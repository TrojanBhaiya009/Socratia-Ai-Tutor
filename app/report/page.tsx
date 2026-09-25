"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_SESSION, type SessionConfig } from "@/lib/prompt";
import { loadSession, listAllSessions, type SessionData } from "@/lib/session";

function ReportInner() {
  const params = useSearchParams();
  const router = useRouter();

  const session: SessionConfig = {
    subject: params.get("subject") ?? DEFAULT_SESSION.subject,
    topic: params.get("topic") ?? DEFAULT_SESSION.topic,
    level: params.get("level") ?? DEFAULT_SESSION.level,
  };

  const [data, setData] = useState<SessionData | null>(null);
  const [allSessions, setAllSessions] = useState<SessionData[]>([]);

  useEffect(() => {
    const d = loadSession(session);
    setData(d);
    setAllSessions(listAllSessions());
  }, [session.subject, session.topic, session.level]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center py-8">
            <CardTitle className="text-h2">No session data</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground py-8">
            <p className="mb-6">No session found for this subject, topic, and level combination.</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center h-10 px-4 text-sm rounded-[4px] bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Start a new session
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const durationMin = data.endedAt
    ? Math.round((data.endedAt - data.startedAt) / 60000)
    : Math.round((Date.now() - data.startedAt) / 60000);

  const misconceptionCounts = new Map<string, { count: number; confidence: number; examples: string[] }>();
  for (const m of data.misconceptions) {
    for (const tag of m.tags) {
      const existing = misconceptionCounts.get(tag) ?? { count: 0, confidence: 0, examples: [] };
      existing.count++;
      existing.confidence = Math.max(existing.confidence, m.confidence);
      if (existing.examples.length < 2 && m.userMessage) {
        existing.examples.push(m.userMessage.slice(0, 120));
      }
      misconceptionCounts.set(tag, existing);
    }
  }

  const sortedMisconceptions = Array.from(misconceptionCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  const userMessageCount = data.misconceptions.length;
  const hasProgress = data.misconceptions.some((m, i) => i > userMessageCount / 2 && m.tags.length === 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center gap-3 px-6">
          <Link
            href="/"
            aria-label="Back to home"
            className="inline-flex items-center justify-center h-10 w-10 rounded-[4px] bg-transparent hover:bg-accent active:bg-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Struggle Report · {session.subject}</p>
            <p className="truncate text-xs text-muted-foreground">{session.topic} · {session.level}</p>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-8 space-y-8">
          {/* Session meta */}
          <section aria-labelledby="meta-title">
            <h2 id="meta-title" className="sr-only">Session metrics</h2>
            <span className="section-label">Record</span>
            <dl className="divide-y divide-border border-y border-border">
              {[
                { label: "Duration", value: `${durationMin} min` },
                { label: "Deepest hint", value: data.hintLevelsUsed.length > 0 ? Math.max(...data.hintLevelsUsed) : 1 },
                { label: "Misconceptions", value: data.misconceptions.length },
              ].map((row) => (
                <div key={row.label} className="flex items-baseline justify-between py-3">
                  <dt className="text-sm text-muted-foreground">{row.label}</dt>
                  <dd className="font-mono text-lg font-medium tabular-nums">{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Top Misconceptions */}
          <section aria-labelledby="misconceptions-title">
            <div className="flex items-center justify-between mb-4">
              <h2 id="misconceptions-title" className="text-h2">Top misconceptions detected</h2>
            </div>
            <Card>
              <CardContent className="pt-0">
                {sortedMisconceptions.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <p className="font-medium mb-1">No clear misconceptions detected</p>
                    <p className="text-sm">Great job staying on track!</p>
                  </div>
                ) : (
                  <dl className="divide-y divide-border">
                    {sortedMisconceptions.map(([tag, info]) => (
                      <div key={tag} className="py-4 flex items-start gap-4">
                        <dt className="flex-shrink-0 w-10 text-right font-mono text-xs text-muted-foreground uppercase tracking-wider tabular-nums">
                          {info.count}x
                        </dt>
                        <dd className="flex-1 min-w-0">
                          <p className="font-medium capitalize">{tag.replace(/_/g, " ")}</p>
                          <p className="text-sm text-muted-foreground">
                            Flagged {info.count} time{info.count > 1 ? "s" : ""} · Confidence: {Math.round(info.confidence * 100)}%
                          </p>
                          <div className="mt-2 h-1 w-full max-w-xs bg-border" role="presentation">
                            <div
                              className="h-full bg-signal"
                              style={{ width: `${Math.round(info.confidence * 100)}%` }}
                            />
                          </div>
                          {info.examples.length > 0 && (
                            <p className="mt-2 text-xs text-muted-foreground italic">
                              &ldquo;{info.examples[0]}&rdquo;
                            </p>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Learning progress */}
          <section aria-labelledby="progress-title">
            <h2 id="progress-title" className="text-h2 mb-4">Learning progress</h2>
            <Card>
              <CardContent className="pt-0 space-y-4">
                {data.ahaMoment && (
                  <div className="border-l-2 border-signal pl-5 py-1">
                    <p className="font-serif italic text-h3 mb-1">Breakthrough.</p>
                    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      Message #{data.ahaMoment.messageIndex}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      You broke through a sticking point and started reasoning correctly.
                    </p>
                  </div>
                )}
                {hasProgress && !data.ahaMoment && (
                  <div className="border-l-2 border-border pl-5 py-1">
                    <p className="font-medium">Clear improvement in later responses</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Your later answers showed fewer misconceptions — the guidance is working.
                    </p>
                  </div>
                )}
                {!data.ahaMoment && !hasProgress && (
                  <div className="rounded-[4px] border border-dashed border-border p-6 text-center text-muted-foreground">
                    <p className="font-medium">Keep going!</p>
                    <p className="text-sm mt-1">
                      More back-and-forth with Socratia will surface clearer patterns for your personalized report.
                    </p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="rounded-[4px] border border-border p-4">
                    <p className="text-xs text-muted-foreground mb-1">Hint levels used</p>
                    <p className="font-mono text-lg font-medium tabular-nums">
                      {data.hintLevelsUsed.length > 0
                        ? [...data.hintLevelsUsed].sort((a, b) => a - b).join(" → ")
                        : "—"}
                    </p>
                  </div>
                  <div className="rounded-[4px] border border-border p-4">
                    <p className="text-xs text-muted-foreground mb-1">Unique misconception types</p>
                    <p className="font-mono text-lg font-medium tabular-nums">{misconceptionCounts.size}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Revision suggestions */}
          <section aria-labelledby="revision-title">
            <h2 id="revision-title" className="text-h2 mb-4">Your revision priorities</h2>
            <Card>
              <CardContent className="pt-0">
                {sortedMisconceptions.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No specific weak spots flagged. Consider reviewing the core concepts of {session.topic} to solidify your understanding.
                  </p>
                ) : (
                  <ol className="space-y-3">
                    {sortedMisconceptions.slice(0, 3).map(([tag, info], i) => (
                      <li key={tag} className="flex items-start gap-3 rounded-[4px] border border-border p-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-[4px] border border-foreground flex items-center justify-center font-mono text-xs font-medium">
                          R{i + 1}
                        </span>
                        <div>
                          <p className="font-medium capitalize">{tag.replace(/_/g, " ")}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Review the concept behind this misconception. Practice 3–5 similar problems where you identify the correct principle before solving.
                          </p>
                        </div>
                      </li>
                    ))}
                    {sortedMisconceptions.length < 3 && (
                      <li className="flex items-start gap-3 rounded-[4px] border border-dashed border-border p-3">
                        <span className="flex-shrink-0 w-8 h-8 rounded-[4px] border border-border text-muted-foreground flex items-center justify-center font-mono text-xs font-medium">
                          R{sortedMisconceptions.length + 1}
                        </span>
                        <div>
                          <p className="font-medium text-muted-foreground">Consolidate {session.topic} fundamentals</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Re-read the core definitions and work through a mixed set of problems without hints.
                          </p>
                        </div>
                      </li>
                    )}
                  </ol>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Actions */}
          <section className="flex gap-3 pt-2">
            <Link
              href={`/chat?subject=${encodeURIComponent(session.subject)}&topic=${encodeURIComponent(session.topic)}&level=${encodeURIComponent(session.level)}`}
              className="inline-flex items-center justify-center gap-2 flex-1 h-10 px-4 text-sm rounded-[4px] bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M22 22 4 4m16 16 4-4 4 4" />
              </svg>
              Continue this session
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 flex-1 h-10 px-4 text-sm rounded-[4px] border border-border bg-transparent hover:bg-accent active:bg-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M12 19v-6M12 5v6M5 12h14" />
              </svg>
              New topic
            </Link>
          </section>

          {/* Past sessions */}
          {allSessions.length > 1 && (
            <section aria-labelledby="history-title">
              <h2 id="history-title" className="text-h2 mb-4">Recent sessions</h2>
              <Card>
                <CardContent className="pt-0">
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {allSessions
                      .filter((s) => s.session.subject !== session.subject || s.session.topic !== session.topic || s.session.level !== session.level)
                      .slice(0, 5)
                      .map((s) => (
                        <Link
                          key={`${s.session.subject}-${s.session.topic}-${s.session.level}`}
                          href={`/report?subject=${encodeURIComponent(s.session.subject)}&topic=${encodeURIComponent(s.session.topic)}&level=${encodeURIComponent(s.session.level)}`}
                          className="group flex items-center justify-between rounded-[4px] border border-border p-3 transition-colors duration-150 hover:bg-accent"
                        >
                          <div className="min-w-0">
                            <p className="font-medium truncate">{s.session.subject} · {s.session.topic}</p>
                            <p className="text-xs text-muted-foreground font-mono tabular-nums">
                              {new Date(s.startedAt).toLocaleDateString()} · {Math.round((s.endedAt ?? Date.now() - s.startedAt) / 60000)} min
                            </p>
                          </div>
                          <svg
                            className="h-4 w-4 text-muted-foreground flex-shrink-0 opacity-0 -translate-x-1 transition-all duration-150 ease-out group-hover:opacity-100 group-hover:translate-x-0"
                            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </Link>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      </main>

      <footer className="border-t border-border bg-background/80 py-6 px-6">
        <p className="mx-auto max-w-4xl text-center text-sm text-muted-foreground">
          Socratia — Learn by thinking.
        </p>
      </footer>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense>
      <ReportInner />
    </Suspense>
  );
}