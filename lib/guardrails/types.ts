// Guardrail System Types and Interfaces
export interface GuardrailResult {
  action: "allow" | "block" | "modify" | "flag"
  reason: string
  originalContent: string
  modifiedContent?: string
  severity: "low" | "medium" | "high" | "critical"
  guardrailType: string
  confidence: number
  metadata?: Record<string, any>
}

export interface GuardrailContext {
  userId?: string
  chatId?: string
  messageId?: string
  modelId: string
  provider: string
  isStreaming: boolean
  userTier: "free" | "pro" | "enterprise"
  previousMessages: any[]
}

export interface GuardrailConfig {
  enabled: boolean
  strictMode: boolean
  logLevel: "none" | "errors" | "all"
  customRules: CustomRule[]
  whitelist: string[]
  blacklist: string[]
  rateLimits: RateLimitConfig
}

export interface CustomRule {
  id: string
  name: string
  pattern: string | RegExp
  action: "block" | "flag" | "modify"
  severity: "low" | "medium" | "high" | "critical"
  replacement?: string
  enabled: boolean
}

export interface RateLimitConfig {
  requestsPerMinute: number
  requestsPerHour: number
  tokensPerDay: number
  concurrentRequests: number
}

export abstract class BaseGuardrail {
  abstract name: string
  abstract type: string
  abstract priority: number
  abstract enabled: boolean

  abstract checkInput(content: string, context: GuardrailContext): Promise<GuardrailResult>
  abstract checkOutput(content: string, context: GuardrailContext): Promise<GuardrailResult>

  protected createResult(
    action: GuardrailResult["action"],
    reason: string,
    originalContent: string,
    modifiedContent?: string,
    severity: GuardrailResult["severity"] = "medium",
    confidence = 1.0,
  ): GuardrailResult {
    return {
      action,
      reason,
      originalContent,
      modifiedContent,
      severity,
      guardrailType: this.type,
      confidence,
    }
  }
}
