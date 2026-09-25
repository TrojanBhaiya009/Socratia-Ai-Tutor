# Socratia — Learn by Thinking

An AI-powered Socratic tutor that **refuses to give you the answer** — it guides you to it with questions, so you actually learn.

## Quick Start

```bash
# 1. Clone the repo
git clone <repo-url>
cd socratia

# 2. Install dependencies
npm install

# 3. Copy environment variables (already included for demo)
# The .env.local file is pre-configured and ready to go

# 4. Start the dev server
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Creating an Account

1. Click **"Start thinking"** on the landing page — you'll be redirected to sign in
2. Click **"Create one"** to register
3. Enter your email and password (min 8 characters)
4. You'll be redirected to sign in with your new credentials
5. Start a learning session!

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite (via better-sqlite3) — zero config, auto-created
- **Auth**: NextAuth.js v5 with credentials
- **AI**: NVIDIA NIM API (Llama 3.1)
- **Styling**: Tailwind CSS 4

## Features

- 🧠 **Socratic Method** — Guides through questions, never gives direct answers
- 🔍 **Misconception Detection** — AI spots where your thinking goes wrong
- 📊 **Struggle Reports** — Post-session analysis of your learning gaps
- ♿ **Accessibility** — Font size, dyslexic font, high contrast, TTS, voice input
- 🎯 **4-Level Hint System** — Progressive hints with "give up" escape hatch

## Project Structure

```
app/
├── page.tsx          # Landing page (session setup)
├── auth/             # Sign in, sign up, error pages
├── chat/             # Main tutoring chat interface
├── dashboard/        # User dashboard with session history
├── report/           # Post-session struggle report
├── settings/         # User settings
└── api/
    ├── auth/         # NextAuth + registration
    └── chat/         # AI chat endpoint
lib/
├── db.ts             # SQLite database (auto-initializes)
├── auth.ts           # NextAuth configuration
├── prompt.ts         # Socratic system prompts
├── model.ts          # NVIDIA NIM model config
└── session.ts        # Client-side session tracking
```