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

## **Current Problems**

1. **Misplaced constants**: `FZF_PROMPTS` is in `src/keepnote/constants.mjs` but it's kn-specific
2. **Cross-dependency violation**: kn scripts importing from keepnote directory
3. **Poor separation**: kn and keepnote code not properly isolated

## **Recommended Structure (Feature-Oriented)**

```
src/
├── kn/                       ← kn command code (completely independent)
│   ├── search-command.mjs    ← All search functionality (~160 lines)
│   │                           • FZF orchestration (spawn, config, bindings)
│   │                           • Mode config (CONTENT/FILES, DEFAULT_MODE)
│   │                           • Ripgrep commands (fileContentSearchCommand, etc.)
│   │                           • Ripgrep parser (parseRipgrepSelection)
│   │                           • Git status header generation
│   │                           (Use comments to demarcate sections if file grows)
│   │
│   ├── create-command.mjs    ← Note creation (currently create-note.mjs)
│   │
│   └── search-scripts/       ← Executable scripts spawned BY FZF
│       ├── get-next-mode.mjs ← Tab key handler
│       ├── get-reload.mjs    ← Reload after delete (currently get-reload-for-current-mode.mjs)
│       ├── preview.mjs       ← Preview handler (currently preview-note.mjs)
│       └── delete.mjs        ← Delete handler (currently delete-note.mjs)
│
├── keepnote/                 ← keepnote command code (completely independent)
│   └── sync-command.mjs      ← Git sync functionality
│
├── open-in-editor.mjs        ← Shared utilities
├── config.mjs                ← Shared utilities
├── dependencies.mjs          ← Shared utilities
└── util.mjs                  ← Shared utilities
```

**Critical Rule: NO imports between `src/kn/` and `src/keepnote/`**
- They are independent CLI tools
- Both can import from shared utilities in `src/`
- No cross-dependencies allowed

**Philosophy: Feature-oriented over technology-oriented**
- All search functionality in one place (not split by FZF/ripgrep/modes)
- Simpler mental model: 2 commands = 2 files
- Cohesive: ripgrep, modes, FZF are all part of ONE feature: search
- If `search-command.mjs` grows large, use comment sections to organize

## **Key Design Decisions**

1. **Complete separation of kn and keepnote**:
    - `src/kn/` - All kn-specific code (search and create functionality)
    - `src/keepnote/` - All keepnote-specific code (git sync, management)
    - `src/` - Shared utilities only (config, editor, dependencies, util)
    - **NO cross-dependencies** between kn and keepnote

2. **Feature-oriented over technology-oriented**:
    - Don't split by technology (FZF vs ripgrep vs modes)
    - Split by feature (search command vs create command)
    - All search-related code in `search-command.mjs`:
        - FZF orchestration (spawning, configuration, bindings)
        - Mode definitions (CONTENT/FILES, DEFAULT_MODE)
        - Ripgrep commands (`fileContentSearchCommand`, `fileNameSearchCommand`)
        - Ripgrep parser (`parseRipgrepSelection`, `FIELD_DELIMITER`)
        - Git status header generation
    - Rationale: These are NOT reusable components - they're cohesive parts of ONE feature

3. **`search-scripts/` directory** - Executable scripts spawned by FZF:
    - Only contains executables (no shared modules)
    - Import from `../search-command.mjs` as needed
    - These are spawned processes (file paths used in --bind, not imported)

4. **File organization within `search-command.mjs`**:
    - Use comment sections to demarcate logical parts:
        ```
        // ============================================================================
        // Mode Configuration
        // ============================================================================

        // ============================================================================
        // Ripgrep Commands
        // ============================================================================

        // ============================================================================
        // FZF Orchestration
        // ============================================================================
        ```
    - If file becomes too large (>300 lines), extract to `search-command-utils.mjs`

5. **Simplicity over premature abstraction**:
    - 2 commands = 2 files (+ scripts directory)
    - Easy to understand, navigate, and maintain
    - Don't create abstractions until we need them

Does this structure make sense? Should I proceed with this reorganization?
