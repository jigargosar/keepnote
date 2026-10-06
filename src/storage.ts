import { openDB, type IDBPDatabase } from "idb";

// ── Note type ──────────────────────────────────────────────
export interface Note {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

// ── Storage interface ──────────────────────────────────────
// Every method is async. Today it's IndexedDB, tomorrow Supabase.
// The subscribe method exists for realtime sync — Supabase will
// push external changes through it. For IndexedDB it's a no-op
// passthrough since we're the only writer.

export type StorageListener = (notes: Note[]) => void;
export type Unsubscribe = () => void;

export interface NoteStorage {
  getAll(): Promise<Note[]>;
  getById(id: string): Promise<Note | null>;
  create(content: string): Promise<Note>;
  update(id: string, partial: Partial<Pick<Note, "content">>): Promise<Note>;
  delete(id: string): Promise<void>;
  subscribe(cb: StorageListener): Unsubscribe;
}

// ── IndexedDB implementation ───────────────────────────────
const DB_NAME = "keepnote";
const STORE = "notes";

export function createStorage(): NoteStorage {
  let db: IDBPDatabase | null = null;
  const listeners = new Set<StorageListener>();

  const getDB = async () => {
    if (!db) {
      db = await openDB(DB_NAME, 1, {
        upgrade(database) {
          if (!database.objectStoreNames.contains(STORE)) {
            database.createObjectStore(STORE, { keyPath: "id" });
          }
        },
      });
    }
    return db;
  };

  const notify = async () => {
    if (listeners.size === 0) return;
    const all = await storage.getAll();
    listeners.forEach((fn) => fn(all));
  };

  const storage: NoteStorage = {
    async getAll() {
      const d = await getDB();
      const notes: Note[] = await d.getAll(STORE);
      return notes.sort((a, b) => b.updatedAt - a.updatedAt);
    },

    async getById(id) {
      const d = await getDB();
      return ((await d.get(STORE, id)) as Note) ?? null;
    },

    async create(content) {
      const d = await getDB();
      const note: Note = {
        id: crypto.randomUUID(),
        content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await d.put(STORE, note);
      await notify();
      return note;
    },

    async update(id, partial) {
      const d = await getDB();
      const existing = (await d.get(STORE, id)) as Note | undefined;
      if (!existing) throw new Error(`Note ${id} not found`);
      const updated: Note = { ...existing, ...partial, updatedAt: Date.now() };
      await d.put(STORE, updated);
      await notify();
      return updated;
    },

    async delete(id) {
      const d = await getDB();
      await d.delete(STORE, id);
      await notify();
    },

    subscribe(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
  };

  return storage;
}

// ── Seed data ──────────────────────────────────────────────
export const SEED_NOTES: Omit<Note, "id">[] = [
  {
    content:
      "[QR] docker compose cheatsheet\n\nversion: '3.8'\nservices:\n  web:\n    build: .\n    ports:\n      - '3000:3000'\n    volumes:\n      - .:/app\n    depends_on:\n      - db\n  db:\n    image: postgres:15\n    environment:\n      POSTGRES_PASSWORD: secret",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    content:
      "[JRL] 2026-03-10\n\nWorked on the keep clone architecture.\nDecided on CM6 + vim + flat notes.\nNo tags, no folders, just text and search.\nThe unix way.",
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
  {
    content:
      "[SCP] random api idea\n\nWhat if there was a CLI that could\npipe stdout directly into a note?\n\n$ echo 'remember this' | keep --new\n$ curl api.example.com | keep --append 'api notes'",
    createdAt: Date.now() - 7200000,
    updatedAt: Date.now() - 7200000,
  },
  {
    content:
      "[QR] git rebase workflow\n\ngit checkout feature\ngit rebase -i main\n# squash/fixup/reword\ngit push --force-with-lease",
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    content:
      "[JRL] 2026-03-09\n\nLong day debugging websocket reconnection.\nTurns out the issue was stale closure\nin the useEffect cleanup.",
    createdAt: Date.now() - 90000000,
    updatedAt: Date.now() - 90000000,
  },
  {
    content:
      "meeting notes standup march\n\n- deploy scheduled for thursday\n- need to review PR #342\n- database migration plan due friday",
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
  },
];
