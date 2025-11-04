import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { spawnAndCapture } from '../util.mjs'

// ============================================================================
// Mode Configuration
// ============================================================================

export const MODE_NAMES = {
  CONTENT: 'CONTENT',
  FILES: 'FILES'
}

export const MODES = {
  [MODE_NAMES.CONTENT]: { prompt: 'Content> ' },
  [MODE_NAMES.FILES]: { prompt: 'Files> ' }
}

export const DEFAULT_MODE = MODE_NAMES.FILES

// ============================================================================
// Ripgrep Commands
// ============================================================================

export const FIELD_DELIMITER = '//'

const WINDOWS_RESERVED_GLOBS = [
  '--glob', '!CON',
  '--glob', '!PRN',
  '--glob', '!AUX',
  '--glob', '!NUL',
  '--glob', '!COM[1-9]',
  '--glob', '!LPT[1-9]',
]

const FILE_CONTENT_SEARCH_ARGS = [
  '--line-number',
  '--color=always',
  '--with-filename',
  '--follow',
  `--field-match-separator=${FIELD_DELIMITER}`,
  ...WINDOWS_RESERVED_GLOBS,
  '.',
]

const FILE_NAME_SEARCH_ARGS = [
  '--files',
  '--color=always',
  ...WINDOWS_RESERVED_GLOBS,
]

export function fileContentSearchCommand(notesPath) {
  return `cd ${notesPath} && ${['rg', ...FILE_CONTENT_SEARCH_ARGS].join(' ')}`
}

export function fileNameSearchCommand(notesPath) {
  return `cd ${notesPath} && ${['rg', ...FILE_NAME_SEARCH_ARGS].join(' ')}`
}

// ============================================================================
// Ripgrep Parser
// ============================================================================

export function parseRipgrepSelection(selection, notesPath) {
  const parts = selection.split(FIELD_DELIMITER)

  // Files mode: just filename, no separator or line number
  if (parts.length === 1) {
    const filename = parts[0]
    const filepath = path.join(notesPath, filename)
    return { filename, lineNumber: 1, filepath }
  }

  // Content mode: filename + line number
  if (parts.length < 2) {
    throw new Error('Could not parse selection: invalid format')
  }

  const filename = parts[0]
  const lineNumber = parseInt(parts[1], 10)
  const filepath = path.join(notesPath, filename)

  return { filename, lineNumber, filepath }
}

// ============================================================================
// Git Status Header
// ============================================================================

function getGitStatusHeader(notesPath) {
  const GREEN = '\x1b[32m'
  const YELLOW = '\x1b[33m'
  const RED = '\x1b[31m'
  const RESET = '\x1b[0m'

  const result = spawnSync('git', ['status', '--porcelain'], {
    cwd: notesPath,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe']
  })

  // Other non-zero exit codes
  if (result.status !== 0) {
    const firstErrorLine = result.stderr?.trim().split('\n')[0] || 'unknown error'
    return `${RED}Git status: ${firstErrorLine}${RESET}`
  }

  const lines = result.stdout.trim().split('\n').filter(line => line)

  const { untracked, modified } = lines.reduce(
    (counts, line) => {
      const status = line.substring(0, 2)
      if (status.includes('?')) {
        return { ...counts, untracked: counts.untracked + 1 }
      } else if (status.trim()) {
        return { ...counts, modified: counts.modified + 1 }
      }
      return counts
    },
    { untracked: 0, modified: 0 }
  )

  if (untracked === 0 && modified === 0) {
    return `${GREEN}Git status: clean${RESET}`
  }

  const parts = []
  if (modified > 0) parts.push(`modified: ${modified}`)
  if (untracked > 0) parts.push(`untracked: ${untracked}`)

  return `${YELLOW}Git status (${parts.join(', ')})${RESET}`
}

// ============================================================================
// FZF Orchestration
// ============================================================================

function spawnFzf(notesPath) {
  const headerText = getGitStatusHeader(notesPath)
  const toggleScriptPath = fileURLToPath(new URL('./search-scripts/get-next-mode.mjs', import.meta.url))
  const previewScriptPath = fileURLToPath(new URL('./search-scripts/preview.mjs', import.meta.url))
  const deleteScriptPath = fileURLToPath(new URL('./search-scripts/delete.mjs', import.meta.url))
  const reloadScriptPath = fileURLToPath(new URL('./search-scripts/get-reload.mjs', import.meta.url))

  return spawnAndCapture(
    'fzf',
    [
      '--ansi',
      '--no-mouse',
      '--layout=reverse',
      `--header=${headerText}`,
      '--header-first',
      '--color=header:yellow,info:8,bg+:237,prompt:39',
      `--delimiter=${FIELD_DELIMITER}`,
      `--preview=node ${previewScriptPath} {1} {2}`,
      '--preview-window=right:30%:wrap',
      `--prompt=${MODES[DEFAULT_MODE].prompt}`,
      `--bind=start:reload(${fileNameSearchCommand(notesPath)})`,
      `--bind=tab:transform(node ${toggleScriptPath} ${notesPath})`,
      `--bind=ctrl-d:execute(node ${deleteScriptPath} ${notesPath} {1} < CON > CON 2>&1)+transform(node ${reloadScriptPath} ${notesPath})`,
      '--bind=change:first',
    ],
    {
      stdio: ['pipe', 'pipe', 'inherit'],
      cwd: notesPath,
    },
  )
}

export default async function searchNote(notesPath) {
  const fzf = spawnFzf(notesPath)

  const { code, output } = await fzf.promise

  const FZF_EXIT_CODE_USER_CANCELLED = 130

  if (code === FZF_EXIT_CODE_USER_CANCELLED) {
    return null
  }

  if (!output) {
    return null
  }

  const parsed = parseRipgrepSelection(output, notesPath)

  console.log('Opening:', parsed.filepath, 'at line', parsed.lineNumber)
  return { filepath: parsed.filepath, lineNumber: parsed.lineNumber }
}
