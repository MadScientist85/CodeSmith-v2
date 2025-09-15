"use client"

import { useState } from "react"
import { Copy, Download, ExternalLink, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface CodeBlockProps {
  language: string
  code: string
  onCreateArtifact?: () => void
  className?: string
}

export function CodeBlock({ language, code, onCreateArtifact, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const extension = getFileExtension(language)
    const blob = new Blob([code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `code.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getFileExtension = (lang: string): string => {
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
      scala: "scala",
      html: "html",
      css: "css",
      scss: "scss",
      sass: "sass",
      json: "json",
      xml: "xml",
      yaml: "yml",
      markdown: "md",
      sql: "sql",
      bash: "sh",
      shell: "sh",
      powershell: "ps1",
    }
    return extensions[lang.toLowerCase()] || "txt"
  }

  const getLanguageColor = (lang: string): string => {
    const colors: Record<string, string> = {
      javascript: "bg-yellow-100 text-yellow-800",
      typescript: "bg-blue-100 text-blue-800",
      python: "bg-green-100 text-green-800",
      java: "bg-red-100 text-red-800",
      cpp: "bg-purple-100 text-purple-800",
      html: "bg-orange-100 text-orange-800",
      css: "bg-pink-100 text-pink-800",
      json: "bg-gray-100 text-gray-800",
      sql: "bg-indigo-100 text-indigo-800",
      bash: "bg-slate-100 text-slate-800",
    }
    return colors[lang.toLowerCase()] || "bg-gray-100 text-gray-800"
  }

  return (
    <TooltipProvider>
      <div className={cn("relative group", className)}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 bg-muted border-b">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={cn("text-xs", getLanguageColor(language))}>
              {language}
            </Badge>
            <span className="text-xs text-muted-foreground">{code.split("\n").length} lines</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleCopy} className="h-8 w-8 p-0">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied ? "Copied!" : "Copy code"}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleDownload} className="h-8 w-8 p-0">
                  <Download className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Download file</p>
              </TooltipContent>
            </Tooltip>

            {onCreateArtifact && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={onCreateArtifact} className="h-8 w-8 p-0">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create artifact</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Code Content */}
        <div className="relative">
          <pre className="p-4 bg-card text-card-foreground overflow-x-auto text-sm leading-relaxed">
            <code className={`language-${language}`}>{code}</code>
          </pre>
        </div>
      </div>
    </TooltipProvider>
  )
}
