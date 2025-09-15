"use client"

import { useState } from "react"
import { Check, ChevronDown, Zap, Eye, Wrench, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { modelConfigs, type ModelConfig } from "@/lib/config/models"
import { cn } from "@/lib/utils"

interface ModelSelectorProps {
  selectedModel: string
  onModelChange: (modelId: string) => void
  disabled?: boolean
}

export function ModelSelector({ selectedModel, onModelChange, disabled = false }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedConfig = modelConfigs[selectedModel]
  const groupedModels = Object.values(modelConfigs).reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = []
      }
      acc[model.provider].push(model)
      return acc
    },
    {} as Record<string, ModelConfig[]>,
  )

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId)
    setOpen(false)
  }

  const getGuardrailColor = (strength: string) => {
    switch (strength) {
      case "high":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPricingTierColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "standard":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
      case "premium":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  return (
    <TooltipProvider>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-card hover:bg-accent/10 border-border"
            disabled={disabled}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", getGuardrailColor(selectedConfig?.guardrailStrength))} />
                <Badge variant="secondary" className="text-xs font-medium">
                  {selectedConfig?.provider.toUpperCase()}
                </Badge>
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span className="font-medium text-sm truncate">{selectedConfig?.name}</span>
                <span className="text-xs text-muted-foreground truncate">{selectedConfig?.description}</span>
              </div>
            </div>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search models..." className="h-9" />
            <CommandList className="max-h-[400px]">
              <CommandEmpty>No models found.</CommandEmpty>
              {Object.entries(groupedModels).map(([provider, models]) => (
                <CommandGroup key={provider} heading={provider.toUpperCase()}>
                  {models.map((model) => (
                    <CommandItem
                      key={model.id}
                      value={model.id}
                      onSelect={() => handleModelSelect(model.id)}
                      className="flex items-center justify-between p-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-2 h-2 rounded-full", getGuardrailColor(model.guardrailStrength))} />
                          <Check className={cn("h-4 w-4", selectedModel === model.id ? "opacity-100" : "opacity-0")} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{model.name}</span>
                            <Badge className={cn("text-xs", getPricingTierColor(model.pricing.tier))}>
                              {model.pricing.tier}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground truncate">{model.description}</span>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Tooltip>
                                <TooltipTrigger>
                                  <span>{(model.contextWindow / 1000).toFixed(0)}K context</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Context window: {model.contextWindow.toLocaleString()} tokens</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <div className="flex items-center gap-1">
                              {model.supportsVision && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Eye className="h-3 w-3 text-blue-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Supports vision/image input</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {model.supportsFunctions && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Wrench className="h-3 w-3 text-green-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Supports function calling</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {model.supportsStreaming && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Zap className="h-3 w-3 text-yellow-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Supports streaming</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-3">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span>${model.pricing.inputTokens.toFixed(4)}</span>
                        </div>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className={cn("w-2 h-2 rounded-full", getGuardrailColor(model.guardrailStrength))} />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Guardrail strength: {model.guardrailStrength}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  )
}
