#!/usr/bin/env node

// Git integration ideas:
// - Show static git status header in fzf (repo overview)
// - Show git status after file edit completes
// - Prompt user to add/commit/push after creating or editing file
// - Consider add/commit workflow integration for simplified UX

import { execSync, spawnSync } from 'node:child_process'
import searchNote from './src/search-note.mjs'
import createNote from './src/create-note.mjs'
import openInEditor from './src/open-in-editor.mjs'
import { displayAndExitIfAnyDependencyMissing } from './src/dependencies.mjs'
import { getOrCreateNotesPath } from './src/config.mjs'

function runGitCommand(args, notesPath) {
  const result = spawnSync('git', args, {
    cwd: notesPath,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  })
  return { status: result.status, output: result.stdout || '' }
}

function showGitStatus(notesPath) {
  const CYAN = '\x1b[36m'
  const GREEN = '\x1b[32m'
  const YELLOW = '\x1b[33m'
  const RESET = '\x1b[0m'

  console.log(`\n${CYAN}=== Git Status ===${RESET}`)

  // 1. Check if git is installed
  const gitCheck = spawnSync('git', ['--version'], { stdio: 'ignore' })
  if (gitCheck.error) {
    console.log(`${YELLOW}Warn: git not installed${RESET}`)
    console.log()
    return
  }

  // 2. Check if it's a git repository
  const { status: repoStatus } = runGitCommand(['rev-parse', '--git-dir'], notesPath)
  if (repoStatus !== 0) {
    console.log(`${YELLOW}Warn: not a git repository${RESET}`)
    console.log()
    return
  }

  // 3. Check for unpushed commits (no upstream is ok, returns 0 commits)
  const { status: upstreamStatus, output: upstreamOutput } = runGitCommand(
    ['rev-list', '@{u}..HEAD', '--count'],
    notesPath,
  )
  const commitsAhead =
    upstreamStatus === 0 ? parseInt(upstreamOutput.trim(), 10) || 0 : 0

  // 4. Check working directory status
  const { output: statusOutput } = runGitCommand(['status', '--porcelain'], notesPath)
  const hasChanges = statusOutput.trim().length > 0

  if (hasChanges) {
    console.log(statusOutput.trimEnd())
  } else {
    console.log(`${GREEN}clean${RESET}`)
  }

  const pushStatus =
    commitsAhead > 0
      ? `${YELLOW}Push pending: ${commitsAhead} commit${commitsAhead > 1 ? 's' : ''}${RESET}`
      : `${GREEN}Push pending: none${RESET}`

  console.log()
  console.log(pushStatus)
  console.log()
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
