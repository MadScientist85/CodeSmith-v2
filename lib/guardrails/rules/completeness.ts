// Code Completeness and Quality Guardrail
import { BaseGuardrail, type GuardrailResult, type GuardrailContext } from "../types"

export class CompletenessGuardrail extends BaseGuardrail {
  name = "Code Completeness & Quality"
  type = "completeness"
  priority = 3
  enabled = true

  private codeBlockPattern = /```[\s\S]*?```/g
  private incompletePatterns = [
    /\/\/ TODO:/gi,
    /\/\/ FIXME:/gi,
    /\/\/ HACK:/gi,
    /\/\*\s*TODO[\s\S]*?\*\//gi,
    /\.\.\./g, // Ellipsis indicating incomplete code
    /\/\/ \.\.\. rest of the code/gi,
    /\/\/ implementation here/gi,
    /\/\/ your code here/gi,
    /\/\/ add your logic/gi,
  ]

  private syntaxErrorPatterns = [
    // JavaScript/TypeScript
    /function\s+\w+\s*$$[^)]*$$\s*\{[^}]*$/gm, // Unclosed function
    /if\s*$$[^)]*$$\s*\{[^}]*$/gm, // Unclosed if statement
    /for\s*$$[^)]*$$\s*\{[^}]*$/gm, // Unclosed for loop
    /while\s*$$[^)]*$$\s*\{[^}]*$/gm, // Unclosed while loop

    // Missing semicolons in critical places
    /import\s+.*from\s+['"][^'"]*['"](?!;)/gm,
    /export\s+.*(?!;)$/gm,

    // Unmatched brackets
    /\{[^}]*$/gm,
    /\[[^\]]*$/gm,
    /\([^)]*$/gm,
  ]

  async checkInput(content: string, context: GuardrailContext): Promise<GuardrailResult> {
    // Only check if the input is asking for code
    const isCodeRequest = /\b(code|function|component|implement|build|create|write|generate)\b/gi.test(content)

    if (!isCodeRequest) {
      return this.createResult("allow", "Not a code request", content, undefined, "low", 1.0)
    }

    return this.createResult("allow", "Input validation passed", content, undefined, "low", 1.0)
  }

  async checkOutput(content: string, context: GuardrailContext): Promise<GuardrailResult> {
    const codeBlocks = content.match(this.codeBlockPattern) || []

    if (codeBlocks.length === 0) {
      return this.createResult("allow", "No code blocks to validate", content, undefined, "low", 1.0)
    }

    const issues: string[] = []
    let severity: "low" | "medium" | "high" | "critical" = "low"

    for (const codeBlock of codeBlocks) {
      // Check for incomplete code patterns
      for (const pattern of this.incompletePatterns) {
        if (pattern.test(codeBlock)) {
          issues.push("Incomplete code detected (TODO, FIXME, or placeholder comments)")
          severity = "high"
        }
      }

      // Check for syntax errors
      for (const pattern of this.syntaxErrorPatterns) {
        if (pattern.test(codeBlock)) {
          issues.push("Potential syntax errors detected")
          severity = "critical"
        }
      }

      // Check for proper imports and exports
      if (codeBlock.includes("import") && !this.hasProperImports(codeBlock)) {
        issues.push("Improper or incomplete import statements")
        severity = severity === "critical" ? "critical" : "high"
      }

      // Check for proper error handling
      if (this.needsErrorHandling(codeBlock) && !this.hasErrorHandling(codeBlock)) {
        issues.push("Missing error handling for async operations")
        severity = severity === "critical" ? "critical" : "medium"
      }

      // Check for proper TypeScript types
      if (this.isTypeScript(codeBlock) && !this.hasProperTypes(codeBlock)) {
        issues.push("Missing or incomplete TypeScript type definitions")
        severity = severity === "critical" ? "critical" : "medium"
      }
    }

    if (issues.length > 0) {
      return this.createResult("block", `Code quality issues: ${issues.join(", ")}`, content, undefined, severity, 0.95)
    }

    return this.createResult("allow", "Code quality validation passed", content, undefined, "low", 1.0)
  }

  private hasProperImports(code: string): boolean {
    const imports = code.match(/import\s+.*from\s+['"][^'"]*['"]/g) || []
    return imports.every((imp) => imp.includes("from") && (imp.includes("'") || imp.includes('"')))
  }

  private needsErrorHandling(code: string): boolean {
    return /\b(async|await|fetch|Promise|\.then|\.catch)\b/g.test(code)
  }

  private hasErrorHandling(code: string): boolean {
    return /\b(try|catch|\.catch|throw|error)\b/g.test(code)
  }

  private isTypeScript(code: string): boolean {
    return /\b(interface|type|enum|as\s+\w+|:\s*\w+|<\w+>)\b/g.test(code)
  }

  private hasProperTypes(code: string): boolean {
    // Check if functions have return types
    const functions = code.match(/function\s+\w+\s*$$[^)]*$$/g) || []
    const typedFunctions = code.match(/function\s+\w+\s*$$[^)]*$$\s*:\s*\w+/g) || []

    if (functions.length > 0 && typedFunctions.length === 0) {
      return false
    }

    // Check if variables have types when needed
    const complexAssignments = code.match(/const\s+\w+\s*=\s*\{/g) || []
    const typedAssignments = code.match(/const\s+\w+\s*:\s*\w+\s*=/g) || []

    return complexAssignments.length === 0 || typedAssignments.length > 0
  }
}
