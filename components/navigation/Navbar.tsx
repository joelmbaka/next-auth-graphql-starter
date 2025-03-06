"use client";

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="flex justify-between items-center p-4">
      <div className="logo">
        <Link href="/">MyApp</Link>
      </div>
      <ul className="flex space-x-4">
        <li><Link href="/">Home</Link></li>
        <li><Link href="/dashboard">Dashboard</Link></li>
        <li><Link href="/profile">Profile</Link></li>
      </ul>
      <div className="auth">
        {session ? (
          <Button onClick={() => signOut()}>Logout</Button>
        ) : (
          <Button onClick={() => signIn()}>Login</Button>
        )}
      </div>
    </nav>
  );
} 