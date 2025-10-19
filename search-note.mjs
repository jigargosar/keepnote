import { spawnAndCapture } from './util.mjs'
import path from 'node:path'

// Field separator for ripgrep output (filename, line number, content)
// Using double forward slash - single slash is forbidden in filenames,
// so // is safe for separating fields. We only parse first 2 fields anyway.
const FIELD_SEPARATOR = '//'

/**
 * Spawns ripgrep to list all lines from all files in the notes directory.
 * Output format: "filename\tlineNumber\tcontent" (tab-separated)
 * Example: "2025-01-15_meeting.md\t5\tDiscussed project timeline"
 *
 * @param {string} notesPath - Path to notes directory
 * @returns {{promise: Promise<unknown>, process: ChildProcessWithoutNullStreams}}
 */
function spawnRipgrep(notesPath) {
  return spawnAndCapture(
    'rg',
    [
      '--line-number', // Include line number in output
      '--color=always', // Preserve ANSI colors for fzf
      '--with-filename', // Include filename in output
      '--follow', // Follow symlinks
      '--field-match-separator',
      FIELD_SEPARATOR,
      '.', // Search current directory (all files)
    ],
    {
      cwd: notesPath,
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  )
}

/**
 * Spawns fzf fuzzy finder to interactively select from ripgrep output.
 * Input format: "filename\tlineNumber\tcontent" (tab-separated)
 * Output: The selected line in the same format
 *
 * @param {string} notesPath - Path to notes directory (for bat preview)
 * @returns {{promise: Promise<unknown>, process: ChildProcessWithoutNullStreams}}
 */
function spawnFzf(notesPath) {
  return spawnAndCapture(
    'fzf',
    [
      '--ansi',
      '--no-mouse',
      // '--color=dark',
      '--delimiter',
      FIELD_SEPARATOR,
      '--preview',
      'bat --color=always --style=numbers --highlight-line={2} {1}',
      '--preview-window',
      'right:50%:wrap',
    ],
    {
      stdio: ['pipe', 'pipe', 'inherit'],
      cwd: notesPath,
    },
  )
}

/**
 * Parses ripgrep selection format using field separator
 * Extracts first two fields (filename and line number)
 *
 * @param {string} selection - Selected line from fzf
 * @param {string} notesPath - Base directory for notes
 * @returns {{filename: string, lineNumber: number, filepath: string}}
 * @throws {Error} If selection format is invalid
 */
function parseRipgrepSelection(selection, notesPath) {
  // Split on field separator and extract first two fields
  const parts = selection.split(FIELD_SEPARATOR)

  if (parts.length < 2) {
    throw new Error('Could not parse selection: invalid format')
  }

  const filename = parts[0]
  const lineNumber = parseInt(parts[1], 10)
  const filepath = path.join(notesPath, filename)

  return { filename, lineNumber, filepath }
}


/**
 * Interactively search notes using ripgrep + fzf
 *
 * @param {string} notesPath - Path to notes directory
 * @returns {Promise<string>} Selected line
 */
async function searchNotes(notesPath) {
  const rg = spawnRipgrep(notesPath)
  const fzf = spawnFzf(notesPath)

  // Connect ripgrep stdout to fzf stdin
  rg.process.stdout.pipe(fzf.process.stdin)

  const { code, output } = await fzf.promise

  // Exit code 130 indicates user cancellation (Ctrl+C or ESC in fzf)
  const FZF_EXIT_CODE_USER_CANCELLED = 130

  if (code === FZF_EXIT_CODE_USER_CANCELLED) {
    process.exit(0)
  }

  // empty output indicates fzf query didn't match any file. hence safe exit.
  if (!output) {
    process.exit(0)
  }

  return output
}

/**
 * Search notes and return the selected file location
 *
 * @param {string} notesPath - Path to notes directory
 * @returns {Promise<{filepath: string, lineNumber: number}>} Selected file location
 */
export default async function searchNote(notesPath) {
  const selection = await searchNotes(notesPath)
  const parsed = parseRipgrepSelection(selection, notesPath)

  console.log('Opening:', parsed.filepath, 'at line', parsed.lineNumber)
  return { filepath: parsed.filepath, lineNumber: parsed.lineNumber }
}
