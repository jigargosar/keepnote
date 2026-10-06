import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createStorage,
  SEED_NOTES,
  type Note,
  type NoteStorage,
} from "./storage";

// ── Public interface ───────────────────────────────────────
// Every write operation lives here. No other file touches
// setNotes or calls storage mutators directly.

export interface NoteStore {
  // reads
  notes: Note[];
  activeId: string | null;
  active: Note | null;

  // writes — the ONLY way to mutate notes
  createNote: () => Promise<string>;
  updateContent: (id: string, content: string) => void;
  deleteNote: (id: string) => Promise<void>;
  selectNote: (id: string) => void;
}

const Ctx = createContext<NoteStore | null>(null);

// ── Provider ───────────────────────────────────────────────

export function NoteStoreProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const storageRef = useRef<NoteStorage>(createStorage());
  const debounceRef = useRef<Map<string, number>>(new Map());
  const notesRef = useRef(notes);
  notesRef.current = notes;

  // ── Init: load from storage, seed if empty ─────────────
  useEffect(() => {
    const init = async () => {
      const s = storageRef.current;
      let all = await s.getAll();

      if (all.length === 0) {
        for (const seed of SEED_NOTES) {
          await s.create(seed.content);
        }
        all = await s.getAll();
      }

      setNotes(all);
      if (all.length > 0) setActiveId(all[0].id);
    };
    init();
  }, []);

  // ── Writes ─────────────────────────────────────────────

  const createNote = useCallback(async (): Promise<string> => {
    const note = await storageRef.current.create("");
    setNotes((prev) => [note, ...prev]);
    setActiveId(note.id);
    return note.id;
  }, []);

  const updateContent = useCallback((id: string, content: string) => {
    // Optimistic React state update — immediate
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, content, updatedAt: Date.now() } : n,
      ),
    );

    // Debounced storage write — 500ms
    const existing = debounceRef.current.get(id);
    if (existing) clearTimeout(existing);
    debounceRef.current.set(
      id,
      window.setTimeout(() => {
        storageRef.current.update(id, { content });
        debounceRef.current.delete(id);
      }, 500),
    );
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    // Flush any pending save for this note
    const pending = debounceRef.current.get(id);
    if (pending) {
      clearTimeout(pending);
      debounceRef.current.delete(id);
    }

    await storageRef.current.delete(id);

    const remaining = notesRef.current.filter((n) => n.id !== id);
    setNotes(remaining);
    setActiveId((prev) => {
      if (prev !== id) return prev;
      return remaining.length > 0 ? remaining[0].id : null;
    });
  }, []);

  const selectNote = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  // ── Derived ────────────────────────────────────────────

  const active = notes.find((n) => n.id === activeId) ?? null;

  const value: NoteStore = {
    notes,
    activeId,
    active,
    createNote,
    updateContent,
    deleteNote,
    selectNote,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// ── Hook ───────────────────────────────────────────────────

export function useNoteStore(): NoteStore {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNoteStore must be inside NoteStoreProvider");
  return ctx;
}
