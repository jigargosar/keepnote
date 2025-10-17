#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

// Get notes directory from environment or use default
function getNotesPath() {
  return process.env.NOTE_PATH || path.join(os.homedir(), 'notes');
}

// Format date as YYYY-MM-DD
function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Editor configurations - maps editor name to argument builder function
const EDITOR_CONFIGS = {
  'code': (filepath, lineNumber) => lineNumber ? ['--wait', '-g', `${filepath}:${lineNumber}`] : ['--wait', filepath],
  'code-insiders': (filepath, lineNumber) => lineNumber ? ['--wait', '-g', `${filepath}:${lineNumber}`] : ['--wait', filepath],
  'vim': (filepath, lineNumber) => lineNumber ? [`+${lineNumber}`, filepath] : [filepath],
  'nvim': (filepath, lineNumber) => lineNumber ? [`+${lineNumber}`, filepath] : [filepath],
};

function openInEditor(filepath, lineNumber) {
  const editorCmd = process.env.EDITOR || 'code';

  // Normalize editor name (remove .exe, .cmd extensions for lookup)
  const normalizedEditor = editorCmd.replace(/\.(exe|cmd)$/i, '');

  // Get editor config or use default (just pass filepath)
  const getArgs = EDITOR_CONFIGS[normalizedEditor] || ((fp) => [fp]);
  const args = getArgs(filepath, lineNumber);

  const editorProcess = spawn(editorCmd, args, {
    stdio: 'inherit',
    shell: true
  });

  editorProcess.on('exit', (code) => {
    if (code === 0) {
      console.log('Editor closed');
    } else {
      console.error(`Editor exited with code ${code}`);
    }
    process.exit(code || 0);
  });

  editorProcess.on('error', (error) => {
    console.error('Failed to open editor:', error.message);
    process.exit(1);
  });
}

// Search notes using ripgrep + fzf
function searchNotes() {
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
    '.'
  ], {
    cwd: notesPath,  // Run inside notes dir to get relative paths
    stdio: ['ignore', 'pipe', 'pipe']  // stdin ignored, stdout/stderr piped
  });

  // Pipe ripgrep output to fzf with bat preview
  const fzfProcess = spawn('fzf', [
    '--ansi',
    '--delimiter', ':',
    '--preview', '"bat --color=always --style=numbers --highlight-line={2} {1}"',
    '--preview-window', 'right:60%:wrap'
  ], {
    stdio: ['pipe', 'pipe', 'inherit'],
    cwd: notesPath,  // Run bat in notes directory so it finds relative paths
    shell: true  // Need shell to handle quoted preview command
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
      // Parse selection: filename:lineNumber:content (content may have colons)
      const parts = selection.trim().split(':');
      if (parts.length >= 2) {
        const filename = parts[0];
        const lineNumber = parseInt(parts[1], 10);

        // Reconstruct full path
        const filepath = path.join(notesPath, filename);

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
}

// Create a new note
function createNote(title) {
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
}

// Main logic
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    searchNotes();
    return;
  }

  // Join all arguments as the note title
  const noteTitle = args.join(' ');
  const filepath = createNote(noteTitle);
  openInEditor(filepath);
}

main();