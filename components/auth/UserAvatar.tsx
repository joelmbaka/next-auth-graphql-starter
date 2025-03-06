import { useSession } from 'next-auth/react';

export default function UserAvatar() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div>
      <img src={session.user.image ?? "https://i.pravatar.cc/300"} alt="User Avatar" />
    </div>
  );
} 