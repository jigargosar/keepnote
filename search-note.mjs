import { fileURLToPath } from 'node:url'
import { spawnAndCapture } from './util.mjs'
import {
  getContentModeReloadCommand,
  FIELD_DELIMITER,
  parseRipgrepSelection
} from './rg-commands.mjs'

function spawnFzf(notesPath) {
  const toggleScriptPath = fileURLToPath(new URL('./get-next-mode.mjs', import.meta.url))
  const previewScriptPath = fileURLToPath(new URL('./preview-note.mjs', import.meta.url))

  return spawnAndCapture(
    'fzf',
    [
      '--ansi',
      '--no-mouse',
      // '--color=dark',
      '--delimiter',
      FIELD_DELIMITER,
      '--preview',
      `node ${previewScriptPath} {1} {2}`,
      '--preview-window',
      'right:50%:wrap',
      '--prompt',
      'Content> ',
      '--bind',
      `start:reload(${getContentModeReloadCommand(notesPath)})`,
      '--bind',
      `tab:transform(node ${toggleScriptPath} ${notesPath})`,
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
    process.exit(0)
  }

  if (!output) {
    process.exit(0)
  }

  const parsed = parseRipgrepSelection(output, notesPath)

  console.log('Opening:', parsed.filepath, 'at line', parsed.lineNumber)
  return { filepath: parsed.filepath, lineNumber: parsed.lineNumber }
}
