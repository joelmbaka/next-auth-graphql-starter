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
                <form className="w-full flex flex-col items-center">
                    <div className="text-center mb-4">
                        <h3>please sign in to continue:</h3>
                    </div>
                    <div className="w-full max-w-[250px]">
                        {/* Button to sign in with Google */}
                        <Button 
                            type="button" 
                            className="flex items-center justify-center gap-2 border border-gray-300 mb-2 w-full" 
                            onClick={handleGoogleSignIn}
                            disabled={googleLoading || githubLoading}
                        >
                            {googleLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600" />
                                    Signing you in...
                                </div>
                            ) : (
                                <>
                                    <FaGoogle className="w-4 h-4" />
                                    Sign In with Google
                                </>
                            )}
                        </Button>
                        {/* Button to sign in with GitHub */}
                        <Button 
                            type="button" 
                            className="flex items-center justify-center gap-2 border border-gray-300 w-full" 
                            onClick={handleGithubSignIn}
                            disabled={googleLoading || githubLoading}
                        >
                            {githubLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600" />
                                    Signing you in...
                                </div>
                            ) : (
                                <>
                                    <Github className="w-4 h-4" />
                                    Sign In with GitHub
                                </>
                            )}
                        </Button>
                    </div>
                </form>
                {/* Button to close the modal */}
                <Button onClick={onClose} className="mt-4">Close</Button> 
            </dialog>
        </div>
    );
};

export default SigninModal; 