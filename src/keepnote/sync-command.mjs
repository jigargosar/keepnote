import { spawnSync } from 'node:child_process'

function runGitCommandSync(args, notesPath) {
  const result = spawnSync('git', args, {
    cwd: notesPath,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'ignore'],
  })
  return { exitCode: result.status, output: result.stdout || '' }
}

export default function syncNotes(notesPath) {
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
