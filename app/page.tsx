// page.tsx
"use client";

import { useState } from 'react';
import ChatInput from '@/components/ChatInput';

// Define a proper type for the API response
interface ApiResponse {
  result?: string;
  error?: string;
}

export default function HomePage() {
  // Replace 'any' with the specific type
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSend = async (question: string) => {
    setLoading(true);
    setResponse(null);
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: `${question},` }),
      });
      // Use the defined type for the data
      const data = await res.json() as ApiResponse;
      setResponse(data.result ? { result: data.result } : { error: data.error });
    } catch (error: unknown) {
      setResponse({ error: error instanceof Error ? error.message : 'An unknown error occurred' });
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
