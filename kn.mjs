#!/usr/bin/env node

// Git integration ideas:
// - Show static git status header in fzf (repo overview)
// - Show git status after file edit completes
// - Prompt user to add/commit/push after creating or editing file
// - Consider add/commit workflow integration for simplified UX

import { execSync } from 'node:child_process'
import searchNote from './src/search-note.mjs'
import createNote from './src/create-note.mjs'
import openInEditor from './src/open-in-editor.mjs'
import { displayAndExitIfAnyDependencyMissing } from './src/dependencies.mjs'
import { getOrCreateNotesPath } from './src/config.mjs'

function showGitStatus(notesPath) {
  try {
    console.log('\nGit Status:')
    execSync('git status --short', {
      cwd: notesPath,
      stdio: 'inherit',
    })
  } catch (error) {
    // Silently ignore git errors (e.g., not a git repo)
  }
}

// Main logic
async function main() {
  displayAndExitIfAnyDependencyMissing()

  const args = process.argv.slice(2)
  const notesPath = getOrCreateNotesPath()

  let exitCode = 0

  try {
    const result =
      args.length === 0
        ? await searchNote(notesPath)
        : createNote(args.join(' '), notesPath)

    if (result) {
      const { filepath, lineNumber } = result
      const { exitCode: editorExitCode } = openInEditor({ filepath, lineNumber })
      exitCode = editorExitCode
    }
  } finally {
    showGitStatus(notesPath)
  }

  process.exit(exitCode)
}

await main()
