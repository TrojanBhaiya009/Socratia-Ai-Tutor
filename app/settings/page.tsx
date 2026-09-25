import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-6">
          <Link
            href="/dashboard"
            aria-label="Back to dashboard"
            className="inline-flex items-center justify-center h-10 w-10 rounded-[4px] bg-transparent hover:bg-accent active:bg-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-sm font-medium">Settings</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-8 space-y-8">
        <section className="rounded-[4px] border border-border bg-card p-6">
          <h2 className="text-h2 mb-4">Account</h2>
          <dl className="divide-y divide-border">
            <div className="flex items-baseline justify-between py-3">
              <dt className="text-sm text-muted-foreground">Name</dt>
              <dd className="font-medium">{session.user.name || '—'}</dd>
            </div>
            <div className="flex items-baseline justify-between py-3">
              <dt className="text-sm text-muted-foreground">Email</dt>
              <dd className="font-medium">{session.user.email || '—'}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[4px] border border-border bg-card p-6">
          <h2 className="text-h2 mb-4">Actions</h2>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="inline-flex items-center justify-center h-10 px-4 text-sm rounded-[4px] border border-destructive text-destructive hover:bg-destructive/10 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Sign out
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
