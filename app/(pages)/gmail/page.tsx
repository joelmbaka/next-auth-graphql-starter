'use client';

import { useState } from 'react';
import ChatInput from '@/components/ChatInput';
import { signIn } from 'next-auth/react';

export default function EmailPage() {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([]);

  const handleSend = async (input: string) => {
    setLoading(true);
    try {
      // Add user message to chat
      setMessages(prev => [...prev, { role: 'user', content: input }]);
      
      // Call email API
      const response = await fetch('/api/gmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ input }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.needsReauth) {
          // Handle reauth case
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `${data.message}. Click the sign-in button in the navbar to grant Gmail permissions.` 
          }]);
          return;
        }
        throw new Error(data.error || 'Failed to process email request');
      }
      
      // Extract the actual output from the response
      const output = data.output || data.result;
      
      // Add assistant response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: typeof output === 'string' ? output : JSON.stringify(output) 
      }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'An error occurred while processing your request.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex-1 overflow-y-auto mb-4">
        {messages.map((message, index) => (
          <div 
            key={index}
            className={`p-3 rounded-lg mb-2 ${
              message.role === 'user' 
                ? 'bg-blue-100 ml-auto max-w-[80%]' 
                : 'bg-gray-100 mr-auto max-w-[80%]'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>
      
      <div className="sticky bottom-0 bg-white pt-4">
        <ChatInput onSend={handleSend} loading={loading} />
      </div>
    </div>
  );
}
