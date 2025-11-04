# Comprehensive Migration Analysis

## Current File Structure (745 total lines)

```
src/
├── search-note.mjs              108 lines  [kn-specific]
├── create-note.mjs               44 lines  [kn-specific]
├── get-next-mode.mjs             16 lines  [kn-specific]
├── get-reload-for-current-mode.mjs  24 lines  [kn-specific]
├── preview-note.mjs              16 lines  [kn-specific]
├── delete-note.mjs               49 lines  [kn-specific]
├── rg-commands.mjs               57 lines  [kn-specific]
├── keepnote/
│   ├── constants.mjs              4 lines  [kn-specific - MISPLACED!]
│   └── sync-command.mjs         196 lines  [keepnote-specific]
├── config.mjs                    51 lines  [shared]
├── open-in-editor.mjs            45 lines  [shared]
├── dependencies.mjs              55 lines  [shared]
└── util.mjs                      80 lines  [shared]
```

## File-by-File Analysis

### KN Command Files (274 lines total → will become ~160 lines)

#### `search-note.mjs` (108 lines)
**Purpose:** Main FZF orchestrator for kn search
**Exports:** `searchNote(notesPath)` - async function
**Imports:**
- `fileURLToPath` from 'node:url'
- `spawnSync` from 'node:child_process'
- `spawnAndCapture` from './util.mjs'
- `fileContentSearchCommand`, `FIELD_DELIMITER`, `parseRipgrepSelection` from './rg-commands.mjs'
- `FZF_PROMPTS` from './keepnote/constants.mjs'

**Contains:**
1. `getGitStatusHeader(notesPath)` - 43 lines - git status for FZF header
2. `spawnFzf(notesPath)` - 32 lines - FZF configuration and spawning
3. `searchNote(notesPath)` - 19 lines - main function, parses selection

**Used by:** `kn.mjs` line 8

---

#### `rg-commands.mjs` (57 lines)
**Purpose:** Ripgrep command builders and output parser
**Exports:**
- `FIELD_DELIMITER` - constant '//'
- `fileContentSearchCommand(notesPath)` - builds rg command for content search
- `fileNameSearchCommand(notesPath)` - builds rg command for filename search
- `parseRipgrepSelection(selection, notesPath)` - parses FZF selection

**Imports:** `path` from 'node:path'

**Contains:**
1. `FIELD_DELIMITER` - 1 line
2. `WINDOWS_RESERVED_GLOBS` - 7 lines - Windows-specific exclusions
3. `FILE_CONTENT_SEARCH_ARGS` - 10 lines - rg args for content search
4. `FILE_NAME_SEARCH_ARGS` - 6 lines - rg args for filename search
5. `fileContentSearchCommand()` - 3 lines - command builder
6. `fileNameSearchCommand()` - 3 lines - command builder
7. `parseRipgrepSelection()` - 20 lines - parser logic for both modes

**Used by:**
- `search-note.mjs`
- `get-next-mode.mjs`
- `get-reload-for-current-mode.mjs`

---

#### `keepnote/constants.mjs` (4 lines) **MISPLACED - should be in kn/**
**Purpose:** FZF prompt definitions
**Exports:** `FZF_PROMPTS` object with CONTENT and FILES prompts

**Contains:**
- `FZF_PROMPTS.CONTENT = 'Content> '`
- `FZF_PROMPTS.FILES = 'Files> '`

**Used by:**
- `search-note.mjs` line 9
- `get-next-mode.mjs` line 4
- `get-reload-for-current-mode.mjs` line 4

**PROBLEM:** This is kn-specific but in keepnote/ directory!

---

#### `create-note.mjs` (44 lines)
**Purpose:** Create new note with date-prefixed filename
**Exports:** `createNote(title, notesPath)` - default export
**Imports:**
- `fs` from 'node:fs'
- `path` from 'node:path'
- `filenamify` from 'filenamify'

