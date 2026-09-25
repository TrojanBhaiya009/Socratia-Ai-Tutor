import { getDb } from './db';

export async function getUserSessions(userId: string) {
  const db = getDb();
  const sessions = db.prepare(`
    SELECT cs.*, 
      (SELECT COUNT(*) FROM chat_messages cm WHERE cm.session_id = cs.id) as message_count
    FROM chat_sessions cs
    WHERE cs.user_id = ?
    ORDER BY cs.started_at DESC
    LIMIT 20
  `).all(userId) as Array<{
    id: string;
    user_id: string;
    subject: string;
    topic: string;
    level: string;
    started_at: string;
    ended_at: string | null;
    hint_levels: string;
    message_count: number;
  }>;

  return sessions.map(s => ({
    ...s,
    messages: Array(s.message_count).fill({ id: '' }),
  }));
}

export async function getSessionWithMessages(sessionId: string) {
  const db = getDb();
  const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(sessionId) as {
    id: string;
    user_id: string;
    subject: string;
    topic: string;
    level: string;
    started_at: string;
    ended_at: string | null;
    hint_levels: string;
  } | undefined;

  if (!session) return null;

  const messages = db.prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC').all(sessionId) as Array<{
    id: string;
    session_id: string;
    role: string;
    content: string;
    metadata: string | null;
    created_at: string;
  }>;

  return {
    ...session,
    messages: messages.map(m => ({
      ...m,
      metadata: m.metadata ? JSON.parse(m.metadata) : null,
    })),
  };
}