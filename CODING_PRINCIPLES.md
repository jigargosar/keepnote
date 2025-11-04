# Coding Principles for This Project

## 1. Avoid Magic Strings - Use Object Constants

**Always define string constants in objects, never use strings directly in code.**

### ✓ Good Examples

```javascript
// Define constants
export const MODE_NAMES = {
  CONTENT: 'CONTENT',
  FILES: 'FILES'
}

// Use constants
if (currentMode === MODE_NAMES.CONTENT) { ... }
const mode = MODE_NAMES.FILES
```

### ❌ Bad Examples

```javascript
// Don't use magic strings
if (currentMode === 'CONTENT') { ... }  // ❌ No!
const mode = 'FILES'  // ❌ No!
```

### Benefits
- Typos caught at import time
- Easy refactoring (rename in one place)
- Autocomplete in IDE
- Clear what values are valid

---

## 2. Feature-Oriented Over Technology-Oriented

**Organize code by feature/command, not by technology layer.**

### ✓ Good
```
src/kn/
├── search-command.mjs    ← All search functionality together
├── create-command.mjs    ← All create functionality together
```

### ❌ Bad
```
src/
├── fzf.mjs              ← Split by technology
├── ripgrep.mjs
├── modes.mjs
```

---

## 3. No Cross-Dependencies Between Commands

**kn and keepnote commands must be completely independent.**

### ✓ Good
```javascript
// Both can import from shared utilities
import { getNotesPath } from '../config.mjs'  // ✓ OK
```

### ❌ Bad
```javascript
// Don't import between command directories
import { something } from '../keepnote/sync-command.mjs'  // ❌ No!
```

---

## 4. Use Comments to Organize Large Files

**When a file grows beyond ~100 lines, use comment dividers.**

### ✓ Good
```javascript
// ============================================================================
// Mode Configuration
// ============================================================================

export const MODE_NAMES = { ... }

// ============================================================================
// Ripgrep Commands
// ============================================================================

export function fileContentSearchCommand() { ... }
```

---

## 5. Extract Only When Needed

**Don't create abstractions prematurely. Extract to separate file only when:**
- File exceeds ~300 lines AND
- Clear logical separation exists AND
- Code is reused in multiple places

**Keep related code together until there's a good reason to split.**
