"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ArrowLeft, Plus, X, Trophy } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import Link from "next/link"

// Mock evaluation data for comparison
const mockEvaluations = [
  {
    id: "eval-1",
    name: "Baseline DP-CTGAN",
    model: "DP-CTGAN (ε=1.0)",
    metrics: {
      fidelity: 0.82,
      utility: 0.75,
      privacy: 0.95,
      overall: 0.84
    },
    details: {
      ks_test: 0.88,
      correlation: 0.76,
      ml_efficiency: 0.72,
      reidentification_risk: "Very Low"
    }
  },
  {
    id: "eval-2",
    name: "High Utility Variant",
    model: "DP-CTGAN (ε=10.0)",
    metrics: {
      fidelity: 0.91,
      utility: 0.88,
      privacy: 0.78,
      overall: 0.86
    },
    details: {
      ks_test: 0.94,
      correlation: 0.89,
      ml_efficiency: 0.85,
      reidentification_risk: "Low"
    }
  },
  {
    id: "eval-3",
    name: "Balanced Approach",
    model: "PATE-GAN",
    metrics: {
      fidelity: 0.86,
      utility: 0.82,
      privacy: 0.89,
      overall: 0.86
    },
    details: {
      ks_test: 0.90,
      correlation: 0.84,
      ml_efficiency: 0.80,
      reidentification_risk: "Low"
    }
  }
]

export default function EvaluationComparePage() {
  const { user } = useAuth()
  const [selectedIds, setSelectedIds] = useState<string[]>(["eval-1", "eval-2"])

  const selectedEvaluations = mockEvaluations.filter(e => selectedIds.includes(e.id))

  const handleAddEvaluation = (value: string) => {
    if (!selectedIds.includes(value) && selectedIds.length < 3) {
      setSelectedIds([...selectedIds, value])
    }
  }

  const handleRemoveEvaluation = (id: string) => {
    if (selectedIds.length > 1) {
      setSelectedIds(selectedIds.filter(eid => eid !== id))
    }
  }

  // Prepare chart data
  const chartData = [
    { name: 'Fidelity', ...selectedEvaluations.reduce((acc, e) => ({ ...acc, [e.name]: e.metrics.fidelity * 100 }), {}) },
    { name: 'Utility', ...selectedEvaluations.reduce((acc, e) => ({ ...acc, [e.name]: e.metrics.utility * 100 }), {}) },
    { name: 'Privacy', ...selectedEvaluations.reduce((acc, e) => ({ ...acc, [e.name]: e.metrics.privacy * 100 }), {}) },
    { name: 'Overall', ...selectedEvaluations.reduce((acc, e) => ({ ...acc, [e.name]: e.metrics.overall * 100 }), {}) },
  ]

  const colors = ["#2563eb", "#16a34a", "#d97706"]

  const getBestPerformer = (metric: keyof typeof mockEvaluations[0]['metrics']) => {
    let best = selectedEvaluations[0]
    selectedEvaluations.forEach(e => {
      if (e.metrics[metric] > best.metrics[metric]) best = e
    })
    return best.id
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Compare Evaluations"
          description="Side-by-side comparison of model performance and privacy metrics"
          actions={
            <Button variant="outline" asChild>
              <Link href="/evaluations">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Link>
            </Button>
          }
        />

        {/* Selection Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              {selectedEvaluations.map((evalItem, idx) => (
                <Badge key={evalItem.id} variant="secondary" className="pl-2 pr-1 py-1 text-sm gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx] }} />
                  {evalItem.name}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 hover:bg-transparent"
                    onClick={() => handleRemoveEvaluation(evalItem.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              
              {selectedIds.length < 3 && (
                <Select onValueChange={handleAddEvaluation}>
                  <SelectTrigger className="w-[200px] h-8">
                    <div className="flex items-center gap-2">
                      <Plus className="h-3 w-3" />
                      <span>Add Evaluation</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {mockEvaluations
                      .filter(e => !selectedIds.includes(e.id))
                      .map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Visual Comparison */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Metric Comparison</CardTitle>
              <CardDescription>Performance scores normalized to 100%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend />
                    {selectedEvaluations.map((e, idx) => (
                      <Bar key={e.id} dataKey={e.name} fill={colors[idx]} radius={[4, 4, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Table */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Metric</TableHead>
                    {selectedEvaluations.map((e, idx) => (
                      <TableHead key={e.id} className="text-center">
                        <div className="flex flex-col items-center">
                          <span style={{ color: colors[idx] }} className="font-bold">{e.name}</span>
                          <span className="text-xs font-normal text-muted-foreground">{e.model}</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>Overall Score</TableCell>
                    {selectedEvaluations.map(e => (
                      <TableCell key={e.id} className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {(e.metrics.overall * 100).toFixed(1)}%
                          {getBestPerformer('overall') === e.id && <Trophy className="h-3 w-3 text-yellow-500" />}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                  
                  {/* Core Metrics */}
                  <TableRow>
                    <TableCell>Fidelity</TableCell>
                    {selectedEvaluations.map(e => (
                      <TableCell key={e.id} className="text-center">{(e.metrics.fidelity * 100).toFixed(1)}%</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Utility</TableCell>
                    {selectedEvaluations.map(e => (
                      <TableCell key={e.id} className="text-center">{(e.metrics.utility * 100).toFixed(1)}%</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Privacy</TableCell>
                    {selectedEvaluations.map(e => (
                      <TableCell key={e.id} className="text-center">{(e.metrics.privacy * 100).toFixed(1)}%</TableCell>
                    ))}
                  </TableRow>

                  {/* Detailed Metrics */}
                  <TableRow className="border-t-2">
                    <TableCell className="text-muted-foreground text-xs font-medium uppercase tracking-wider pt-4">Detailed Stats</TableCell>
                    {selectedEvaluations.map(e => <TableCell key={e.id} />)}
                  </TableRow>
                  <TableRow>
                    <TableCell>KS Test (Similarity)</TableCell>
                    {selectedEvaluations.map(e => (
                      <TableCell key={e.id} className="text-center">{e.details.ks_test.toFixed(2)}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Correlation Retention</TableCell>
                    {selectedEvaluations.map(e => (
                      <TableCell key={e.id} className="text-center">{e.details.correlation.toFixed(2)}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>ML Efficiency</TableCell>
                    {selectedEvaluations.map(e => (
                      <TableCell key={e.id} className="text-center">{e.details.ml_efficiency.toFixed(2)}</TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell>Re-ID Risk</TableCell>
                    {selectedEvaluations.map(e => (
                      <TableCell key={e.id} className="text-center">
                        <Badge variant="outline">{e.details.reidentification_risk}</Badge>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
