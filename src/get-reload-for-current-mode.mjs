#!/usr/bin/env node

import { fileContentSearchCommand, fileNameSearchCommand } from './rg-commands.mjs'
import { FZF_PROMPTS } from './keepnote/constants.mjs'

const notesPath = process.argv[2]

if (!notesPath) {
  console.error('Error: notes path argument required')
  process.exit(1)
}

const currentPrompt = process.env.FZF_PROMPT

let reloadCommand
if (currentPrompt === FZF_PROMPTS.CONTENT) {
  reloadCommand = fileContentSearchCommand(notesPath)
} else if (currentPrompt === FZF_PROMPTS.FILES) {
  reloadCommand = fileNameSearchCommand(notesPath)
} else {
  reloadCommand = fileContentSearchCommand(notesPath)
}

console.log(`reload(${reloadCommand})+refresh-preview`)
