# keepnote

[![npm version](https://badge.fury.io/js/keepnote.svg)](https://www.npmjs.com/package/keepnote)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Lightning-fast note-taking for the command line

Dead simple. Blazingly fast. Just notes.

## Why?

- **Search is instant** - ripgrep + fzf means you find what you need in milliseconds
- **Dual search modes** - Toggle between filename and content search with Tab
- **Creating notes is frictionless** - `kn "my idea"` and you're writing
- **Opens right where you need** - Jumps to the exact line in your editor
- **Git sync built-in** - One command backup your notes with automated commit messages
- **Works everywhere** - Linux, macOS, Windows
- **No lock-in** - Just markdown files in a folder
- **Preview while you search** - See your notes with syntax highlighting before opening

## Installation

```bash
npm install -g keepnote
```

### What you need

Three excellent CLI tools (you probably already have them): [ripgrep](https://github.com/BurntSushi/ripgrep), [fzf](https://github.com/junegunn/fzf), [bat](https://github.com/sharkdp/bat)

```
# macOS
brew install ripgrep fzf bat

# Windows
scoop install ripgrep fzf bat

# Linux
apt install ripgrep fzf bat
```

## Usage

**New note:**

```bash
kn "My note title"
```

Creates a markdown file as `YYYY-MM-DD_my-note-title.md` and opens it in your editor. Just start typing.

**Find your notes:**

```bash
kn
```

Launches interactive search powered by ripgrep and fzf. Type to filter through all your notes. Press Tab to toggle between searching filenames vs file content. bat shows a syntax-highlighted preview as you browse. Hit Enter to open the note at the exact matched line.

**Configure:**

```bash
keepnote config
```

Opens `~/.config/keepnote/config.toml` where you can set your notes path and editor:

```toml
notePath = "/path/to/your/notes"  # default: ~/notes
editor = "code"                    # default: $EDITOR or vim
```

**Sync your notes:**

```bash
keepnote sync
```

Automatically commits and pushes your notes to git with a timestamped message.

**Get help:**

```bash
keepnote help
```

## FAQ

**Where are my notes stored?**
By default, in `~/notes`, but you can change this with `keepnote config`.

**How do I back up my notes?**
Your notes are just markdown files - use any backup solution. Or run `keepnote sync` to push to a git repository.

**Can I use my own editor?**
Yes. Set it in `~/.config/keepnote/config.toml` or keepnote will use your `$EDITOR` environment variable.

**What's the file naming convention?**
Notes are named `YYYY-MM-DD_your-title.md` automatically when you create them.

## Credits

Inspired by [ripnote](https://github.com/cekrem/ripnote) by cekrem.

## License

MIT