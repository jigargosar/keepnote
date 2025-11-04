# Architecture Analysis

## **Current Architecture Flow**

```
kn.mjs
  ↓
search-note.mjs (orchestrator)
  ↓ spawns FZF with config
  ├── --bind=start:reload(rg command)        [uses rg-commands.mjs]
  ├── --bind=tab:transform(get-next-mode)    [spawns helper script]
  ├── --bind=ctrl-d:execute(delete-note)+transform(get-reload)
  ├── --preview=preview-note                 [spawns helper script]
  ↓
FZF runs, receives ripgrep output via pipe
  ↓
User interactions spawn helper scripts:
  - get-next-mode.mjs          → outputs: change-prompt()+reload(rg command)
  - get-reload-for-current-mode.mjs → outputs: reload(rg command)
  - preview-note.mjs           → spawns bat
  - delete-note.mjs            → deletes file
  ↓
FZF exits with selection (in ripgrep output format)
  ↓
search-note.mjs parses selection (parseRipgrepSelection)
  ↓
Returns to kn.mjs
```

## **File Dependencies**

| File                              | Imports                | Purpose                             |
|-----------------------------------|------------------------|-------------------------------------|
| `search-note.mjs`                 | rg-commands, constants | Orchestrates FZF+RG, parses results |
| `get-next-mode.mjs`               | rg-commands, constants | Outputs FZF transform command       |
| `get-reload-for-current-mode.mjs` | rg-commands, constants | Outputs FZF reload command          |
| `preview-note.mjs`                | (none)                 | Spawns bat for preview              |
| `delete-note.mjs`                 | (none)                 | Deletes file                        |
| `rg-commands.mjs`                 | (none)                 | Builds ripgrep command strings      |
| `constants.mjs`                   | (none)                 | Mode definitions                    |

## **Recommended Structure**

```
src/kn/
├── search-note.mjs           ← Main orchestrator (spawns FZF, parses output)
├── create-note.mjs           ← Create new notes
│
├── rg/                       ← Ripgrep layer
│   ├── commands.mjs          ← Build rg command strings
│   └── parser.mjs            ← Parse rg output format (from search-note)
│
├── fzf-scripts/              ← Scripts spawned BY FZF
│   ├── modes.mjs             ← Mode config (CONTENT/FILES), DEFAULT_MODE
│   ├── get-next-mode.mjs     ← Tab key handler
│   ├── get-reload.mjs        ← Reload after delete
│   ├── preview.mjs           ← Preview handler
│   └── delete.mjs            ← Delete handler
```

## **Key Design Decisions**

1. **`rg/` directory** - Ripgrep-specific code
    - `commands.mjs` - Command builders
    - `parser.mjs` - Parse ripgrep output (move from rg-commands.mjs)

2. **`fzf-scripts/` directory** - Helper scripts spawned by FZF
    - `modes.mjs` - Mode configuration (CONTENT/FILES, DEFAULT_MODE, mode-to-command mapping)
    - All FZF child processes in one place
    - Import from `../rg/commands.mjs` when needed

3. **`search-note.mjs` orchestrates**:
    - Imports from `rg/commands.mjs` for initial command
    - Imports from `rg/parser.mjs` for parsing selection
    - Imports from `fzf-scripts/modes.mjs` for default mode
    - Passes script paths to FZF --bind arguments

4. **Separation of concerns**:
    - Ripgrep = search engine (rg/)
    - FZF = UI layer (fzf-scripts/)
    - search-note = orchestrator (connects them)

Does this structure make sense? Should I proceed with this reorganization?
