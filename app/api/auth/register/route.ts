import { getDb, generateId } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Handle both JSON and form data
    const contentType = request.headers.get('content-type') || '';
    let body: Record<string, unknown>;

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      body = {
        email: formData.get('email'),
        password: formData.get('password'),
        name: formData.get('name') || undefined,
      };
    } else {
      body = await request.json();
    }

    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      // If it was a form submission, redirect back with error
      if (contentType.includes('application/x-www-form-urlencoded')) {
        return NextResponse.redirect(new URL('/auth/signup?error=InvalidInput', request.url));
      }
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, name } = parsed.data;
    const db = getDb();

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

    if (existingUser) {
      if (contentType.includes('application/x-www-form-urlencoded')) {
        return NextResponse.redirect(new URL('/auth/signup?error=EmailExists', request.url));
      }
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const id = generateId();

    db.prepare(
      'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)'
    ).run(id, email, passwordHash, name || null);

    // For form submissions, redirect to sign-in page
    if (contentType.includes('application/x-www-form-urlencoded')) {
      return NextResponse.redirect(new URL('/auth/signin?registered=true', request.url));
    }

    return NextResponse.json({ user: { id, email, name } }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}