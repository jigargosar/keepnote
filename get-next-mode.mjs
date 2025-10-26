#!/usr/bin/env node

// Helper script for fzf transform binding
// Reads current prompt from FZF_PROMPT env var and outputs next mode command

const currentPrompt = process.env.FZF_PROMPT || 'Content> '

if (currentPrompt === 'Content> ') {
  console.log('change-prompt(Files> )')
} else {
  console.log('change-prompt(Content> )')
}