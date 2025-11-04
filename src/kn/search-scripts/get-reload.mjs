#!/usr/bin/env node

import { MODE_NAMES, MODES, fileContentSearchCommand, fileNameSearchCommand } from '../search-command.mjs'

const notesPath = process.argv[2]

if (!notesPath) {
  console.error('Error: notes path argument required')
  process.exit(1)
}

const currentPrompt = process.env.FZF_PROMPT

let reloadCommand
if (currentPrompt === MODES[MODE_NAMES.CONTENT].prompt) {
  reloadCommand = fileContentSearchCommand(notesPath)
} else if (currentPrompt === MODES[MODE_NAMES.FILES].prompt) {
  reloadCommand = fileNameSearchCommand(notesPath)
} else {
  reloadCommand = fileNameSearchCommand(notesPath)
}

console.log(`reload(${reloadCommand})+refresh-preview`)
