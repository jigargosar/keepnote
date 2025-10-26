#!/usr/bin/env node

import { spawnSync } from 'node:child_process'

const filename = process.argv[2]
const lineNumber = process.argv[3]

const args = ['--color=always', '--style=numbers']

if (lineNumber) {
  args.push(`--highlight-line=${lineNumber}`)
}

args.push(filename)

const result = spawnSync('bat', args, { stdio: 'inherit' })
process.exit(result.status)