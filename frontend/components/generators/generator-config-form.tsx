"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { EpsilonBadge } from "@/components/ui/epsilon-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HelpCircle, Shield, Zap, AlertTriangle, CheckCircle2 } from "lucide-react"
import type { ModelType } from "@/lib/types"

interface GeneratorConfigFormProps {
  datasetId: string
  datasetRowCount?: number
  onSubmit: (config: GeneratorConfig) => void
  isSubmitting?: boolean
  className?: string
}

export interface GeneratorConfig {
  name: string
  model_type: ModelType
  num_rows: number
  epochs: number
  batch_size: number
  use_differential_privacy: boolean
  target_epsilon: number
  target_delta: number
  max_grad_norm: number
}

const MODEL_OPTIONS: { value: ModelType; label: string; description: string; dpSupport: boolean }[] = [
  {
    value: "ctgan",
    label: "CTGAN",
    description: "Conditional Tabular GAN - Best for mixed data types",
    dpSupport: false,
  },
  { value: "tvae", label: "TVAE", description: "Tabular VAE - Good for continuous data", dpSupport: false },
  { value: "dp-ctgan", label: "DP-CTGAN", description: "CTGAN with differential privacy", dpSupport: true },
  { value: "dp-tvae", label: "DP-TVAE", description: "TVAE with differential privacy", dpSupport: true },
  { value: "timegan", label: "TimeGAN", description: "For time-series data generation", dpSupport: false },
]

export function GeneratorConfigForm({
  datasetId,
  datasetRowCount = 10000,
  onSubmit,
  isSubmitting,
  className,
}: GeneratorConfigFormProps) {
  const [config, setConfig] = React.useState<GeneratorConfig>({
    name: "",
    model_type: "ctgan",
    num_rows: datasetRowCount,
    epochs: 300,
    batch_size: 500,
    use_differential_privacy: false,
    target_epsilon: 10.0,
    target_delta: 1 / datasetRowCount,
    max_grad_norm: 1.0,
  })

  const [validation, setValidation] = React.useState<{
    valid: boolean
    warnings: string[]
    utilityEstimate?: string
  }>({ valid: true, warnings: [] })

  const selectedModel = MODEL_OPTIONS.find((m) => m.value === config.model_type)
  const isDpModel = selectedModel?.dpSupport || false

  // Auto-switch to DP model when DP is enabled
  React.useEffect(() => {
    if (config.use_differential_privacy && !isDpModel) {
      setConfig((prev) => ({ ...prev, model_type: "dp-ctgan" }))
    }
  }, [config.use_differential_privacy, isDpModel])

  // Validate DP configuration
  React.useEffect(() => {
    if (config.use_differential_privacy) {
      const warnings: string[] = []
      let valid = true

      if (config.target_epsilon < 1) {
        warnings.push("Very low epsilon may significantly reduce data utility")
      }
      if (config.target_epsilon > 50) {
        warnings.push("High epsilon provides weaker privacy guarantees")
      }
      if (config.target_delta > 1 / datasetRowCount) {
        warnings.push("Delta should be less than 1/n for strong privacy")
        valid = false
      }

      const utilityEstimate = config.target_epsilon <= 1 ? "low" : config.target_epsilon <= 10 ? "high" : "very high"

      setValidation({ valid, warnings, utilityEstimate })
    } else {
      setValidation({ valid: true, warnings: [] })
    }
  }, [config.use_differential_privacy, config.target_epsilon, config.target_delta, datasetRowCount])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!config.name.trim()) return
    onSubmit(config)
  }

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-6">
        {/* Basic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Generator Configuration
            </CardTitle>
            <CardDescription>Configure your synthetic data generator</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Generator Name</Label>
              <Input
                id="name"
                placeholder="e.g., Patient Records Generator"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model_type">Model Type</Label>
              <Select
                value={config.model_type}
                onValueChange={(value: ModelType) => setConfig({ ...config, model_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex items-center gap-2">
                        <span>{model.label}</span>
                        {model.dpSupport && <Shield className="h-3 w-3 text-success" />}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{selectedModel?.description}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="num_rows" className="flex items-center gap-1">
                  Rows to Generate
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>Number of synthetic rows to create</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="num_rows"
                  type="number"
                  min={100}
                  max={1000000}
                  value={config.num_rows}
                  onChange={(e) => setConfig({ ...config, num_rows: Number.parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="epochs">Training Epochs</Label>
                <Input
                  id="epochs"
                  type="number"
                  min={10}
                  max={2000}
                  value={config.epochs}
                  onChange={(e) => setConfig({ ...config, epochs: Number.parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch_size">Batch Size</Label>
                <Input
                  id="batch_size"
                  type="number"
                  min={32}
                  max={2048}
                  value={config.batch_size}
                  onChange={(e) => setConfig({ ...config, batch_size: Number.parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Differential Privacy Configuration */}
        <Card className={cn(config.use_differential_privacy && "border-success/30")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield
                  className={cn("h-5 w-5", config.use_differential_privacy ? "text-success" : "text-muted-foreground")}
                />
                <div>
                  <CardTitle>Differential Privacy</CardTitle>
                  <CardDescription>Add mathematical privacy guarantees</CardDescription>
                </div>
              </div>
              <Switch
                checked={config.use_differential_privacy}
                onCheckedChange={(checked) => setConfig({ ...config, use_differential_privacy: checked })}
              />
            </div>
          </CardHeader>

          {config.use_differential_privacy && (
            <CardContent className="space-y-6">
              {/* Epsilon Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1">
                    Privacy Budget (ε)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          Lower epsilon = stronger privacy, but lower data utility. Recommended: 1-10 for most use
                          cases.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <EpsilonBadge epsilon={config.target_epsilon} size="sm" />
                </div>
                <Slider
                  value={[config.target_epsilon]}
                  onValueChange={([value]) => setConfig({ ...config, target_epsilon: value })}
                  min={0.1}
                  max={100}
                  step={0.1}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Stronger Privacy</span>
                  <span>Better Utility</span>
                </div>
              </div>

              {/* Delta Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Delta (δ)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Probability of privacy breach. Should be less than 1/n where n is your dataset size.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={config.target_delta.toExponential(1)}
                    onChange={(e) => {
                      const value = Number.parseFloat(e.target.value)
                      if (!isNaN(value)) setConfig({ ...config, target_delta: value })
                    }}
                    className="font-mono"
                  />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Recommended: {"<"} {(1 / datasetRowCount).toExponential(1)}
                  </span>
                </div>
              </div>

              {/* Gradient Clipping */}
              <div className="space-y-2">
                <Label>Gradient Clipping Norm</Label>
                <Slider
                  value={[config.max_grad_norm]}
                  onValueChange={([value]) => setConfig({ ...config, max_grad_norm: value })}
                  min={0.1}
                  max={5}
                  step={0.1}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Value: {config.max_grad_norm.toFixed(1)}</span>
                  <span>Recommended: 1.0</span>
                </div>
              </div>

              {/* Validation Feedback */}
              {(validation.warnings.length > 0 || validation.utilityEstimate) && (
                <div className="space-y-2 pt-2 border-t">
                  {validation.warnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-warning-foreground">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </div>
                  ))}
                  {validation.utilityEstimate && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      <span className="text-muted-foreground">
                        Expected utility: <span className="font-medium capitalize">{validation.utilityEstimate}</span>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit" disabled={!config.name.trim() || !validation.valid || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Generator"}
          </Button>
        </div>
      </div>
    </form>
  )
}
