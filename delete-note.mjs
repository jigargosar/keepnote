#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'

// Strip ANSI color codes
function stripAnsi(str) {
  return str.replace(/\u001b\[\d+m/g, '')
}

const notesPath = process.argv[2]
const filenameRaw = process.argv[3]
const filename = stripAnsi(filenameRaw)

if (!notesPath || !filename) {
  console.error('Error: notesPath and filename arguments required')
  process.exit(1)
}

const filepath = path.join(notesPath, filename)

if (!fs.existsSync(filepath)) {
  console.error(`Error: File does not exist: ${filepath}`)
  process.exit(1)
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

rl.question(`Mock Delete: ${filename}? (y/N) `, (answer) => {
  rl.close()

  if (answer.toLowerCase() === 'y') {
    try {
      // fs.unlinkSync(filepath)
      console.log(`Deleted: ${filename}`)
      process.exit(0)
    } catch (err) {
      console.error(`Error deleting file: ${err.message}`)
      process.exit(1)
    }
  } else {
    console.log('Cancelled')
    process.exit(0)
  }
})
