import { BaseChatMemory, BaseChatMemoryInput } from "langchain/memory";
import { InputValues, OutputValues } from "langchain/memory";
import { Redis } from "@upstash/redis";

interface RedisMemoryInput extends BaseChatMemoryInput {
    redis: Redis;
    sessionId: string;
    memoryKey?: string;
    embeddingKey?: string;
}

export class RedisMemory extends BaseChatMemory {
    redis: Redis;
    sessionId: string;
    memoryKey: string;
    embeddingKey: string;
    memoryKeys = ["history", "embeddings"];

    constructor(fields: RedisMemoryInput) {
        super(fields);
        this.redis = fields.redis;
        this.sessionId = fields.sessionId;
        this.memoryKey = fields.memoryKey || "history";
        this.embeddingKey = fields.embeddingKey || "embeddings";
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async loadMemoryVariables(_values: InputValues) {
        try {
            const history = await this.redis.get(`${this.sessionId}:${this.memoryKey}`);
            const embeddings = await this.redis.get(`${this.sessionId}:${this.embeddingKey}`);
            
            return {
                history: history || "",
                embeddings: embeddings && typeof embeddings === 'string' ? 
                    JSON.parse(embeddings) : []
            };
        } catch (error) {
            console.error('Error loading memory variables:', error);
            return {
                history: "",
                embeddings: []
            };
        }
    }

    async saveContext(inputValues: InputValues, outputValues: OutputValues) {
        try {
            const input = inputValues.input;
            const output = outputValues.output;
            const embeddings = outputValues.embeddings || [];

            // Save conversation history
            await this.redis.set(
                `${this.sessionId}:${this.memoryKey}`,
                JSON.stringify({ input, output })
            );

            // Save embeddings if they exist
            if (embeddings.length > 0) {
                const existingEmbeddings = await this.redis.get(`${this.sessionId}:${this.embeddingKey}`);
                const allEmbeddings = existingEmbeddings && typeof existingEmbeddings === 'string' ? 
                    JSON.parse(existingEmbeddings) : [];
                allEmbeddings.push(...embeddings);
                await this.redis.set(
                    `${this.sessionId}:${this.embeddingKey}`,
                    JSON.stringify(allEmbeddings)
                );
            }
        } catch (error) {
            console.error('Error saving context:', error);
        }
    }

    async clear() {
        await this.redis.del(`${this.sessionId}:${this.memoryKey}`);
        await this.redis.del(`${this.sessionId}:${this.embeddingKey}`);
    }
} 