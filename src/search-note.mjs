import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { spawnAndCapture } from './util.mjs'
import {
  fileContentSearchCommand,
  FIELD_DELIMITER,
  parseRipgrepSelection
} from './rg-commands.mjs'
import { FZF_PROMPTS } from './keepnote/constants.mjs'

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

function spawnFzf(notesPath) {
  const headerText = getGitStatusHeader(notesPath)
  const toggleScriptPath = fileURLToPath(new URL('./get-next-mode.mjs', import.meta.url))
  const previewScriptPath = fileURLToPath(new URL('./preview-note.mjs', import.meta.url))
  const deleteScriptPath = fileURLToPath(new URL('./delete-note.mjs', import.meta.url))
  const reloadScriptPath = fileURLToPath(new URL('./get-reload-for-current-mode.mjs', import.meta.url))

  return spawnAndCapture(
    'fzf',
    [
      '--ansi',
      '--no-mouse',
      '--layout=reverse',
      `--header=${headerText}`,
      '--header-first',
      '--color=header:yellow,info:8,bg+:237,prompt:39',
      // '--color=dark',
      `--delimiter=${FIELD_DELIMITER}`,
      `--preview=node ${previewScriptPath} {1} {2}`,
      '--preview-window=right:30%:wrap',
      `--prompt=${FZF_PROMPTS.CONTENT}`,
      `--bind=start:reload(${fileContentSearchCommand(notesPath)})`,
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
