"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, ArrowRight, Zap, CheckCircle2, RefreshCw } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"

// Mock suggestions data
const mockSuggestions = [
  {
    id: "sugg-1",
    category: "Utility",
    title: "Improve Correlation Retention",
    description: "The correlation between 'age' and 'income' is lower than in the original dataset. Consider increasing the training epochs or adjusting the correlation penalty weight.",
    impact: "High",
    difficulty: "Medium",
    code_snippet: `config = GeneratorConfig(
  epochs=300,
  correlation_penalty=1.5
)`
  },
  {
    id: "sugg-2",
    category: "Privacy",
    title: "Reduce Outlier Risk",
    description: "Several records in the synthetic data are too similar to outliers in the training set. Increasing the epsilon value slightly or enabling outlier suppression is recommended.",
    impact: "Critical",
    difficulty: "Low",
    code_snippet: `config.privacy.epsilon = 3.0
config.privacy.outlier_suppression = True`
  },
  {
    id: "sugg-3",
    category: "Performance",
    title: "Optimize Batch Size",
    description: "Training is taking longer than expected. Increasing the batch size to 500 could speed up training without significant quality loss.",
    impact: "Medium",
    difficulty: "Low",
    code_snippet: `config.training.batch_size = 500`
  }
]

export default function SuggestionsPage() {
  const { user } = useAuth()
  const [selectedEval, setSelectedEval] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<typeof mockSuggestions | null>(null)

  const handleGenerate = () => {
    setLoading(true)
    setTimeout(() => {
      setSuggestions(mockSuggestions)
      setLoading(false)
    }, 2000)
  }

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="AI Improvement Suggestions"
          description="Get actionable advice to improve your synthetic data quality and privacy"
          actions={
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Powered by LLM
            </Badge>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Input Panel */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>Request Analysis</CardTitle>
              <CardDescription>Select an evaluation to analyze</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Evaluation Report</label>
                <Select value={selectedEval} onValueChange={setSelectedEval}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select evaluation..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eval-1">Eval #101 - Patient Data V1</SelectItem>
                    <SelectItem value="eval-2">Eval #102 - Financial Trans V2</SelectItem>
                    <SelectItem value="eval-3">Eval #103 - Customer Churn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Focus Area (Optional)</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="All areas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas</SelectItem>
                    <SelectItem value="privacy">Privacy & Security</SelectItem>
                    <SelectItem value="utility">Data Utility</SelectItem>
                    <SelectItem value="fidelity">Statistical Fidelity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Context</label>
                <Textarea 
                  placeholder="E.g., I need this data for a fraud detection model..." 
                  className="resize-none h-24"
                />
              </div>

              <Button 
                className="w-full" 
                onClick={handleGenerate} 
                disabled={!selectedEval || loading}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Suggestions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {!suggestions && !loading && (
              <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-lg text-muted-foreground">
                <Sparkles className="h-12 w-12 mb-4 opacity-20" />
                <p className="text-lg font-medium">Ready to Analyze</p>
                <p className="text-sm">Select an evaluation report to get AI-powered suggestions</p>
              </div>
            )}

            {loading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader className="h-24 bg-muted/50" />
                    <CardContent className="h-32 bg-muted/20" />
                  </Card>
                ))}
              </div>
            )}

            {suggestions && (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">3 Suggestions Found</h2>
                  <Button variant="ghost" size="sm" onClick={() => setSuggestions(null)}>Clear Results</Button>
                </div>

                {suggestions.map((sugg) => (
                  <Card key={sugg.id} className="overflow-hidden border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className="mb-2">{sugg.category}</Badge>
                          <CardTitle className="text-lg">{sugg.title}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={sugg.impact === "Critical" ? "destructive" : "secondary"}>
                            Impact: {sugg.impact}
                          </Badge>
                          <Badge variant="outline">Difficulty: {sugg.difficulty}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{sugg.description}</p>
                      
                      {sugg.code_snippet && (
                        <div className="bg-muted p-3 rounded-md font-mono text-sm relative group">
                          <pre>{sugg.code_snippet}</pre>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" className="gap-2">
                          Apply Fix <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
