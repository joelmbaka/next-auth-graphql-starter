'use client';

import { useState } from 'react';
import ChatInput from '@/components/ChatInput';

export default function PeoplePage() {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

  const handleSend = async (input: string) => {
    setLoading(true);
    try {
      // Add the user message to the chat
      setMessages(prev => [...prev, { role: 'user', content: input }]);
      
      // Call the People API agent endpoint
      const response = await fetch('/api/people', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) throw new Error('Failed to process your People request');
      const data = await response.json();
      
      // Add the assistant's response to the chat
      setMessages(prev => [...prev, { role: 'assistant', content: data.result }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'An error occurred while processing your request.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">People Assistant</h1>
      <ChatInput onSend={handleSend} loading={loading} />
      <div className="mt-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 ${msg.role === 'user' ? 'text-blue-600' : 'text-green-600'}`}
          >
            <strong>{msg.role}:</strong> {msg.content}
          </div>
        ))}
      </div>
    </div>
  );
} 