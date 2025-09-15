"use client"

import { useState } from "react"
import { Copy, ThumbsUp, ThumbsDown, MoreHorizontal, Code, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { Message } from "@/lib/types"
import { CodeBlock } from "./code-block"

interface MessageProps {
  message: Message
  onEdit?: (messageId: string) => void
  onVote?: (messageId: string, isUpvote: boolean) => void
  onCopy?: (content: string) => void
  onCreateArtifact?: (messageId: string, content: string, language?: string) => void
}

export function ChatMessage({ message, onEdit, onVote, onCopy, onCreateArtifact }: MessageProps) {
  const [showReasoning, setShowReasoning] = useState(false)
  const [votedUp, setVotedUp] = useState(false)
  const [votedDown, setVotedDown] = useState(false)

  const isUser = message.role === "user"
  const isAssistant = message.role === "assistant"

  const handleVote = (isUpvote: boolean) => {
    if (isUpvote) {
      setVotedUp(!votedUp)
      setVotedDown(false)
    } else {
      setVotedDown(!votedDown)
      setVotedUp(false)
    }
    onVote?.(message.id, isUpvote)
  }

  const handleCopy = () => {
    const content = message.parts.map((part) => part.content).join("\n")
    onCopy?.(content)
  }

  const extractCodeBlocks = (content: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
    const blocks: { language: string; content: string }[] = []
    let match

    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        language: match[1] || "text",
        content: match[2],
      })
    }

    return blocks
  }

  const renderContent = (content: string) => {
    const codeBlocks = extractCodeBlocks(content)

    if (codeBlocks.length === 0) {
      return <div className="prose prose-sm max-w-none dark:prose-invert">{content}</div>
    }

    // Split content by code blocks and render each part
    const parts = content.split(/```(\w+)?\n([\s\S]*?)```/g)
    const rendered = []

    for (let i = 0; i < parts.length; i += 3) {
      const textPart = parts[i]
      const language = parts[i + 1]
      const codePart = parts[i + 2]

      if (textPart) {
        rendered.push(
          <div key={`text-${i}`} className="prose prose-sm max-w-none dark:prose-invert">
            {textPart}
          </div>,
        )
      }

      if (codePart) {
        rendered.push(
          <CodeBlock
            key={`code-${i}`}
            language={language || "text"}
            code={codePart}
            onCreateArtifact={() => onCreateArtifact?.(message.id, codePart, language)}
          />,
        )
      }
    }

    return rendered
  }

  return (
    <TooltipProvider>
      <div className={cn("flex gap-4 p-4", isUser ? "justify-end" : "justify-start")}>
        <div className={cn("flex flex-col gap-2 max-w-[80%]", isUser ? "items-end" : "items-start")}>
          {/* Message Header */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{isUser ? "You" : "Assistant"}</span>
            {message.modelUsed && (
              <>
                <Separator orientation="vertical" className="h-3" />
                <Badge variant="outline" className="text-xs">
                  {message.modelUsed}
                </Badge>
              </>
            )}
            {message.guardrailApplied && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                    Filtered
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Content was processed by guardrails</p>
                </TooltipContent>
              </Tooltip>
            )}
            <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
            {message.tokenCount > 0 && (
              <>
                <Separator orientation="vertical" className="h-3" />
                <span>{message.tokenCount} tokens</span>
              </>
            )}
            {message.cost > 0 && (
              <>
                <Separator orientation="vertical" className="h-3" />
                <span>${message.cost.toFixed(4)}</span>
              </>
            )}
          </div>

          {/* Message Content */}
          <Card className={cn("p-4", isUser ? "bg-primary text-primary-foreground" : "bg-card")}>
            <div className="space-y-3">
              {message.parts.map((part, index) => (
                <div key={index}>
                  {part.type === "text" && renderContent(part.content)}
                  {part.type === "image" && (
                    <img
                      src={part.content || "/placeholder.svg"}
                      alt="Uploaded image"
                      className="max-w-full h-auto rounded-md"
                    />
                  )}
                  {part.type === "file" && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                      <Code className="h-4 w-4" />
                      <span className="text-sm">{part.metadata?.name || "File"}</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Tool Calls */}
              {message.toolCalls.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">Tool Calls:</div>
                  {message.toolCalls.map((toolCall, index) => (
                    <div key={index} className="p-2 bg-muted rounded-md text-sm">
                      <div className="font-medium">{toolCall.function.name}</div>
                      <pre className="text-xs mt-1 overflow-x-auto">
                        {JSON.stringify(toolCall.function.arguments, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}

              {/* Reasoning */}
              {message.reasoning && (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReasoning(!showReasoning)}
                    className="h-auto p-1 text-xs"
                  >
                    {showReasoning ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                    {showReasoning ? "Hide" : "Show"} Reasoning
                  </Button>
                  {showReasoning && (
                    <div className="p-3 bg-muted/50 rounded-md text-sm">
                      <div className="font-medium text-muted-foreground mb-2">Model Reasoning:</div>
                      <div className="prose prose-sm max-w-none dark:prose-invert">{message.reasoning}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Message Actions */}
          {isAssistant && (
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 w-8 p-0">
                    <Copy className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Copy message</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(true)}
                    className={cn("h-8 w-8 p-0", votedUp && "text-green-600")}
                  >
                    <ThumbsUp className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upvote</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVote(false)}
                    className={cn("h-8 w-8 p-0", votedDown && "text-red-600")}
                  >
                    <ThumbsDown className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Downvote</p>
                </TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit?.(message.id)}>Edit message</DropdownMenuItem>
                  <DropdownMenuItem>Regenerate</DropdownMenuItem>
                  <DropdownMenuItem>Share</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
