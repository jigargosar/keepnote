#!/usr/bin/env node

import searchNote from './search-note.mjs'
import createNote from './create-note.mjs'
import openInEditor from './open-in-editor.mjs'
import { displayAndExitIfAnyDependencyMissing } from './dependencies.mjs'
import { getOrCreateNotesPath } from './config.mjs'

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
