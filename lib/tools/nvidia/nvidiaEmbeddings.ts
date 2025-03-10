// nvidiaEmbeddingsClient.ts
export interface NvidiaEmbeddingsClientConfig {
    apiKey: string;
    baseUrl: string;
    model: string;
    truncate?: "NONE" | "START" | "END";
    inputType?: "query" | "passage";
  }
  
  interface EmbeddingResponse {
    data: Array<{
      embedding: number[];
    }>;
  }
  
  export class NvidiaEmbeddingsClient {
    private apiKey: string;
    private baseUrl: string;
    private model: string;
    private truncate: "NONE" | "START" | "END";
    private inputType: "query" | "passage";
  
    constructor(config: NvidiaEmbeddingsClientConfig) {
      this.apiKey = config.apiKey;
      this.baseUrl = config.baseUrl;
      this.model = config.model;
      this.truncate = config.truncate || "NONE";
      this.inputType = config.inputType || "query";
    }
  
    async embedQuery(query: string): Promise<number[]> {
      const payload = {
        input: [query],
        model: this.model,
        encoding_format: "float",
        input_type: this.inputType,
        truncate: this.truncate,
      };
  
      // Log payload for debugging
      console.log("Payload:", JSON.stringify(payload, null, 2));
  
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error fetching embedding: ${response.statusText} - ${errorText}`);
      }
  
      const data: EmbeddingResponse = await response.json();
      return data.data[0].embedding;
    }
  }
  