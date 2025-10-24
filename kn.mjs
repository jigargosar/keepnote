#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import searchNote from './search-note.mjs'
import createNote from './create-note.mjs'
import openInEditor from './open-in-editor.mjs'
import { displayAndExitIfAnyDependencyMissing } from './dependencies.mjs'

// Get notes directory from environment or use default, ensuring it exists
function getOrCreateNotesPath() {
  const notesPath = process.env.NOTE_PATH || path.join(os.homedir(), 'notes')
  fs.mkdirSync(notesPath, { recursive: true })
  return notesPath
}

// Main logic
async function main() {
  displayAndExitIfAnyDependencyMissing()

  const args = process.argv.slice(2)
  const notesPath = getOrCreateNotesPath()

  const { filepath, lineNumber } =
    args.length === 0
      ? await searchNote(notesPath)
      : createNote(args.join(' '), notesPath)

  openInEditor({ filepath, lineNumber })
}

await main()
