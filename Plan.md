# KeepNote (kn) Implementation Plan

## Goal
Create a CLI note-taking tool in a single Node.js file that replicates ripnote functionality.

## Dependencies
- ripgrep (rg)
- fzf
- bat
- $EDITOR environment variable

## Implementation Steps

### Step 1: Basic scaffolding & create note (no editor)
- Parse command line arguments
- Create notes directory (from NOTE_PATH env var or default ~/notes)
- Create new note file: `YYYY-MM-DD_title.md` with heading
- Use Node.js Date for timestamp (not GNU date)
- Test: `node kn.js "my test note"` creates file in notes directory

### Step 2: Open note in editor
- Check $EDITOR environment variable
- Warn if not set
- Open created note at line 3 using child_process.spawn
- Test: `node kn.js "another note"` creates and opens in editor

### Step 3: Search mode - basic ripgrep integration
- Detect when no arguments provided
- Use child_process to call ripgrep on notes directory
- Format output: `filename:line_number content`
- Display results to console
- Test: `node kn.js` shows search results

### Step 4: Add fzf fuzzy finder
- Pipe ripgrep output to fzf
- Handle fzf selection
- Parse selected result (filename + line number)
- Test: `node kn.js` opens fzf, selecting a result shows parsed info

### Step 5: Open selected note in editor
- Take fzf selection
- Extract filename and line number
- Open in $EDITOR at specific line (e.g., `vim +42 filename.md`)
- Test: Full workflow - search, select, opens in editor at correct line

### Step 6: Add bat preview to fzf
- Configure fzf with --preview option
- Use bat to show file preview with highlighted line
- Test: `node kn.js` shows fzf with syntax-highlighted preview

### Step 7: Error handling & polish
- Check for missing dependencies (rg, fzf, bat)
- Handle missing $EDITOR gracefully
- Handle NOTE_PATH directory creation errors
- Better error messages
- Test: Run without dependencies, verify helpful error messages

### Step 8: Cross-platform validation
- Test on Windows/Linux/macOS if possible
- Verify path handling works across platforms
- Verify date formatting is consistent
- Test: Run on different platforms

## Success Criteria
- Create notes with timestamp and title
- Search existing notes with fuzzy find + preview
- Open notes in user's preferred editor
- Works cross-platform
- Simple, single-file implementation

## Someday/Maybe
- Support editor-specific line number syntax (vim +line, code -g file:line, etc.)
- Colocate ripgrep output format encoding/decoding (create RipgrepFormat object with args + parse method)