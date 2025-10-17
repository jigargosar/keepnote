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

// Search notes using ripgrep + fzf
async function searchNotes() {
  const notesPath = getOrCreateNotesPath()

  const rg = spawnRipgrep(notesPath)

  const fzf = spawnAndCapture('fzf', [
    '--ansi',
    '--delimiter', ':',
    '--preview', '"bat --color=always --style=numbers --highlight-line={2} {1}"',
    '--preview-window', 'right:60%:wrap'
  ], {
    stdio: ['pipe', 'pipe', 'inherit'],
    cwd: notesPath,
    shell: true
  })

  // Connect ripgrep stdout to fzf stdin
  rg.process.stdout.pipe(fzf.process.stdin)

  try {
    const { output } = await fzf.promise

    if (!output) {
      process.exit(0)
    }

    // Parse selection: filename:lineNumber:content (content may have colons)
    const parts = output.split(':')
    if (parts.length >= 2) {
      const filename = parts[0]
      const lineNumber = parseInt(parts[1], 10)
      const filepath = path.join(notesPath, filename)

      console.log('Opening:', filepath, 'at line', lineNumber)
      openInEditor(filepath, lineNumber)
    } else {
      console.error('Could not parse selection')
      process.exit(1)
    }
  } catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
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
    await searchNotes()
    return
  }

  // Join all arguments as the note title
  const noteTitle = args.join(' ')
  const filepath = createNote(noteTitle)
  openInEditor(filepath)
}

main()
