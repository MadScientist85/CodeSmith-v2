// Perplexity Provider Implementation
import { BaseAIProvider, type AIResponse, type AIStreamChunk, type ChatRequest } from "./base"
import { openai } from "@ai-sdk/openai"
import { generateText, streamText } from "ai"

export class PerplexityProvider extends BaseAIProvider {
  name = "perplexity"
  models = [
    "llama-3.1-sonar-large-128k-online",
    "llama-3.1-sonar-small-128k-online",
    "llama-3.1-sonar-large-128k-chat",
    "llama-3.1-sonar-small-128k-chat",
    "llama-3.1-8b-instruct",
    "llama-3.1-70b-instruct",
  ]

  private client: any

  async initialize(apiKey: string, config: Record<string, any> = {}): Promise<void> {
    await super.initialize(apiKey, config)
    this.client = openai({
      apiKey: this.apiKey,
      baseURL: "https://api.perplexity.ai",
    })
  }

  async generateText(request: ChatRequest): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      const messages = request.messages.map((msg) => ({
        role: msg.role,
        content: msg.parts.map((part) => part.content).join("\n"),
      }))

      const result = await generateText({
        model: this.client(request.modelId),
        messages,
        system: request.systemPrompt,
        temperature: request.params?.temperature ?? 0.7,
        maxTokens: request.params?.maxTokens ?? 2000,
        topP: request.params?.topP ?? 1,
        tools: request.tools,
      })

      const responseTime = Date.now() - startTime

      this.updateUsage(result.usage.promptTokens, result.usage.completionTokens)

      return {
        content: result.text,
        usage: {
          inputTokens: result.usage.promptTokens,
          outputTokens: result.usage.completionTokens,
          totalTokens: result.usage.totalTokens,
        },
        model: request.modelId,
        finishReason: result.finishReason,
        responseTime,
        toolCalls: result.toolCalls,
      }
    } catch (error) {
      this.updateUsage(0, 0, true)
      throw error
    }
  }

  async *streamText(request: ChatRequest): AsyncIterable<AIStreamChunk> {
    try {
      const messages = request.messages.map((msg) => ({
        role: msg.role,
        content: msg.parts.map((part) => part.content).join("\n"),
      }))

      const result = streamText({
        model: this.client(request.modelId),
        messages,
        system: request.systemPrompt,
        temperature: request.params?.temperature ?? 0.7,
        maxTokens: request.params?.maxTokens ?? 2000,
        topP: request.params?.topP ?? 1,
        tools: request.tools,
      })

      for await (const chunk of result.textStream) {
        yield {
          type: "text",
          delta: chunk,
        }
      }

      const usage = await result.usage
      this.updateUsage(usage.promptTokens, usage.completionTokens)

      yield {
        type: "done",
        usage: {
          inputTokens: usage.promptTokens,
          outputTokens: usage.completionTokens,
        },
      }
    } catch (error) {
      this.updateUsage(0, 0, true)
      yield {
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
