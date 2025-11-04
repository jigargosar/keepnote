#!/usr/bin/env node

import { fileContentSearchCommand, fileNameSearchCommand } from './rg-commands.mjs'
import { FZF_PROMPTS } from './keepnote/constants.mjs'

const notesPath = process.argv[2]

if (!notesPath) {
  console.error('Error: notes path argument required')
  process.exit(1)
}

if (process.env.FZF_PROMPT === FZF_PROMPTS.CONTENT) {
  console.log(`change-prompt(${FZF_PROMPTS.FILES})+reload(${fileNameSearchCommand(notesPath)})`)
} else {
  console.log(`change-prompt(${FZF_PROMPTS.CONTENT})+reload(${fileContentSearchCommand(notesPath)})`)
}