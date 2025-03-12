import { WebBrowser } from "langchain/tools/webbrowser";
import { NvidiaEmbeddingsClient } from "@/lib/tools/nvidia/nvidiaEmbeddings";
import { ChatNvidiaLLM } from "@/lib/tools/nvidia/ChatNVIDIA";
import { NextResponse } from "next/server";
import { AgentExecutor, createStructuredChatAgent } from "langchain/agents";
import { PromptTemplate } from "@langchain/core/prompts";
import { RedisConversationKGMemory } from "@/lib/memory/RedisConversationKGMemory";
import redis from "@/lib/clients/redis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function POST(request: Request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { input } = await request.json();
    
    if (!input) {
      return NextResponse.json(
        { error: "Input is required" },
        { status: 400 }
      );
    }

    if (!process.env.NVIDIA_API_KEY) {
      throw new Error("Missing NVIDIA_API_KEY environment variable");
    }

    const model = new ChatNvidiaLLM({
      apiKey: process.env.NVIDIA_API_KEY || "",
      model: "meta/llama-3.3-70b-instruct",
    });

    const embeddings = new NvidiaEmbeddingsClient({
      apiKey: process.env.NVIDIA_API_KEY || "",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      model: "nvidia/llama-3.2-nv-embedqa-1b-v2",
      truncate: "NONE",
      inputType: "passage",
    });

    // Initialize memory with knowledge graph capabilities
    const memory = new RedisConversationKGMemory({
      redis,
      sessionId: session.user.id,
      llm: model,
      memoryKey: "history",
      kgKey: "knowledge_graph",
    });

    const tools = [new WebBrowser({ model, embeddings })];

    // Update the prompt to leverage knowledge graph
    const agentRunnable = await createStructuredChatAgent({
      llm: model,
      tools,
      prompt: PromptTemplate.fromTemplate(`
        You are a research assistant with memory and knowledge graph capabilities.
        Your task is to analyze information and provide summaries while remembering past conversations.
        
        Available tools: {tool_names}
        Tools: {tools}
        
        Conversation history: {history}
        
        ${
          // Conditionally include entity knowledge if available
          `{% if entities %}
          Known entities and relationships: 
          {% for entity, relations in entities.items() %}
          - {{ entity }}:
            {% for relation, objects in relations.items() %}
              {{ relation }}: {{ objects | join(', ') }}
            {% endfor %}
          {% endfor %}
          {% endif %}`
        }

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
      `)
    });

    const executor = AgentExecutor.fromAgentAndTools({
      agent: agentRunnable,
      tools,
      verbose: true,
      memory,
    });

    const result = await executor.invoke({
      input: input,
    });

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
};