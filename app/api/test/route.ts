// app/api/test/route.ts
import { NvidiaEmbeddingsClient } from "@/lib/tools/nvidia/nvidiaEmbeddings";

export async function GET(request: Request): Promise<Response> {
  const apiKey = process.env.NVIDIA_API_KEY || "";
  const baseUrl = "https://integrate.api.nvidia.com/v1";
  const model = "nvidia/llama-3.2-nv-embedqa-1b-v2";

  const client = new NvidiaEmbeddingsClient({
    apiKey,
    baseUrl,
    model,
    truncate: "NONE",
    inputType: "query", // Provide the required input_type
  });

  try {
    const query = "What is the capital of France?";
    const embedding = await client.embedQuery(query);
    const json = JSON.stringify({ embedding, dimensions: embedding.length });
    return new Response(json, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
