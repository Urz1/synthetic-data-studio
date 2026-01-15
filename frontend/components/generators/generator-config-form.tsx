"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { EpsilonBadge } from "@/components/ui/epsilon-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  NumericStepperInput,
  TrainingStepsIndicator,
} from "@/components/ui/numeric-stepper-input";
import {
  HelpCircle,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Minus,
  Plus,
} from "lucide-react";
import type { ModelType } from "@/lib/types";

// ============================================================================
// CONSTANTS - Safety Limits
// ============================================================================

const LIMITS = {
  epochs: { min: 1, max: 500 },
  batchSize: { min: 32, max: 8192 },
  numRows: { min: 100, max: 1_000_000 },
  productMax: 2_000_000, // epochs × batch_size max
  epsilon: { min: 0.01, max: 10 },
  delta: { min: 1e-6, max: 1e-3 },
  maxGradNorm: { min: 0.1, max: 5 },
} as const;

const DP_DEFAULTS = {
  epsilon: 1.0,
  delta: 1e-5,
  maxGradNorm: 1.0,
};

const DELTA_OPTIONS = ["1e-6", "1e-5", "1e-4", "1e-3"] as const;

// ============================================================================
// TYPES
// ============================================================================

interface GeneratorConfigFormProps {
  datasetId: string;
  datasetRowCount?: number;
  onSubmit: (config: GeneratorConfig) => void;
  isSubmitting?: boolean;
  className?: string;
}

export interface GeneratorConfig {
  name: string;
  model_type: ModelType;
  num_rows: number;
  epochs: number;
  batch_size: number;
  use_differential_privacy: boolean;
  target_epsilon?: number;
  target_delta?: number;
  max_grad_norm?: number;
  synthetic_dataset_name?: string;
}

