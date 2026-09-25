import { supabase } from './supabase';

export async function getUserSessions(userId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*, messages:chat_messages(id)')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data || [];
}

export async function createChatSession(userId: string, subject: string, topic: string, level: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      user_id: userId,
      subject,
      topic,
      level,
      started_at: new Date().toISOString(),
      hint_levels: [],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addMessage(sessionId: string, role: string, content: string, metadata?: Record<string, unknown>) {
  if (!supabase) return;
  const { error } = await supabase
    .from('chat_messages')
    .insert({
      session_id: sessionId,
      role,
      content,
      metadata,
    });

  if (error) throw error;
}

export async function updateSessionHintLevels(sessionId: string, hintLevel: number) {
  if (!supabase) return;
  const { error } = await supabase.rpc('push_hint_level', {
    session_id: sessionId,
    hint_level: 1,
  });
  if (error) throw error;
}

export async function endSession(sessionId: string) {
  if (!supabase) return;
  const { error } = await supabase
    .from('chat_sessions')
    .update({ ended_at: new Date().toISOString() })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function getUserSettings(userId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateUserSettings(userId: string, settings: Record<string, unknown>) {
  if (!supabase) return;
  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: settings.user_id, ...settings });
  if (error) throw error;
}