"use client";

import { SignInButton } from '@/components/auth/SignInButton';
import { SignOut } from '@/components/auth/SignOut';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { data: session } = useSession();

  return (
    <div>
      {session ? <SignOut /> : <SignInButton />}
    </div>
  );
}