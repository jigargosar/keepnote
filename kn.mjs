#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { requireExecutables } from './util.mjs'
import searchNote from './search-note.mjs'
import createNote from './create-note.mjs'
import openInEditor from './open-in-editor.mjs'

// Get notes directory from environment or use default, ensuring it exists
function getOrCreateNotesPath() {
  const notesPath = process.env.NOTE_PATH || path.join(os.homedir(), 'notes')
  fs.mkdirSync(notesPath, { recursive: true })
  return notesPath
}

// Main logic
async function main() {
  requireExecutables([
    { cmd: 'rg', name: 'ripgrep', url: 'https://github.com/BurntSushi/ripgrep' },
    { cmd: 'fzf', name: 'fzf', url: 'https://github.com/junegunn/fzf' },
    { cmd: 'bat', name: 'bat', url: 'https://github.com/sharkdp/bat' }
  ])

  const notesPath = getOrCreateNotesPath()
  const args = process.argv.slice(2)

  if (args.length === 0) {
    const result = await searchNote(notesPath)
    openInEditor(result.filepath, result.lineNumber)
  } else {
    const noteTitle = args.join(' ')
    const result = createNote(noteTitle, notesPath)
    openInEditor(result.filepath)
  }
}

await main()
