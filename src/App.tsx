import { useState, useEffect, useRef, useCallback } from "react";
import { useNoteStore } from "./store";
import { useEditor } from "./useEditor";

// ── Helpers ────────────────────────────────────────────────

const firstLine = (c: string) => {
  const lines = c.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) return trimmed;
  }
  return "untitled";
};

const lineCount = (c: string) => c.split("\n").length;

// ── Fuzzy match ────────────────────────────────────────────

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

// ── App ────────────────────────────────────────────────────

export default function App() {
  const store = useNoteStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [quickOpenVisible, setQuickOpenVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [vimMode, setVimMode] = useState("NORMAL");
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const editorContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Editor hook ────────────────────────────────────────
  const viewRef = useEditor(editorContainerRef, {
    store,
    onModeChange: setVimMode,
    onCursorChange: setCursorPos,
  });

  // ── Global keyboard shortcuts (capture phase) ──────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+P / Cmd+P — quick open
      if (e.key === "p" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        setQuickOpenVisible((v) => {
          if (!v) {
            setQuery("");
            setSelectedIndex(0);
          }
          return !v;
        });
      }
      // Ctrl+B / Cmd+B — toggle sidebar
      if (e.key === "b" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        setSidebarOpen((v) => !v);
      }
      // Escape — close quick open
      if (e.key === "Escape" && quickOpenVisible) {
        e.preventDefault();
        e.stopPropagation();
        setQuickOpenVisible(false);
        viewRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () =>
      window.removeEventListener("keydown", handler, { capture: true });
  }, [quickOpenVisible, viewRef]);

  // ── Focus search input when quick open appears ─────────
  useEffect(() => {
    if (quickOpenVisible) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [quickOpenVisible]);

  // ── Quick open: filtered notes ─────────────────────────
  const isFullText = query.startsWith("?");
  const searchQuery = isFullText ? query.slice(1) : query;

  const filtered = store.notes
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .filter((n) => {
      if (!searchQuery) return true;
      if (isFullText) {
        return fuzzyMatch(searchQuery, n.content);
      }
      return fuzzyMatch(searchQuery, firstLine(n.content));
    });

  const selectFiltered = useCallback(
    (index: number) => {
      const note = filtered[index];
      if (note) {
        store.selectNote(note.id);
        setQuickOpenVisible(false);
        viewRef.current?.focus();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, store.selectNote],
  );

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // ── Quick open keyboard nav ────────────────────────────
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectFiltered(selectedIndex);
    }
  };

  // ── Sidebar note selection ─────────────────────────────
  const handleSidebarSelect = (id: string) => {
    store.selectNote(id);
    viewRef.current?.focus();
  };

  // ── New note ───────────────────────────────────────────
  const handleNewNote = async () => {
    await store.createNote();
    setQuickOpenVisible(false);
    setTimeout(() => viewRef.current?.focus(), 50);
  };

  // ── Sorted notes for sidebar ───────────────────────────
  const sortedNotes = store.notes
    .slice()
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div
      className="h-screen w-screen flex bg-neutral-950 text-neutral-300 overflow-hidden"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* ── Sidebar ─────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="w-64 flex-shrink-0 border-r border-neutral-800 flex flex-col bg-neutral-950">
          <div className="flex items-center justify-between px-3 py-3 border-b border-neutral-800">
            <span className="text-xs font-bold tracking-widest text-neutral-500 uppercase">
              Notes
            </span>
            <div className="flex gap-1">
              <button
                onClick={handleNewNote}
                className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
                title="New note"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded hover:bg-neutral-800 text-neutral-500 hover:text-neutral-300 transition-colors"
                title="Hide sidebar (Ctrl+B)"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sortedNotes.map((n) => (
              <button
                key={n.id}
                onClick={() => handleSidebarSelect(n.id)}
                className={`w-full text-left px-3 py-2.5 border-b border-neutral-900 transition-colors truncate text-sm ${
                  n.id === store.activeId
                    ? "bg-neutral-800/60 text-amber-400"
                    : "hover:bg-neutral-900 text-neutral-400"
                }`}
              >
                {firstLine(n.content) || (
                  <span className="italic text-neutral-600">empty note</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Breadcrumb when sidebar hidden */}
        {!sidebarOpen && (
          <div className="px-3 py-1.5 border-b border-neutral-800 flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors flex-shrink-0"
            >
              ← notes
            </button>
            <span className="text-neutral-700 text-xs flex-shrink-0">·</span>
            <span className="text-xs text-neutral-600 truncate max-w-xs">
              {firstLine(store.active?.content ?? "")}
            </span>
          </div>
        )}

        {/* Editor container — CM6 mounts here */}
        <div ref={editorContainerRef} className="flex-1 overflow-hidden" />

        {/* ── Status bar ──────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-neutral-800 text-xs">
          <div className="flex items-center gap-4">
            <span
              className={`font-bold px-2 py-0.5 rounded text-xs ${
                vimMode === "NORMAL"
                  ? "bg-amber-400/15 text-amber-400"
                  : vimMode === "INSERT"
                    ? "bg-emerald-400/15 text-emerald-400"
                    : "bg-violet-400/15 text-violet-400"
              }`}
            >
              {vimMode}
            </span>
          </div>
          <div className="flex items-center gap-4 text-neutral-600">
            <span>
              Ln {cursorPos.ln}, Col {cursorPos.col}
            </span>
            <span>{lineCount(store.active?.content ?? "")} lines</span>
            <span>
              Ctrl+P <span className="text-neutral-700">search</span>
            </span>
            <span>
              Ctrl+B <span className="text-neutral-700">sidebar</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Quick Open ──────────────────────────────────── */}
      {quickOpenVisible && (
        <div
          className="fixed inset-0 bg-black/60 flex items-start justify-center pt-[15vh] z-50"
          onClick={() => {
            setQuickOpenVisible(false);
            viewRef.current?.focus();
          }}
        >
          <div
            className="w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-800">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-neutral-500 flex-shrink-0"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={
                  isFullText
                    ? "Full-text search..."
                    : "Search notes by title...  (prefix ? for full-text)"
                }
                className="flex-1 bg-transparent text-sm text-neutral-200 outline-none placeholder-neutral-600"
                spellCheck={false}
              />
              <span className="text-xs text-neutral-700 flex-shrink-0">
                esc
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filtered.map((n, i) => (
                <button
                  key={n.id}
                  onClick={() => selectFiltered(i)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                    i === selectedIndex
                      ? "bg-neutral-800/50 text-neutral-200"
                      : "text-neutral-400 hover:bg-neutral-800/30"
                  }`}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-neutral-600 flex-shrink-0"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <span className="truncate text-sm">
                    {firstLine(n.content)}
                  </span>
                  <span className="ml-auto text-xs text-neutral-700 flex-shrink-0">
                    {lineCount(n.content)}L
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-8 text-center text-neutral-600 text-sm">
                  No notes match
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
