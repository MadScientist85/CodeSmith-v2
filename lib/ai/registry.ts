// AI Provider Registry and Management
import type { AIProvider } from "./providers/base"
import { OpenAIProvider } from "./providers/openai"
import { AnthropicProvider } from "./providers/anthropic"
import { XAIProvider } from "./providers/xai"
import { OpenRouterProvider } from "./providers/openrouter"
import { PerplexityProvider } from "./providers/perplexity"
import { GroqProvider } from "./providers/groq"
import { modelConfigs } from "@/lib/config/models"

export class AIProviderRegistry {
  private providers = new Map<string, AIProvider>()
  private initialized = new Set<string>()

  constructor() {
    // Register all providers
    this.registerProvider(new OpenAIProvider())
    this.registerProvider(new AnthropicProvider())
    this.registerProvider(new XAIProvider())
    this.registerProvider(new OpenRouterProvider())
    this.registerProvider(new PerplexityProvider())
    this.registerProvider(new GroqProvider())
  }

  private registerProvider(provider: AIProvider): void {
    this.providers.set(provider.name, provider)
  }

  async initializeProvider(providerName: string, apiKey: string, config?: Record<string, any>): Promise<void> {
    const provider = this.providers.get(providerName)
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`)
    }

    await provider.initialize(apiKey, config)
    this.initialized.add(providerName)
  }

  getProvider(providerName: string): AIProvider {
    const provider = this.providers.get(providerName)
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`)
    }

    if (!this.initialized.has(providerName)) {
      throw new Error(`Provider ${providerName} not initialized`)
    }

    return provider
  }

  getProviderForModel(modelId: string): AIProvider {
    const modelConfig = modelConfigs[modelId]
    if (!modelConfig) {
      throw new Error(`Model ${modelId} not found`)
    }

    return this.getProvider(modelConfig.provider)
  }

  async getHealthyProvider(preferredProvider?: string): Promise<AIProvider> {
    const providersToCheck = preferredProvider
      ? [preferredProvider, ...Array.from(this.initialized).filter((p) => p !== preferredProvider)]
      : Array.from(this.initialized)

    for (const providerName of providersToCheck) {
      const provider = this.providers.get(providerName)
      if (provider && (await provider.isHealthy())) {
        return provider
      }
    }

    throw new Error("No healthy providers available")
  }

  getAvailableModels(): string[] {
    const models: string[] = []

    for (const providerName of this.initialized) {
      const provider = this.providers.get(providerName)
      if (provider) {
        models.push(...provider.models)
      }
    }

    return models
  }

  async getProviderStatus(): Promise<Record<string, { healthy: boolean; usage: any }>> {
    const status: Record<string, { healthy: boolean; usage: any }> = {}

    for (const [name, provider] of this.providers) {
      if (this.initialized.has(name)) {
        status[name] = {
          healthy: await provider.isHealthy(),
          usage: provider.getUsage(),
        }
      }
    }

    return status
  }

  getInitializedProviders(): string[] {
    return Array.from(this.initialized)
  }

  isProviderInitialized(providerName: string): boolean {
    return this.initialized.has(providerName)
  }
}

// Global registry instance
export const aiRegistry = new AIProviderRegistry()

// Auto-initialize providers from environment variables
export async function initializeProvidersFromEnv(): Promise<void> {
  const envMappings = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    xai: process.env.XAI_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    perplexity: process.env.PERPLEXITY_API_KEY,
    groq: process.env.GROQ_API_KEY,
  }

  const initPromises = Object.entries(envMappings).map(async ([provider, apiKey]) => {
    if (apiKey) {
      try {
        await aiRegistry.initializeProvider(provider, apiKey)
        console.log(`✅ Initialized ${provider} provider`)
      } catch (error) {
        console.warn(`⚠️ Failed to initialize ${provider} provider:`, error)
      }
    }
  })

  await Promise.allSettled(initPromises)
}
