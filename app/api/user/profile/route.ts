import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
});

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });

    const { name, email } = parsed.data;
    const { data: user, error } = await supabase
      .from('users')
      .update({ name, email, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
      .select('id, email, name')
      .single();

    if (error) throw error;

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}