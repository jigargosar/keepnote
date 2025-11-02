#!/usr/bin/env node

// Git integration ideas:
// - Show static git status header in fzf (repo overview)
// - Show git status after file edit completes
// - Prompt user to add/commit/push after creating or editing file
// - Consider add/commit workflow integration for simplified UX

import searchNote from './src/search-note.mjs'
import createNote from './src/create-note.mjs'
import openInEditor from './src/open-in-editor.mjs'
import { displayAndExitIfAnyDependencyMissing } from './src/dependencies.mjs'
import { getOrCreateNotesPath } from './src/config.mjs'

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
