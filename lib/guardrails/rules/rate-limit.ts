// Rate Limiting Guardrail
import { BaseGuardrail, type GuardrailResult, type GuardrailContext } from "../types"

interface RateLimitEntry {
  count: number
  tokens: number
  lastReset: number
  concurrent: number
}

export class RateLimitGuardrail extends BaseGuardrail {
  name = "Rate Limiting"
  type = "rate_limit"
  priority = 0 // Highest priority
  enabled = true

  private userLimits = new Map<string, RateLimitEntry>()
  private ipLimits = new Map<string, RateLimitEntry>()

  private limits = {
    free: {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      tokensPerDay: 10000,
      concurrentRequests: 2,
    },
    pro: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      tokensPerDay: 100000,
      concurrentRequests: 5,
    },
    enterprise: {
      requestsPerMinute: 300,
      requestsPerHour: 10000,
      tokensPerDay: 1000000,
      concurrentRequests: 20,
    },
  }

  async checkInput(content: string, context: GuardrailContext): Promise<GuardrailResult> {
    const userId = context.userId || "anonymous"
    const userTier = context.userTier || "free"
    const limits = this.limits[userTier]

    // Get or create rate limit entry
    let entry = this.userLimits.get(userId)
    if (!entry) {
      entry = {
        count: 0,
        tokens: 0,
        lastReset: Date.now(),
        concurrent: 0,
      }
      this.userLimits.set(userId, entry)
    }

    const now = Date.now()
    const minutesSinceReset = (now - entry.lastReset) / (1000 * 60)
    const hoursSinceReset = minutesSinceReset / 60
    const daysSinceReset = hoursSinceReset / 24

    // Reset counters if needed
    if (minutesSinceReset >= 1) {
      entry.count = 0
      entry.lastReset = now
    }

    if (daysSinceReset >= 1) {
      entry.tokens = 0
    }

    // Check concurrent requests
    if (entry.concurrent >= limits.concurrentRequests) {
      return this.createResult(
        "block",
        `Too many concurrent requests. Limit: ${limits.concurrentRequests}`,
        content,
        undefined,
        "medium",
        1.0,
      )
    }

    // Check requests per minute
    if (entry.count >= limits.requestsPerMinute) {
      return this.createResult(
        "block",
        `Rate limit exceeded. Limit: ${limits.requestsPerMinute} requests per minute`,
        content,
        undefined,
        "medium",
        1.0,
      )
    }

    // Estimate tokens for this request
    const estimatedTokens = Math.ceil(content.length / 4) // Rough estimation

    // Check daily token limit
    if (entry.tokens + estimatedTokens > limits.tokensPerDay) {
      return this.createResult(
        "block",
        `Daily token limit exceeded. Limit: ${limits.tokensPerDay} tokens per day`,
        content,
        undefined,
        "medium",
        1.0,
      )
    }

    // Update counters
    entry.count++
    entry.tokens += estimatedTokens
    entry.concurrent++

    return this.createResult("allow", "Rate limit check passed", content, undefined, "low", 1.0)
  }

  async checkOutput(content: string, context: GuardrailContext): Promise<GuardrailResult> {
    // Decrement concurrent counter
    const userId = context.userId || "anonymous"
    const entry = this.userLimits.get(userId)
    if (entry && entry.concurrent > 0) {
      entry.concurrent--
    }

    return this.createResult("allow", "Output rate limit check passed", content, undefined, "low", 1.0)
  }

  // Method to get current usage for a user
  getUserUsage(userId: string): RateLimitEntry | null {
    return this.userLimits.get(userId) || null
  }

  // Method to reset limits for a user (admin function)
  resetUserLimits(userId: string): void {
    this.userLimits.delete(userId)
  }
}
