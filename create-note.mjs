import fs from 'node:fs'
import path from 'node:path'
import filenamify from 'filenamify'

// Format date as YYYY-MM-DD
function getDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Build filename for a new note with proper sanitization
function buildNoteFilename(title) {
  const datePrefix = getDateString()

  // Step 1: Replace invalid filename chars with dash
  const sanitized = filenamify(title, { replacement: '-' })
  // Step 2: Replace spaces (including multiple) with single dash
  const spacesReplaced = sanitized.replace(/\s+/g, '-')
  // Step 3: Replace multiple consecutive dashes with single dash
  const dashesCollapsed = spacesReplaced.replace(/-+/g, '-')
  // Step 4: Trim leading/trailing dashes
  const slug = dashesCollapsed.replace(/^-+|-+$/g, '')

  return `${datePrefix}_${slug}.md`
}

/**
 * Create a new note with the given title
 *
 * @param {string} title - The title of the note
 * @param {string} notesPath - Path to notes directory
 * @returns {{filepath: string, lineNumber: number}} Path to created note and line number for cursor
 */
export default function createNote(title, notesPath) {
  const filename = buildNoteFilename(title)
  const filepath = path.join(notesPath, filename)

  const content = `# ${title}\n\n\n`
  fs.writeFileSync(filepath, content)
  console.log(`Created note: ${filepath}`)

  // Return line 4 (after all content) for cursor position
  return { filepath, lineNumber: 4 }
}
