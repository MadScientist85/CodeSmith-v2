// Content Safety Guardrail
import { BaseGuardrail, type GuardrailResult, type GuardrailContext } from "../types"

export class ContentSafetyGuardrail extends BaseGuardrail {
  name = "Content Safety"
  type = "content_safety"
  priority = 1
  enabled = true

  private harmfulPatterns = [
    // Violence and harm
    /\b(kill|murder|assassinate|torture|harm|hurt|violence|weapon|bomb|explosive)\b/gi,
    // Illegal activities
    /\b(drug|cocaine|heroin|meth|illegal|hack|crack|pirate|steal|fraud)\b/gi,
    // Hate speech
    /\b(nazi|terrorist|extremist|radical|supremacist)\b/gi,
    // Self-harm
    /\b(suicide|self.harm|cut.myself|end.my.life)\b/gi,
  ]

  private sensitivePatterns = [
    // Personal information
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // Credit card
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{3}[\s-]?\d{3}[\s-]?\d{4}\b/g, // Phone number
  ]

  async checkInput(content: string, context: GuardrailContext): Promise<GuardrailResult> {
    // Check for harmful content
    for (const pattern of this.harmfulPatterns) {
      if (pattern.test(content)) {
        return this.createResult(
          "block",
          "Content contains potentially harmful or dangerous information",
          content,
          undefined,
          "high",
          0.9,
        )
      }
    }

    // Check for sensitive information
    let modifiedContent = content
    let hasSensitiveData = false

    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(content)) {
        modifiedContent = modifiedContent.replace(pattern, "[REDACTED]")
        hasSensitiveData = true
      }
    }

    if (hasSensitiveData) {
      return this.createResult(
        "modify",
        "Sensitive personal information detected and redacted",
        content,
        modifiedContent,
        "medium",
        0.95,
      )
    }

    return this.createResult("allow", "Content passed safety checks", content, undefined, "low", 1.0)
  }

  async checkOutput(content: string, context: GuardrailContext): Promise<GuardrailResult> {
    // Similar checks for output, but more lenient for educational content
    const educationalContext = /\b(explain|teach|learn|understand|example|tutorial)\b/gi.test(
      context.previousMessages.slice(-3).join(" "),
    )

    if (educationalContext) {
      // Allow more content in educational contexts
      return this.createResult("allow", "Educational context detected", content, undefined, "low", 0.8)
    }

    return this.checkInput(content, context)
  }
}
