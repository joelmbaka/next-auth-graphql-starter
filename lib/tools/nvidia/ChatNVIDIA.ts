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

interface NvidiaMessage {
  role: string;
  content: string;
}

interface NvidiaCompletionChoice {
  message: NvidiaMessage;
  content?: string;
  finish_reason: string;
  index: number;
}

interface NvidiaCompletionResponse {
  id: string;
  choices: NvidiaCompletionChoice[];
  created: number;
  model: string;
  object: string;
}

interface NvidiaError {
  status: number;
  message: string;
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
      await runManager.handleLLMNewToken(this._llmType(), {
        prompt: 0,
        completion: 0,
      });
    }
    let finalResponse: string = "";
    let retries = 3;
    while (retries > 0) {
      try {
        const completion: NvidiaCompletionResponse = await this.openai.chat.completions.create({
          model: this.model,
          messages: messages.map((m) => ({ role: 'user', content: m })),
          temperature: this.temperature,
          top_p: this.top_p,
          max_tokens: this.max_tokens,
          stream: false,
        });
        finalResponse = completion.choices[0].message.content;
        if (runManager) {
          await runManager.handleLLMEnd({
            generations: [[{ text: finalResponse }]],
          });
        }
        return finalResponse;
      } catch (error: unknown) {
        if (typeof error === 'object' && error !== null && 'status' in error) {
          const nvidiaError = error as NvidiaError;
          if (nvidiaError.status === 429) {
            retries--;
            await new Promise((resolve) => setTimeout(resolve, 1000 * (4 - retries))); // Exponential backoff
          }
        }
        if (runManager) {
          await runManager.handleLLMError(error, messages.join("\n"));
        }
        throw error;
      }
    }
    throw new Error('Rate limit exceeded after retries');
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

  async getMessages(prompt: string | string[] | any): Promise<any[]> {
    if (Array.isArray(prompt) && prompt.length > 0 && typeof prompt[0] === 'object' && 'role' in prompt[0]) {
      return prompt;
    }
    
    if (typeof prompt === 'string') {
      return [{ role: 'user', content: prompt }];
    }
    
    if (Array.isArray(prompt)) {
      return prompt.map(p => ({ role: 'user', content: p }));
    }
    
    // Handle LangChain message format
    if (prompt.messages) {
      return prompt.messages.map((msg: any) => ({
        role: msg.type === 'human' ? 'user' : 'assistant',
        content: msg.content
      }));
    }
    
    return [{ role: 'user', content: String(prompt) }];
  }

  _formatMessages(prompt: any) {
    // This helper ensures messages are properly formatted
    if (Array.isArray(prompt) && prompt.length > 0 && typeof prompt[0] === 'object') {
      // If it's already an array of message objects
      return prompt;
    }
    
    if (typeof prompt === 'string') {
      return [{ role: 'user', content: prompt }];
    }
    
    if (Array.isArray(prompt)) {
      return prompt.map(p => ({ role: 'user', content: p }));
    }
    
    return [{ role: 'user', content: String(prompt) }];
  }
}
