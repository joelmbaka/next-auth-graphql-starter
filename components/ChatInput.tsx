// components/ChatInput.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

const ChatInput: React.FC = () => {
    const [question, setQuestion] = useState('');

    const handleSend = () => {
        // Handle sending the question
        console.log(question);
        setQuestion('');
    };

    return (
        <div className="flex mb-4">
            <Input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="flex-grow border rounded p-2"
            />
            <Button onClick={handleSend} className="ml-2 flex items-center">
                Send <Send className="ml-1" />
            </Button>
        </div>
    );
};

export default ChatInput;