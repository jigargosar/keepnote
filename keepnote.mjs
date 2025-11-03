#!/usr/bin/env node

import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import { spawnAndCapture } from './src/util.mjs'
import { displayDependencyStatus } from './src/dependencies.mjs'
import { getOrCreateConfigFilePath, getOrCreateNotesPath, } from './src/config.mjs'
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
  return openInEditor({ filepath: configPath })
}

function runGitCommandSync(args, notesPath) {
  const result = spawnSync('git', args, {
    cwd: notesPath,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  })
  return { exitCode: result.status, output: result.stdout || '' }
}

async function runGitCommand(notesDir, gitArgs) {
  const { promise } = spawnAndCapture('git', gitArgs, {
    stdio: 'inherit',
    cwd: notesDir,
  })
  const { code } = await promise
  process.exit(code)
}

function syncNotes(notesPath) {
  const RED = '\x1b[31m'
  const RESET = '\x1b[0m'

  // Check if git repo exists
  const { exitCode: repoExitCode } = runGitCommandSync(
    ['rev-parse', '--git-dir'],
    notesPath,
  )

  if (repoExitCode !== 0) {
    console.error(`${RED}Error: Not a git repository${RESET}

Initialize with:
  keepnote git init
  keepnote git remote add origin <url>
  keepnote git push -u origin main
`)
    process.exit(1)
  }

  console.log('TODO: Implement rest of sync flow')
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
    case 'sync':
      return { type: 'sync' }
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
      const { exitCode } = editConfig()
      process.exit(exitCode)
      break

    case 'sync':
      syncNotes(getOrCreateNotesPath())
      break

    case 'git':
      await runGitCommand(getOrCreateNotesPath(), command.args)
      break

    case 'unknown-command':
      console.error(`Unknown command: ${command.command}`)
      showHelp()
      process.exit(1)
      break
  }
}

await main()