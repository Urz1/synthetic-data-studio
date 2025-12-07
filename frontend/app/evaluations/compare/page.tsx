"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { ArrowLeft, Plus, X, Trophy, Loader2, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import { api } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function EvaluationComparePage() {
  const { user } = useAuth()
  const [availableEvaluations, setAvailableEvaluations] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [comparisonResult, setComparisonResult] = useState<any>(null)

  useEffect(() => {
    loadEvaluations()
  }, [])

  useEffect(() => {
    // Auto-compare when selection changes and has 2+ evaluations
    if (selectedIds.length >= 2) {
      loadComparison()
    } else {
      setComparisonResult(null)
    }
  }, [selectedIds])

  const loadEvaluations = async () => {
    try {
      setLoading(true)
      setError(null)
      const evaluations = await api.listEvaluations()
      setAvailableEvaluations(evaluations)
      // Auto-select first 2 if available
      if (evaluations.length >= 2) {
        setSelectedIds([evaluations[0].id, evaluations[1].id])
      } else if (evaluations.length === 1) {
        setSelectedIds([evaluations[0].id])
      }
    } catch (err: any) {
      setError(err.message || "Failed to load evaluations")
    } finally {
      setLoading(false)
    }
  }

  const loadComparison = async () => {
    if (selectedIds.length < 2) return
    
    try {
      setComparing(true)
      setError(null)
      const result = await api.compareEvaluations(selectedIds)
      setComparisonResult(result)
    } catch (err: any) {
      setError(err.message || "Failed to generate comparison")
      setComparisonResult(null)
    } finally {
      setComparing(false)
    }
  }

  const selectedEvaluations = availableEvaluations.filter(e => selectedIds.includes(e.id))

  const handleAddEvaluation = (value: string) => {
    if (!selectedIds.includes(value) && selectedIds.length < 5) {
      setSelectedIds([...selectedIds, value])
    }
  }

  const handleRemoveEvaluation = (id: string) => {
    if (selectedIds.length > 1) {
      setSelectedIds(selectedIds.filter(eid => eid !== id))
    }
  }

  // Extract metrics from evaluation report
  const getMetrics = (evaluation: any) => {
    const report = evaluation.report || {}
    return {
      fidelity: report.statistical_similarity || report.overall_score || 0,
      utility: report.ml_utility || report.overall_score || 0,
      privacy: report.privacy_score || report.overall_score || 0,
      overall: report.overall_score || 0
    }
  }

  // Prepare chart data
  const chartData = [
    { 
      name: 'Fidelity', 
      ...selectedEvaluations.reduce((acc, e) => ({ 
        ...acc, 
        [`Eval ${selectedIds.indexOf(e.id) + 1}`]: (getMetrics(e).fidelity * 100) 
      }), {}) 
    },
    { 
      name: 'Utility', 
      ...selectedEvaluations.reduce((acc, e) => ({ 
        ...acc, 
        [`Eval ${selectedIds.indexOf(e.id) + 1}`]: (getMetrics(e).utility * 100) 
      }), {}) 
    },
    { 
      name: 'Privacy', 
      ...selectedEvaluations.reduce((acc, e) => ({ 
        ...acc, 
        [`Eval ${selectedIds.indexOf(e.id) + 1}`]: (getMetrics(e).privacy * 100) 
      }), {}) 
    },
    { 
      name: 'Overall', 
      ...selectedEvaluations.reduce((acc, e) => ({ 
        ...acc, 
        [`Eval ${selectedIds.indexOf(e.id) + 1}`]: (getMetrics(e).overall * 100) 
      }), {}) 
    },
  ]

  const colors = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#9333ea"]

  const getBestPerformer = (metricKey: 'fidelity' | 'utility' | 'privacy' | 'overall') => {
    if (selectedEvaluations.length === 0) return null
    let best = selectedEvaluations[0]
    selectedEvaluations.forEach(e => {
      if (getMetrics(e)[metricKey] > getMetrics(best)[metricKey]) best = e
    })
    return best.id
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell user={user || { full_name: "", email: "" }}>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AppShell>
      </ProtectedRoute>
    )
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

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {availableEvaluations.length === 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No evaluations available. Run some evaluations first to compare them.
            </AlertDescription>
          </Alert>
        )}

        {availableEvaluations.length > 0 && (
          <>
            {/* Selection Controls */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 items-center">
                  {selectedEvaluations.map((evalItem, idx) => {
                    const evalNum = selectedIds.indexOf(evalItem.id) + 1
                    return (
                      <Badge key={evalItem.id} variant="secondary" className="pl-2 pr-1 py-1 text-sm gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx] }} />
                        Evaluation {evalNum}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 ml-1 hover:bg-transparent"
                          onClick={() => handleRemoveEvaluation(evalItem.id)}
                          disabled={selectedIds.length <= 1}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    )
                  })}
                  
                  {selectedIds.length < 5 && (
                    <Select onValueChange={handleAddEvaluation}>
                      <SelectTrigger className="w-[200px] h-8">
                        <div className="flex items-center gap-2">
                          <Plus className="h-3 w-3" />
                          <span>Add Evaluation</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {availableEvaluations
                          .filter(e => !selectedIds.includes(e.id))
                          .map(e => (
                            <SelectItem key={e.id} value={e.id}>
                              Evaluation (ID: {e.id.substring(0, 8)})
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  )}
                  
                  {comparing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating comparison...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Comparison Insights */}
            {comparisonResult && (
              <Card className="mb-6 bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    AI-Powered Insights
                  </CardTitle>
                  <CardDescription>
                    Intelligent analysis and recommendations based on your evaluation criteria
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Recommendation</h4>
                    <p className="text-sm">{comparisonResult.recommendation}</p>
                  </div>
                  
                  {comparisonResult.best_for_analytics && (
                    <div>
                      <h4 className="font-semibold mb-2">Best for Analytics</h4>
                      <p className="text-sm">{comparisonResult.best_for_analytics}</p>
                    </div>
                  )}
                  
                  {comparisonResult.best_for_privacy && (
                    <div>
                      <h4 className="font-semibold mb-2">Best for Privacy</h4>
                      <p className="text-sm">{comparisonResult.best_for_privacy}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {selectedEvaluations.length >= 2 && (
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
                      {selectedEvaluations.map((e, idx) => {
                        const evalNum = selectedIds.indexOf(e.id) + 1
                        return (
                          <Bar key={e.id} dataKey={`Eval ${evalNum}`} fill={colors[idx]} radius={[4, 4, 0, 0]} />
                        )
                      })}
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
                      {selectedEvaluations.map((e, idx) => {
                        const evalNum = selectedIds.indexOf(e.id) + 1
                        return (
                          <TableHead key={e.id} className="text-center">
                            <div className="flex flex-col items-center">
                              <span style={{ color: colors[idx] }} className="font-bold">
                                Evaluation {evalNum}
                              </span>
                              <span className="text-xs font-normal text-muted-foreground">
                                {new Date(e.completed_at).toLocaleDateString()}
                              </span>
                            </div>
                          </TableHead>
                        )
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell>Overall Score</TableCell>
                      {selectedEvaluations.map(e => {
                        const metrics = getMetrics(e)
                        return (
                          <TableCell key={e.id} className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {(metrics.overall * 100).toFixed(1)}%
                              {getBestPerformer('overall') === e.id && <Trophy className="h-3 w-3 text-yellow-500" />}
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                    
                    {/* Core Metrics */}
                    <TableRow>
                      <TableCell>Fidelity</TableCell>
                      {selectedEvaluations.map(e => {
                        const metrics = getMetrics(e)
                        return (
                          <TableCell key={e.id} className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {(metrics.fidelity * 100).toFixed(1)}%
                              {getBestPerformer('fidelity') === e.id && <Trophy className="h-3 w-3 text-yellow-500" />}
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell>Utility</TableCell>
                      {selectedEvaluations.map(e => {
                        const metrics = getMetrics(e)
                        return (
                          <TableCell key={e.id} className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {(metrics.utility * 100).toFixed(1)}%
                              {getBestPerformer('utility') === e.id && <Trophy className="h-3 w-3 text-yellow-500" />}
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                    <TableRow>
                      <TableCell>Privacy</TableCell>
                      {selectedEvaluations.map(e => {
                        const metrics = getMetrics(e)
                        return (
                          <TableCell key={e.id} className="text-center">
                            <div className="flex items-center justify-center gap-2">
                              {(metrics.privacy * 100).toFixed(1)}%
                              {getBestPerformer('privacy') === e.id && <Trophy className="h-3 w-3 text-yellow-500" />}
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>

                    {/* Additional Report Details */}
                    <TableRow className="border-t-2">
                      <TableCell className="text-muted-foreground text-xs font-medium uppercase tracking-wider pt-4">
                        Additional Details
                      </TableCell>
                      {selectedEvaluations.map(e => <TableCell key={e.id} />)}
                    </TableRow>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      {selectedEvaluations.map(e => (
                        <TableCell key={e.id} className="text-center">
                          <Badge variant={e.status === 'completed' ? 'default' : 'secondary'}>
                            {e.status}
                          </Badge>
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      <TableCell>Evaluation ID</TableCell>
                      {selectedEvaluations.map(e => (
                        <TableCell key={e.id} className="text-center">
                          <code className="text-xs">{e.id.substring(0, 8)}</code>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  )
}
