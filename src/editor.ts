import {
  EditorView,
  ViewPlugin,
  type ViewUpdate,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  drawSelection,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { history } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import {
  bracketMatching,
  syntaxHighlighting,
  HighlightStyle,
} from "@codemirror/language";
import {
  autocompletion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { tags } from "@lezer/highlight";
import { vim, getCM } from "@replit/codemirror-vim";

// ── Theme ──────────────────────────────────────────────────

const theme = EditorView.theme(
  {
    "&": {
      backgroundColor: "#0a0a0a",
      color: "#e5e5e5",
      height: "100%",
      fontSize: "14px",
    },
    ".cm-content": {
      fontFamily: "'JetBrains Mono', monospace",
      lineHeight: "1.5rem",
      padding: "1rem 0",
      caretColor: "#f59e0b",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#f59e0b",
    },
    ".cm-gutters": {
      backgroundColor: "#0a0a0a",
      color: "#404040",
      border: "none",
      minWidth: "3.5em",
    },
    ".cm-activeLineGutter": {
      color: "#737373",
      backgroundColor: "transparent",
    },
    ".cm-activeLine": {
      backgroundColor: "#17171780",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "#292524 !important",
    },
    // Vim panels (command line, search)
    ".cm-panels": {
      backgroundColor: "#0a0a0a",
      color: "#a3a3a3",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "12px",
    },
    ".cm-panels.cm-panels-bottom": {
      borderTop: "1px solid #262626",
    },
    // Vim fat cursor
    ".cm-fat-cursor": {
      backgroundColor: "#f59e0b80 !important",
    },
    "&:not(.cm-focused) .cm-fat-cursor": {
      backgroundColor: "#f59e0b40 !important",
      outline: "1px solid #f59e0b80",
    },
    // Autocomplete tooltip
    ".cm-tooltip": {
      backgroundColor: "#171717",
      border: "1px solid #262626",
      color: "#e5e5e5",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "13px",
    },
    ".cm-tooltip-autocomplete ul li": {
      padding: "3px 8px",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      backgroundColor: "#292524",
      color: "#f5f5f5",
    },
    ".cm-scroller": {
      overflow: "auto",
    },
    // Hide the default vim mode indicator — we show our own
    ".cm-vim-panel": {
      padding: "0 0.5rem",
    },
  },
  { dark: true },
);

// ── Syntax highlighting for markdown ───────────────────────

const highlight = HighlightStyle.define([
  { tag: tags.heading1, color: "#f59e0b", fontWeight: "bold" },
  { tag: tags.heading2, color: "#fbbf24", fontWeight: "bold" },
  { tag: tags.heading3, color: "#fcd34d", fontWeight: "bold" },
  { tag: tags.emphasis, fontStyle: "italic", color: "#a3a3a3" },
  { tag: tags.strong, fontWeight: "bold", color: "#f5f5f5" },
  { tag: tags.link, color: "#38bdf8", textDecoration: "underline" },
  { tag: tags.url, color: "#38bdf8" },
  { tag: tags.monospace, color: "#34d399" },
  { tag: tags.meta, color: "#737373" },
  { tag: tags.comment, color: "#525252" },
  { tag: tags.keyword, color: "#c084fc" },
  { tag: tags.string, color: "#34d399" },
  { tag: tags.number, color: "#fb923c" },
  { tag: tags.strikethrough, textDecoration: "line-through", color: "#737373" },
  { tag: tags.processingInstruction, color: "#737373" },
]);

// ── Cross-note word autocomplete ───────────────────────────

function wordCompletion(
  getWords: () => string[],
) {
  return (ctx: CompletionContext): CompletionResult | null => {
    const word = ctx.matchBefore(/\w{2,}/);
    if (!word || (word.from === word.to && !ctx.explicit)) return null;

    const allWords = getWords();
    const prefix = word.text.toLowerCase();
    const seen = new Set<string>();
    const options: { label: string; type: string }[] = [];

    for (const w of allWords) {
      const lower = w.toLowerCase();
      if (lower.startsWith(prefix) && lower !== prefix && !seen.has(lower)) {
        seen.add(lower);
        options.push({ label: w, type: "text" });
        if (options.length >= 30) break;
      }
    }

    if (options.length === 0) return null;
    return { from: word.from, options, filter: false };
  };
}

// ── Editor config & factory ────────────────────────────────

export interface EditorConfig {
  content: string;
  onChange: (content: string) => void;
  onCursorChange: (pos: { ln: number; col: number }) => void;
  onModeChange: (mode: string) => void;
  wordSource: () => string[];
}

export function createEditor(
  parent: HTMLElement,
  config: EditorConfig,
): EditorView {
  // Track cursor position and vim mode on every update
  const statusPlugin = ViewPlugin.fromClass(
    class {
      update(update: ViewUpdate) {
        // Cursor position
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        config.onCursorChange({
          ln: line.number,
          col: pos - line.from + 1,
        });

        // Vim mode
        try {
          const cm = getCM(update.view);
          if (cm) {
            const mode =
              (cm as any).state?.vim?.mode?.toUpperCase() || "NORMAL";
            config.onModeChange(mode);
          }
        } catch {
          // vim not ready yet
        }
      }
    },
  );

  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc: config.content,
      extensions: [
        vim(),
        theme,
        syntaxHighlighting(highlight),
        lineNumbers(),
        highlightActiveLine(),
        highlightActiveLineGutter(),
        drawSelection(),
        bracketMatching(),
        history(),
        markdown(),
        autocompletion({
          override: [wordCompletion(config.wordSource)],
          activateOnTyping: true,
        }),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            config.onChange(update.state.doc.toString());
          }
        }),
        statusPlugin,
      ],
    }),
  });

  return view;
}

// ── Helpers ────────────────────────────────────────────────

export function extractWords(texts: string[]): string[] {
  const words: string[] = [];
  const seen = new Set<string>();
  for (const text of texts) {
    const matches = text.match(/\w{3,}/g);
    if (matches) {
      for (const m of matches) {
        if (!seen.has(m.toLowerCase())) {
          seen.add(m.toLowerCase());
          words.push(m);
        }
      }
    }
  }
  return words;
}
