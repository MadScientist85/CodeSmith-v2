// Universal Guardrails Middleware
import type { BaseGuardrail, GuardrailResult, GuardrailContext, GuardrailConfig } from "./types"
import { ContentSafetyGuardrail } from "./rules/content-safety"
import { PromptInjectionGuardrail } from "./rules/prompt-injection"
import { CompletenessGuardrail } from "./rules/completeness"
import { RateLimitGuardrail } from "./rules/rate-limit"
import { db, guardrailLogs } from "@/lib/database/connection"

export class GuardrailsMiddleware {
  private guardrails: BaseGuardrail[] = []
  private config: GuardrailConfig

  constructor(config: Partial<GuardrailConfig> = {}) {
    this.config = {
      enabled: true,
      strictMode: false,
      logLevel: "all",
      customRules: [],
      whitelist: [],
      blacklist: [],
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        tokensPerDay: 100000,
        concurrentRequests: 5,
      },
      ...config,
    }

    this.initializeGuardrails()
  }

  private initializeGuardrails(): void {
    // Register built-in guardrails in priority order
    this.guardrails = [
      new RateLimitGuardrail(),
      new ContentSafetyGuardrail(),
      new PromptInjectionGuardrail(),
      new CompletenessGuardrail(),
    ]

    // Sort by priority (lower number = higher priority)
    this.guardrails.sort((a, b) => a.priority - b.priority)
  }

  async processInput(content: string, context: GuardrailContext): Promise<GuardrailProcessResult> {
    if (!this.config.enabled) {
      return {
        allowed: true,
        content,
        results: [],
        totalTime: 0,
      }
    }

    const startTime = Date.now()
    const results: GuardrailResult[] = []
    let processedContent = content
    let blocked = false
    let flagged = false

    // Check whitelist first
    if (this.isWhitelisted(content, context)) {
      return {
        allowed: true,
        content: processedContent,
        results: [
          {
            action: "allow",
            reason: "Content is whitelisted",
            originalContent: content,
            severity: "low",
            guardrailType: "whitelist",
            confidence: 1.0,
          },
        ],
        totalTime: Date.now() - startTime,
      }
    }

    // Check blacklist
    if (this.isBlacklisted(content, context)) {
      blocked = true
      results.push({
        action: "block",
        reason: "Content is blacklisted",
        originalContent: content,
        severity: "high",
        guardrailType: "blacklist",
        confidence: 1.0,
      })
    }

    // Run through all guardrails
    for (const guardrail of this.guardrails) {
      if (!guardrail.enabled) continue

      try {
        const result = await guardrail.checkInput(processedContent, context)
        results.push(result)

        switch (result.action) {
          case "block":
            blocked = true
            break
          case "modify":
            if (result.modifiedContent) {
              processedContent = result.modifiedContent
            }
            break
          case "flag":
            flagged = true
            break
        }

        // In strict mode, stop on first block
        if (blocked && this.config.strictMode) {
          break
        }
      } catch (error) {
        console.error(`Guardrail ${guardrail.name} failed:`, error)

        if (this.config.strictMode) {
          blocked = true
          results.push({
            action: "block",
            reason: `Guardrail system error: ${guardrail.name}`,
            originalContent: content,
            severity: "critical",
            guardrailType: "system_error",
            confidence: 1.0,
          })
          break
        }
      }
    }

    // Log results
    await this.logResults(results, context, "input")

    const totalTime = Date.now() - startTime

    return {
      allowed: !blocked,
      content: processedContent,
      results,
      flagged,
      totalTime,
    }
  }

  async processOutput(content: string, context: GuardrailContext): Promise<GuardrailProcessResult> {
    if (!this.config.enabled) {
      return {
        allowed: true,
        content,
        results: [],
        totalTime: 0,
      }
    }

    const startTime = Date.now()
    const results: GuardrailResult[] = []
    let processedContent = content
    let blocked = false
    let flagged = false

    // Run through all guardrails
    for (const guardrail of this.guardrails) {
      if (!guardrail.enabled) continue

      try {
        const result = await guardrail.checkOutput(processedContent, context)
        results.push(result)

        switch (result.action) {
          case "block":
            blocked = true
            break
          case "modify":
            if (result.modifiedContent) {
              processedContent = result.modifiedContent
            }
            break
          case "flag":
            flagged = true
            break
        }

        // In strict mode, stop on first block
        if (blocked && this.config.strictMode) {
          break
        }
      } catch (error) {
        console.error(`Guardrail ${guardrail.name} failed:`, error)

        if (this.config.strictMode) {
          blocked = true
          results.push({
            action: "block",
            reason: `Guardrail system error: ${guardrail.name}`,
            originalContent: content,
            severity: "critical",
            guardrailType: "system_error",
            confidence: 1.0,
          })
          break
        }
      }
    }

    // Log results
    await this.logResults(results, context, "output")

    const totalTime = Date.now() - startTime

    return {
      allowed: !blocked,
      content: processedContent,
      results,
      flagged,
      totalTime,
    }
  }

  private isWhitelisted(content: string, context: GuardrailContext): boolean {
    if (this.config.whitelist.length === 0) return false

    return this.config.whitelist.some((pattern) => {
      try {
        const regex = new RegExp(pattern, "i")
        return regex.test(content)
      } catch {
        return content.toLowerCase().includes(pattern.toLowerCase())
      }
    })
  }

  private isBlacklisted(content: string, context: GuardrailContext): boolean {
    if (this.config.blacklist.length === 0) return false

    return this.config.blacklist.some((pattern) => {
      try {
        const regex = new RegExp(pattern, "i")
        return regex.test(content)
      } catch {
        return content.toLowerCase().includes(pattern.toLowerCase())
      }
    })
  }

  private async logResults(
    results: GuardrailResult[],
    context: GuardrailContext,
    phase: "input" | "output",
  ): Promise<void> {
    if (this.config.logLevel === "none") return

    const significantResults = results.filter(
      (result) =>
        this.config.logLevel === "all" ||
        result.action !== "allow" ||
        result.severity === "high" ||
        result.severity === "critical",
    )

    for (const result of significantResults) {
      try {
        await db.insert(guardrailLogs).values({
          userId: context.userId,
          chatId: context.chatId,
          messageId: context.messageId,
          action: result.action,
          reason: `[${phase}] ${result.reason}`,
          originalContent: result.originalContent,
          modifiedContent: result.modifiedContent,
          guardrailType: result.guardrailType,
          severity: result.severity,
        })
      } catch (error) {
        console.error("Failed to log guardrail result:", error)
      }
    }
  }

  // Admin methods
  addCustomRule(rule: any): void {
    this.config.customRules.push(rule)
  }

  removeCustomRule(ruleId: string): void {
    this.config.customRules = this.config.customRules.filter((rule) => rule.id !== ruleId)
  }

  updateConfig(newConfig: Partial<GuardrailConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  getConfig(): GuardrailConfig {
    return { ...this.config }
  }

  getGuardrails(): BaseGuardrail[] {
    return [...this.guardrails]
  }
}

