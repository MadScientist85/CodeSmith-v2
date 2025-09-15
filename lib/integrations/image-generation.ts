// Image Generation Integration Service
export interface ImageGenerationRequest {
  prompt: string
  model?: string
  width?: number
  height?: number
  steps?: number
  guidance?: number
  seed?: number
  negativePrompt?: string
  style?: string
  format?: "png" | "jpg" | "webp"
}

export interface ImageGenerationResult {
  id: string
  url: string
  width: number
  height: number
  seed: number
  model: string
  prompt: string
  generationTime: number
  cost: number
}

export class ImageGenerationService {
  private falApiKey: string
  private replicateApiKey: string

  constructor(falApiKey: string, replicateApiKey: string) {
    this.falApiKey = falApiKey
    this.replicateApiKey = replicateApiKey
  }

  async generateWithFal(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const startTime = Date.now()

    try {
      const response = await fetch("https://fal.run/fal-ai/flux-pro", {
        method: "POST",
        headers: {
          Authorization: `Key ${this.falApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: request.prompt,
          image_size: `${request.width || 1024}x${request.height || 1024}`,
          num_inference_steps: request.steps || 28,
          guidance_scale: request.guidance || 3.5,
          seed: request.seed,
          enable_safety_checker: true,
        }),
      })

      if (!response.ok) {
        throw new Error(`FAL API error: ${response.statusText}`)
      }

      const data = await response.json()
      const generationTime = Date.now() - startTime

      return {
        id: crypto.randomUUID(),
        url: data.images[0].url,
        width: data.images[0].width,
        height: data.images[0].height,
        seed: data.seed,
        model: "flux-pro",
        prompt: request.prompt,
        generationTime,
        cost: 0.05, // Estimated cost
      }
    } catch (error) {
      console.error("FAL image generation failed:", error)
      throw error
    }
  }

  async generateWithReplicate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const startTime = Date.now()

    try {
      const response = await fetch("https://api.replicate.com/v1/predictions", {
        method: "POST",
        headers: {
          Authorization: `Token ${this.replicateApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e45", // SDXL
          input: {
            prompt: request.prompt,
            negative_prompt: request.negativePrompt || "",
            width: request.width || 1024,
            height: request.height || 1024,
            num_inference_steps: request.steps || 50,
            guidance_scale: request.guidance || 7.5,
            seed: request.seed,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Replicate API error: ${response.statusText}`)
      }

      const prediction = await response.json()

      // Poll for completion
      let result = prediction
      while (result.status === "starting" || result.status === "processing") {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
          headers: {
            Authorization: `Token ${this.replicateApiKey}`,
          },
        })

        result = await pollResponse.json()
      }

      if (result.status === "failed") {
        throw new Error(`Image generation failed: ${result.error}`)
      }

      const generationTime = Date.now() - startTime

      return {
        id: result.id,
        url: result.output[0],
        width: request.width || 1024,
        height: request.height || 1024,
        seed: request.seed || 0,
        model: "sdxl",
        prompt: request.prompt,
        generationTime,
        cost: 0.02, // Estimated cost
      }
    } catch (error) {
      console.error("Replicate image generation failed:", error)
      throw error
    }
  }

  async generateImage(
    request: ImageGenerationRequest,
    provider: "fal" | "replicate" = "fal",
  ): Promise<ImageGenerationResult> {
    switch (provider) {
      case "fal":
        return this.generateWithFal(request)
      case "replicate":
        return this.generateWithReplicate(request)
      default:
        throw new Error(`Unknown provider: ${provider}`)
    }
  }

  async enhancePrompt(prompt: string): Promise<string> {
    // Simple prompt enhancement
    const enhancements = ["high quality", "detailed", "professional", "8k resolution", "masterpiece"]

    const hasEnhancements = enhancements.some((enhancement) => prompt.toLowerCase().includes(enhancement.toLowerCase()))

    if (!hasEnhancements) {
      return `${prompt}, high quality, detailed, professional`
    }

    return prompt
  }

  async generateVariations(originalRequest: ImageGenerationRequest, count = 3): Promise<ImageGenerationResult[]> {
    const variations: Promise<ImageGenerationResult>[] = []

    for (let i = 0; i < count; i++) {
      const variationRequest = {
        ...originalRequest,
        seed: originalRequest.seed ? originalRequest.seed + i : undefined,
      }
      variations.push(this.generateImage(variationRequest))
    }

    return Promise.all(variations)
  }
}

// Global image generation service
export const imageGenerationService = new ImageGenerationService(
  process.env.FAL_KEY || "",
  process.env.REPLICATE_API_TOKEN || "",
)
