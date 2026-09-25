import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { getUserSessions } from '@/lib/database-queries';
import { getDb } from '@/lib/db';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  const sessions = await getUserSessions(session.user.id!);
  const db = getDb();

  const totalSessions = (db.prepare('SELECT COUNT(*) as count FROM chat_sessions WHERE user_id = ?').get(session.user.id!) as { count: number }).count;
  const totalMessages = (db.prepare('SELECT COUNT(*) as count FROM chat_messages cm JOIN chat_sessions cs ON cm.session_id = cs.id WHERE cs.user_id = ?').get(session.user.id!) as { count: number }).count;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="font-serif text-h3 font-medium tracking-tight">Socratia</Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {session.user.name || session.user.email}
            </span>
            <Link href="/settings">
              <Button variant="ghost" size="icon" aria-label="Settings">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                </svg>
              </Button>
            </Link>
            <form action="/api/auth/signout" method="POST">
              <Button variant="ghost" size="icon">Log out</Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Stats */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <p className="text-h2 font-mono tabular-nums">{totalSessions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Messages</p>
              <p className="text-h2 font-mono tabular-nums">{totalMessages}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-h2 font-mono tabular-nums">
                {sessions.filter((s: { started_at: string }) => new Date(s.started_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Avg. Duration</p>
              <p className="text-h2 font-mono tabular-nums">
                {sessions.length > 0
                  ? Math.round(
                      sessions.reduce((a: number, s: { ended_at: string | null; started_at: string }) => a + (s.ended_at ? (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) : 0), 0) / sessions.length / 60000
                    )
                  : 0} min
              </p>
            </CardContent>
          </Card>
        </section>

        {/* New Session */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2">Start a new session</h2>
          </div>
          <Link href="/chat?subject=Mathematics&topic=New+topic&level=High+school" className="block">
            <Card className="hover:border-signal/50 transition-colors cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Quick Start</p>
                    <p className="text-sm text-muted-foreground">Jump straight into a new learning session</p>
                  </div>
                  <svg className="h-6 w-6 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* Session History */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2">Recent Sessions</h2>
          </div>

          {sessions.length === 0 ? (
            <div className="rounded-[4px] border border-border bg-card p-12 text-center text-muted-foreground">
              <p className="font-medium mb-1">No sessions yet</p>
              <p className="text-sm">Start your first learning session to see history here</p>
              <Link href="/chat?subject=Mathematics&topic=New+topic&level=High+school" className="mt-4 inline-block">
                <button className="inline-flex items-center justify-center h-10 px-4 text-sm rounded-[4px] bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  Start your first session
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((s: { id: string; topic: string; subject: string; level: string; messages: any[]; ended_at: string | null; started_at: string }) => (
                <Link key={s.id} href={`/chat?sessionId=${s.id}`} className="block">
                  <div className="rounded-[4px] border border-border bg-card p-4 hover:border-signal/50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium truncate">{s.topic}</h3>
                          <span className="inline-flex items-center rounded-[3px] border border-input px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground bg-secondary">{s.subject}</span>
                          <span className="inline-flex items-center rounded-[3px] border border-input px-2.5 py-0.5 text-xs font-semibold capitalize">{s.level}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="font-mono tabular-nums">{s.messages?.length || 0} messages</span>
                          <span className="font-mono tabular-nums">
                            {s.ended_at
                              ? Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000)
                              : Math.round((Date.now() - new Date(s.started_at).getTime()) / 60000)} min
                          </span>
                          <span>{format(new Date(s.started_at), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      </div>
                      <svg className="h-5 w-5 text-muted-foreground flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}