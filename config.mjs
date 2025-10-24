import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import TOML from '@iarna/toml'

const CONFIG_DIR = path.join(os.homedir(), '.config', 'keepnote')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.toml')

const DEFAULT_CONFIG_TEMPLATE = `# Keepnote Configuration File

# Notes directory path
# Default:
# notePath = "${path.join(os.homedir(), 'notes')}"

# Editor command
# Default:
# editor = "${process.env.EDITOR || 'vim'}"
`

// Read config file, return empty object if not found
function readConfig() {
  try {
    const content = fs.readFileSync(CONFIG_FILE, 'utf8')
    return TOML.parse(content)
  } catch (error) {
    // Config file doesn't exist or is invalid
    return {}
  }
}

// Ensure config directory and file exist with template
function ensureConfigFile() {
  fs.mkdirSync(CONFIG_DIR, { recursive: true })

  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, DEFAULT_CONFIG_TEMPLATE, 'utf8')
  }
}

// Get notes path, creating notes directory if needed
export function getOrCreateNotesPath() {
  ensureConfigFile()
  const config = readConfig()

  const notesPath = config.notePath || path.join(os.homedir(), 'notes')
  fs.mkdirSync(notesPath, { recursive: true })

  return notesPath
}

// Get editor executable name from config, env var, or default
export function getEditorExecutableName() {
  ensureConfigFile()
  const config = readConfig()

  if (config.editor) {
    return config.editor
  }

  if (process.env.EDITOR) {
    return process.env.EDITOR
  }

  return 'vim'
}

// Get config file path, creating file with template if needed
export function getOrCreateConfigFilePath() {
  ensureConfigFile()
  return CONFIG_FILE
}