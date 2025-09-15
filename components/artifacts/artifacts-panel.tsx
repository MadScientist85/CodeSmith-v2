"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Code, ImageIcon, FileText, BarChart, Download, ExternalLink, Copy, Trash2, Pin, PinOff } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Artifact } from "@/lib/types"

interface ArtifactsPanelProps {
  chatId: string
  artifacts: Artifact[]
  onArtifactSelect?: (artifact: Artifact) => void
  onArtifactDelete?: (artifactId: string) => void
  onArtifactExport?: (artifactId: string, format: string) => void
  className?: string
}

export function ArtifactsPanel({
  chatId,
  artifacts,
  onArtifactSelect,
  onArtifactDelete,
  onArtifactExport,
  className,
}: ArtifactsPanelProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null)
  const [pinnedArtifacts, setPinnedArtifacts] = useState<Set<string>>(new Set())

  const groupedArtifacts = artifacts.reduce(
    (acc, artifact) => {
      if (!acc[artifact.type]) {
        acc[artifact.type] = []
      }
      acc[artifact.type].push(artifact)
      return acc
    },
    {} as Record<string, Artifact[]>,
  )

  const getArtifactIcon = (type: string) => {
    switch (type) {
      case "code":
        return Code
      case "image":
        return ImageIcon
      case "document":
        return FileText
      case "chart":
        return BarChart
      default:
        return FileText
    }
  }

  const getArtifactColor = (type: string) => {
    switch (type) {
      case "code":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "image":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "document":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "chart":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  const handleArtifactClick = (artifact: Artifact) => {
    setSelectedArtifact(artifact)
    onArtifactSelect?.(artifact)
  }

  const handlePin = (artifactId: string) => {
    setPinnedArtifacts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(artifactId)) {
        newSet.delete(artifactId)
      } else {
        newSet.add(artifactId)
      }
      return newSet
    })
  }

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content)
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size"
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  if (artifacts.length === 0) {
    return (
      <Card className={cn("w-80 h-full", className)}>
        <CardHeader>
          <CardTitle className="text-lg">Artifacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No artifacts yet</p>
            <p className="text-sm">Code and files will appear here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card className={cn("w-80 h-full flex flex-col", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            Artifacts
            <Badge variant="secondary">{artifacts.length}</Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <Tabs defaultValue="all" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 mx-4">
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="code" className="text-xs">
                Code
              </TabsTrigger>
              <TabsTrigger value="image" className="text-xs">
                Images
              </TabsTrigger>
              <TabsTrigger value="document" className="text-xs">
                Docs
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="all" className="h-full mt-0">
                <ScrollArea className="h-full px-4">
                  <div className="space-y-3 pb-4">
                    {/* Pinned Artifacts */}
                    {Array.from(pinnedArtifacts).length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Pin className="h-3 w-3" />
                          <span className="text-xs font-medium text-muted-foreground">Pinned</span>
                        </div>
                        {artifacts
                          .filter((artifact) => pinnedArtifacts.has(artifact.id))
                          .map((artifact) => (
                            <ArtifactCard
                              key={artifact.id}
                              artifact={artifact}
                              isPinned={true}
                              isSelected={selectedArtifact?.id === artifact.id}
                              onSelect={() => handleArtifactClick(artifact)}
                              onPin={() => handlePin(artifact.id)}
                              onCopy={() => handleCopy(artifact.content)}
                              onDelete={() => onArtifactDelete?.(artifact.id)}
                              onExport={(format) => onArtifactExport?.(artifact.id, format)}
                            />
                          ))}
                        <Separator className="my-3" />
                      </div>
                    )}

                    {/* All Artifacts */}
                    {Object.entries(groupedArtifacts).map(([type, typeArtifacts]) => (
                      <div key={type}>
                        <div className="flex items-center gap-2 mb-2">
                          {(() => {
                            const Icon = getArtifactIcon(type)
                            return <Icon className="h-3 w-3" />
                          })()}
                          <span className="text-xs font-medium text-muted-foreground capitalize">
                            {type} ({typeArtifacts.length})
                          </span>
                        </div>
                        {typeArtifacts
                          .filter((artifact) => !pinnedArtifacts.has(artifact.id))
                          .map((artifact) => (
                            <ArtifactCard
                              key={artifact.id}
                              artifact={artifact}
                              isPinned={false}
                              isSelected={selectedArtifact?.id === artifact.id}
                              onSelect={() => handleArtifactClick(artifact)}
                              onPin={() => handlePin(artifact.id)}
                              onCopy={() => handleCopy(artifact.content)}
                              onDelete={() => onArtifactDelete?.(artifact.id)}
                              onExport={(format) => onArtifactExport?.(artifact.id, format)}
                            />
                          ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              {Object.keys(groupedArtifacts).map((type) => (
                <TabsContent key={type} value={type} className="h-full mt-0">
                  <ScrollArea className="h-full px-4">
                    <div className="space-y-2 pb-4">
                      {groupedArtifacts[type]?.map((artifact) => (
                        <ArtifactCard
                          key={artifact.id}
                          artifact={artifact}
                          isPinned={pinnedArtifacts.has(artifact.id)}
                          isSelected={selectedArtifact?.id === artifact.id}
                          onSelect={() => handleArtifactClick(artifact)}
                          onPin={() => handlePin(artifact.id)}
                          onCopy={() => handleCopy(artifact.content)}
                          onDelete={() => onArtifactDelete?.(artifact.id)}
                          onExport={(format) => onArtifactExport?.(artifact.id, format)}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

interface ArtifactCardProps {
  artifact: Artifact
  isPinned: boolean
  isSelected: boolean
  onSelect: () => void
  onPin: () => void
  onCopy: () => void
  onDelete: () => void
  onExport: (format: string) => void
}

function ArtifactCard({
  artifact,
  isPinned,
  isSelected,
  onSelect,
  onPin,
  onCopy,
  onDelete,
  onExport,
}: ArtifactCardProps) {
  const Icon = (() => {
    switch (artifact.type) {
      case "code":
        return Code
      case "image":
        return ImageIcon
      case "document":
        return FileText
      case "chart":
        return BarChart
      default:
        return FileText
    }
  })()

  const getArtifactColor = (type: string) => {
    switch (type) {
      case "code":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "image":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "document":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      case "chart":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <Card
      className={cn("p-3 cursor-pointer transition-colors hover:bg-accent/50", isSelected && "ring-2 ring-primary")}
      onClick={onSelect}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Icon className="h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-xs", getArtifactColor(artifact.type))}>{artifact.type}</Badge>
                {artifact.language && (
                  <Badge variant="outline" className="text-xs">
                    {artifact.language}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(artifact.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPin()
                  }}
                  className="h-6 w-6 p-0"
                >
                  {isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPinned ? "Unpin" : "Pin"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {artifact.metadata?.lineCount && `${artifact.metadata.lineCount} lines`}
          {artifact.metadata?.wordCount && `${artifact.metadata.wordCount} words`}
          {artifact.fileSize && ` • ${formatFileSize(artifact.fileSize)}`}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onCopy()
                }}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onExport("file")
                }}
                className="h-6 w-6 p-0"
              >
                <Download className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onExport("gist")
                }}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="h-6 w-6 p-0 text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </Card>
  )
}

function formatFileSize(bytes: number): string {
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}
