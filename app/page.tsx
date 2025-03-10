// page.tsx
"use client";

import { useState } from 'react';
import ChatInput from '@/components/ChatInput';

export default function HomePage() {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async (question: string) => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: question }),
      });
      const data = await res.json();
      setResponse(data.response || data.error);
    } catch (error: any) {
      setResponse({ error: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen p-4">
      <div className="flex-grow flex flex-col items-center">
        <div className="w-full max-w-2xl mt-8">
          {/* Chat Input */}
          <div className="mb-4">
            <ChatInput onSend={handleSend} loading={loading} />
          </div>
          
          {/* Response Canvas */}
          {response && (
            <div className="border rounded-lg p-4 bg-background shadow-sm">
              {typeof response === 'string' ? (
                <pre className="whitespace-pre-wrap text-foreground">{response}</pre>
              ) : response?.error ? (
                <div className="text-red-500">{response.error}</div>
              ) : (
                <div className="text-foreground">
                  <p>Unsupported response format</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
