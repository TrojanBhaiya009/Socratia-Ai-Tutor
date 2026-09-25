import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const settingsSchema = z.object({
  fontFamily: z.enum(['system', 'dyslexic', 'monospace']),
  fontSize: z.number().min(14).max(24),
  colorScheme: z.enum(['default', 'high-contrast', 'sepia']),
  languageMode: z.enum(['standard', 'simplified']),
  reducedMotion: z.boolean(),
  textToSpeech: z.boolean(),
  speechRate: z.number().min(0.5).max(2),
  voiceInput: z.boolean(),
  announceResponses: z.boolean(),
});

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  try {
    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: session.user.id, ...parsed.data });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}