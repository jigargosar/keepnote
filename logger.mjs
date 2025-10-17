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