const MODEL_OPTIONS: {
  value: ModelType;
  label: string;
  description: string;
  dpSupport: boolean;
}[] = [
  {
    value: "ctgan",
    label: "CTGAN",
    description: "Conditional Tabular GAN - Best for mixed data types",
    dpSupport: false,
  },
  {
    value: "tvae",
    label: "TVAE",
    description: "Tabular VAE - Good for continuous data",
    dpSupport: false,
  },
  {
    value: "dp-ctgan",
    label: "DP-CTGAN",
    description: "CTGAN with differential privacy",
    dpSupport: true,
  },
  {
    value: "dp-tvae",
    label: "DP-TVAE",
    description: "TVAE with differential privacy",
    dpSupport: true,
  },
  // {
  //   value: "timegan",
  //   label: "TimeGAN",
  //   description: "For time-series data generation",
  //   dpSupport: false,
  // },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function GeneratorConfigForm({
  datasetId,
  datasetRowCount = 10000,
  onSubmit,
  isSubmitting,
  className,
}: GeneratorConfigFormProps) {
  // Form state - DP fields only included when enabled
  const [config, setConfig] = React.useState<GeneratorConfig>({
    name: "",
    model_type: "ctgan",
    num_rows: Math.min(datasetRowCount, LIMITS.numRows.max),
    epochs: 300,
    batch_size: 500,
    use_differential_privacy: false,
    // DP fields use defaults when DP is enabled
    target_epsilon: DP_DEFAULTS.epsilon,
    target_delta: DP_DEFAULTS.delta,
    max_grad_norm: DP_DEFAULTS.maxGradNorm,
    synthetic_dataset_name: "",
  });

  const [validation, setValidation] = React.useState<{
    valid: boolean;
    errors: Record<string, string>;
    warnings: string[];
    utilityEstimate?: string;
    productError?: string;
  }>({ valid: true, errors: {}, warnings: [] });

  const selectedModel = MODEL_OPTIONS.find(
    (m) => m.value === config.model_type
  );
  const isDpModel = selectedModel?.dpSupport || false;

  // SIMPLIFIED: DP is driven purely by model selection
  // If DP model selected → DP parameters shown, use_differential_privacy = true
  // If non-DP model selected → DP parameters hidden, use_differential_privacy = false
  React.useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      use_differential_privacy: isDpModel,
      // Reset DP parameters to defaults when switching to DP model
      target_epsilon: isDpModel
        ? prev.target_epsilon ?? DP_DEFAULTS.epsilon
        : prev.target_epsilon,
      target_delta: isDpModel
        ? prev.target_delta ?? DP_DEFAULTS.delta
        : prev.target_delta,
      max_grad_norm: isDpModel
        ? prev.max_grad_norm ?? DP_DEFAULTS.maxGradNorm
        : prev.max_grad_norm,
    }));
  }, [isDpModel]);

  // ============================================================================
  // VALIDATION - Comprehensive with all safety gates
  // ============================================================================

  React.useEffect(() => {
    const errors: Record<string, string> = {};
    const warnings: string[] = [];
    let valid = true;

    // --- Epochs Validation ---
    if (config.epochs < LIMITS.epochs.min) {
      errors.epochs = `Epochs must be at least ${LIMITS.epochs.min}`;
      valid = false;
    } else if (config.epochs > LIMITS.epochs.max) {
      errors.epochs = `Epochs cannot exceed ${LIMITS.epochs.max}`;
      valid = false;
    }

    // --- Batch Size Validation ---
    if (config.batch_size < LIMITS.batchSize.min) {
      errors.batch_size = `Batch size must be at least ${LIMITS.batchSize.min}`;
      valid = false;
    } else if (config.batch_size > LIMITS.batchSize.max) {
      errors.batch_size = `Batch size cannot exceed ${LIMITS.batchSize.max.toLocaleString()}`;
      valid = false;
    } else if (
      (config.model_type === "ctgan" || config.model_type === "dp-ctgan") &&
      config.batch_size % 10 !== 0
    ) {
      errors.batch_size =
        "Batch size must be a multiple of 10 for CTGAN (e.g., 500, 510)";
      valid = false;
    } else if (config.batch_size > datasetRowCount) {
      errors.batch_size = `Batch size cannot exceed dataset size (${datasetRowCount} rows)`;
      valid = false;
    } else if (
      config.use_differential_privacy &&
      config.batch_size > datasetRowCount * 0.5 &&
      datasetRowCount >= 100
    ) {
      // Backend constraint: Batch size cannot exceed 50% of dataset for DP models
      const maxBatch = Math.floor(datasetRowCount * 0.5);
      errors.batch_size = `For Differential Privacy, batch size cannot exceed 50% of dataset. Max allowed: ${maxBatch}`;
      valid = false;
    }

    // --- Product Rule: epochs × batch_size <= 2M (General Safety) ---
    const product = config.epochs * config.batch_size;
    let productError: string | undefined;
    if (product > LIMITS.productMax) {
      productError = `Reduce epochs or batch size to stay within safety limit (≤ ${LIMITS.productMax.toLocaleString()} total samples processed).`;
      valid = false;
    }

    // --- DP Training Steps & Math Validation (Critical for Privacy) ---
    if (config.use_differential_privacy) {
      const steps =
        config.epochs * Math.ceil(datasetRowCount / config.batch_size);
      const MAX_DP_STEPS = 5000;

      // 1. Max Steps Check
      if (steps > MAX_DP_STEPS) {
        const suggestedEpochs = Math.floor(
          MAX_DP_STEPS / (datasetRowCount / config.batch_size)
        );
        const suggestedBatchSize = Math.ceil(
          datasetRowCount / (MAX_DP_STEPS / config.epochs)
        );

        productError = `Too many training steps (${steps.toLocaleString()}). Maximum allowed is ${MAX_DP_STEPS} for Differential Privacy.
        
        To fix this, either:
        • Reduce epochs to ~${Math.max(1, suggestedEpochs)}
        • Increase batch size to ~${suggestedBatchSize}`;
        valid = false;
      }

      // 2. Infinite Noise Check
      // Formula: 2 * steps * log(1/delta) > 1e10 implies infinite noise required
      // Backend (DPCTGANService) uses 1e10 as the safety limit
      const delta = config.target_delta || 1.0 / datasetRowCount;
      const logTerm = Math.log(1.0 / delta);
      const infiniteNoiseCheck = 2 * steps * logTerm;

      if (infiniteNoiseCheck > 1e10) {
        productError = `Configuration requires excessive noise (mathematically unstable).
        
        To fix this, significantly reduce epochs or increase batch size.`;
        valid = false;
      }

      // 3. Minimum Noise Multiplier Check
      // Formula: noise_mult = sqrt(2 * steps * log(1/delta)) / epsilon
      // If noise_mult < 0.5, it's too risky/unstable
      const epsilon = config.target_epsilon || 1.0;
      if (epsilon > 0) {
        const noiseMult = Math.sqrt(2 * steps * logTerm) / epsilon;
        if (noiseMult < 0.5) {
          productError = `Privacy budget (ε=${epsilon}) is too high for this amount of training.
           
           To fix this, either:
           • Reduce epochs (less training needs less noise)
           • Decrease epsilon (allow more privacy loss)`;
          valid = false;
        }
      }
    }

    // --- Num Rows Validation ---
    if (config.num_rows < LIMITS.numRows.min) {
      errors.num_rows = `Rows must be at least ${LIMITS.numRows.min}`;
      valid = false;
    } else if (config.num_rows > LIMITS.numRows.max) {
      errors.num_rows = `Rows cannot exceed ${LIMITS.numRows.max.toLocaleString()}`;
      valid = false;
    }

    // --- Privacy Validation (only when DP enabled) ---
    let utilityEstimate: string | undefined;
    if (config.use_differential_privacy) {
      // Epsilon validation
      if (config.target_epsilon === undefined || config.target_epsilon < 0.1) {
        errors.target_epsilon = "Privacy budget (ε) must be at least 0.1";
        valid = false;
      } else if (config.target_epsilon > LIMITS.epsilon.max) {
        errors.target_epsilon = `Privacy budget (ε) cannot exceed ${LIMITS.epsilon.max}`;
        valid = false;
      } else {
        // Utility estimation based on epsilon
        if (config.target_epsilon < 1) {
          warnings.push(
            "Very low epsilon may significantly reduce data utility"
          );
          utilityEstimate = "low";
        } else if (config.target_epsilon <= 5) {
          utilityEstimate = "medium";
        } else {
          utilityEstimate = "high";
        }
      }

      // Delta validation
      if (config.target_delta === undefined) {
        errors.target_delta = "Delta (δ) is required";
        valid = false;
      } else if (config.target_delta < LIMITS.delta.min) {
        errors.target_delta = `Delta must be at least ${LIMITS.delta.min.toExponential(
          0
        )}`;
        valid = false;
      } else if (config.target_delta > LIMITS.delta.max) {
        errors.target_delta = `Delta cannot exceed ${LIMITS.delta.max.toExponential(
          0
        )}`;
        valid = false;
      } else if (config.target_delta > 1 / datasetRowCount) {
        warnings.push("Delta should be less than 1/n for strong privacy");
      }

      // Max grad norm validation
      if (config.max_grad_norm === undefined || config.max_grad_norm <= 0) {
        errors.max_grad_norm = "Gradient clipping norm must be greater than 0";
        valid = false;
      }
    }

    setValidation({ valid, errors, warnings, utilityEstimate, productError });
  }, [config, datasetRowCount]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validation.valid) return;

    // Build submission payload - omit DP fields when disabled
    const payload: GeneratorConfig = {
      name: config.name,
      model_type: config.model_type,
      num_rows: config.num_rows,
      epochs: config.epochs,
      batch_size: config.batch_size,
      use_differential_privacy: config.use_differential_privacy,
    };

    // Only include DP parameters when enabled
    if (config.use_differential_privacy) {
      payload.target_epsilon = config.target_epsilon;
      payload.target_delta = config.target_delta;
      payload.max_grad_norm = config.max_grad_norm;
    }

    if (config.synthetic_dataset_name?.trim()) {
      payload.synthetic_dataset_name = config.synthetic_dataset_name;
    }

    onSubmit(payload);
  };

  const handleDpToggle = (checked: boolean) => {
    // NO LONGER NEEDED - DP is model-driven
    // Kept for potential future use but not called
    setConfig((prev) => ({
      ...prev,
      use_differential_privacy: checked,
      target_epsilon: checked
        ? prev.target_epsilon ?? DP_DEFAULTS.epsilon
        : prev.target_epsilon,
      target_delta: checked
        ? prev.target_delta ?? DP_DEFAULTS.delta
        : prev.target_delta,
      max_grad_norm: checked
        ? prev.max_grad_norm ?? DP_DEFAULTS.maxGradNorm
        : prev.max_grad_norm,
    }));
  };

  // Calculate if submit should be disabled
  const isSubmitDisabled =
    !validation.valid || isSubmitting || !config.name.trim();

  const deltaSelectValue = React.useMemo(
    () => (config.target_delta ?? DP_DEFAULTS.delta).toExponential(0),
    [config.target_delta]
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      <div className="space-y-6">
        {/* Basic Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Generator Configuration
            </CardTitle>
            <CardDescription>
              Configure your synthetic data generator
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Generator Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Generator Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Patient Records Generator"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                className={cn(validation.errors.name && "border-destructive")}
                required
              />
              {validation.errors.name && (
                <p className="text-xs text-destructive">
                  {validation.errors.name}
                </p>
              )}
            </div>

            {/* Model Type */}
            <div className="space-y-2">
              <Label htmlFor="model_type">Model Type</Label>
              <Select
                value={config.model_type}
                onValueChange={(value: ModelType) =>
                  setConfig({ ...config, model_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      <div className="flex items-center gap-2">
                        <span>{model.label}</span>
                        {model.dpSupport && (
                          <Shield className="h-3 w-3 text-success" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {selectedModel?.description}
              </p>
            </div>

            {/* Rows to Generate */}
            <NumericStepperInput
              label="Rows to Generate"
              value={config.num_rows}
              onChange={(value) => setConfig({ ...config, num_rows: value })}
              min={LIMITS.numRows.min}
              max={LIMITS.numRows.max}
              step={1000}
              sliderStep={1000}
              presets={[1000, 5000, 10000, 50000]}
              tooltip="Number of synthetic rows to create"
              error={validation.errors.num_rows}
            />

            {/* Training Parameters with Steps Indicator */}
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium">Training Parameters</h4>

              <div className="grid gap-6 sm:grid-cols-2">
                {/* Epochs */}
                <NumericStepperInput
                  label="Training Epochs"
                  value={config.epochs}
                  onChange={(value) => setConfig({ ...config, epochs: value })}
                  min={LIMITS.epochs.min}
                  max={LIMITS.epochs.max}
                  step={1}
                  sliderStep={10}
                  presets={[100, 200, 300, 500]}
                  tooltip="Number of training iterations. More epochs = better quality but longer training."
                  error={validation.errors.epochs}
                />

                {/* Batch Size */}
                <NumericStepperInput
                  label="Batch Size"
                  value={config.batch_size}
                  onChange={(value) =>
                    setConfig({ ...config, batch_size: value })
                  }
                  min={LIMITS.batchSize.min}
                  max={LIMITS.batchSize.max}
                  step={10}
                  sliderStep={10}
                  presets={[100, 250, 500, 1000]}
                  tooltip="Samples per training step. Must be a multiple of 10 for CTGAN. Larger batches = faster training but more memory."
                  error={validation.errors.batch_size}
                />
              </div>

              {/* Training Steps Indicator */}
              <TrainingStepsIndicator
                epochs={config.epochs}
                batchSize={config.batch_size}
                maxSteps={LIMITS.productMax}
                className="mt-4"
              />

              {/* Product Error Tooltip */}
              {validation.productError && (
                <TooltipProvider>
                  <Tooltip open={true}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                        <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                        <p className="text-xs text-destructive">
                          {validation.productError}
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-sm">
                      To reduce total steps, either lower epochs or batch size.
                      Current:{" "}
                      {(config.epochs * config.batch_size).toLocaleString()}{" "}
                      steps.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Differential Privacy Configuration */}
        {/* SIMPLIFIED UX: Only show when DP model selected - no toggle */}
        {isDpModel && (
          <Card
            className={cn(
              "border-success/30",
              (validation.errors.target_epsilon ||
                validation.errors.target_delta ||
                validation.errors.max_grad_norm) &&
                "border-destructive"
            )}
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-success" />
                <div>
                  <CardTitle>Differential Privacy Parameters</CardTitle>
                  <CardDescription>
                    Configure privacy guarantees for {selectedModel?.label}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Epsilon Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-1">
                    Privacy Budget (ε) *
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger type="button" tabIndex={-1}>
                          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          Lower epsilon = stronger privacy, but lower data
                          utility. Range: 0.01 to 10. Recommended: 1-5 for most
                          use cases.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <EpsilonBadge
                    epsilon={config.target_epsilon || 0}
                    size="sm"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-12">
                    0.01
                  </span>
                  <Slider
                    value={[config.target_epsilon || DP_DEFAULTS.epsilon]}
                    onValueChange={([value]) =>
                      setConfig({ ...config, target_epsilon: value })
                    }
                    min={LIMITS.epsilon.min}
                    max={LIMITS.epsilon.max}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-8">
                    {LIMITS.epsilon.max}
                  </span>
                </div>

                {/* Epsilon direct input */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Value:</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={config.target_epsilon}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        setConfig({ ...config, target_epsilon: value });
                      }
                    }}
                    min={LIMITS.epsilon.min}
                    max={LIMITS.epsilon.max}
                    step={0.1}
                    className={cn(
                      "w-24 h-8 text-sm",
                      validation.errors.target_epsilon && "border-destructive"
                    )}
                  />
                </div>

                {validation.errors.target_epsilon && (
                  <p className="text-xs text-destructive">
                    {validation.errors.target_epsilon}
                  </p>
                )}

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Stronger Privacy</span>
                  <span>Better Utility</span>
                </div>
              </div>

              {/* Delta Input */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Delta (δ) *
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger type="button" tabIndex={-1}>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Probability of privacy breach. Must be between{" "}
                        {LIMITS.delta.min.toExponential(0)} and{" "}
                        {LIMITS.delta.max.toExponential(0)}. Should be less than
                        1/n where n is your dataset size.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={deltaSelectValue}
                    onValueChange={(value) =>
                      setConfig({ ...config, target_delta: parseFloat(value) })
                    }
                  >
                    <SelectTrigger
                      className={cn(
                        "w-32",
                        validation.errors.target_delta && "border-destructive"
                      )}
                    >
                      <SelectValue placeholder="Select δ" />
                    </SelectTrigger>
                    <SelectContent>
                      {DELTA_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    Recommended: {"<"} {(1 / datasetRowCount).toExponential(1)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected δ: <span className="font-mono">{deltaSelectValue}</span>
                </p>
                {validation.errors.target_delta && (
                  <p className="text-xs text-destructive">
                    {validation.errors.target_delta}
                  </p>
                )}
              </div>

              {/* Gradient Clipping */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  Gradient Clipping Norm *
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger type="button" tabIndex={-1}>
                        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        Maximum L2 norm for gradient clipping. Controls
                        sensitivity bound. Must be greater than 0. Recommended:
                        1.0.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[config.max_grad_norm || DP_DEFAULTS.maxGradNorm]}
                    onValueChange={([value]) =>
                      setConfig({ ...config, max_grad_norm: value })
                    }
                    min={LIMITS.maxGradNorm.min}
                    max={LIMITS.maxGradNorm.max}
                    step={0.1}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono w-12 text-right">
                    {(config.max_grad_norm || DP_DEFAULTS.maxGradNorm).toFixed(
                      1
                    )}
                  </span>
                </div>
                {validation.errors.max_grad_norm && (
                  <p className="text-xs text-destructive">
                    {validation.errors.max_grad_norm}
                  </p>
                )}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{LIMITS.maxGradNorm.min}</span>
                  <span>Recommended: 1.0</span>
                  <span>{LIMITS.maxGradNorm.max}</span>
                </div>
              </div>

              {/* Validation Feedback */}
              {(validation.warnings.length > 0 ||
                validation.utilityEstimate) && (
                <div className="space-y-2 pt-2 border-t">
                  {validation.warnings.map((warning, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm text-warning-foreground"
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </div>
                  ))}
                  {validation.utilityEstimate && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-success" />
                      <span>
                        Projected Data Utility:{" "}
                        <span className="font-medium capitalize">
                          {validation.utilityEstimate}
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    type="submit"
                    disabled={isSubmitDisabled}
                    aria-disabled={isSubmitDisabled}
                  >
                    {isSubmitting ? "Creating..." : "Create Generator"}
                  </Button>
                </span>
              </TooltipTrigger>
              {isSubmitDisabled && !isSubmitting && (
                <TooltipContent>
                  {!config.name.trim()
                    ? "Please enter a generator name"
                    : validation.productError
                    ? validation.productError
                    : "Please fix validation errors above"}
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </form>
  );
}
