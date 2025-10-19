# keepnote

Simple CLI note-taking tool. Cross-platform (Linux, macOS, Windows).

## Prerequisites

Requires the following tools to be installed:
- [ripgrep](https://github.com/BurntSushi/ripgrep)
- [fzf](https://github.com/junegunn/fzf)
- [bat](https://github.com/sharkdp/bat)

These are available on all platforms via package managers (brew, chocolatey, scoop, etc).

## Installation

```bash
npm install -g keepnote
```

## Usage

Create a new note:
```bash
kn my note title
```

Search existing notes:
```bash
kn
```

## Configuration

By default, notes are stored in `~/notes`. To use a different location, set the `NOTE_PATH` environment variable:

**Unix/macOS/Git Bash:**
```bash
export NOTE_PATH=/path/to/your/notes
```

**Windows CMD:**
```cmd
set NOTE_PATH=C:\path\to\your\notes
```

**Windows PowerShell:**
```powershell
$env:NOTE_PATH = "C:\path\to\your\notes"
```