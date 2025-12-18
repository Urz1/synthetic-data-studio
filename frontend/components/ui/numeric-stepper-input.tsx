"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Minus, Plus, HelpCircle } from "lucide-react"

interface NumericStepperInputProps {
  /** Current value */
  value: number
  /** Callback when value changes */
  onChange: (value: number) => void
  /** Minimum allowed value */
  min: number
  /** Maximum allowed value */
  max: number
  /** Step for stepper buttons (default: 1) */
  step?: number
  /** Step for slider (default: same as step) */
  sliderStep?: number
  /** Label for the input */
  label: string
  /** Optional helper text */
  helperText?: string
  /** Tooltip content */
  tooltip?: string
  /** Error message */
  error?: string
  /** Warning message */
  warning?: string
  /** Whether to snap slider to powers of 2 */
  powerOfTwo?: boolean
  /** Preset values to show as quick buttons */
  presets?: number[]
  /** Whether the input is disabled */
  disabled?: boolean
  /** Custom className */
  className?: string
}

/**
 * NumericStepperInput - A triple-pattern input with slider + stepper + editable number.
 * 
 * Features:
 * - Slider for coarse control
 * - +/- stepper buttons for fine control
 * - Editable number field for precise input
 * - Real-time validation with error/warning states
 * - Mobile-optimized with native numeric keyboard
 * - Optional power-of-2 snapping for batch sizes
 */
export function NumericStepperInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  sliderStep,
  label,
  helperText,
  tooltip,
  error,
  warning,
  powerOfTwo = false,
  presets,
  disabled = false,
  className,
}: NumericStepperInputProps) {
  const [localValue, setLocalValue] = React.useState(value.toString())

  // Sync local value when prop changes
  React.useEffect(() => {
    setLocalValue(value.toString())
  }, [value])

  const effectiveSliderStep = sliderStep ?? step

  // Snap to nearest power of 2 for batch size sliders
  const snapToPowerOfTwo = React.useCallback((val: number): number => {
    if (!powerOfTwo) return val
    const log = Math.log2(val)
    const lower = Math.pow(2, Math.floor(log))
    const upper = Math.pow(2, Math.ceil(log))
    return val - lower < upper - val ? lower : upper
  }, [powerOfTwo])

  const handleIncrement = () => {
    const newValue = powerOfTwo 
      ? Math.min(max, value * 2)
      : Math.min(max, value + step)
    onChange(newValue)
  }

  const handleDecrement = () => {
    const newValue = powerOfTwo 
      ? Math.max(min, value / 2)
      : Math.max(min, value - step)
    onChange(Math.round(newValue))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setLocalValue(inputValue)
    
    // Only update parent if it's a valid number
    const parsed = parseInt(inputValue, 10)
    if (!isNaN(parsed)) {
      onChange(parsed)
    }
  }

  const handleInputBlur = () => {
    // On blur, clamp to valid range and snap to step
    const parsed = parseInt(localValue, 10)
    if (isNaN(parsed)) {
      setLocalValue(value.toString())
    } else {
      const clamped = Math.max(min, Math.min(max, parsed))
      let snapped: number
      if (powerOfTwo) {
        snapped = snapToPowerOfTwo(clamped)
      } else if (step > 1) {
        // Snap to nearest step value
        snapped = Math.round(clamped / step) * step
        // Ensure we don't go below min or above max after snapping
        snapped = Math.max(min, Math.min(max, snapped))
      } else {
        snapped = clamped
      }
      onChange(snapped)
      setLocalValue(snapped.toString())
    }
  }

  const handleSliderChange = ([sliderValue]: number[]) => {
    const snapped = powerOfTwo ? snapToPowerOfTwo(sliderValue) : sliderValue
    onChange(snapped)
  }

  const handlePresetClick = (preset: number) => {
    onChange(preset)
  }

  const isInvalid = !!error
  const hasWarning = !!warning && !error

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label with optional tooltip */}
      <div className="flex items-center gap-1">
        <Label className="text-sm font-medium">{label}</Label>
        {tooltip && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger type="button" tabIndex={-1}>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Preset buttons */}
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {presets.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={value === preset ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => handlePresetClick(preset)}
              disabled={disabled}
            >
              {preset >= 1000 ? `${preset / 1000}K` : preset}
            </Button>
          ))}
        </div>
      )}

      {/* Stepper + Input + Stepper */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <Input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            "text-center font-mono",
            isInvalid && "border-destructive focus-visible:ring-destructive",
            hasWarning && "border-warning focus-visible:ring-warning"
          )}
          aria-invalid={isInvalid}
          aria-describedby={error ? `${label}-error` : helperText ? `${label}-helper` : undefined}
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Slider */}
      <Slider
        value={[value]}
        onValueChange={handleSliderChange}
        min={min}
        max={max}
        step={effectiveSliderStep}
        disabled={disabled}
        className={cn(
          "py-1",
          isInvalid && "[&_[role=slider]]:border-destructive"
        )}
      />

      {/* Range labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{min.toLocaleString()}</span>
        <span>{max.toLocaleString()}</span>
      </div>

      {/* Error message */}
      {error && (
        <p id={`${label}-error`} className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Warning message */}
      {warning && !error && (
        <p className="text-xs text-warning-foreground">
          {warning}
        </p>
      )}

      {/* Helper text */}
      {helperText && !error && !warning && (
        <p id={`${label}-helper`} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  )
}

/**
 * TrainingStepsIndicator - Shows real-time calculation of training steps
 */
interface TrainingStepsIndicatorProps {
  epochs: number
  batchSize: number
  maxSteps?: number
  className?: string
}

export function TrainingStepsIndicator({
  epochs,
  batchSize,
  maxSteps = 2_000_000,
  className,
}: TrainingStepsIndicatorProps) {
  const totalSteps = epochs * batchSize
  const isWithinLimit = totalSteps <= maxSteps
  const percentage = Math.min(100, (totalSteps / maxSteps) * 100)

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Training Steps</span>
        <span className={cn(
          "font-mono",
          isWithinLimit ? "text-success" : "text-destructive"
        )}>
          {totalSteps.toLocaleString()} / {maxSteps.toLocaleString()}
          {isWithinLimit ? " ✅" : " ❌"}
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-300",
            isWithinLimit ? "bg-success" : "bg-destructive"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {epochs.toLocaleString()} epochs × {batchSize.toLocaleString()} batch = {totalSteps.toLocaleString()} steps
      </p>
    </div>
  )
}
