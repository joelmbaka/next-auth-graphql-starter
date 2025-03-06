"use client";

import { useSession } from 'next-auth/react';
    
export default function ProfilePage() {
    const { data: session } = useSession();

    return (
        <div>
            <h1>Profile</h1>
            <div>
                <img src={session?.user.image ?? "https://i.pravatar.cc/300"} alt="User Avatar" className="w-16 h-16 rounded-full" />
                <p>ID: {session?.user.id}</p>
                <p>Name: {session?.user.name}</p>
                <p>Email: {session?.user.email}</p>
            </div>
        </div>
    );
}

