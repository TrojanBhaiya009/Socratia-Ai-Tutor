import {
  streamText,
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import { auth } from '@/lib/auth';
import { getDb, generateId } from '@/lib/db';
import { socratiaModel } from '@/lib/model';
import {
  buildSystemPrompt,
  normalizeHintLevel,
  normalizeSession,
} from '@/lib/prompt';

export const maxDuration = 30;

function extractLatestUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i].parts
        .filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join(' ');
    }
  }
  return '';
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });

  const db = getDb();

  let body: {
    messages?: UIMessage[];
    sessionConfig?: unknown;
    hintLevel?: unknown;
    sessionId?: string;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.messages)) {
    return Response.json({ error: 'messages must be an array' }, { status: 400 });
  }

  const userId = session.user.id!;
  const sessionConfig = normalizeSession(body.sessionConfig);
  const hintLevel = normalizeHintLevel(body.hintLevel);

  const latestUserText = extractLatestUserText(body.messages);

  let chatSessionId = body.sessionId;
  let isNewSession = false;

  if (!chatSessionId) {
    chatSessionId = generateId();
    db.prepare(
      'INSERT INTO chat_sessions (id, user_id, subject, topic, level, hint_levels) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(chatSessionId, userId, sessionConfig.subject, sessionConfig.topic, sessionConfig.level, JSON.stringify([hintLevel]));
    isNewSession = true;
  }

  const result = streamText({
    model: socratiaModel(),
    system: buildSystemPrompt(sessionConfig, hintLevel),
    messages: await convertToModelMessages(body.messages),
    maxOutputTokens: 2048,
    temperature: 0.5,
  });

  const finalChatSessionId = chatSessionId;

  const stream = toUIMessageStream({
    stream: result.stream,
    messageMetadata: () => undefined,
    onFinish: async ({ messages }) => {
      if (!finalChatSessionId) return;

      const assistantMessages = messages.filter((m) => m.role === 'assistant');
      for (const msg of assistantMessages) {
        const text = msg.parts.filter((p) => p.type === 'text').map((p) => p.text).join('');
        if (text.trim()) {
          db.prepare(
            'INSERT INTO chat_messages (id, session_id, role, content, metadata) VALUES (?, ?, ?, ?, ?)'
          ).run(generateId(), finalChatSessionId, 'assistant', text, msg.metadata ? JSON.stringify(msg.metadata) : null);
        }
      }

      const lastUserMsg = messages.filter((m) => m.role === 'user').pop();
      if (lastUserMsg) {
        const text = lastUserMsg.parts.filter((p) => p.type === 'text').map((p) => p.text).join('');
        if (text.trim()) {
          db.prepare(
            'INSERT INTO chat_messages (id, session_id, role, content) VALUES (?, ?, ?, ?)'
          ).run(generateId(), finalChatSessionId, 'user', text);
        }
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}