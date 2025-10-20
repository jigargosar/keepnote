#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import searchNote from './search-note.mjs'
import createNote from './create-note.mjs'
import openInEditor from './open-in-editor.mjs'
import {
  displayDependencyStatus,
  displayAndExitIfAnyDependencyMissing,
} from './dependencies.mjs'

// Get notes directory from environment or use default, ensuring it exists
function getOrCreateNotesPath() {
  const notesPath = process.env.NOTE_PATH || path.join(os.homedir(), 'notes')
  fs.mkdirSync(notesPath, { recursive: true })
  return notesPath
}

function showHelp() {
  console.log(`Usage:
  kn [OPTIONS]
  kn <title>

Options:
  -h, --help       Show this help message
  -v, --version    Show version number

Examples:
  kn                  Search and open existing note
  kn "Fix login bug"  Create new note with title
`)

  displayDependencyStatus()
}

function showVersion() {
  const packageJson = JSON.parse(
    fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
  )
  console.log(packageJson.version)
}

function parseCliCommand(argv) {
  const args = argv.slice(2)

  if (args[0]?.startsWith('-')) {
    switch (args[0]) {
      case '--help':
      case '-h':
        return { type: 'help' }
      case '--version':
      case '-v':
        return { type: 'version' }
      default:
        return { type: 'unknown-flag', flag: args[0] }
    }
  }

  if (args.length === 0) {
    return { type: 'search' }
  }

  return { type: 'create', title: args.join(' ') }
}

// Main logic
async function main() {
  const command = parseCliCommand(process.argv)

  switch (command.type) {
    case 'help':
      showHelp()
      process.exit(0)
      break

    case 'version':
      showVersion()
      process.exit(0)
      break

    case 'unknown-flag':
      console.error(`Unknown option: ${command.flag}`)
      showHelp()
      process.exit(1)
      break

    case 'search':
    case 'create':
      displayAndExitIfAnyDependencyMissing()

      const notesPath = getOrCreateNotesPath()

      const { filepath, lineNumber } =
        command.type === 'search'
          ? await searchNote(notesPath)
          : createNote(command.title, notesPath)

      openInEditor({ filepath, lineNumber })
      break
  }
}

await main()
