#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawn, spawnSync } from 'node:child_process'
import { log, commandsExists, spawnAndCapture } from './util.mjs'

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

// Search notes using ripgrep + fzf
function searchNotes() {
  const notesPath = getOrCreateNotesPath()

  // Use ripgrep to search note content with line numbers
  const rgProcess = spawn(
    'rg',
    [
      '--line-number',
      '--color=always',
      '--with-filename',
      '--no-heading',
      '--follow',
      '.',
    ],
    {
      cwd: notesPath, // Run inside notes dir to get relative paths
      stdio: ['ignore', 'pipe', 'pipe'], // stdin ignored, stdout/stderr piped
    },
  )

  // Pipe ripgrep output to fzf with bat preview
  const fzfProcess = spawn(
    'fzf',
    [
      '--ansi',
      '--delimiter',
      ':',
      '--preview',
      '"bat --color=always --style=numbers --highlight-line={2} {1}"',
      '--preview-window',
      'right:60%:wrap',
    ],
    {
      stdio: ['pipe', 'pipe', 'inherit'],
      cwd: notesPath, // Run bat in notes directory so it finds relative paths
      shell: true, // Need shell to handle quoted preview command
    },
  )

  // Connect ripgrep stdout to fzf stdin
  rgProcess.stdout.pipe(fzfProcess.stdin)

  rgProcess.on('error', (err) => {
    console.error('Error: ripgrep (rg) not found')
    console.error(
      'Please install ripgrep: https://github.com/BurntSushi/ripgrep',
    )
    process.exit(1)
  })

  fzfProcess.on('error', (err) => {
    console.error('Error: fzf not found')
    console.error('Please install fzf: https://github.com/junegunn/fzf')
    process.exit(1)
  })

  // Capture fzf selection
  let selection = ''
  fzfProcess.stdout.on('data', (data) => {
    selection += data.toString()
  })

  fzfProcess.on('exit', (code) => {
    if (code === 0 && selection.trim()) {
      // Parse selection: filename:lineNumber:content (content may have colons)
      const parts = selection.trim().split(':')
      if (parts.length >= 2) {
        const filename = parts[0]
        const lineNumber = parseInt(parts[1], 10)

        // Reconstruct full path
        const filepath = path.join(notesPath, filename)

        console.log('Opening:', filepath, 'at line', lineNumber)
        openInEditor(filepath, lineNumber)
      } else {
        console.error('Could not parse selection')
        process.exit(1)
      }
    } else {
      process.exit(code || 0)
    }
  })
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
function main() {
  commandsExists([
    { cmd: 'rg', name: 'ripgrep', url: 'https://github.com/BurntSushi/ripgrep' },
    { cmd: 'fzf', name: 'fzf', url: 'https://github.com/junegunn/fzf' },
    { cmd: 'bat', name: 'bat', url: 'https://github.com/sharkdp/bat' }
  ])

  const args = process.argv.slice(2)

  if (args.length === 0) {
    searchNotes()
    return
  }

  // Join all arguments as the note title
  const noteTitle = args.join(' ')
  const filepath = createNote(noteTitle)
  openInEditor(filepath)
}

main()
