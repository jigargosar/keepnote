#!/usr/bin/env node

import { fileContentSearchCommand, fileNameSearchCommand } from './rg-commands.mjs'

const CONTENT_PROMPT = 'Content> '
const FILES_PROMPT = 'Files> '

const notesPath = process.argv[2]

if (!notesPath) {
  console.error('Error: notes path argument required')
  process.exit(1)
}

const currentPrompt = process.env.FZF_PROMPT

let reloadCommand
if (currentPrompt === CONTENT_PROMPT) {
  reloadCommand = fileContentSearchCommand(notesPath)
} else if (currentPrompt === FILES_PROMPT) {
  reloadCommand = fileNameSearchCommand(notesPath)
} else {
  reloadCommand = fileContentSearchCommand(notesPath)
}

console.log(`reload(${reloadCommand})+refresh-preview`)