**Contains:**
1. `getDateString()` - 6 lines - formats YYYY-MM-DD
2. `slugifyTitleToFilename(title)` - 13 lines - sanitizes title to filename
3. `createNote(title, notesPath)` - 9 lines - main function

**Used by:** `kn.mjs` line 9

---

#### FZF Scripts (spawned as processes, not imported)

**`get-next-mode.mjs` (16 lines)**
- Executable script spawned by FZF on Tab key
- Reads `FZF_PROMPT` env var to determine current mode
- Outputs FZF transform command to toggle between CONTENT ↔ FILES
- Imports from `rg-commands.mjs` and `constants.mjs`
- Used in `search-note.mjs` line 57 (file path only)

**`get-reload-for-current-mode.mjs` (24 lines)**
- Executable script spawned by FZF after delete
- Preserves current mode (CONTENT or FILES) during reload
- Outputs FZF reload command with appropriate rg command
- Imports from `rg-commands.mjs` and `constants.mjs`
- Used in `search-note.mjs` line 60 (file path only)

**`preview-note.mjs` (16 lines)**
- Executable script spawned by FZF for preview window
- Takes filename and line number as arguments
- Spawns `bat` with syntax highlighting
- No imports (uses node:child_process)
- Used in `search-note.mjs` line 58 (file path only)

**`delete-note.mjs` (49 lines)**
- Executable script spawned by FZF on Ctrl+D
- Prompts user for deletion confirmation
- Deletes file if confirmed
- No imports from project files
- Used in `search-note.mjs` line 59 (file path only)

---

### Keepnote Command Files (196 lines - stays as-is)

#### `keepnote/sync-command.mjs` (196 lines)
**Purpose:** Git sync functionality for keepnote command
**Exports:** `syncNotes(notesPath)` - default async export
**Imports:**
- `spawnSync` from 'node:child_process'
- `readline` from 'node:readline'

**Contains:** Complete git sync workflow (status, commit, push)
**Used by:** `keepnote.mjs` line 8

**ACTION:** No changes needed - stays in place

---

### Shared Utilities (231 lines - stay as-is)

#### `util.mjs` (80 lines)
**Exports:** `spawnAndCapture`, `checkExecutables`, `log`
**Used by:** search-note, dependencies, keepnote/sync-command

#### `config.mjs` (51 lines)
**Exports:** `getOrCreateNotesPath`, `getEditorExecutableName`, `getOrCreateConfigFilePath`
**Used by:** kn.mjs, keepnote.mjs, open-in-editor

#### `open-in-editor.mjs` (45 lines)
**Exports:** `openInEditor({ filepath, lineNumber })`
**Used by:** kn.mjs, keepnote.mjs

#### `dependencies.mjs` (55 lines)
**Exports:** `displayDependencyStatus`, `displayAndExitIfAnyDependencyMissing`
**Used by:** kn.mjs, keepnote.mjs

**ACTION:** All stay in place at `src/` level

---

## Migration Plan

### New Structure

```
src/
├── kn/
│   ├── search-command.mjs       ~160 lines (consolidated)
│   ├── create-command.mjs        44 lines (renamed)
│   └── search-scripts/
│       ├── get-next-mode.mjs     16 lines (moved + updated imports)
│       ├── get-reload.mjs        24 lines (renamed + moved + updated imports)
│       ├── preview.mjs           16 lines (renamed + moved)
│       └── delete.mjs            49 lines (renamed + moved)
│
├── keepnote/
│   └── sync-command.mjs         196 lines (no changes)
│
├── config.mjs                    51 lines (no changes)
├── open-in-editor.mjs            45 lines (no changes)
├── dependencies.mjs              55 lines (no changes)
└── util.mjs                      80 lines (no changes)
```

### File Operations

#### 1. Create `src/kn/search-command.mjs` (~160 lines)
**Consolidate from:**
- `src/search-note.mjs` (108 lines)
- `src/rg-commands.mjs` (57 lines)
- `src/keepnote/constants.mjs` (4 lines)

