#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

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

// Open file in editor
const openInEditor = (filepath) => {
  const editor = process.env.EDITOR;

  if (!editor) {
    console.error('Error: $EDITOR environment variable not set');
    console.error('Please set your preferred editor: export EDITOR=code');
    process.exit(1);
  }

  const editorProcess = spawn(editor, [filepath], {
    stdio: 'inherit'
  });

  editorProcess.on('exit', (code) => {
    process.exit(code || 0);
  });
};

// Search notes using ripgrep + fzf
const searchNotes = () => {
  const notesPath = getNotesPath();

  if (!fs.existsSync(notesPath)) {
    console.error(`Notes directory does not exist: ${notesPath}`);
    process.exit(1);
  }

  // Use ripgrep to search all notes
  const rgProcess = spawn('rg', [
    '--line-number',
    '--color=always',
    '--with-filename',
    '--follow',
    '.',
    notesPath
  ]);

  // Pipe ripgrep output to fzf
  const fzfProcess = spawn('fzf', [
    '--ansi'
  ], {
    stdio: ['pipe', 'pipe', 'inherit']
  });

  // Connect ripgrep stdout to fzf stdin
  rgProcess.stdout.pipe(fzfProcess.stdin);

  rgProcess.on('error', (err) => {
    console.error('Error: ripgrep (rg) not found');
    console.error('Please install ripgrep: https://github.com/BurntSushi/ripgrep');
    process.exit(1);
  });

  fzfProcess.on('error', (err) => {
    console.error('Error: fzf not found');
    console.error('Please install fzf: https://github.com/junegunn/fzf');
    process.exit(1);
  });

  // Capture fzf selection
  let selection = '';
  fzfProcess.stdout.on('data', (data) => {
    selection += data.toString();
  });

  fzfProcess.on('exit', (code) => {
    if (code === 0 && selection.trim()) {
      console.log('Selected:', selection.trim());
    }
    process.exit(code || 0);
  });
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
    searchNotes();
    return;
  }

  // Join all arguments as the note title
  const noteTitle = args.join(' ');
  const filepath = createNote(noteTitle);
  openInEditor(filepath);
};

main();