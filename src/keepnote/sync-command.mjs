import { spawnSync } from 'node:child_process'
import * as readline from 'node:readline'

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BOLD = '\x1b[1m'
const RESET = '\x1b[0m'

const SyncAction = {
  NOTHING_TO_SYNC: { type: 'nothing-to-sync' },
  COMMIT_ONLY: { type: 'commit-only' },
  PUSH_ONLY: { type: 'push-only' },
  COMMIT_AND_PUSH: { type: 'commit-and-push' },
}

function runGitCommandSync(args, notesPath) {
  const result = spawnSync('git', args, {
    cwd: notesPath,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  })
  return { exitCode: result.status, output: result.stdout || '' }
}

function getCurrentLocalDate() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

function ensureGitRepoOrExit(notesPath) {
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
}

function initSyncAction({ hasChanges, hasUpstream, commitsAhead }) {
  if (!hasChanges && (!hasUpstream || commitsAhead === 0)) {
    return SyncAction.NOTHING_TO_SYNC
  }

  if (hasChanges && !hasUpstream) {
    return SyncAction.COMMIT_ONLY
  }

  if (!hasChanges && hasUpstream && commitsAhead > 0) {
    return SyncAction.PUSH_ONLY
  }

  return SyncAction.COMMIT_AND_PUSH
}

function displayGitStatusAndInitAction(notesPath) {
  const { output: statusOutput } = runGitCommandSync(
    ['status', '--porcelain'],
    notesPath,
  )
  const hasChanges = statusOutput.trim().length > 0

  if (hasChanges) {
    console.log(`${BOLD}Git status:${RESET}`)
    console.log(`${YELLOW}${statusOutput.trimEnd()}${RESET}`)
  } else {
    console.log(`${BOLD}Git status:${RESET} ${GREEN}clean${RESET}`)
  }

  console.log()

  const { exitCode: upstreamExitCode, output: upstreamOutput } =
    runGitCommandSync(['rev-list', '@{u}..HEAD', '--count'], notesPath)

  if (upstreamExitCode !== 0) {
    console.log(`${BOLD}Push pending:${RESET} ${YELLOW}N/A (no upstream branch)${RESET}`)
  } else {
    const commitsAhead = parseInt(upstreamOutput.trim(), 10) || 0
    if (commitsAhead > 0) {
      console.log(
        `${BOLD}Push pending:${RESET} ${YELLOW}${commitsAhead} commit${commitsAhead > 1 ? 's' : ''}${RESET}`,
      )
    } else {
      console.log(`${BOLD}Push pending:${RESET} ${GREEN}none${RESET}`)
    }
  }

  console.log()

  const hasUpstream = upstreamExitCode === 0
  const commitsAhead = hasUpstream ? parseInt(upstreamOutput.trim(), 10) || 0 : 0

  return initSyncAction({ hasChanges, hasUpstream, commitsAhead })
}

function buildGitCommands(action) {
  const commitMsg = `${getCurrentLocalDate()} -- Synced`

  switch (action) {
    case SyncAction.NOTHING_TO_SYNC:
      return []

    case SyncAction.COMMIT_ONLY:
      return [['add', '--all'], ['commit', '-m', commitMsg]]

    case SyncAction.PUSH_ONLY:
      return [['push']]

    case SyncAction.COMMIT_AND_PUSH:
      return [['add', '--all'], ['commit', '-m', commitMsg], ['push']]

    default:
      return []
  }
}

function displayCommandsToRun(commands) {
  if (commands.length === 0) {
    console.log('Already up to date')
    return false
  }

  console.log('Will run:')
  for (const args of commands) {
    console.log(`  git ${args.join(' ')}`)
  }
  console.log()
  return true
}

async function confirmExecution() {
  const response = await promptUser('Continue? [Y/n] ')

  if (response.toLowerCase() === 'n' || response.toLowerCase() === 'no') {
    console.log('Aborted')
    return false
  }

  return true
}

function executeCommands(commands, notesPath) {
  for (const args of commands) {
    const result = spawnSync('git', args, {
      cwd: notesPath,
      encoding: 'utf8',
      stdio: 'inherit',
    })

    if (result.status !== 0) {
      console.error(`${RED}Error: git ${args.join(' ')} failed${RESET}`)
      process.exit(1)
    }
  }

  console.log()
  console.log(`${GREEN}✓ Synced successfully${RESET}`)
}

export default async function syncNotes(notesPath) {
  ensureGitRepoOrExit(notesPath)
  const action = displayGitStatusAndInitAction(notesPath)

  const commands = buildGitCommands(action)

  if (!displayCommandsToRun(commands)) return
  if (!(await confirmExecution())) return

  executeCommands(commands, notesPath)
}
