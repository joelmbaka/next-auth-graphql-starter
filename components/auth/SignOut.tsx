import { signOut } from "next-auth/react";

export function SignOut() {
  return (
    <div>
      <p>You are signed in with GitHub.</p>
      <button onClick={() => signOut({ callbackUrl: '/' })}>Sign Out</button>
    </div>
  );
} 