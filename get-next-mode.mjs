#!/usr/bin/env node

import { fileContentSearchCommand, fileNameSearchCommand } from './rg-commands.mjs'

const CONTENT_PROMPT = 'Content> '
const FILES_PROMPT = 'Files> '

const notesPath = process.argv[2]

if (!notesPath) {
  console.error('Error: notes path argument required')
  process.exit(1)
}

if (process.env.FZF_PROMPT === CONTENT_PROMPT) {
  console.log(`change-prompt(${FILES_PROMPT})+reload(${fileNameSearchCommand(notesPath)})`)
} else {
  console.log(`change-prompt(${CONTENT_PROMPT})+reload(${fileContentSearchCommand(notesPath)})`)
}