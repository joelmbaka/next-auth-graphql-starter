// components/auth/UserAvatar.tsx
import { useSession } from 'next-auth/react';
import Image from 'next/image';

export default function UserAvatar() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div>
      <Image
        src={session.user.image ?? "https://i.pravatar.cc/300"}
        alt="User Avatar"
        width={40}
        height={40}
      />
    </div>
  );
} 