'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { SAMPLE_PROBLEMS } from '@/lib/config';
import { DEFAULT_SESSION, type HintLevel, type SessionConfig } from '@/lib/prompt';
import {
  initSession,
  addMisconception,
  recordHintLevel,
  endSession,
  markAhaMoment,
  type StoredMisconception,
} from '@/lib/session';

function MisconceptionBadges({ metadata }: { metadata: unknown }) {
  const meta = metadata as {
    misconceptions?: string[];
    isAhaMoment?: boolean;
    ahaConfidence?: number;
  } | undefined;

  if (!meta?.misconceptions?.length && !meta?.isAhaMoment) return null;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {meta.misconceptions?.map((tag, ti) => (
        <Badge key={ti} variant="outline" className="text-xs gap-1">
          <span className="uppercase tracking-wider">{tag.replace(/_/g, ' ')}</span>
        </Badge>
      ))}
      {meta.isAhaMoment && meta.ahaConfidence && meta.ahaConfidence > 0.6 && (
        <Badge variant="signal" className="text-xs gap-1">
          <span>Breakthrough</span>
        </Badge>
      )}
    </div>
  );
}

function ChatInner() {
  const params = useSearchParams();
  const router = useRouter();
  const sessionConfig: SessionConfig = {
    subject: params.get('subject') ?? DEFAULT_SESSION.subject,
    topic: params.get('topic') ?? DEFAULT_SESSION.topic,
    level: params.get('level') ?? DEFAULT_SESSION.level,
  };

  const [input, setInput] = useState('');
  const [hintLevel, setHintLevel] = useState<HintLevel>(1);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { messages, sendMessage, status, error } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionDataRef = useRef(initSession(sessionConfig));

  const busy = status === 'submitted' || status === 'streaming';
  const giveUpsLeft = 4 - hintLevel;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'assistant' && lastMsg.metadata) {
      const meta = lastMsg.metadata as {
        misconceptions?: string[];
        misconceptionConfidence?: number;
        isAhaMoment?: boolean;
        ahaConfidence?: number;
      };
      if (meta.misconceptions?.length) {
        const misconception: StoredMisconception = {
          tags: meta.misconceptions,
          confidence: meta.misconceptionConfidence ?? 0,
          reasoning: 'Auto-detected from student response',
          timestamp: Date.now(),
          userMessage: messages[messages.length - 2]?.parts
            .filter((p) => p.type === 'text')
            .map((p) => p.text)
            .join(' ') ?? '',
        };
        sessionDataRef.current = addMisconception(sessionConfig, misconception);
      }
      if (meta.isAhaMoment && meta.ahaConfidence && meta.ahaConfidence > 0.6) {
        sessionDataRef.current = markAhaMoment(sessionConfig, messages.length - 1);
      }
    }
  }, [messages]);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'assistant') {
      const text = lastMsg.parts
        .filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join(' ');
      if (text) {
        const liveRegion = document.getElementById('a11y-live-region');
        if (liveRegion) liveRegion.textContent = text;
      }
    }
  }, [messages]);

  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function send(text: string, level: HintLevel, attachment?: File) {
    if (attachment) {
      fileToDataUrl(attachment).then((dataUrl) => {
        sendMessage(
          { text, files: [{ type: 'file', mediaType: attachment.type, url: dataUrl, filename: attachment.name }] }
        );
      });
    } else {
      sendMessage({ text });
    }
  }

  function handleImageSelect(file: File) {
    if (!file.type.startsWith('image/')) return;
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text && !image) return;
    if (busy) return;
    send(text, hintLevel, image ?? undefined);
    setInput('');
    clearImage();
  }

  function handleGiveUp() {
    if (busy || hintLevel >= 4) return;
    const next = Math.min(hintLevel + 1, 4) as HintLevel;
    setHintLevel(next);
    send(
      next === 4
        ? 'I give up. Please teach me the underlying concept.'
        : "I'm still stuck. Can you help me more?",
      next,
    );
  }

  function handleEndSession() {
    endSession(sessionConfig);
    router.push(`/report?subject=${encodeURIComponent(sessionConfig.subject)}&topic=${encodeURIComponent(sessionConfig.topic)}&level=${encodeURIComponent(sessionConfig.level)}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-6">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="inline-flex items-center justify-center h-10 w-10 rounded-[4px] bg-transparent hover:bg-accent active:bg-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{sessionConfig.subject} · {sessionConfig.topic}</p>
            <p className="truncate text-xs text-muted-foreground">{sessionConfig.level}</p>
          </div>
          <div className="flex items-center gap-2" aria-label={`Hint level ${hintLevel} of 4`}>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {hintLevel}/4
            </span>
            <div className="flex gap-1" aria-hidden>
              {[1, 2, 3, 4].map((seg) => (
                <span
                  key={seg}
                  className={cn(
                    'h-2 w-4 rounded-[2px] transition-colors duration-150',
                    seg <= hintLevel ? 'bg-signal' : 'bg-border'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1 overflow-y-auto" role="log" aria-live="polite" aria-label="Conversation">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <div className="flex flex-col gap-6" ref={scrollRef}>
            {messages.length === 0 && (
              <section className="space-y-4 rounded-[4px] border border-border p-6" aria-labelledby="welcome-title">
                <h3 id="welcome-title" className="font-medium">Paste the problem you&apos;re stuck on</h3>
                <p className="text-sm text-muted-foreground">
                  Don&apos;t worry about wording it perfectly. Socratia will ask questions to figure out where your thinking is stuck — one question at a time.
                </p>
                <Separator />
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Try one of these</p>
                <div className="flex flex-col gap-2">
                  {SAMPLE_PROBLEMS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setInput(p)}
                      className="chip-invert text-left rounded-[4px] border border-border px-3 py-2 text-sm text-muted-foreground"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {messages.map((m, idx) => {
              const meta = m.metadata as { misconceptions?: string[] } | undefined;
              const flagged = m.role === 'assistant' && !!meta?.misconceptions?.length;
              return (
                <article
                  key={m.id}
                  className={cn(
                    'flex flex-col gap-1.5',
                    m.role === 'user' ? 'items-end' : 'items-start',
                  )}
                >
                  {m.role === 'user' && (
                    <span className="font-mono text-[0.6875rem] tracking-widest text-muted-foreground uppercase pr-0.5">
                      You
                    </span>
                  )}
                  <div
                    className={cn(
                      'max-w-[85%] rounded-[4px] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                      m.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : cn(
                            'border-y border-r border-border bg-card border-l-2',
                            flagged ? 'border-l-signal' : 'border-l-border'
                          ),
                    )}
                  >
                    {m.parts.map((part, i) =>
                      part.type === 'text' ? (
                        <span key={`${m.id}-${i}`}>{part.text}</span>
                      ) : null
                    )}
                  </div>
                  {m.role === 'assistant' && m.metadata ? (
                    <MisconceptionBadges metadata={m.metadata} />
                  ) : null}
                </article>
              );
            })}

            {status === 'submitted' && (
              <div className="flex justify-start" aria-live="polite">
                <div className="rounded-[4px] border-y border-r border-l-2 border-border bg-card px-4 py-3 text-sm text-muted-foreground font-mono">
                  composing
                  <span className="thinking-dot inline-block">.</span>
                  <span className="thinking-dot inline-block">.</span>
                  <span className="thinking-dot inline-block">.</span>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-[4px] border border-destructive/40 bg-destructive/10 p-4 text-sm" role="alert">
                <p className="font-medium">Something went wrong</p>
                <p className="mt-1 text-muted-foreground">
                  {error.message.includes('NVIDIA_API_KEY')
                    ? 'The NVIDIA API key is missing. Add NVIDIA_API_KEY to .env.local and restart the server.'
                    : error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="sticky bottom-0 z-10 border-t border-border bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <input type="file" ref={fileInputRef} accept="image/*" onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])} className="hidden" />

          {imagePreview && (
            <div className="mb-3 flex items-center gap-3 rounded-[4px] border border-border bg-muted p-2" role="status" aria-label="Image attached">
              <img src={imagePreview} alt="Upload preview" className="h-12 w-12 rounded-[4px] object-cover" />
              <div className="flex-1 min-w-0 text-sm text-muted-foreground truncate">
                Ready to send with your message
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={clearImage} aria-label="Remove image">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={image ? 'Add a note about the image (optional)…' : 'Type the problem, or answer Socratia&apos;s question…'}
              rows={2}
              className="max-h-40 resize-none"
              disabled={busy}
              autoFocus
              aria-label="Your message"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy || !!image}
              aria-label="Attach image"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </Button>
            <Button
              type="submit"
              size="icon"
              variant={input.trim() || image ? 'signal' : 'default'}
              disabled={busy || (!input.trim() && !image)}
              aria-label="Send"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </Button>
          </form>

          <div className="flex items-center justify-between mt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleGiveUp}
              disabled={busy || hintLevel >= 4 || messages.length === 0}
              className="gap-1.5 text-muted-foreground"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 19v-6M12 5v6M5 12h14" />
              </svg>
              {hintLevel >= 4 ? 'Full explanation given' : `I need a bigger hint (${giveUpsLeft} left)`}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEndSession}
                disabled={messages.length === 0}
                className="gap-1.5"
              >
                End session
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    }>
      <ChatInner />
    </Suspense>
  );
}