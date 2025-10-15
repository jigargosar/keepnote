#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import os from 'os';

// Get notes directory from environment or use default
const getNotesPath = () => {
  return process.env.NOTE_PATH || path.join(os.homedir(), 'notes');
};

// Format date as YYYY-MM-DD
const getDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Create a new note
const createNote = (title) => {
  const notesPath = getNotesPath();

  // Create notes directory if it doesn't exist
  if (!fs.existsSync(notesPath)) {
    fs.mkdirSync(notesPath, { recursive: true });
    console.log(`Created notes directory: ${notesPath}`);
  }

  // Create filename: YYYY-MM-DD_title.md
  const filename = `${getDateString()}_${title.replace(/\s+/g, '-')}.md`;
  const filepath = path.join(notesPath, filename);

  // Create note content with heading and blank lines
  const content = `# ${title}\n\n\n`;

  fs.writeFileSync(filepath, content);
  console.log(`Created note: ${filepath}`);

  return filepath;
};

// Main logic
const main = () => {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Search mode not implemented yet');
    process.exit(0);
  }

  // Join all arguments as the note title
  const noteTitle = args.join(' ');
  createNote(noteTitle);
};

main();