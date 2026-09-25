/**
 * Session persistence (localStorage).
 * Key format: socratia-session-{subject}-{topic}-{level}
 */

import { type SessionConfig } from "@/lib/prompt";

export interface StoredMisconception {
  tags: string[];
  confidence: number;
  reasoning: string;
  timestamp: number;
  userMessage: string;
}

export interface SessionData {
  session: SessionConfig;
  misconceptions: StoredMisconception[];
  startedAt: number;
  endedAt?: number;
  hintLevelsUsed: number[];
  ahaMoment?: { messageIndex: number; timestamp: number };
}

function makeKey(session: SessionConfig): string {
  const safe = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return `socratia-session-${safe(session.subject)}-${safe(session.topic)}-${safe(session.level)}`;
}

export function loadSession(session: SessionConfig): SessionData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(makeKey(session));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(data: SessionData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(makeKey(data.session), JSON.stringify(data));
  } catch {
    // ignore quota errors
  }
}

export function initSession(session: SessionConfig): SessionData {
  const existing = loadSession(session);
  if (existing) return existing;
  const fresh: SessionData = {
    session,
    misconceptions: [],
    startedAt: Date.now(),
    hintLevelsUsed: [],
  };
  saveSession(fresh);
  return fresh;
}

export function addMisconception(
  session: SessionConfig,
  misconception: StoredMisconception,
): SessionData {
  const data = loadSession(session) ?? initSession(session);
  data.misconceptions.push(misconception);
  saveSession(data);
  return data;
}

export function recordHintLevel(session: SessionConfig, level: number): SessionData {
  const data = loadSession(session) ?? initSession(session);
  if (!data.hintLevelsUsed.includes(level)) {
    data.hintLevelsUsed.push(level);
  }
  saveSession(data);
  return data;
}

export function markAhaMoment(session: SessionConfig, messageIndex: number): SessionData {
  const data = loadSession(session) ?? initSession(session);
  data.ahaMoment = { messageIndex, timestamp: Date.now() };
  saveSession(data);
  return data;
}

export function endSession(session: SessionConfig): SessionData {
  const data = loadSession(session) ?? initSession(session);
  data.endedAt = Date.now();
  saveSession(data);
  return data;
}

export function clearSession(session: SessionConfig): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(makeKey(session));
}

export function listAllSessions(): SessionData[] {
  if (typeof window === "undefined") return [];
  const sessions: SessionData[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("socratia-session-")) {
      try {
        const data = JSON.parse(localStorage.getItem(key)!);
        sessions.push(data);
      } catch {
        // ignore
      }
    }
  }
  return sessions.sort((a, b) => b.startedAt - a.startedAt);
}