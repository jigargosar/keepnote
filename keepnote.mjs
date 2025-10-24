#!/usr/bin/env node

import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import {
  displayDependencyStatus,
  displayAndExitIfAnyDependencyMissing,
} from './dependencies.mjs'
import {
  getOrCreateNotesPath,
  getEditorExecutableName,
  getOrCreateConfigFilePath,
} from './config.mjs'

function getVersion() {
  const packageJson = JSON.parse(
    fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
  )
  return packageJson.version
}

function showHelp() {
  console.log(`keepnote v${getVersion()}

Usage:
  keepnote [COMMAND]

Commands:
  help             Show this help message
  version          Show version number
  config           Show current configuration
  config edit      Edit configuration file
`)

  displayDependencyStatus()
}

function showConfig() {
  const notePath = getOrCreateNotesPath()
  const editor = getEditorExecutableName()
  const configPath = getOrCreateConfigFilePath()

  console.log('Current configuration:')
  console.log(`  notePath: ${notePath}`)
  console.log(`  editor:   ${editor}`)
  console.log()
  console.log(`Config file: ${configPath}`)
}

function editConfig() {
  const configPath = getOrCreateConfigFilePath()
  const editor = getEditorExecutableName()

  // Open in editor
  const result = spawnSync(editor, [configPath], {
    stdio: 'inherit',
    shell: true,
  })

  if (result.error) {
    console.error('Failed to open editor:', result.error.message)
    process.exit(1)
  }

  process.exit(result.status || 0)
}

function showVersion() {
  console.log(getVersion())
}

function parseCliCommand(argv) {
  const args = argv.slice(2)

  if (args.length === 0) {
    return { type: 'help' }
  }

  const command = args[0]
  const subcommand = args[1]

  switch (command) {
    case 'help':
      return { type: 'help' }
    case 'version':
      return { type: 'version' }
    case 'config':
      if (subcommand === 'edit') {
        return { type: 'config-edit' }
      }
      return { type: 'config-show' }
    default:
      return { type: 'unknown-command', command }
  }
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

    case 'config-show':
      showConfig()
      process.exit(0)
      break

    case 'config-edit':
      editConfig()
      break

    case 'unknown-command':
      console.error(`Unknown command: ${command.command}`)
      showHelp()
      process.exit(1)
      break
  }
}

await main()