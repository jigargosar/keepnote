# keepnote

[![npm version](https://badge.fury.io/js/keepnote.svg)](https://www.npmjs.com/package/keepnote)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Lightning-fast note-taking for the command line

Dead simple. Blazingly fast. Just notes.

## Why?

- **Search is instant** - ripgrep + fzf means you find what you need in milliseconds
- **Creating notes is frictionless** - `kn "my idea"` and you're writing
- **Opens right where you need** - Jumps to the exact line in your editor
- **Works everywhere** - Linux, macOS, Windows
- **No lock-in** - Just markdown files in a folder
- **Preview while you search** - See your notes with syntax highlighting before opening

## Installation

```bash
npm install -g keepnote
```

### What you need

Three excellent CLI tools (you probably already have them):
- [ripgrep](https://github.com/BurntSushi/ripgrep)
- [fzf](https://github.com/junegunn/fzf)
- [bat](https://github.com/sharkdp/bat)

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

**New note:**

```bash
kn "My note title"
```

Boom. New note created as `YYYY-MM-DD_my-note-title.md` and opened in your editor.

**Find your notes:**

```bash
kn
```

Fuzzy search appears. Type to filter. Hit Enter. Done.

**Configure:**

```bash
keepnote config
```

Opens `~/.config/keepnote/config.toml` where you can set your notes path and editor:

```toml
notePath = "/path/to/your/notes"  # default: ~/notes
editor = "code"                    # default: $EDITOR or vim
```

**Get help:**

```bash
keepnote help
```

## How it works

1. **Create**: `kn "title"` generates a markdown file with date prefix
2. **Search**: `kn` uses ripgrep to index all notes, pipes to fzf for interactive filtering
3. **Preview**: bat provides syntax-highlighted preview while browsing
4. **Open**: Selected note opens in your configured editor at the matched line

## Credits

Inspired by [ripnote](https://github.com/cekrem/ripnote) by cekrem.

## License

MIT