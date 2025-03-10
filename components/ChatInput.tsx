// components/ChatInput.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (question: string) => void;
  loading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, loading }) => {
    const [question, setQuestion] = useState('');

    const handleSend = () => {
        if (question.trim()) {
            onSend(question);
            setQuestion('');
        }
    };

    return (
        <div className="flex mb-4 w-full">
            <Input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="flex-grow border rounded p-2 mr-2 bg-background text-foreground"
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <Button 
                onClick={handleSend} 
                className="flex items-center bg-background text-foreground hover:bg-foreground hover:text-background"
                disabled={loading}
            >
                {loading ? 'Sending...' : (
                    <>
                        Send <Send className="ml-1" />
                    </>
                )}
            </Button>
        </div>
    );
};

export default ChatInput;