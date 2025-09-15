// Base Provider Interface and Abstract Class
import type { ChatRequest } from "@/lib/types"

export interface AIProvider {
  name: string
  models: string[]
  initialize(apiKey: string, config?: Record<string, any>): Promise<void>
  generateText(request: ChatRequest): Promise<AIResponse>
  streamText(request: ChatRequest): AsyncIterable<AIStreamChunk>
  isHealthy(): Promise<boolean>
  getUsage(): ProviderUsage
}

export interface AIResponse {
  content: string
  usage: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  model: string
  finishReason: string
  responseTime: number
  toolCalls?: any[]
}

export interface AIStreamChunk {
  type: "text" | "tool-call" | "tool-result" | "done" | "error"
  content?: string
  delta?: string
  usage?: {
    inputTokens: number
    outputTokens: number
  }
  toolCall?: any
  error?: string
}

export interface ProviderUsage {
  requestCount: number
  tokenCount: number
  errorCount: number
  lastRequest: Date | null
}

export abstract class BaseAIProvider implements AIProvider {
  abstract name: string
  abstract models: string[]

  protected apiKey = ""
  protected config: Record<string, any> = {}
  protected usage: ProviderUsage = {
    requestCount: 0,
    tokenCount: 0,
    errorCount: 0,
    lastRequest: null,
  }

  async initialize(apiKey: string, config: Record<string, any> = {}): Promise<void> {
    this.apiKey = apiKey
    this.config = config
  }

  abstract generateText(request: ChatRequest): Promise<AIResponse>
  abstract streamText(request: ChatRequest): AsyncIterable<AIStreamChunk>

  async isHealthy(): Promise<boolean> {
    try {
      // Simple health check with minimal request
      const testRequest: ChatRequest = {
        messages: [
          {
            id: "test",
            chatId: "test",
            role: "user",
            parts: [{ type: "text", content: "Hi" }],
            attachments: [],
            createdAt: new Date(),
            tokenCount: 1,
            toolCalls: [],
            toolResults: [],
            guardrailApplied: false,
            cost: 0,
          },
        ],
        modelId: this.models[0],
        params: { temperature: 0, maxTokens: 1, topP: 1, frequencyPenalty: 0, presencePenalty: 0 },
      }

      const response = await this.generateText(testRequest)
      return response.content.length > 0
    } catch {
      return false
    }
  }

  getUsage(): ProviderUsage {
    return { ...this.usage }
  }

  protected updateUsage(inputTokens: number, outputTokens: number, isError = false): void {
    this.usage.requestCount++
    this.usage.tokenCount += inputTokens + outputTokens
    this.usage.lastRequest = new Date()

    if (isError) {
      this.usage.errorCount++
    }
  }
}
