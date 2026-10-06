import { useEffect, useRef, type RefObject } from "react";
import { createEditor, extractWords, type EditorConfig } from "./editor";
import { registerDefaultCommands } from "./commands";
import type { NoteStore } from "./store";
import type { EditorView } from "@codemirror/view";

interface UseEditorOpts {
  store: NoteStore;
  onModeChange: (mode: string) => void;
  onCursorChange: (pos: { ln: number; col: number }) => void;
}

export function useEditor(
  containerRef: RefObject<HTMLDivElement | null>,
  opts: UseEditorOpts,
) {
  const viewRef = useRef<EditorView | null>(null);
  const activeIdRef = useRef<string | null>(opts.store.activeId);
  const storeRef = useRef(opts.store);
  storeRef.current = opts.store;

  // Keep activeIdRef in sync for the onChange closure
  activeIdRef.current = opts.store.activeId;

  // ── Create editor once on mount ────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const config: EditorConfig = {
      content: storeRef.current.active?.content ?? "",
      onChange: (content) => {
        const id = activeIdRef.current;
        if (id) storeRef.current.updateContent(id, content);
      },
      onCursorChange: opts.onCursorChange,
      onModeChange: opts.onModeChange,
      wordSource: () =>
        extractWords(storeRef.current.notes.map((n) => n.content)),
    };

    const view = createEditor(el, config);
    viewRef.current = view;

    // Register vim ex commands (:new, :bd, etc.)
    registerDefaultCommands({
      createNote: () => storeRef.current.createNote(),
      deleteNote: () => {
        const id = activeIdRef.current;
        if (id) storeRef.current.deleteNote(id);
      },
    });

    // Focus the editor
    view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Swap content when activeId changes ─────────────────
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const note = opts.store.notes.find((n) => n.id === opts.store.activeId);
    const newContent = note?.content ?? "";
    const currentContent = view.state.doc.toString();

    // Only swap if the content is actually different
    // (avoids fighting with the user's typing)
    if (newContent !== currentContent) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: newContent,
        },
      });
    }

    view.focus();
  }, [opts.store.activeId]); // intentionally only activeId, not content

  return viewRef;
}
