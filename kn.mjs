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


// const editor = process.env.EDITOR;
const editor = 'code';


function getEditorArgs(filePath, lineNumber) {
    // VS Code: use -g flag with file:line format
    if (lineNumber) {
        return ['-g', `${filePath}:${lineNumber}`];
    }
    return [filePath];
}

// Open file in editor
const openInEditor = (filepath, lineNumber) => {

  if (!editor) {
    console.error('Error: $EDITOR environment variable not set');
    console.error('Please set your preferred editor: export EDITOR=code');
    process.exit(1);
  }

  const editorProcess = spawn(editor, getEditorArgs(filepath, lineNumber), {
    stdio: 'inherit',
    shell: true  // Required for .cmd files on Windows
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

  // Use ripgrep to search note content with line numbers
  const rgProcess = spawn('rg', [
    '--line-number',
    '--color=always',
    '--with-filename',
    '--no-heading',
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
      // Parse selection: filepath:lineNumber:content
      // Handle Windows paths (C:\...) by looking for :digit: pattern
      const match = selection.trim().match(/^(.+?):(\d+):/);
      if (match) {
        const filepath = match[1];
        const lineNumber = parseInt(match[2], 10);
        console.log('Opening:', filepath, 'at line', lineNumber);
        openInEditor(filepath, lineNumber);
      } else {
        console.error('Could not parse selection');
        process.exit(1);
      }
    } else {
      process.exit(code || 0);
    }
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