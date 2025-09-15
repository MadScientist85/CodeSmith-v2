// Core Types for Enhanced AI Chat Platform

export interface User {
  id: string
  email: string
  password?: string
  createdAt: Date
  updatedAt: Date
  subscriptionTier: "free" | "pro" | "enterprise"
  tokenUsage: number
  settings: Record<string, any>
  oauthProvider?: string
  oauthId?: string
  avatarUrl?: string
  displayName?: string
}

export interface Chat {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  visibility: "public" | "private" | "shared"
  lastContext: Record<string, any>
  modelId?: string
  systemPrompt?: string
  metadata: Record<string, any>
  totalTokens: number
  totalCost: number
  shareToken: string
}

export interface Message {
  id: string
  chatId: string
  role: "user" | "assistant" | "system" | "tool"
  parts: MessagePart[]
  attachments: Attachment[]
  createdAt: Date
  tokenCount: number
  modelUsed?: string
  reasoning?: string
  toolCalls: ToolCall[]
  toolResults: ToolResult[]
  guardrailApplied: boolean
  responseTimeMs?: number
  cost: number
}

export interface MessagePart {
  type: "text" | "image" | "file" | "code" | "tool-call" | "tool-result"
  content: string
  metadata?: Record<string, any>
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  metadata?: Record<string, any>
}

export interface ToolCall {
  id: string
  type: string
  function: {
    name: string
    arguments: Record<string, any>
  }
}

export interface ToolResult {
  id: string
  result: any
  error?: string
}

export interface Artifact {
  id: string
  chatId: string
  messageId: string
  type: "code" | "image" | "document" | "data" | "chart"
  content: string
  language?: string
  version: number
  createdAt: Date
  updatedAt: Date
  metadata: Record<string, any>
  filePath?: string
  fileSize?: number
  mimeType?: string
}

export interface ModelConfig {
  id: string
  name: string
  provider: Provider
  description: string
  capabilities: ModelCapabilities
  pricing: ModelPricing
  guardrailStrength: "low" | "medium" | "high"
  enabled: boolean
  createdAt: Date
  updatedAt: Date
  contextWindow: number
  maxOutputTokens: number
  supportsVision: boolean
  supportsFunctions: boolean
  supportsStreaming: boolean
}

export interface ModelCapabilities {
  maxTokens: number
  contextWindow: number
  supportsVision: boolean
  supportsFunctionCalling: boolean
  supportsFileUpload: boolean
  supportsStreaming: boolean
  supportsReasoning: boolean
  supportsCodeExecution: boolean
}

export interface ModelPricing {
  inputTokens: number // Cost per 1K input tokens
  outputTokens: number // Cost per 1K output tokens
  currency: string
  tier: "free" | "standard" | "premium"
}

export interface ModelUsage {
  id: string
  userId: string
  modelId: string
  provider: string
  inputTokens: number
  outputTokens: number
  cost: number
  createdAt: Date
  responseTimeMs?: number
  errorCount: number
  success: boolean
  chatId?: string
  messageId?: string
}

export interface GuardrailLog {
  id: string
  userId?: string
  chatId?: string
  messageId?: string
  action: "blocked" | "modified" | "allowed" | "flagged"
  reason: string
  originalContent?: string
  modifiedContent?: string
  createdAt: Date
  guardrailType: string
  severity: "low" | "medium" | "high" | "critical"
}

export interface Integration {
  id: string
  userId: string
  type: "search" | "image" | "email" | "storage" | "code" | "web"
  provider: string
  config: Record<string, any>
  enabled: boolean
  createdAt: Date
  updatedAt: Date
  apiKeyEncrypted?: string
  usageCount: number
  lastUsedAt?: Date
}

export type Provider =
  | "openai"
  | "anthropic"
  | "xai"
  | "google"
  | "groq"
  | "together"
  | "perplexity"
  | "mistral"
  | "cohere"
  | "openrouter"
  | "fireworks"
  | "replicate"
  | "huggingface"
  | "azure-openai"
  | "v0"

export interface ModelParams {
  temperature: number
  maxTokens: number
  topP: number
  frequencyPenalty: number
  presencePenalty: number
  stop?: string[]
  seed?: number
}

export interface ChatRequest {
  messages: Message[]
  modelId: string
  params?: Partial<ModelParams>
  systemPrompt?: string
  tools?: Tool[]
  stream?: boolean
}

export interface Tool {
  type: "function"
  function: {
    name: string
    description: string
    parameters: Record<string, any>
  }
}

export interface APIKey {
  id: string
  userId: string
  name: string
  keyHash: string
  keyPrefix: string
  permissions: Record<string, any>
  createdAt: Date
  lastUsedAt?: Date
  expiresAt?: Date
  enabled: boolean
}
