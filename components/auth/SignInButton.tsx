'use client';

import { signIn } from "next-auth/react";

export function SignInButton() {
  return (
    <div className="flex justify-center items-center h-screen">
      <button onClick={() => signIn('github', { callbackUrl: '/dashboard' })}>Sign In</button>
    </div>
  );
} 