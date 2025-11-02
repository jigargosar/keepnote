import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { spawnAndCapture } from './util.mjs'
import {
  fileContentSearchCommand,
  FIELD_DELIMITER,
  parseRipgrepSelection
} from './rg-commands.mjs'

function getGitStatusHeader(notesPath) {
  try {
    const output = execSync('git status --porcelain', {
      cwd: notesPath,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    })

    const lines = output.trim().split('\n').filter(line => line)

    let untracked = 0
    let modified = 0

    for (const line of lines) {
      const status = line.substring(0, 2)
      if (status.includes('?')) {
        untracked++
      } else if (status.trim()) {
        modified++
      }
    }

    return `Git: ${untracked} untracked, ${modified} modified`
  } catch (error) {
    return 'Git: status unavailable'
  }
}

function spawnFzf(notesPath, headerText) {
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
      '--prompt=Content> ',
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
  const headerText = getGitStatusHeader(notesPath)
  const fzf = spawnFzf(notesPath, headerText)

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
