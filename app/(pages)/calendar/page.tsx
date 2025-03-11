'use client';

import { useState } from 'react';
import ChatInput from '@/components/ChatInput';

export default function CalendarPage() {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: string, content: string }>>([]);

  const handleSend = async (input: string) => {
    setLoading(true);
    try {
      // Add user message to chat
      setMessages(prev => [...prev, { role: 'user', content: input }]);
      
      // Call calendar API
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to process calendar request');
      }

      const data = await response.json();
      
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