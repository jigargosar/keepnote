import { Vim } from "@replit/codemirror-vim";

// ── Command context ────────────────────────────────────────
// The minimum write surface commands need from the store.
// No raw state access — just named operations.

export interface CommandContext {
  createNote: () => Promise<string>;
  deleteNote: () => Promise<void>;
}

// ── Register defaults ──────────────────────────────────────
// Called once after editor creation. Uses Vim.defineEx to
// hook into the vim : command line.
//
// Usage in the editor:
//   :new     → create a blank note and switch to it
//   :enew    → alias for :new
//   :bd      → delete the current note
//   :delete  → alias for :bd
//   :w       → no-op (saves are automatic), but doesn't error

let registered = false;

export function registerDefaultCommands(ctx: CommandContext) {
  // Guard against double-registration (React StrictMode)
  if (registered) return;
  registered = true;

  Vim.defineEx("new", "new", () => {
    ctx.createNote();
  });

  Vim.defineEx("enew", "enew", () => {
    ctx.createNote();
  });

  Vim.defineEx("bd", "bd", () => {
    ctx.deleteNote();
  });

  Vim.defineEx("delete", "delete", () => {
    ctx.deleteNote();
  });

  Vim.defineEx("write", "w", () => {
    // Saves are automatic. This exists so :w doesn't error.
  });

  Vim.defineEx("wq", "wq", () => {
    // Same as :w — there's nowhere to "quit" to.
  });
}
