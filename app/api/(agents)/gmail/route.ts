import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ChatNvidiaLLM } from "@/lib/tools/nvidia/ChatNVIDIA";
import { AgentExecutor, createStructuredChatAgent } from "langchain/agents";
import { PromptTemplate } from "@langchain/core/prompts";
import { getGmailTools } from "@/lib/tools/googleapi/gmail";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { input } = await request.json();
    if (!input) {
      return NextResponse.json(
        { error: "Input is required" },
        { status: 400 }
      );
    }

    // Initialize LLM
    const model = new ChatNvidiaLLM({
      apiKey: process.env.NVIDIA_API_KEY || "",
      model:"meta/llama-3.3-70b-instruct",
    });

    // Patch missing methods to satisfy BaseChatModel interface requirements
    (model as any).disableStreaming = () => {};
    (model as any).getLsParams = () => ({});
    (model as any).callPrompt = async (prompt: any) => {
      // Return a dummy response so that the tool doesn't throw an error.
      return { text: "dummy calendar response" };
    };
    // Also add a dummy "call" method if required by the tools.
    (model as any).call = async (prompt: any, options?: any) => {
      return "dummy calendar call result";
    };

    // Get Gmail tools
    const tools = getGmailTools(session.accessToken);

    // Create agent
    const agentRunnable = await createStructuredChatAgent({
      llm: model,
      tools,
      prompt: PromptTemplate.fromTemplate(`
        You are a Gmail assistant. Your task is to help users manage and interact with their Gmail account.
            
        IMPORTANT: When asked about emails, you MUST use the appropriate tools to get real data.
        NEVER make up email information or skip using tools.
        DO NOT provide final answers until you have retrieved actual data using tools.
        
        Available tools: {tool_names}
        Tools: {tools}

        Use this format for tool inputs:
        {{
          "action": "tool_name",
          "action_input": {{
            "parameter": "value"
          }}
        }}

        Use this format for final answers:
        {{
          "final_answer": "your_response_here"
        }}

        Input: {input}
        Thought: {agent_scratchpad}

        When using gmail_get_message, you must provide the messageId from the search results. Example:
        {{
          "action": "gmail_get_message",
          "action_input": {{
            "messageId": "unique_message_id_string"
          }}
        }}
      `)
    });

    const executor = AgentExecutor.fromAgentAndTools({
      agent: agentRunnable,
      tools,
      verbose: true,
    });

    const result = await executor.invoke({ input });

    return NextResponse.json({ result });
  } catch (error: any) {
    console.error("Gmail API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
