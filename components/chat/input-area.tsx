"use client"

import type React from "react"

import { useState, useRef, type KeyboardEvent } from "react"
import { Send, Paperclip, Mic, Square, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface InputAreaProps {
  onSendMessage: (content: string, attachments?: File[]) => void
  onStopGeneration?: () => void
  isGenerating?: boolean
  disabled?: boolean
  placeholder?: string
  maxTokens?: number
}

export function InputArea({
  onSendMessage,
  onStopGeneration,
  isGenerating = false,
  disabled = false,
  placeholder = "Type your message...",
  maxTokens = 4000,
}: InputAreaProps) {
  const [input, setInput] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const estimatedTokens = Math.ceil(input.length / 4) // Rough estimation
  const tokenProgress = (estimatedTokens / maxTokens) * 100

  const handleSubmit = () => {
    if (!input.trim() && attachments.length === 0) return
    if (disabled || isGenerating) return

    onSendMessage(input.trim(), attachments)
    setInput("")
    setAttachments([])
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setAttachments((prev) => [...prev, ...files])
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleVoiceToggle = () => {
    setIsRecording(!isRecording)
    // Voice recording implementation would go here
  }

  const getTokenColor = () => {
    if (tokenProgress < 70) return "bg-green-500"
    if (tokenProgress < 90) return "bg-yellow-500"
    return "bg-red-500"
  }

  return (
    <TooltipProvider>
      <div className="border-t bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="flex items-center gap-1 px-2 py-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeAttachment(index)}
                >
                  <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                  <span className="text-xs">×</span>
                </Badge>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              className="min-h-[60px] max-h-[200px] resize-none pr-32 text-base leading-relaxed"
              rows={1}
            />

            {/* Action Buttons */}
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt,.md"
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="h-8 w-8 p-0"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach files</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleVoiceToggle}
                    disabled={disabled}
                    className={cn("h-8 w-8 p-0", isRecording && "text-red-500")}
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isRecording ? "Stop recording" : "Voice input"}</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={disabled} className="h-8 w-8 p-0">
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Input settings</p>
                </TooltipContent>
              </Tooltip>

              {isGenerating ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="destructive" size="sm" onClick={onStopGeneration} className="h-8 w-8 p-0">
                      <Square className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Stop generation</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleSubmit}
                      disabled={disabled || (!input.trim() && attachments.length === 0)}
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Send message (Enter)</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Token Counter */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>
                {estimatedTokens.toLocaleString()} / {maxTokens.toLocaleString()} tokens
              </span>
              <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                <div className={cn("h-full transition-all", getTokenColor())} style={{ width: `${tokenProgress}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span>Shift + Enter for new line</span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
