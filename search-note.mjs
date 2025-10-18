import { spawnAndCapture } from './util.mjs'
import path from 'node:path'

/**
 * Spawns ripgrep to list all lines from all files in the notes directory.
 * Output format: "filename:lineNumber:content"
 * Example: "2025-01-15_meeting.md:5:Discussed project timeline"
 *
 * @param {string} notesPath - Path to notes directory
 * @returns {{promise: Promise<unknown>, process: ChildProcessWithoutNullStreams}}
 */
function spawnRipgrep(notesPath) {
  return spawnAndCapture('rg', [
    '--line-number',     // Include line number in output
    '--color=always',    // Preserve ANSI colors for fzf
    '--with-filename',   // Include filename in output
    '--no-heading',      // Output format: filename:line:content (no grouping)
    '--follow',          // Follow symlinks
    '.'                  // Search current directory (all files)
  ], {
    cwd: notesPath,
    stdio: ['ignore', 'pipe', 'pipe']
  })
}

/**
 * Spawns fzf fuzzy finder to interactively select from ripgrep output.
 * Input format: "filename:lineNumber:content" (from ripgrep)
 * Output: The selected line in the same format
 *
 * @param {string} notesPath - Path to notes directory (for bat preview)
 * @returns {{promise: Promise<unknown>, process: ChildProcessWithoutNullStreams}}
 */
function spawnFzf(notesPath) {
  return spawnAndCapture('fzf', [
    '--ansi',            // Support ANSI color codes from ripgrep
    '--delimiter', ':',  // Split on ':' for preview (filename:line:content)
    '--preview', '"bat --color=always --style=numbers --highlight-line={2} {1}"',  // Preview: bat {filename} highlighting {lineNumber}
    '--preview-window', 'right:60%:wrap'  // Show preview on right side
  ], {
    stdio: ['pipe', 'pipe', 'inherit'],  // stdin: pipe from rg, stdout: capture selection, stderr: show UI
    cwd: notesPath,  // Run in notes dir so bat can find files
    shell: true      // Need shell for quoted preview command
  })
}

/**
 * Parses ripgrep selection format: "filename:lineNumber:content"
 * Note: content may contain colons, but we only need first 2 parts
 *
 * @param {string} selection - Selected line from fzf
 * @param {string} notesPath - Base directory for notes
 * @returns {{filename: string, lineNumber: number, filepath: string}}
 * @throws {Error} If selection format is invalid
 */
function parseRipgrepSelection(selection, notesPath) {
  const parts = selection.split(':')
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

  const { output } = await fzf.promise

  if (!output) {
    process.exit(0)  // User cancelled - clean exit
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
