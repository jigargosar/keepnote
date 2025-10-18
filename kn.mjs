#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { requireExecutables } from './util.mjs'
import { search } from './search.mjs'
import { createNote } from './create.mjs'

// Get notes directory from environment or use default, ensuring it exists
function getOrCreateNotesPath() {
  const notesPath = process.env.NOTE_PATH || path.join(os.homedir(), 'notes')
  fs.mkdirSync(notesPath, { recursive: true })
  return notesPath
}

// Editor configuration
const editorConfig = (() => {
  const EDITOR_CONFIGS = {
    code: (filepath, lineNumber) =>
      lineNumber
        ? ['--wait', '-g', `${filepath}:${lineNumber}`]
        : ['--wait', filepath],
    'code-insiders': (filepath, lineNumber) =>
      lineNumber
        ? ['--wait', '-g', `${filepath}:${lineNumber}`]
        : ['--wait', filepath],
    vim: (filepath, lineNumber) =>
      lineNumber ? [`+${lineNumber}`, filepath] : [filepath],
    nvim: (filepath, lineNumber) =>
      lineNumber ? [`+${lineNumber}`, filepath] : [filepath],
  }

  return function (filepath, lineNumber) {
    const editorCmd = process.env.EDITOR || 'code'
    const normalizedEditor = editorCmd.replace(/\.(exe|cmd)$/i, '')
    const getArgs = EDITOR_CONFIGS[normalizedEditor] || ((fp) => [fp])
    const args = getArgs(filepath, lineNumber)

    return { editorCmd, args }
  }
})()

function openInEditor(filepath, lineNumber) {
  const { editorCmd, args } = editorConfig(filepath, lineNumber)

  const result = spawnSync(editorCmd, args, {
    stdio: 'inherit',
    shell: true,
  })

  if (result.error) {
    console.error('Failed to open editor:', result.error.message)
    process.exit(1)
  }

  process.exit(result.status || 0)
}

// Main logic
async function main() {
  requireExecutables([
    { cmd: 'rg', name: 'ripgrep', url: 'https://github.com/BurntSushi/ripgrep' },
    { cmd: 'fzf', name: 'fzf', url: 'https://github.com/junegunn/fzf' },
    { cmd: 'bat', name: 'bat', url: 'https://github.com/sharkdp/bat' }
  ])

  const notesPath = getOrCreateNotesPath()
  const args = process.argv.slice(2)

  if (args.length === 0) {
    const result = await search(notesPath)
    openInEditor(result.filepath, result.lineNumber)
  } else {
    const noteTitle = args.join(' ')
    const result = createNote(noteTitle, notesPath)
    openInEditor(result.filepath)
  }
}

await main()
