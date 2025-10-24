#!/usr/bin/env node

import fs from 'node:fs'
import {
  displayDependencyStatus,
  displayAndExitIfAnyDependencyMissing,
} from './dependencies.mjs'

function showHelp() {
  console.log(`Usage:
  keepnote [OPTIONS]

Options:
  -h, --help       Show this help message
  -v, --version    Show version number

Examples:
  keepnote --help     Show this help message
  keepnote --version  Show version number
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

  if (args.length === 0) {
    return { type: 'help' }
  }

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

  return { type: 'unknown-command', command: args[0] }
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

    case 'unknown-command':
      console.error(`Unknown command: ${command.command}`)
      showHelp()
      process.exit(1)
      break
  }
}

await main()