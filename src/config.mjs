import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import TOML from '@iarna/toml'

const CONFIG_DIR = path.join(os.homedir(), '.config', 'keepnote')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.toml')

const DEFAULT_NOTES_PATH = path.join(os.homedir(), 'notes')
const DEFAULT_EDITOR = process.env.EDITOR || 'code -w'

const DEFAULT_CONFIG_TEMPLATE = `# Keepnote Configuration File

# Notes directory path
# Default:
# notePath = "~/notes"

# Editor command
# Default:
# editor = "$EDITOR or code -w"
`

function readConfig() {
  fs.mkdirSync(CONFIG_DIR, { recursive: true })

  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, DEFAULT_CONFIG_TEMPLATE, 'utf8')
  }

  const content = fs.readFileSync(CONFIG_FILE, 'utf8')
  return TOML.parse(content)
}

export function getOrCreateNotesPath() {
  const config = readConfig()

  const notesPath = config.notePath || DEFAULT_NOTES_PATH
  fs.mkdirSync(notesPath, { recursive: true })

  return notesPath
}

export function getEditorExecutableName() {
  const config = readConfig()
  return config.editor || DEFAULT_EDITOR
}

// Get config file path, creating file with template if needed
export function getOrCreateConfigFilePath() {
  readConfig()
  return CONFIG_FILE
}