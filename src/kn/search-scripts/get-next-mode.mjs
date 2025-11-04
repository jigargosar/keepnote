#!/usr/bin/env node

import { MODE_NAMES, MODES, fileContentSearchCommand, fileNameSearchCommand } from '../search-command.mjs'

const notesPath = process.argv[2]

if (!notesPath) {
  console.error('Error: notes path argument required')
  process.exit(1)
}

if (process.env.FZF_PROMPT === MODES[MODE_NAMES.CONTENT].prompt) {
  console.log(`change-prompt(${MODES[MODE_NAMES.FILES].prompt})+reload(${fileNameSearchCommand(notesPath)})`)
} else {
  console.log(`change-prompt(${MODES[MODE_NAMES.CONTENT].prompt})+reload(${fileContentSearchCommand(notesPath)})`)
}
