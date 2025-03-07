"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import SigninModal from '@/components/SigninModal';

export default function Navbar() {
  const [isSigninModalOpen, setIsSigninModalOpen] = useState(false);
  const { data: session, status } = useSession();

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
        {status === 'loading' ? (
          <Button disabled>Loading...</Button>
        ) : session ? (
          <Button onClick={() => signOut()}>Logout</Button>
        ) : (
          <>
            <Button onClick={() => setIsSigninModalOpen(true)}>Login</Button>
            <SigninModal 
              isOpen={isSigninModalOpen} 
              onClose={() => setIsSigninModalOpen(false)} 
            />
          </>
        )}
      </div>
    </nav>
  );
}

