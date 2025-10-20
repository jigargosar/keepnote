#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { checkExecutables } from './util.mjs'
import searchNote from './search-note.mjs'
import createNote from './create-note.mjs'
import openInEditor from './open-in-editor.mjs'

const REQUIRED_EXECUTABLES = [
  { cmd: 'rg', name: 'ripgrep', url: 'https://github.com/BurntSushi/ripgrep' },
  { cmd: 'fzf', name: 'fzf', url: 'https://github.com/junegunn/fzf' },
  { cmd: 'bat', name: 'bat', url: 'https://github.com/sharkdp/bat' },
]

// Get notes directory from environment or use default, ensuring it exists
function getOrCreateNotesPath() {
  const notesPath = process.env.NOTE_PATH || path.join(os.homedir(), 'notes')
  fs.mkdirSync(notesPath, { recursive: true })
  return notesPath
}

// Format executable status for display
function formatExecutableStatus(executables) {
  const GREEN = '\x1b[32m'
  const RED = '\x1b[31m'
  const RESET = '\x1b[0m'

  const lines = []
  for (const exe of executables) {
    const status = exe.installed
      ? `${GREEN}\u2713${RESET} Installed`
      : `${RED}\u2717${RESET} Missing`
    const line = exe.installed
      ? `  ${status} ${exe.name}`
      : `  ${status} ${exe.name} - ${exe.url}`
    lines.push(line)
  }
  return lines.join('\n')
}

// Helper: Get dependency status information
function getDependencyStatus() {
  const status = checkExecutables(REQUIRED_EXECUTABLES)
  const anyMissing = status.some((exe) => !exe.installed)
  const formatted = formatExecutableStatus(status)

  return { formatted, anyMissing }
}

// Display dependency status (always display)
function displayDependencyStatus() {
  const { formatted } = getDependencyStatus()
  console.log('Dependencies:')
  console.log(formatted)
}

// Display and exit if any dependency missing
function displayAndExitIfAnyDependencyMissing() {
  const { formatted, anyMissing } = getDependencyStatus()

  if (anyMissing) {
    console.error('Missing required dependencies:')
    console.error(formatted)
    process.exit(1)
  }
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
    fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8')
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

    case 'version':
      showVersion()
      process.exit(0)

    case 'unknown-flag':
      console.error(`Unknown option: ${command.flag}`)
      showHelp()
      process.exit(1)

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
