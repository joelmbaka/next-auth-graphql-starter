import { NextResponse } from "next/server";

// Proper redirect that forwards the request body
export async function POST(request: Request) {
  try {
    // Get the original request body
    const body = await request.json();
    
    // Forward the request to the Gmail API
    const response = await fetch(new URL('/api/gmail', request.url), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    // Return the response
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Email redirect error:", error);
    return NextResponse.json({ 
      error: "Failed to process email request" 
    }, { status: 500 });
  }
} 