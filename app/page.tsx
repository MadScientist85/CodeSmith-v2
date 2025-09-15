"use client"

import { useState } from "react"
import { ModelSelector } from "@/components/chat/model-selector"
import { ChatMessage } from "@/components/chat/message"
import { InputArea } from "@/components/chat/input-area"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, History, Share, Plus } from "lucide-react"
import type { Message } from "@/lib/types"

export default function ChatPage() {
  const [selectedModel, setSelectedModel] = useState("gpt-4o")
  const [messages, setMessages] = useState<Message[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      chatId: "current-chat",
      role: "user",
      parts: [{ type: "text", content }],
      attachments:
        attachments?.map((file) => ({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
        })) || [],
      createdAt: new Date(),
      tokenCount: Math.ceil(content.length / 4),
      toolCalls: [],
      toolResults: [],
      guardrailApplied: false,
      cost: 0,
    }

    setMessages((prev) => [...prev, userMessage])
    setIsGenerating(true)

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        chatId: "current-chat",
        role: "assistant",
        parts: [
          {
            type: "text",
            content: `I understand you're asking about: "${content}"\n\nHere's a comprehensive response with code example:\n\n\`\`\`typescript\nfunction handleUserQuery(query: string): string {\n  // Process the user's query\n  const processedQuery = query.toLowerCase().trim()\n  \n  // Generate appropriate response\n  return \`Processed: \${processedQuery}\`\n}\n\n// Example usage\nconst result = handleUserQuery("${content}")\nconsole.log(result)\n\`\`\`\n\nThis implementation provides a complete solution with proper error handling and TypeScript types.`,
          },
        ],
        attachments: [],
        createdAt: new Date(),
        tokenCount: 150,
        modelUsed: selectedModel,
        toolCalls: [],
        toolResults: [],
        guardrailApplied: false,
        cost: 0.002,
        responseTimeMs: 1500,
      }

      setMessages((prev) => [...prev, assistantMessage])
      setIsGenerating(false)
    }, 2000)
  }

  const handleStopGeneration = () => {
    setIsGenerating(false)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r bg-sidebar flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Enhanced AI Chat</h1>
            <Button variant="ghost" size="sm">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
        </div>

        <div className="flex-1 p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Recent Chats</h3>
              <Button variant="ghost" size="sm">
                <History className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              <Card className="p-3 cursor-pointer hover:bg-accent/50">
                <div className="text-sm font-medium truncate">Building a React component</div>
                <div className="text-xs text-muted-foreground">2 hours ago</div>
              </Card>
              <Card className="p-3 cursor-pointer hover:bg-accent/50">
                <div className="text-sm font-medium truncate">Database optimization query</div>
                <div className="text-xs text-muted-foreground">Yesterday</div>
              </Card>
            </div>
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="ghost" size="sm">
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">New Chat</h2>
              <Badge variant="outline">{selectedModel}</Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{messages.length} messages</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{messages.reduce((acc, msg) => acc + msg.tokenCount, 0).toLocaleString()} tokens</span>
              <Separator orientation="vertical" className="h-4" />
              <span>${messages.reduce((acc, msg) => acc + msg.cost, 0).toFixed(4)} cost</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full p-8">
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-semibold">Welcome to Enhanced AI Chat</h3>
                  <p className="text-muted-foreground max-w-md">
                    Start a conversation with any of our 40+ AI models. Each response is guaranteed to be complete,
                    correct, and production-ready.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Badge variant="secondary">Universal Guardrails</Badge>
                    <Badge variant="secondary">Code Completeness</Badge>
                    <Badge variant="secondary">Multi-Provider</Badge>
                    <Badge variant="secondary">Real-time Streaming</Badge>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onCopy={(content) => navigator.clipboard.writeText(content)}
                    onVote={(messageId, isUpvote) => console.log("Vote:", messageId, isUpvote)}
                  />
                ))}
                {isGenerating && (
                  <div className="flex gap-4 p-4">
                    <div className="flex flex-col gap-2 max-w-[80%]">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium">Assistant</span>
                        <Badge variant="outline" className="text-xs">
                          {selectedModel}
                        </Badge>
                        <span>Generating...</span>
                      </div>
                      <Card className="p-4 bg-card">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-75" />
                          <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150" />
                        </div>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <InputArea
          onSendMessage={handleSendMessage}
          onStopGeneration={handleStopGeneration}
          isGenerating={isGenerating}
          placeholder="Ask anything... I'll provide complete, production-ready responses."
        />
      </div>
    </div>
  )
}
