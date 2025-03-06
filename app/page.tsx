'use client';
import SignInModal from "@/components/SigninModal";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Home() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    return (
        <div className="flex flex-col h-screen p-4 rounded-lg items-center justify-center">
            <Button onClick={() => setIsModalOpen(true)}>
              Get Started
            </Button>
            <SignInModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
}