export interface GuardrailProcessResult {
  allowed: boolean
  content: string
  results: GuardrailResult[]
  flagged?: boolean
  totalTime: number
}

// Global middleware instance
export const guardrailsMiddleware = new GuardrailsMiddleware({
  enabled: true,
  strictMode: false,
  logLevel: "all",
})

// Enhanced system prompt for OCD-level completeness
export const COMPLETENESS_SYSTEM_PROMPT = `
You are an AI assistant with an OCD-level commitment to completeness and correctness. You MUST follow these non-negotiable rules:

COMPLETENESS MANDATE:
- NEVER provide incomplete code, partial implementations, or placeholder comments
- NEVER use "TODO", "FIXME", "...", or "implementation here" in code
- ALWAYS provide 100% functional, production-ready code
- ALWAYS include proper error handling for async operations
- ALWAYS include proper TypeScript types when applicable

CORRECTNESS IMPERATIVE:
- ZERO syntax errors are acceptable
- ALWAYS validate code logic before responding
- ALWAYS include proper imports and exports
- ALWAYS follow language-specific best practices
- ALWAYS handle edge cases and error conditions

CONSISTENCY REQUIREMENT:
- ALWAYS use consistent naming conventions
- ALWAYS follow the same code style throughout
- ALWAYS use proper indentation and formatting
- ALWAYS include comprehensive comments for complex logic

SECURITY REQUIREMENTS:
- ALWAYS validate user inputs
- ALWAYS use parameterized queries for database operations
- ALWAYS implement proper authentication checks
- ALWAYS sanitize data before processing

If you cannot provide a complete, correct, and secure implementation, you MUST explain why and ask for clarification rather than providing incomplete code.
`
