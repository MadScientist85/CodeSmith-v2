// Groq Provider Implementation
import { BaseAIProvider, type AIResponse, type AIStreamChunk, type ChatRequest } from "./base"

export class GroqProvider extends BaseAIProvider {
  name = "groq"
  models = ["llama-3.1-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", "gemma-7b-it"]

  private baseURL = "https://api.groq.com/openai/v1"

  async generateText(request: ChatRequest): Promise<AIResponse> {
    const startTime = Date.now()

    try {
      const messages = request.messages.map((msg) => ({
        role: msg.role,
        content: msg.parts.map((part) => part.content).join("\n"),
      }))

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: request.modelId,
          messages: [...(request.systemPrompt ? [{ role: "system", content: request.systemPrompt }] : []), ...messages],
          temperature: request.params?.temperature ?? 0.7,
          max_tokens: request.params?.maxTokens ?? 2000,
          top_p: request.params?.topP ?? 1,
          frequency_penalty: request.params?.frequencyPenalty ?? 0,
          presence_penalty: request.params?.presencePenalty ?? 0,
          stream: false,
        }),
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`)
      }

      const data = await response.json()
      const responseTime = Date.now() - startTime

      this.updateUsage(data.usage.prompt_tokens, data.usage.completion_tokens)

      return {
        content: data.choices[0].message.content,
        usage: {
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        model: request.modelId,
        finishReason: data.choices[0].finish_reason,
        responseTime,
      }
    } catch (error) {
      this.updateUsage(0, 0, true)
      throw error
    }
  }

  async *streamText(request: ChatRequest): AsyncIterable<AIStreamChunk> {
    try {
      const messages = request.messages.map((msg) => ({
        role: msg.role,
        content: msg.parts.map((part) => part.content).join("\n"),
      }))

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: request.modelId,
          messages: [...(request.systemPrompt ? [{ role: "system", content: request.systemPrompt }] : []), ...messages],
          temperature: request.params?.temperature ?? 0.7,
          max_tokens: request.params?.maxTokens ?? 2000,
          top_p: request.params?.topP ?? 1,
          frequency_penalty: request.params?.frequencyPenalty ?? 0,
          presence_penalty: request.params?.presencePenalty ?? 0,
          stream: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let totalInputTokens = 0
      let totalOutputTokens = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter((line) => line.trim())

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") {
              yield {
                type: "done",
                usage: {
                  inputTokens: totalInputTokens,
                  outputTokens: totalOutputTokens,
                },
              }
              return
            }

            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta?.content

              if (delta) {
                yield {
                  type: "text",
                  delta,
                }
                totalOutputTokens += 1 // Approximate token counting
              }

              if (parsed.usage) {
                totalInputTokens = parsed.usage.prompt_tokens
                totalOutputTokens = parsed.usage.completion_tokens
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      this.updateUsage(totalInputTokens, totalOutputTokens)
    } catch (error) {
      this.updateUsage(0, 0, true)
      yield {
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
