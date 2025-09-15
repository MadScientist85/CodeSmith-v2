// Artifacts Management System
import { db, artifacts } from "@/lib/database/connection"
import { eq, desc } from "drizzle-orm"
import type { Artifact } from "@/lib/types"

export interface ArtifactCreateRequest {
  chatId: string
  messageId: string
  type: "code" | "image" | "document" | "data" | "chart"
  content: string
  language?: string
  metadata?: Record<string, any>
}

export interface ArtifactUpdateRequest {
  content?: string
  language?: string
  metadata?: Record<string, any>
}

export class ArtifactsManager {
  async createArtifact(request: ArtifactCreateRequest): Promise<Artifact> {
    try {
      const [artifact] = await db
        .insert(artifacts)
        .values({
          chatId: request.chatId,
          messageId: request.messageId,
          type: request.type,
          content: request.content,
          language: request.language,
          metadata: request.metadata || {},
        })
        .returning()

      return this.mapToArtifact(artifact)
    } catch (error) {
      console.error("Failed to create artifact:", error)
      throw error
    }
  }

  async updateArtifact(id: string, updates: ArtifactUpdateRequest): Promise<Artifact> {
    try {
      const [artifact] = await db
        .update(artifacts)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(artifacts.id, id))
        .returning()

      if (!artifact) {
        throw new Error("Artifact not found")
      }

      return this.mapToArtifact(artifact)
    } catch (error) {
      console.error("Failed to update artifact:", error)
      throw error
    }
  }

  async getArtifact(id: string): Promise<Artifact | null> {
    try {
      const [artifact] = await db.select().from(artifacts).where(eq(artifacts.id, id)).limit(1)

      return artifact ? this.mapToArtifact(artifact) : null
    } catch (error) {
      console.error("Failed to get artifact:", error)
      throw error
    }
  }

  async getArtifactsByChat(chatId: string): Promise<Artifact[]> {
    try {
      const chatArtifacts = await db
        .select()
        .from(artifacts)
        .where(eq(artifacts.chatId, chatId))
        .orderBy(desc(artifacts.createdAt))

      return chatArtifacts.map(this.mapToArtifact)
    } catch (error) {
      console.error("Failed to get chat artifacts:", error)
      throw error
    }
  }

  async getArtifactsByMessage(messageId: string): Promise<Artifact[]> {
    try {
      const messageArtifacts = await db
        .select()
        .from(artifacts)
        .where(eq(artifacts.messageId, messageId))
        .orderBy(desc(artifacts.createdAt))

      return messageArtifacts.map(this.mapToArtifact)
    } catch (error) {
      console.error("Failed to get message artifacts:", error)
      throw error
    }
  }

  async deleteArtifact(id: string): Promise<void> {
    try {
      await db.delete(artifacts).where(eq(artifacts.id, id))
    } catch (error) {
      console.error("Failed to delete artifact:", error)
      throw error
    }
  }

  async createCodeArtifact(
    chatId: string,
    messageId: string,
    code: string,
    language: string,
    metadata?: Record<string, any>,
  ): Promise<Artifact> {
    return this.createArtifact({
      chatId,
      messageId,
      type: "code",
      content: code,
      language,
      metadata: {
        ...metadata,
        lineCount: code.split("\n").length,
        characterCount: code.length,
      },
    })
  }

  async createImageArtifact(
    chatId: string,
    messageId: string,
    imageUrl: string,
    metadata?: Record<string, any>,
  ): Promise<Artifact> {
    return this.createArtifact({
      chatId,
      messageId,
      type: "image",
      content: imageUrl,
      metadata: {
        ...metadata,
        url: imageUrl,
      },
    })
  }

  async createDocumentArtifact(
    chatId: string,
    messageId: string,
    content: string,
    format: "markdown" | "html" | "text" = "markdown",
    metadata?: Record<string, any>,
  ): Promise<Artifact> {
    return this.createArtifact({
      chatId,
      messageId,
      type: "document",
      content,
      language: format,
      metadata: {
        ...metadata,
        format,
        wordCount: content.split(/\s+/).length,
      },
    })
  }

  async exportArtifact(id: string, format: "file" | "gist" | "codesandbox" = "file"): Promise<string> {
    const artifact = await this.getArtifact(id)
    if (!artifact) {
      throw new Error("Artifact not found")
    }

    switch (format) {
      case "file":
        return this.exportAsFile(artifact)
      case "gist":
        return this.exportAsGist(artifact)
      case "codesandbox":
        return this.exportAsCodeSandbox(artifact)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  private exportAsFile(artifact: Artifact): string {
    const extension = this.getFileExtension(artifact.language || "txt")
    const filename = `artifact-${artifact.id}.${extension}`

    // Create blob URL for download
    const blob = new Blob([artifact.content], { type: "text/plain" })
    return URL.createObjectURL(blob)
  }

  private async exportAsGist(artifact: Artifact): Promise<string> {
    // GitHub Gist creation would require GitHub API integration
    // This is a placeholder implementation
    const gistData = {
      description: `Artifact from Enhanced AI Chat - ${artifact.type}`,
      public: false,
      files: {
        [`artifact.${this.getFileExtension(artifact.language || "txt")}`]: {
          content: artifact.content,
        },
      },
    }

    // Would make API call to GitHub here
    console.log("Would create gist:", gistData)
    return "https://gist.github.com/placeholder"
  }

  private async exportAsCodeSandbox(artifact: Artifact): Promise<string> {
    // CodeSandbox API integration would go here
    // This is a placeholder implementation
    const sandboxConfig = {
      files: {
        [`index.${this.getFileExtension(artifact.language || "js")}`]: {
          content: artifact.content,
        },
        "package.json": {
          content: JSON.stringify({
            name: "enhanced-ai-artifact",
            version: "1.0.0",
            description: "Generated from Enhanced AI Chat",
            main: "index.js",
          }),
        },
      },
    }

    console.log("Would create CodeSandbox:", sandboxConfig)
    return "https://codesandbox.io/s/placeholder"
  }

  private getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      cpp: "cpp",
      c: "c",
      csharp: "cs",
      php: "php",
      ruby: "rb",
      go: "go",
      rust: "rs",
      swift: "swift",
      kotlin: "kt",
      html: "html",
      css: "css",
      scss: "scss",
      json: "json",
      xml: "xml",
      yaml: "yml",
      markdown: "md",
      sql: "sql",
      bash: "sh",
    }
    return extensions[language.toLowerCase()] || "txt"
  }

  private mapToArtifact(dbArtifact: any): Artifact {
    return {
      id: dbArtifact.id,
      chatId: dbArtifact.chatId,
      messageId: dbArtifact.messageId,
      type: dbArtifact.type,
      content: dbArtifact.content,
      language: dbArtifact.language,
      version: dbArtifact.version,
      createdAt: dbArtifact.createdAt,
      updatedAt: dbArtifact.updatedAt,
      metadata: dbArtifact.metadata || {},
      filePath: dbArtifact.filePath,
      fileSize: dbArtifact.fileSize,
      mimeType: dbArtifact.mimeType,
    }
  }
}

// Global artifacts manager
export const artifactsManager = new ArtifactsManager()
