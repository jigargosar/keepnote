import path from 'node:path'

export const FIELD_DELIMITER = '//'

const WINDOWS_RESERVED_GLOBS = [
  '--glob', '!CON',
  '--glob', '!PRN',
  '--glob', '!AUX',
  '--glob', '!NUL',
  '--glob', '!COM[1-9]',
  '--glob', '!LPT[1-9]',
]

const CONTENT_MODE_ARGS = [
  '--line-number',
  '--color=always',
  '--with-filename',
  '--follow',
  `--field-match-separator=${FIELD_DELIMITER}`,
  ...WINDOWS_RESERVED_GLOBS,
  '.',
]

const FILES_MODE_ARGS = [
  '--files',
  '--color=always',
  ...WINDOWS_RESERVED_GLOBS,
]

export function getContentModeReloadCommand(notesPath) {
  return `cd ${notesPath} && ${['rg', ...CONTENT_MODE_ARGS].join(' ')}`
}

export function getFilesModeReloadCommand(notesPath) {
  return `cd ${notesPath} && ${['rg', ...FILES_MODE_ARGS].join(' ')}`
}

export function parseRipgrepSelection(selection, notesPath) {
  const parts = selection.split(FIELD_DELIMITER)

  // Files mode: just filename, no separator or line number
  if (parts.length === 1) {
    const filename = parts[0]
    const filepath = path.join(notesPath, filename)
    return { filename, lineNumber: 1, filepath }
  }

  // Content mode: filename + line number
  if (parts.length < 2) {
    throw new Error('Could not parse selection: invalid format')
  }

  const filename = parts[0]
  const lineNumber = parseInt(parts[1], 10)
  const filepath = path.join(notesPath, filename)

  return { filename, lineNumber, filepath }
}