#!/usr/bin/env node

import fs from 'node:fs'
import { displayDependencyStatus } from './src/dependencies.mjs'
import {
  getOrCreateConfigFilePath,
  getOrCreateNotesPath,
} from './src/config.mjs'
import openInEditor from './src/open-in-editor.mjs'

function getVersion() {
  const packageJson = JSON.parse(
    fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
  )
  return packageJson.version
}

function showHelp() {
  const notesPath = getOrCreateNotesPath()
  const configPath = getOrCreateConfigFilePath()

  console.log(`keepnote v${getVersion()}

Usage:
  keepnote [COMMAND]

Commands:
  help             Show this help message
  config           Edit configuration file
  git <command>    Run git commands in notes directory

Paths:
  Notes:  ${notesPath}
  Config: ${configPath}
`)

  displayDependencyStatus()
}

function editConfig() {
  const configPath = getOrCreateConfigFilePath()
  openInEditor({ filepath: configPath })
}

function runGitCommand(notesDir, gitArgs) {
  console.log(`git ${gitArgs.join(' ')}`)
}

function parseCliCommand(argv) {
  const args = argv.slice(2)

  if (args.length === 0) {
    return { type: 'help' }
  }

  const command = args[0]

  switch (command) {
    case 'help':
      return { type: 'help' }
    case 'config':
      return { type: 'config' }
    case 'git':
      return { type: 'git', args: args.slice(1) }
    default:
      return { type: 'unknown-command', command }
  }
}

async function main() {
  const command = parseCliCommand(process.argv)

  switch (command.type) {
    case 'help':
      showHelp()
      process.exit(0)
      break

    case 'config':
      editConfig()
      break

    case 'git':
      const notesPath = getOrCreateNotesPath()
      runGitCommand(notesPath, command.args)
      break

    case 'unknown-command':
      console.error(`Unknown command: ${command.command}`)
      showHelp()
      process.exit(1)
      break
  }
}

await main()