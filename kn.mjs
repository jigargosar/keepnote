#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawn, spawnSync } from 'node:child_process'
import { log, requireExecutables, spawnAndCapture } from './util.mjs'

// Get notes directory from environment or use default, ensuring it exists
function getOrCreateNotesPath() {
  const notesPath = process.env.NOTE_PATH || path.join(os.homedir(), 'notes')
  fs.mkdirSync(notesPath, { recursive: true })
  return notesPath
}

// Format date as YYYY-MM-DD
function getDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Build filename for a new note
function buildNoteFilename(title) {
  const datePrefix = getDateString()
  const slug = title.replace(/\s+/g, '-')
  return `${datePrefix}_${slug}.md`
}

// Editor configuration
const editorConfig = (() => {
  const EDITOR_CONFIGS = {
    code: (filepath, lineNumber) =>
      lineNumber
        ? ['--wait', '-g', `${filepath}:${lineNumber}`]
        : ['--wait', filepath],
    'code-insiders': (filepath, lineNumber) =>
      lineNumber
        ? ['--wait', '-g', `${filepath}:${lineNumber}`]
        : ['--wait', filepath],
    vim: (filepath, lineNumber) =>
      lineNumber ? [`+${lineNumber}`, filepath] : [filepath],
    nvim: (filepath, lineNumber) =>
      lineNumber ? [`+${lineNumber}`, filepath] : [filepath],
  }

  return function (filepath, lineNumber) {
    const editorCmd = process.env.EDITOR || 'code'
    const normalizedEditor = editorCmd.replace(/\.(exe|cmd)$/i, '')
    const getArgs = EDITOR_CONFIGS[normalizedEditor] || ((fp) => [fp])
    const args = getArgs(filepath, lineNumber)

    return { editorCmd, args }
  }
})()

function openInEditor(filepath, lineNumber) {
  const { editorCmd, args } = editorConfig(filepath, lineNumber)

  const result = spawnSync(editorCmd, args, {
    stdio: 'inherit',
    shell: true,
  })

  if (result.error) {
    console.error('Failed to open editor:', result.error.message)
    process.exit(1)
  }

  process.exit(result.status || 0)
}

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
 * @returns {{filename: string, lineNumber: number, filepath: string} | null}
 */
function parseRipgrepSelection(selection, notesPath) {
  const parts = selection.split(':')
  if (parts.length < 2) return null

  const filename = parts[0]
  const lineNumber = parseInt(parts[1], 10)
  const filepath = path.join(notesPath, filename)

  return { filename, lineNumber, filepath }
}

/**
 * Interactively search notes using ripgrep + fzf
 *
 * @param {string} notesPath - Path to notes directory
 * @returns {Promise<string | null>} Selected line or null if cancelled
 */
async function searchNotes(notesPath) {
  const rg = spawnRipgrep(notesPath)
  const fzf = spawnFzf(notesPath)

  // Connect ripgrep stdout to fzf stdin
  rg.process.stdout.pipe(fzf.process.stdin)

  const { output } = await fzf.promise
  return output || null
}

/**
 * Search notes and open the selected one in editor
 */
async function searchAndOpen() {
  const notesPath = getOrCreateNotesPath()

  const selection = await searchNotes(notesPath)
  if (!selection) {
    process.exit(0)
  }

  const parsed = parseRipgrepSelection(selection, notesPath)
  if (!parsed) {
    console.error('Could not parse selection')
    process.exit(1)
  }

  console.log('Opening:', parsed.filepath, 'at line', parsed.lineNumber)
  openInEditor(parsed.filepath, parsed.lineNumber)
}

// Create a new note
function createNote(title) {
  const notesPath = getOrCreateNotesPath()
  const filename = buildNoteFilename(title)
  const filepath = path.join(notesPath, filename)

  const content = `# ${title}\n\n\n`
  fs.writeFileSync(filepath, content)
  console.log(`Created note: ${filepath}`)

  return filepath
}

// Main logic
async function main() {
  requireExecutables([
    { cmd: 'rg', name: 'ripgrep', url: 'https://github.com/BurntSushi/ripgrep' },
    { cmd: 'fzf', name: 'fzf', url: 'https://github.com/junegunn/fzf' },
    { cmd: 'bat', name: 'bat', url: 'https://github.com/sharkdp/bat' }
  ])

  const args = process.argv.slice(2)

  if (args.length === 0) {
    await searchAndOpen()
    return
  }

  // Join all arguments as the note title
  const noteTitle = args.join(' ')
  const filepath = createNote(noteTitle)
  openInEditor(filepath)
}

await main()
