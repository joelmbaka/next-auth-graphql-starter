// /api/agent/route.ts
import { NextResponse } from 'next/server';
import { ChatNvidiaLLM } from '@/lib/tools/nvidia/ChatNVIDIA';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth'; // Adjust the path as needed

export async function POST(request: Request) {
  try {
    // Parse the request body for prompt and model configuration.
    const { prompt, model, temperature, top_p, max_tokens } = await request.json();

    // Ensure the user is authenticated.
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Retrieve the ChatNvidia API key from environment variables.
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ChatNvidia API key');
    }

    // Dynamically instantiate the ChatNvidiaLLM with the desired model and parameters.
    const llm = new ChatNvidiaLLM({
      apiKey,
      model: model || "meta/llama-3.3-70b-instruct",
      temperature: temperature ?? 0.2,
      top_p: top_p ?? 0.7,
      max_tokens: max_tokens ?? 1024,
    });

    // Get the LLM's response (non-streaming example).
    const response = await llm._call(prompt, {});
    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("Agent Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
