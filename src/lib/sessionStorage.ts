import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SessionRecord } from "./types";

const STORAGE_KEY = "@gym_form_coach/sessions";
const MAX_SESSIONS = 50;

export async function saveSessions(
  sessions: SessionRecord[]
): Promise<void> {
  const trimmed = sessions.slice(0, MAX_SESSIONS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export async function loadSessions(): Promise<SessionRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SessionRecord[];
  } catch {
    return [];
  }
}

export async function addSession(session: SessionRecord): Promise<void> {
  const sessions = await loadSessions();
  sessions.unshift(session);
  await saveSessions(sessions);
}

export async function deleteSession(id: string): Promise<void> {
  const sessions = await loadSessions();
  const filtered = sessions.filter((s) => s.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export async function clearAllSessions(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function findPreviousSession(
  sessions: SessionRecord[],
  exercise: string,
  currentId: string
): SessionRecord | null {
  return (
    sessions.find((s) => s.exercise === exercise && s.id !== currentId) ?? null
  );
}
