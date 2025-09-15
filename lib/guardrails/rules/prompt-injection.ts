// Prompt Injection Detection Guardrail
import { BaseGuardrail, type GuardrailResult, type GuardrailContext } from "../types"

export class PromptInjectionGuardrail extends BaseGuardrail {
  name = "Prompt Injection Protection"
  type = "prompt_injection"
  priority = 2
  enabled = true

  private injectionPatterns = [
    // Direct instruction overrides
    /ignore\s+(previous|all|above|system)\s+(instructions?|prompts?|rules?)/gi,
    /forget\s+(everything|all|previous|system)/gi,
    /new\s+(instructions?|task|role|system)/gi,

    // Role manipulation
    /you\s+are\s+now\s+(a|an|the)/gi,
    /act\s+as\s+(a|an|the)/gi,
    /pretend\s+(to\s+be|you\s+are)/gi,

    // System prompt extraction
    /show\s+me\s+(your|the)\s+(system\s+)?(prompt|instructions?)/gi,
    /what\s+(are\s+)?your\s+(system\s+)?(prompt|instructions?)/gi,
    /repeat\s+(your|the)\s+(system\s+)?(prompt|instructions?)/gi,

    // Jailbreak attempts
    /\bDAN\b|\bdo\s+anything\s+now\b/gi,
    /developer\s+mode/gi,
    /jailbreak/gi,

    // Encoding attempts
    /base64|rot13|caesar|cipher/gi,
    /\\x[0-9a-f]{2}/gi, // Hex encoding
    /&#\d+;/gi, // HTML entities
  ]

  private suspiciousStructures = [
    // Multiple system-like messages
    /system:\s*.*\nuser:\s*.*\nassistant:/gi,
    // Fake conversation structures
    /human:\s*.*\nai:\s*.*\nhuman:/gi,
    // XML-like injection attempts
    /<\s*(system|user|assistant|human|ai)\s*>/gi,
  ]

  async checkInput(content: string, context: GuardrailContext): Promise<GuardrailResult> {
    const lowerContent = content.toLowerCase()

    // Check for direct injection patterns
    for (const pattern of this.injectionPatterns) {
      if (pattern.test(content)) {
        return this.createResult("block", "Potential prompt injection detected", content, undefined, "high", 0.9)
      }
    }

    // Check for suspicious conversation structures
    for (const pattern of this.suspiciousStructures) {
      if (pattern.test(content)) {
        return this.createResult(
          "flag",
          "Suspicious conversation structure detected",
          content,
          undefined,
          "medium",
          0.8,
        )
      }
    }

    // Check for excessive special characters (potential encoding)
    const specialCharRatio = (content.match(/[^a-zA-Z0-9\s.,!?]/g) || []).length / content.length
    if (specialCharRatio > 0.3 && content.length > 50) {
      return this.createResult("flag", "High ratio of special characters detected", content, undefined, "medium", 0.7)
    }

    // Check for extremely long single words (potential obfuscation)
    const words = content.split(/\s+/)
    const longWords = words.filter((word) => word.length > 100)
    if (longWords.length > 0) {
      return this.createResult("flag", "Unusually long words detected", content, undefined, "medium", 0.8)
    }

    return this.createResult("allow", "No prompt injection detected", content, undefined, "low", 1.0)
  }

  async checkOutput(content: string, context: GuardrailContext): Promise<GuardrailResult> {
    // Check if the output reveals system information
    const systemRevealPatterns = [
      /my\s+(system\s+)?(prompt|instructions?)/gi,
      /i\s+(am|was)\s+(programmed|instructed|told)/gi,
      /according\s+to\s+my\s+(system\s+)?(prompt|instructions?)/gi,
    ]

    for (const pattern of systemRevealPatterns) {
      if (pattern.test(content)) {
        return this.createResult("block", "Output may reveal system information", content, undefined, "high", 0.9)
      }
    }

    return this.createResult("allow", "Output passed injection checks", content, undefined, "low", 1.0)
  }
}
