#!/usr/bin/env node

import fs from 'node:fs'
import {
  displayDependencyStatus,
  displayAndExitIfAnyDependencyMissing,
} from './dependencies.mjs'

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
`)

  displayDependencyStatus()
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

  switch (command) {
    case 'help':
      return { type: 'help' }
    case 'version':
      return { type: 'version' }
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

    case 'unknown-command':
      console.error(`Unknown command: ${command.command}`)
      showHelp()
      process.exit(1)
      break
  }
}

await main()