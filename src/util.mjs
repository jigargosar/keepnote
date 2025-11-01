import { spawn, spawnSync } from 'node:child_process'

// Generic spawn wrapper - captures output and returns promise + process
// Promise always resolves with { code, output } - callers handle non-zero exit codes
export function spawnAndCapture(command, args, options) {
  const proc = spawn(command, args, options)

  const chunks = []
  if (proc.stdout) {
    proc.stdout.on('data', (chunk) => {
      chunks.push(chunk)
    })
  }

  const promise = new Promise((resolve, reject) => {
    proc.on('error', (err) => {
      reject(err)
    })

    proc.on('exit', (code) => {
      const output =
        chunks.length > 0 ? Buffer.concat(chunks).toString().trim() : ''
      resolve({ code, output })
    })
  })

  return { promise, process: proc }
}

// Check if a command exists
function commandExists(cmd) {
  const result = spawnSync(cmd, ['--version'], { stdio: 'ignore' })
  return !result.error
}

// Check status of executables, returns array with installed status for each
export function checkExecutables(executables) {
  return executables.map((exe) => ({
    ...exe,
    installed: commandExists(exe.cmd),
  }))
}

// Logger
export const log = (() => {
  const LOG_LEVEL = process.env.LOG_LEVEL || 'error'

  const COLORS = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    gray: '\x1b[90m',
    reset: '\x1b[0m',
  }

  function colored(color, text) {
    return `${COLORS[color]}${text}${COLORS.reset}`
  }

  function createLogger(level, color, prefix) {
    return (...args) => {
      console[level](colored(color, `[${prefix}]`), ...args)
    }
  }

  return {
    error: createLogger('error', 'red', 'Error'),

    info: (...args) => {
      if (LOG_LEVEL === 'info' || LOG_LEVEL === 'verbose') {
        createLogger('log', 'green', 'Info')(...args)
      }
    },

    verbose: (...args) => {
      if (LOG_LEVEL === 'verbose') {
        createLogger('log', 'gray', 'Verbose')(...args)
      }
    },
  }
})()
