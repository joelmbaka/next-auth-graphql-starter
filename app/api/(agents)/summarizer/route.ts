import { WebBrowser } from "langchain/tools/webbrowser";
import { NvidiaEmbeddingsClient } from "@/lib/tools/nvidia/nvidiaEmbeddings";
import { ChatNvidiaLLM } from "@/lib/tools/nvidia/ChatNVIDIA";
import { NextResponse } from "next/server";
import { AgentExecutor, createStructuredChatAgent } from "langchain/agents";
import { PromptTemplate } from "@langchain/core/prompts";
import type { Session } from 'next-auth';
import { auth } from '@/auth';
import redis from '@/lib/clients/redis';
import { RedisMemory } from "@/lib/memory/RedisMemory";
import { ConsoleCallbackHandler } from "langchain/callbacks";

export async function POST(request: Request) {
  try {
    // Authentication check
    const session = await auth() as Session | null;
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { input } = await request.json();
    if (!input) {
      return NextResponse.json({ error: "Input is required" }, { status: 400 });
    }
    if (!process.env.NVIDIA_API_KEY) {
      throw new Error("Missing NVIDIA_API_KEY environment variable");
    }

    // Use the authenticated user's ID as the session key.
    const sessionId = session.user.id;

    // Initialize the LLM and embeddings
    const model = new ChatNvidiaLLM({
      apiKey: process.env.NVIDIA_API_KEY || "",
      model: "meta/llama-3.3-70b-instruct",
      callbacks: [new ConsoleCallbackHandler()]
    });

    const embeddings = new NvidiaEmbeddingsClient({
      apiKey: process.env.NVIDIA_API_KEY || "",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      model: "nvidia/llama-3.2-nv-embedqa-1b-v2",
      truncate: "NONE",
      inputType: "passage",
    });

    // Generate embeddings for the input
    const inputEmbeddings = await embeddings.embedQuery(input);

    // Use RedisMemory with embeddings support
    const memory = new RedisMemory({
      sessionId,
      redis,
      memoryKey: "summarizer_chat_history",
      embeddingKey: "summarizer_embeddings"
    });

    // Register available tools.
    const tools = [new WebBrowser({ model, embeddings })];

    // Create a structured chat agent with a custom prompt that includes conversation history.
    const agentRunnable = await createStructuredChatAgent({
      llm: model,
      tools,
      prompt: PromptTemplate.fromTemplate(`
        You are a research assistant. Your task is to analyze URLs and provide summaries.
        Always use the web-browser tool when necessary.

        Chat History: {history}

        Available tools: {tool_names}
        Tools: {tools}

        Use this format for tool inputs:
        {{
          "action": "web-browser",
          "action_input": "<URL>,<query>"
        }}

        Use this format for final answers:
        {{
          "final_answer": "your_summary_here"
        }}

        Input: {input}
        Thought: {agent_scratchpad}
      `),
    });

    // Create executor with Redis memory
    const executor = AgentExecutor.fromAgentAndTools({
      agent: agentRunnable,
      tools,
      verbose: true,
      memory,
      returnIntermediateSteps: false,
    });

    // Invoke the agent with the user's input and embeddings
    const history = await memory.loadMemoryVariables({});
    const result = await executor.invoke({ 
      input,
      embeddings: inputEmbeddings,
      history: history.history || "",
      callbacks: [new ConsoleCallbackHandler()]
    });

    // Handle the response
    const output = result?.returnValues?.output || 
                  result?.output || 
                  result?.action_input || 
                  result?.log?.match(/"final_answer":\s*"([^"]+)"/)?.[1] || 
                  "No output available";

    return NextResponse.json({ 
      result: output,
      embeddings: inputEmbeddings // Optionally return embeddings in the response
    });
  } catch (error: Error | unknown) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
