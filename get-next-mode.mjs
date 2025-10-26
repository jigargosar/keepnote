#!/usr/bin/env node

const CONTENT_PROMPT = 'Content> '
const FILES_PROMPT = 'Files> '
const FIELD_SEPARATOR = '//'

const notesPath = process.argv[2]

if (!notesPath) {
  console.error('Error: notes path argument required')
  process.exit(1)
}

const contentModeCommand = [
  'rg',
  '--line-number',
  '--color=always',
  '--with-filename',
  '--follow',
  '--field-match-separator',
  FIELD_SEPARATOR,
  '--glob', '!CON',
  '--glob', '!PRN',
  '--glob', '!AUX',
  '--glob', '!NUL',
  '--glob', '!COM[1-9]',
  '--glob', '!LPT[1-9]',
  '.',
].join(' ')

const filesModeCommand = 'rg --files --color=always'

if (process.env.FZF_PROMPT === CONTENT_PROMPT) {
  console.log(`change-prompt(${FILES_PROMPT})+reload(cd ${notesPath} && ${filesModeCommand})`)
} else {
  console.log(`change-prompt(${CONTENT_PROMPT})+reload(cd ${notesPath} && ${contentModeCommand})`)
}