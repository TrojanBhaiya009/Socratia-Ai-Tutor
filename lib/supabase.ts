import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const createServerSupabaseClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Database types
export interface ChatSession {
  id: string;
  user_id: string;
  subject: string;
  topic: string;
  level: string;
  started_at: string;
  ended_at: string | null;
  hint_levels: number[];
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  font_family: string;
  font_size: number;
  color_scheme: string;
  language_mode: string;
  reduced_motion: boolean;
  text_to_speech: boolean;
  speech_rate: number;
  voice_input: boolean;
  announce_responses: boolean;
  created_at: string;
  updated_at: string;
}