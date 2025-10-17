const LOG_LEVEL = process.env.LOG_LEVEL || 'error';

const COLORS = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
  reset: '\x1b[0m'
};

function colored(color, text) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function createLogger(level, color, prefix) {
  return (...args) => {
    console[level](colored(color, `[${prefix}]`), ...args);
  };
}

const errorLogger = createLogger('error', 'red', 'Error');
const infoLogger = createLogger('log', 'green', 'Info');
const verboseLogger = createLogger('log', 'gray', 'Verbose');

export const log = {
  error: errorLogger,

  info: (...args) => {
    if (LOG_LEVEL === 'info' || LOG_LEVEL === 'verbose') {
      infoLogger(...args);
    }
  },

  verbose: (...args) => {
    if (LOG_LEVEL === 'verbose') {
      verboseLogger(...args);
    }
  }
};
