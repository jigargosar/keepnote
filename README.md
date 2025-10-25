# keepnote

[![npm version](https://badge.fury.io/js/keepnote.svg)](https://www.npmjs.com/package/keepnote)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A fast, minimal CLI tool for creating and searching notes. Built with speed and simplicity in mind.

## Features

- **Fast fuzzy search** - Instantly search through all your notes with ripgrep + fzf
- **Quick note creation** - Create notes with automatic date prefixes and smart filename sanitization
- **Editor integration** - Opens notes in your preferred editor with cursor at the right line
- **Cross-platform** - Works on Linux, macOS, and Windows
- **Configurable** - Customize notes directory and editor via config file
- **Live preview** - See note contents while searching with syntax highlighting

## Installation

```bash
npm install -g keepnote
```

### Prerequisites

The following tools must be installed and available in your PATH:
- [ripgrep](https://github.com/BurntSushi/ripgrep) - Fast search
- [fzf](https://github.com/junegunn/fzf) - Fuzzy finder
- [bat](https://github.com/sharkdp/bat) - Syntax highlighting in preview

**Install on macOS (Homebrew):**
```bash
brew install ripgrep fzf bat
```

**Install on Windows (Scoop):**
```bash
scoop install ripgrep fzf bat
```

**Install on Linux (Ubuntu/Debian):**
```bash
apt install ripgrep fzf bat
```

## Usage

### Create a new note

```bash
kn "My note title"
```

Creates a new note with filename format: `YYYY-MM-DD_my-note-title.md`

### Search and open existing notes

```bash
kn
```

Opens an interactive fuzzy finder to search through all note contents. Use arrow keys to navigate, type to filter, and press Enter to open.

### Configuration

```bash
keepnote config
```

Opens the configuration file in your editor. You can customize:

```toml
# Notes directory path
notePath = "/path/to/your/notes"

# Editor command (defaults to $EDITOR env var or vim)
editor = "code"  # or "vim", "nvim", "nano", etc.
```

**Default paths:**
- Notes: `~/notes`
- Config: `~/.config/keepnote/config.toml`

### Help

```bash
keepnote help
```

Shows all available commands and current configuration paths.

## How it works

1. **Create**: `kn "title"` generates a markdown file with date prefix
2. **Search**: `kn` uses ripgrep to index all notes, pipes to fzf for interactive filtering
3. **Preview**: bat provides syntax-highlighted preview while browsing
4. **Open**: Selected note opens in your configured editor at the matched line

## License

MIT