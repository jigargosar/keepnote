#!/usr/bin/env node

const CONTENT_PROMPT = 'Content> '
const FILES_PROMPT = 'Files> '

const currentPrompt = process.env.FZF_PROMPT
const nextPrompt = currentPrompt === CONTENT_PROMPT ? FILES_PROMPT : CONTENT_PROMPT

console.log(`change-prompt(${nextPrompt})`)