import { checkExecutables } from './util.mjs'

const REQUIRED_EXECUTABLES = [
  { cmd: 'rg', name: 'ripgrep', url: 'https://github.com/BurntSushi/ripgrep' },
  { cmd: 'fzf', name: 'fzf', url: 'https://github.com/junegunn/fzf' },
  { cmd: 'bat', name: 'bat', url: 'https://github.com/sharkdp/bat' },
]

// Format executable status for display
function formatExecutableStatus(executables) {
  const GREEN = '\x1b[32m'
  const RED = '\x1b[31m'
  const RESET = '\x1b[0m'
  const CHECK_MARK = '\u2713'
  const CROSS_MARK = '\u2717'

  const lines = executables.map((exe) => {
    const status = exe.installed
      ? `${GREEN}${CHECK_MARK}${RESET} Installed`
      : `${RED}${CROSS_MARK}${RESET} Missing`

    return exe.installed
      ? `  ${status} ${exe.name}`
      : `  ${status} ${exe.name} - ${exe.url}`
  })

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
export function displayDependencyStatus() {
  const { formatted } = getDependencyStatus()
  console.log('Dependencies:')
  console.log(formatted)
}

// Display and exit if any dependency missing
export function displayAndExitIfAnyDependencyMissing() {
  const { formatted, anyMissing } = getDependencyStatus()

  if (anyMissing) {
    console.error('Missing required dependencies:')
    console.error(formatted)
    process.exit(1)
  }
}
