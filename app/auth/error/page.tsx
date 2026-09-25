'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'Access was denied. You may not have permission to sign in.',
  Verification: 'The verification link has expired or has already been used.',
  OAuthSignin: 'Error starting the OAuth sign-in process.',
  OAuthCallback: 'Error completing the OAuth sign-in process.',
  OAuthCreateAccount: 'Could not create OAuth account.',
  EmailCreateAccount: 'Could not create email account.',
  Callback: 'Error in the OAuth callback handler.',
  OAuthAccountNotLinked: 'This account is not linked to the OAuth provider.',
  EmailSignin: 'Error sending the email sign-in link.',
  CredentialsSignin: 'Invalid email or password.',
  SessionRequired: 'Please sign in to access this page.',
  Default: 'An error occurred during authentication.',
}

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'Default';
  const message = errorMessages[error] || errorMessages.Default;

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 bg-background">
      <div className="w-full max-w-md text-center">
        <h1 className="text-h2 mb-2">Authentication Error</h1>
        <div className="rounded-[4px] bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive mb-4">
          {message}
        </div>
        <div className="flex flex-col gap-3">
          <a
            href="/auth/signin"
            className="inline-flex items-center justify-center h-10 px-4 text-sm rounded-[4px] bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Try signing in again
          </a>
          <a
            href="/auth/signup"
            className="inline-flex items-center justify-center h-10 px-4 text-sm rounded-[4px] border border-border bg-transparent hover:bg-accent active:bg-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Create an account
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center h-10 px-4 text-sm rounded-[4px] border border-transparent bg-transparent hover:bg-accent active:bg-accent transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <AuthErrorContent />
    </Suspense>
  );
}