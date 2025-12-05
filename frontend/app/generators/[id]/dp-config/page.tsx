"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calculator, Shield, AlertCircle, CheckCircle2, Info, Lightbulb } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import Link from "next/link"

// Mock DP configuration data
const mockDPLimits = {
  min_epsilon: 0.1,
  max_epsilon: 50.0,
  min_delta: 1e-10,
  max_delta: 1e-3,
  recommended_epsilon_range: [1.0, 10.0],
  recommended_delta: 1e-5,
}

const mockRecommendations = {
  healthcare: { epsilon: 3.0, delta: 1e-6, description: "HIPAA-compliant, strong privacy" },
  financial: { epsilon: 5.0, delta: 1e-5, description: "Balanced privacy and utility" },
  general: { epsilon: 8.0, delta: 1e-5, description: "Good utility, moderate privacy" },
  research: { epsilon: 1.0, delta: 1e-6, description: "Maximum privacy, research use" },
}

export default function DPConfigPage() {
  const { user } = useAuth()
  const params = useParams()
  const generatorId = params?.id as string

  const [epsilon, setEpsilon] = useState(5.0)
  const [delta, setDelta] = useState(1e-5)
  const [datasetSize, setDatasetSize] = useState(10000)
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const applyPreset = (preset: keyof typeof mockRecommendations) => {
    const config = mockRecommendations[preset]
    setEpsilon(config.epsilon)
    setDelta(config.delta)
    setSelectedPreset(preset)
  }

  const getPrivacyLevel = (eps: number): { level: string; color: string; description: string } => {
    if (eps <= 1) return { level: "Very Strong", color: "text-green-500", description: "Maximum privacy protection" }
    if (eps <= 5) return { level: "Strong", color: "text-blue-500", description: "Good privacy for sensitive data" }
    if (eps <= 10) return { level: "Moderate", color: "text-yellow-500", description: "Balanced privacy/utility" }
    return { level: "Weak", color: "text-orange-500", description: "Consider higher sensitivity" }
  }

  const estimateBudget = () => {
    // Simplified budget calculation
    const usagePerQuery = epsilon / 10
    const queriesRemaining = Math.floor((mockDPLimits.max_epsilon - epsilon) / usagePerQuery)
    return queriesRemaining
  }

  const privacyLevel = getPrivacyLevel(epsilon)

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="DP Configuration Helper"
          description="Interactive tool for configuring differential privacy parameters"
          actions={
            <Button variant="outline" asChild>
              <Link href={`/generators/${generatorId}`}>Back to Generator</Link>
            </Button>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Presets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Quick Presets
                </CardTitle>
                <CardDescription>Recommended configurations for common use cases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(mockRecommendations).map(([key, config]) => (
                    <Button
                      key={key}
                      variant={selectedPreset === key ? "default" : "outline"}
                      onClick={() => applyPreset(key as keyof typeof mockRecommendations)}
                      className="flex flex-col h-auto py-4 items-start"
                    >
                      <span className="font-semibold capitalize">{key}</span>
                      <span className="text-xs opacity-80 text-left">ε={config.epsilon}, δ={config.delta.toExponential(0)}</span>
                      <span className="text-xs opacity-60 text-left mt-1">{config.description}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Epsilon Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Epsilon (ε) - Privacy Loss Parameter</CardTitle>
                <CardDescription>Lower values = stronger privacy | Higher values = better utility</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Epsilon Value</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={epsilon}
                        onChange={(e) => setEpsilon(parseFloat(e.target.value) || 0.1)}
                        className="w-24 text-right"
                        step={0.1}
                        min={mockDPLimits.min_epsilon}
                        max={mockDPLimits.max_epsilon}
                      />
                      <Badge className={privacyLevel.color}>{privacyLevel.level}</Badge>
                    </div>
                  </div>
                  <Slider
                    value={[epsilon]}
                    onValueChange={(value) => setEpsilon(value[0])}
                    min={mockDPLimits.min_epsilon}
                    max={20}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">{privacyLevel.description}</p>
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="text-sm font-medium">Epsilon Guidelines:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-green-500">ε ≤ 1</span>
                      <span>Very strong privacy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-blue-500">ε = 1-5</span>
                      <span>Strong privacy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-yellow-500">ε = 5-10</span>
                      <span>Moderate privacy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-orange-500">ε &gt; 10</span>
                      <span>Weak privacy</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delta Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Delta (δ) - Failure Probability</CardTitle>
                <CardDescription>Probability that privacy guarantee fails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Delta Value</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={delta.toExponential(1)}
                      readOnly
                      className="flex-1 font-mono"
                    />
                    <Select
                      value={delta.toString()}
                      onValueChange={(val) => setDelta(parseFloat(val))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1e-3">1e-3</SelectItem>
                        <SelectItem value="1e-4">1e-4</SelectItem>
                        <SelectItem value="1e-5">1e-5</SelectItem>
                        <SelectItem value="1e-6">1e-6</SelectItem>
                        <SelectItem value="1e-7">1e-7</SelectItem>
                        <SelectItem value="1e-8">1e-8</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-700 dark:text-blue-300">Common Practice</p>
                      <p className="text-blue-600 dark:text-blue-400 mt-1">
                        For datasets with n records, set δ ≤ 1/n² to ensure negligible failure probability. 
                        Current dataset: {datasetSize.toLocaleString()} records, recommended δ ≤ {(1 / (datasetSize * datasetSize)).toExponential(1)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dataset Size */}
            <Card>
              <CardHeader>
                <CardTitle>Dataset Size</CardTitle>
                <CardDescription>Number of records affects DP parameter selection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Input
                  type="number"
                  value={datasetSize}
                  onChange={(e) => setDatasetSize(parseInt(e.target.value) || 1000)}
                  min={100}
                  max={1000000}
                />
                <p className="text-xs text-muted-foreground">
                  Larger datasets allow for stronger privacy guarantees
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Results & Validation Panel */}
          <div className="space-y-6">
            {/* Privacy Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Configuration Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Privacy Level</p>
                    <p className={`text-lg font-bold ${privacyLevel.color}`}>{privacyLevel.level}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Epsilon (ε)</p>
                    <p className="text-2xl font-mono font-bold">{epsilon.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delta (δ)</p>
                    <p className="text-sm font-mono">{delta.toExponential(1)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Validation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Validation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Within Valid Range</p>
                    <p className="text-muted-foreground text-xs">
                      {mockDPLimits.min_epsilon} ≤ ε ≤ {mockDPLimits.max_epsilon}
                    </p>
                  </div>
                </div>

                {epsilon >= mockDPLimits.recommended_epsilon_range[0] && 
                 epsilon <= mockDPLimits.recommended_epsilon_range[1] ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Recommended Range</p>
                      <p className="text-muted-foreground text-xs">
                        ε is within recommended range ({mockDPLimits.recommended_epsilon_range[0]}-{mockDPLimits.recommended_epsilon_range[1]})
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Outside Recommended Range</p>
                      <p className="text-muted-foreground text-xs">
                        Consider {mockDPLimits.recommended_epsilon_range[0]}-{mockDPLimits.recommended_epsilon_range[1]} for balanced privacy/utility
                      </p>
                    </div>
                  </div>
                )}

                {delta <= mockDPLimits.recommended_delta ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Delta Acceptable</p>
                      <p className="text-muted-foreground text-xs">
                        δ ≤ {mockDPLimits.recommended_delta.toExponential(0)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Delta High</p>
                      <p className="text-muted-foreground text-xs">
                        Consider reducing to ≤ {mockDPLimits.recommended_delta.toExponential(0)}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Estimate */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Estimate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Estimated Queries</span>
                    <span className="font-semibold">{estimateBudget()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Approximate number of additional queries before budget depleted
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Apply Button */}
            <Button className="w-full" size="lg">
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Apply Configuration
            </Button>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