**Sections (use comment dividers):**
```javascript
// ============================================================================
// Mode Configuration
// ============================================================================
export const MODE_NAMES = {
  CONTENT: 'CONTENT',
  FILES: 'FILES'
}

export const MODES = {
  [MODE_NAMES.CONTENT]: { prompt: 'Content> ' },
  [MODE_NAMES.FILES]: { prompt: 'Files> ' }
}

export const DEFAULT_MODE = MODE_NAMES.CONTENT  // ← Easy to change! Use MODE_NAMES constant

// ============================================================================
// Ripgrep Commands
// ============================================================================
export const FIELD_DELIMITER = '//'
// ... WINDOWS_RESERVED_GLOBS, args arrays, command builders

// ============================================================================
// Ripgrep Parser
// ============================================================================
export function parseRipgrepSelection(selection, notesPath) { ... }

// ============================================================================
// Git Status Header
// ============================================================================
function getGitStatusHeader(notesPath) { ... }

// ============================================================================
// FZF Orchestration
// ============================================================================
function spawnFzf(notesPath) { ... }
export default async function searchNote(notesPath) { ... }
```

**Exports:**
- `MODE_NAMES` (constants for mode keys - for scripts)
- `MODES` (mode configuration - for scripts)
- `DEFAULT_MODE` (default mode constant - for scripts)
- `FIELD_DELIMITER` (for FZF config)
- `fileContentSearchCommand(notesPath)` (for scripts)
- `fileNameSearchCommand(notesPath)` (for scripts)
- `parseRipgrepSelection(selection, notesPath)` (for scripts)
- `searchNote(notesPath)` (default - for kn.mjs)

**Imports:**
- Standard: `fileURLToPath`, `spawnSync`, `path`
- From project: `spawnAndCapture` from '../../util.mjs'

---

#### 2. Move and rename `src/create-note.mjs` → `src/kn/create-command.mjs`
**Changes:**
- File location only
- Update import in `kn.mjs` line 9

---

#### 3. Move FZF scripts to `src/kn/search-scripts/`

**`get-next-mode.mjs` → `search-scripts/get-next-mode.mjs`**
- Update imports:
  - FROM: `'./rg-commands.mjs'` and `'./keepnote/constants.mjs'`
  - TO: `'../search-command.mjs'`
- Import: `{ MODE_NAMES, MODES, fileContentSearchCommand, fileNameSearchCommand }`
- Update logic to use `MODE_NAMES` and `MODES` instead of `FZF_PROMPTS`
- Example: `if (process.env.FZF_PROMPT === MODES[MODE_NAMES.CONTENT].prompt)`

**`get-reload-for-current-mode.mjs` → `search-scripts/get-reload.mjs`**
- Rename file (shorter name)
- Update imports same as above
- Update logic to use `MODE_NAMES` and `MODES` instead of `FZF_PROMPTS`

**`preview-note.mjs` → `search-scripts/preview.mjs`**
- Rename file (shorter name)
- No import changes needed (uses only node builtins)

**`delete-note.mjs` → `search-scripts/delete.mjs`**
- Rename file (shorter name)
- No import changes needed

---

#### 4. Update `src/kn/search-command.mjs` script paths
Update file path references in `spawnFzf()`:
```javascript
// OLD:
const toggleScriptPath = fileURLToPath(new URL('./get-next-mode.mjs', import.meta.url))
const previewScriptPath = fileURLToPath(new URL('./preview-note.mjs', import.meta.url))
const deleteScriptPath = fileURLToPath(new URL('./delete-note.mjs', import.meta.url))
const reloadScriptPath = fileURLToPath(new URL('./get-reload-for-current-mode.mjs', import.meta.url))

// NEW:
const toggleScriptPath = fileURLToPath(new URL('./search-scripts/get-next-mode.mjs', import.meta.url))
const previewScriptPath = fileURLToPath(new URL('./search-scripts/preview.mjs', import.meta.url))
const deleteScriptPath = fileURLToPath(new URL('./search-scripts/delete.mjs', import.meta.url))
const reloadScriptPath = fileURLToPath(new URL('./search-scripts/get-reload.mjs', import.meta.url))
```

