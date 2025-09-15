// xAI Provider Implementation
import { BaseAIProvider, type AIResponse, type AIStreamChunk, type ChatRequest } from "./base"
import { xai } from "@ai-sdk/xai"
import { generateText, streamText } from "ai"

export class XAIProvider extends BaseAIProvider {
  name = "xai"
  models = ["grok-beta", "grok-vision-beta"]

  private client: any

  async initialize(apiKey: string, config: Record<string, any> = {}): Promise<void> {
    await super.initialize(apiKey, config)
    this.client = xai({
      apiKey: this.apiKey,
      baseURL: config.baseURL,
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
        frequencyPenalty: request.params?.frequencyPenalty ?? 0,
        presencePenalty: request.params?.presencePenalty ?? 0,
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
        frequencyPenalty: request.params?.frequencyPenalty ?? 0,
        presencePenalty: request.params?.presencePenalty ?? 0,
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
