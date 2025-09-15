// Model Configuration Registry
import type { ModelConfig } from "@/lib/types"

export const modelConfigs: Record<string, ModelConfig> = {
  // OpenAI Models
  "gpt-4o": {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Most advanced GPT-4 model with vision and function calling",
    capabilities: {
      maxTokens: 128000,
      contextWindow: 128000,
      supportsVision: true,
      supportsFunctionCalling: true,
      supportsFileUpload: true,
      supportsStreaming: true,
      supportsReasoning: true,
      supportsCodeExecution: false,
    },
    pricing: {
      inputTokens: 0.005,
      outputTokens: 0.015,
      currency: "USD",
      tier: "premium",
    },
    guardrailStrength: "high",
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },
  "gpt-4o-mini": {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Faster, more affordable GPT-4o model",
    capabilities: {
      maxTokens: 128000,
      contextWindow: 128000,
      supportsVision: true,
      supportsFunctionCalling: true,
      supportsFileUpload: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsCodeExecution: false,
    },
    pricing: {
      inputTokens: 0.00015,
      outputTokens: 0.0006,
      currency: "USD",
      tier: "standard",
    },
    guardrailStrength: "high",
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    contextWindow: 128000,
    maxOutputTokens: 16384,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },

  // Anthropic Models
  "claude-3-5-sonnet-20241022": {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    description: "Anthropic's most intelligent model with superior reasoning",
    capabilities: {
      maxTokens: 200000,
      contextWindow: 200000,
      supportsVision: true,
      supportsFunctionCalling: true,
      supportsFileUpload: true,
      supportsStreaming: true,
      supportsReasoning: true,
      supportsCodeExecution: false,
    },
    pricing: {
      inputTokens: 0.003,
      outputTokens: 0.015,
      currency: "USD",
      tier: "premium",
    },
    guardrailStrength: "high",
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },
  "claude-3-5-haiku-20241022": {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    description: "Fast and efficient Claude model for everyday tasks",
    capabilities: {
      maxTokens: 200000,
      contextWindow: 200000,
      supportsVision: true,
      supportsFunctionCalling: true,
      supportsFileUpload: true,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsCodeExecution: false,
    },
    pricing: {
      inputTokens: 0.0008,
      outputTokens: 0.004,
      currency: "USD",
      tier: "standard",
    },
    guardrailStrength: "high",
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },

  // xAI Models
  "grok-beta": {
    id: "grok-beta",
    name: "Grok Beta",
    provider: "xai",
    description: "xAI's flagship model with real-time information access",
    capabilities: {
      maxTokens: 131072,
      contextWindow: 131072,
      supportsVision: true,
      supportsFunctionCalling: true,
      supportsFileUpload: true,
      supportsStreaming: true,
      supportsReasoning: true,
      supportsCodeExecution: false,
    },
    pricing: {
      inputTokens: 0.005,
      outputTokens: 0.015,
      currency: "USD",
      tier: "premium",
    },
    guardrailStrength: "medium",
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    contextWindow: 131072,
    maxOutputTokens: 4096,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },

  // OpenRouter Models
  "meta-llama/llama-3.2-90b-vision-instruct": {
    id: "meta-llama/llama-3.2-90b-vision-instruct",
    name: "Llama 3.2 90B Vision",
    provider: "openrouter",
    description: "Meta's latest multimodal model with vision capabilities",
    capabilities: {
      maxTokens: 131072,
      contextWindow: 131072,
      supportsVision: true,
      supportsFunctionCalling: true,
      supportsFileUpload: true,
      supportsStreaming: true,
      supportsReasoning: true,
      supportsCodeExecution: false,
    },
    pricing: {
      inputTokens: 0.0009,
      outputTokens: 0.0009,
      currency: "USD",
      tier: "premium",
    },
    guardrailStrength: "medium",
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    contextWindow: 131072,
    maxOutputTokens: 8192,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },
  "anthropic/claude-3.5-sonnet": {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet (OpenRouter)",
    provider: "openrouter",
    description: "Claude 3.5 Sonnet via OpenRouter with competitive pricing",
    capabilities: {
      maxTokens: 200000,
      contextWindow: 200000,
      supportsVision: true,
      supportsFunctionCalling: true,
      supportsFileUpload: true,
      supportsStreaming: true,
      supportsReasoning: true,
      supportsCodeExecution: false,
    },
    pricing: {
      inputTokens: 0.003,
      outputTokens: 0.015,
      currency: "USD",
      tier: "premium",
    },
    guardrailStrength: "high",
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    contextWindow: 200000,
    maxOutputTokens: 8192,
    supportsVision: true,
    supportsFunctions: true,
    supportsStreaming: true,
  },

  // Perplexity Models
  "llama-3.1-sonar-large-128k-online": {
    id: "llama-3.1-sonar-large-128k-online",
    name: "Sonar Large Online",
    provider: "perplexity",
    description: "Perplexity's flagship model with real-time web access",
    capabilities: {
      maxTokens: 127072,
      contextWindow: 127072,
      supportsVision: false,
      supportsFunctionCalling: false,
      supportsFileUpload: false,
      supportsStreaming: true,
      supportsReasoning: true,
      supportsCodeExecution: false,
    },
    pricing: {
      inputTokens: 0.001,
      outputTokens: 0.001,
      currency: "USD",
      tier: "premium",
    },
    guardrailStrength: "medium",
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    contextWindow: 127072,
    maxOutputTokens: 4096,
    supportsVision: false,
    supportsFunctions: false,
    supportsStreaming: true,
  },
  "llama-3.1-sonar-small-128k-online": {
    id: "llama-3.1-sonar-small-128k-online",
    name: "Sonar Small Online",
    provider: "perplexity",
    description: "Fast Perplexity model with real-time web access",
    capabilities: {
      maxTokens: 127072,
      contextWindow: 127072,
      supportsVision: false,
      supportsFunctionCalling: false,
      supportsFileUpload: false,
      supportsStreaming: true,
      supportsReasoning: false,
      supportsCodeExecution: false,
    },
    pricing: {
      inputTokens: 0.0002,
      outputTokens: 0.0002,
      currency: "USD",
      tier: "standard",
    },
    guardrailStrength: "medium",
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    contextWindow: 127072,
    maxOutputTokens: 4096,
    supportsVision: false,
    supportsFunctions: false,
    supportsStreaming: true,
  },
}

export const getModelsByProvider = (provider: string) => {
  return Object.values(modelConfigs).filter((model) => model.provider === provider)
}

export const getEnabledModels = () => {
  return Object.values(modelConfigs).filter((model) => model.enabled)
}

export const getModelById = (id: string) => {
  return modelConfigs[id]
}

export const calculateCost = (modelId: string, inputTokens: number, outputTokens: number): number => {
  const model = modelConfigs[modelId]
  if (!model) return 0

  const inputCost = (inputTokens / 1000) * model.pricing.inputTokens
  const outputCost = (outputTokens / 1000) * model.pricing.outputTokens

  return inputCost + outputCost
}