---

#### 5. Update `kn.mjs` imports
```javascript
// OLD:
import searchNote from './src/search-note.mjs'
import createNote from './src/create-note.mjs'

// NEW:
import searchNote from './src/kn/search-command.mjs'
import createNote from './src/kn/create-command.mjs'
```

---

#### 6. Delete old files
- `src/search-note.mjs`
- `src/create-note.mjs`
- `src/rg-commands.mjs`
- `src/get-next-mode.mjs`
- `src/get-reload-for-current-mode.mjs`
- `src/preview-note.mjs`
- `src/delete-note.mjs`
- `src/keepnote/constants.mjs`

---

## Critical Considerations

### 1. File Path Resolution
The FZF scripts use `import.meta.url` to resolve their own locations. When moved:
- `search-command.mjs` is at `src/kn/search-command.mjs`
- Scripts are at `src/kn/search-scripts/*.mjs`
- Use `new URL('./search-scripts/...', import.meta.url)` for relative paths

### 2. Import Path Updates
Scripts move from `src/` to `src/kn/search-scripts/`:
- OLD: `import from './rg-commands.mjs'` (sibling)
- NEW: `import from '../search-command.mjs'` (parent)
- Shared utilities: `'../../util.mjs'` (grandparent)

### 3. Mode Configuration
Replace `FZF_PROMPTS` with `MODE_NAMES` and `MODES`:
```javascript
// OLD:
FZF_PROMPTS.CONTENT  // "Content> "
FZF_PROMPTS.FILES    // "Files> "

// NEW (use constants, not strings):
MODES[MODE_NAMES.CONTENT].prompt  // "Content> "
MODES[MODE_NAMES.FILES].prompt    // "Files> "

// WRONG - don't use magic strings:
MODES['CONTENT'].prompt  // ❌ No!
MODES.CONTENT.prompt     // ❌ No!

// RIGHT - use constants:
MODES[MODE_NAMES.CONTENT].prompt  // ✓ Yes!
```

### 4. Default Mode Change (Original Request)
In `search-command.mjs`, simply change:
```javascript
// Use constant, not string!
export const DEFAULT_MODE = MODE_NAMES.FILES  // Changed from MODE_NAMES.CONTENT
```

Then use `MODES[DEFAULT_MODE].prompt` in FZF spawn configuration.

**Important:** Always use `MODE_NAMES.CONTENT` or `MODE_NAMES.FILES`, never `'CONTENT'` or `'FILES'` strings.

---

## Testing Checklist

After migration:
1. ✓ `kn` (no args) - should open FZF search in FILES mode (new default)
2. ✓ `kn some title` - should create note and open in editor
3. ✓ Tab key in FZF - should toggle CONTENT ↔ FILES
4. ✓ Ctrl+D in FZF - should delete file and refresh
5. ✓ Preview in FZF - should show file with bat
6. ✓ Select in FZF - should open in editor at correct line
7. ✓ `keepnote sync` - should still work (no changes)
8. ✓ All imports resolve correctly
9. ✓ No broken file paths

---

## Summary

**Lines of code impact:**
- Before: 274 lines across 8 kn-related files
- After: ~160 lines in 1 main file + 4 script files (105 lines)
- Net reduction: ~9 lines (but much clearer organization)

**Key benefits:**
1. Feature-oriented structure (search vs create)
2. No cross-dependencies between kn and keepnote
3. Single source of truth for mode configuration
4. Easy to change default mode (one line)
5. Easier to understand and maintain

**Risk level:** Low
- All shared utilities unchanged
- Keepnote command unchanged
- Only moving and consolidating kn-specific code
- Clear migration path with specific file operations
