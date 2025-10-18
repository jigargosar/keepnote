import fs from 'node:fs'
import path from 'node:path'

// Format date as YYYY-MM-DD
function getDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Build filename for a new note
function buildNoteFilename(title) {
  const datePrefix = getDateString()
  const slug = title.replace(/\s+/g, '-')
  return `${datePrefix}_${slug}.md`
}

/**
 * Create a new note with the given title
 *
 * @param {string} title - The title of the note
 * @param {string} notesPath - Path to notes directory
 * @returns {{filepath: string}} Path to created note
 */
export default function createNote(title, notesPath) {
  const filename = buildNoteFilename(title)
  const filepath = path.join(notesPath, filename)

  const content = `# ${title}\n\n\n`
  fs.writeFileSync(filepath, content)
  console.log(`Created note: ${filepath}`)

  return { filepath }
}
