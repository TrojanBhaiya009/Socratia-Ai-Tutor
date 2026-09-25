'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ClientAuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ClientAuthGuard({ children, fallback }: ClientAuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/auth/signin?callbackUrl=${callbackUrl}`;
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center px-6 py-12">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Please sign in to continue</p>
          <a
            href="/auth/signin"
            className="inline-flex items-center justify-center h-10 px-4 text-sm rounded-[4px] bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}