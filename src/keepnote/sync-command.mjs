import { spawnSync } from 'node:child_process'

const RED = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const BOLD = '\x1b[1m'
const RESET = '\x1b[0m'

function runGitCommandSync(args, notesPath) {
  const result = spawnSync('git', args, {
    cwd: notesPath,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  })
  return { exitCode: result.status, output: result.stdout || '' }
}

function checkGitRepo(notesPath) {
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

function showGitStatus(notesPath) {
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
}

export default function syncNotes(notesPath) {
  checkGitRepo(notesPath)
  showGitStatus(notesPath)
  console.log('TODO: Show commands and prompt')
}
