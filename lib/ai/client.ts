// Main AI Client with Fallback and Retry Logic
import type { ChatRequest, AIResponse, AIStreamChunk } from "./providers/base"
import { aiRegistry } from "./registry"
import { modelConfigs, calculateCost } from "@/lib/config/models"

export interface AIClientOptions {
  maxRetries?: number
  retryDelay?: number
  fallbackModels?: string[]
  enableFallback?: boolean
}

export class AIClient {
  private options: Required<AIClientOptions>

  constructor(options: AIClientOptions = {}) {
    this.options = {
      maxRetries: options.maxRetries ?? 3,
      retryDelay: options.retryDelay ?? 1000,
      fallbackModels: options.fallbackModels ?? [],
      enableFallback: options.enableFallback ?? true,
    }
  }

  async generateText(request: ChatRequest): Promise<AIResponse> {
    const modelsToTry = this.getModelsToTry(request.modelId)
    let lastError: Error | null = null

    for (const modelId of modelsToTry) {
      const modelConfig = modelConfigs[modelId]
      if (!modelConfig || !modelConfig.enabled) continue

      try {
        const provider = aiRegistry.getProviderForModel(modelId)
        const requestWithModel = { ...request, modelId }

        const response = await this.executeWithRetry(
          () => provider.generateText(requestWithModel),
          this.options.maxRetries,
        )

        // Calculate and add cost
        const cost = calculateCost(modelId, response.usage.inputTokens, response.usage.outputTokens)

        return {
          ...response,
          cost,
          model: modelId,
        }
      } catch (error) {
        lastError = error as Error
        console.warn(`Failed to generate text with model ${modelId}:`, error)

        // If this is the preferred model, try fallbacks
        if (modelId === request.modelId && this.options.enableFallback) {
          continue
        }

        // If this is already a fallback, stop trying
        break
      }
    }

    throw lastError || new Error("All models failed")
  }

  async *streamText(request: ChatRequest): AsyncIterable<AIStreamChunk> {
    const modelsToTry = this.getModelsToTry(request.modelId)
    let lastError: Error | null = null

    for (const modelId of modelsToTry) {
      const modelConfig = modelConfigs[modelId]
      if (!modelConfig || !modelConfig.enabled) continue

      try {
        const provider = aiRegistry.getProviderForModel(modelId)
        const requestWithModel = { ...request, modelId }

        let totalInputTokens = 0
        let totalOutputTokens = 0

        for await (const chunk of provider.streamText(requestWithModel)) {
          if (chunk.type === "done" && chunk.usage) {
            totalInputTokens = chunk.usage.inputTokens
            totalOutputTokens = chunk.usage.outputTokens

            // Calculate and add cost
            const cost = calculateCost(modelId, totalInputTokens, totalOutputTokens)

            yield {
              ...chunk,
              usage: {
                ...chunk.usage,
                cost,
              },
            }
          } else {
            yield chunk
          }
        }

        return // Success, exit the retry loop
      } catch (error) {
        lastError = error as Error
        console.warn(`Failed to stream text with model ${modelId}:`, error)

        // If this is the preferred model, try fallbacks
        if (modelId === request.modelId && this.options.enableFallback) {
          continue
        }

        // If this is already a fallback, stop trying
        break
      }
    }

    // If we get here, all models failed
    yield {
      type: "error",
      error: lastError?.message || "All models failed",
    }
  }

  private getModelsToTry(preferredModelId: string): string[] {
    const models = [preferredModelId]

    if (this.options.enableFallback) {
      // Add configured fallback models
      models.push(...this.options.fallbackModels)

      // Add automatic fallbacks based on provider and tier
      const preferredConfig = modelConfigs[preferredModelId]
      if (preferredConfig) {
        const fallbacks = this.getAutomaticFallbacks(preferredConfig)
        models.push(...fallbacks)
      }
    }

    // Remove duplicates and return
    return [...new Set(models)]
  }

  private getAutomaticFallbacks(preferredConfig: any): string[] {
    const fallbacks: string[] = []

    // Same provider, cheaper models
    const sameProviderModels = Object.values(modelConfigs)
      .filter(
        (config) =>
          config.provider === preferredConfig.provider &&
          config.id !== preferredConfig.id &&
          config.enabled &&
          config.pricing.tier !== "premium",
      )
      .sort((a, b) => a.pricing.inputTokens - b.pricing.inputTokens)
      .map((config) => config.id)

    fallbacks.push(...sameProviderModels.slice(0, 2))

    // Different providers, similar capabilities
    const crossProviderModels = Object.values(modelConfigs)
      .filter(
        (config) =>
          config.provider !== preferredConfig.provider &&
          config.enabled &&
          config.capabilities.contextWindow >= preferredConfig.capabilities.contextWindow * 0.5,
      )
      .sort((a, b) => a.pricing.inputTokens - b.pricing.inputTokens)
      .map((config) => config.id)

    fallbacks.push(...crossProviderModels.slice(0, 2))

    return fallbacks
  }

  private async executeWithRetry<T>(operation: () => Promise<T>, maxRetries: number): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        if (attempt < maxRetries) {
          const delay = this.options.retryDelay * Math.pow(2, attempt)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError
  }

  async getAvailableModels(): Promise<string[]> {
    return aiRegistry.getAvailableModels()
  }

  async getProviderStatus(): Promise<Record<string, any>> {
    return aiRegistry.getProviderStatus()
  }
}

// Global client instance
export const aiClient = new AIClient({
  maxRetries: 3,
  retryDelay: 1000,
  enableFallback: true,
  fallbackModels: ["gpt-4o-mini", "claude-3-5-haiku-20241022", "llama-3.1-8b-instant"],
})
