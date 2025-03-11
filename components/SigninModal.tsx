'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Github } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';

interface SigninModalProps {
    // Props for the SigninModal component
    isOpen: boolean; // Prop to determine if the modal is open
    onClose: () => void; // Prop for closing the modal
}

// Functional component for the SigninModal
const SigninModal: React.FC<SigninModalProps> = ({ isOpen, onClose }) => {
    // Hook to programmatically navigate
    const router = useRouter(); 
    const [googleLoading, setGoogleLoading] = useState(false);
    const [githubLoading, setGithubLoading] = useState(false);

    // Return null if modal is not open
    if (!isOpen) return null; 

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        await signIn('google');
    };

    const handleGithubSignIn = async () => {
        setGithubLoading(true);
        await signIn('github');
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <dialog open className="border border-gray-300 rounded-lg shadow-md p-4 w-[90%] max-w-[400px] h-[300px] bg-white mx-auto flex flex-col justify-center items-center">
                <h2 className="text-center mb-4">Welcome to Bramix Builders!</h2>
                <Button
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="w-full mb-2"
                >
                    {googleLoading ? "Loading..." : "Sign in with Google"}
                </Button>
                <Button
                    onClick={handleGithubSignIn}
                    disabled={githubLoading}
                    className="w-full"
                >
                    {githubLoading ? "Loading..." : "Sign in with GitHub"}
                </Button>
                <Button
                    onClick={onClose}
                    variant="ghost"
                    className="mt-4 text-sm text-gray-600 hover:text-gray-800"
                >
                    Close
                </Button>
            </dialog>
        </div>
    );
};

export default SigninModal; 