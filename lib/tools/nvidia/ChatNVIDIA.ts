// /lib/chatnvidia.ts
import OpenAI from 'openai';
import { LLM, type BaseLLMParams } from "@langchain/core/language_models/llms";
import type { CallbackManagerForLLMRun } from "@langchain/core/callbacks/manager";
import { GenerationChunk } from "@langchain/core/outputs";

export interface ChatNvidiaLLMInput extends BaseLLMParams {
  apiKey: string;
  model?: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
}

export class ChatNvidiaLLM extends LLM {
  apiKey: string;
  model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  openai: any;

  constructor(fields: ChatNvidiaLLMInput) {
    super(fields);
    this.apiKey = fields.apiKey;
    this.model = fields.model || "meta/llama-3.3-70b-instruct";
    this.temperature = fields.temperature ?? 0.2;
    this.top_p = fields.top_p ?? 0.7;
    this.max_tokens = fields.max_tokens ?? 1024;
    this.openai = new OpenAI({
      apiKey: this.apiKey,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  }

  _llmType() {
    return "chatnvidia";
  }

  /**
   * Converts a single prompt or an array of prompts into a messages array.
   */
  _getMessages(prompt: string | string[]): string[] {
    // For this example, we simply extract the content as strings.
    if (Array.isArray(prompt)) {
      return prompt;
    }
    return [prompt];
  }

  /**
   * _call makes a non-streaming call to the ChatNvidia API.
   */
  async _call(
    prompt: string | string[],
    options: this["ParsedCallOptions"],
    runManager?: CallbackManagerForLLMRun
  ): Promise<string> {
    const messages = this._getMessages(prompt);
    if (runManager) {
      // Updated callback: now passing the llm type and the prompt messages (as string or array)
      await runManager.handleLLMNewToken(this._llmType(), {
        prompt: 0, // index of the prompt
        completion: 0 // index of the completion
      });
    }
    let finalResponse: string = "";
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages.map((m) => ({ role: 'user', content: m })), // Convert back to expected API shape
        temperature: this.temperature,
        top_p: this.top_p,
        max_tokens: this.max_tokens,
        stream: false,
      });
      finalResponse = completion.choices[0].message.content;
      if (runManager) {
        // Now passing the final response directly (or as an array)
        await runManager.handleLLMEnd({
          generations: [[{ text: finalResponse }]]
        });
      }
    } catch (error: any) {
      if (runManager) {
        await runManager.handleLLMError(error, messages.join("\n"));
      }
      throw error;
    }
    return finalResponse as string;
  }

  /**
   * _streamResponseChunks streams the response from ChatNvidia in chunks.
   */
  async *_streamResponseChunks(
    prompt: string | string[],
    options: this["ParsedCallOptions"],
    runManager?: CallbackManagerForLLMRun
  ): AsyncGenerator<GenerationChunk> {
    const messages = this._getMessages(prompt);
    if (runManager) {
      await runManager.handleLLMNewToken(this._llmType(), {
        prompt: 0, // index of the prompt
        completion: 0 // index of the completion
      });
    }
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages.map((m) => ({ role: 'user', content: m })),
        temperature: this.temperature,
        top_p: this.top_p,
        max_tokens: this.max_tokens,
        stream: true,
      });
      for await (const chunk of completion) {
        const textChunk = chunk.choices[0]?.delta?.content;
        if (textChunk) {
          yield new GenerationChunk({ text: textChunk });
        }
      }
      if (runManager) {
        // Indicate the streaming is complete with a final message.
        await runManager.handleLLMEnd({
          generations: [[{ text: "stream complete" }]]
        });
      }
    } catch (error: any) {
      if (runManager) {
        await runManager.handleLLMError(error, messages.join("\n"));
      }
      throw error;
    }
  }
}
