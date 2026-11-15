import { openDB } from "idb";
import type { Conversation } from "./types";

const DB_NAME = "browser-llm";
const STORE = "conversations";

let dbPromise: ReturnType<typeof openDB> | undefined;
function getDB() {
  return dbPromise ??= openDB(DB_NAME, 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE, { keyPath: "id" });
    }
  },
  });
}

export async function saveConversation(conversation: Conversation) {
  const db = await getDB();
  await db.put(STORE, conversation);
}

export async function getConversations(): Promise<Conversation[]> {
  const db = await getDB();
  const items = await db.getAll(STORE) as Conversation[];
  return items.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteConversation(id: string) {
  const db = await getDB();
  await db.delete(STORE, id);
}
