"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Code, Sparkles, Plus, Trash2, Download, Zap, BrainCircuit } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import type { Project } from "@/lib/types"

interface SchemaColumn {
  name: string
  type: string
  format?: string
  constraints?: Record<string, unknown>
}

// Template schemas
const templates = {
  customer: {
    name: "Customer Database",
    columns: [
      { name: "customer_id", type: "uuid" },
      { name: "first_name", type: "string" },
      { name: "last_name", type: "string" },
      { name: "email", type: "email" },
      { name: "phone", type: "phone" },
      { name: "created_at", type: "datetime" },
    ],
  },
  ecommerce: {
    name: "E-commerce Orders",
    columns: [
      { name: "order_id", type: "uuid" },
      { name: "customer_id", type: "uuid" },
      { name: "product_name", type: "string" },
      { name: "quantity", type: "integer" },
      { name: "price", type: "float" },
      { name: "order_date", type: "datetime" },
    ],
  },
  healthcare: {
    name: "Healthcare Records",
    columns: [
      { name: "patient_id", type: "uuid" },
      { name: "name", type: "string" },
      { name: "age", type: "integer" },
      { name: "diagnosis", type: "string" },
      { name: "admission_date", type: "date" },
    ],
  },
  financial: {
    name: "Financial Transactions",
    columns: [
      { name: "transaction_id", type: "uuid" },
      { name: "account_number", type: "string" },
      { name: "amount", type: "float" },
      { name: "currency", type: "string" },
      { name: "timestamp", type: "datetime" },
    ],
  },
}

export default function SchemaGeneratorPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [columns, setColumns] = useState<SchemaColumn[]>([
    { name: "id", type: "uuid" },
  ])
  const [numRows, setNumRows] = useState(1000)
  const [schemaJson, setSchemaJson] = useState("")
  const [activeTab, setActiveTab] = useState<"builder" | "json">("builder")
  const [generatedData, setGeneratedData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string>("")
  
  // Project & Naming state
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [datasetName, setDatasetName] = useState<string>("")
  const [useLLMSeed, setUseLLMSeed] = useState(false)  // Enhanced mode: LLM-powered seed data
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        setIsLoadingProjects(true)
        const data = await api.listProjects()
        setProjects(data)
        if (data.length > 0) {
          setSelectedProjectId(data[0].id)
        }
      } catch (err) {
        console.error("Failed to load projects", err)
        toast({
          title: "Failed to load projects",
          description: "Could not fetch available projects",
          variant: "destructive"
        })
      } finally {
        setIsLoadingProjects(false)
      }
    }
    loadProjects()
  }, [toast])


  const addColumn = () => {
    setColumns([...columns, { name: "", type: "string" }])
  }

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index))
  }

  const updateColumn = (index: number, field: keyof SchemaColumn, value: string) => {
    const updated = [...columns]
    updated[index] = { ...updated[index], [field]: value }
    setColumns(updated)
  }

  const loadTemplate = (templateKey: keyof typeof templates) => {
    const template = templates[templateKey]
    setColumns(template.columns)
    toast({
      title: "Template Loaded",
      description: `Loaded ${template.name} template`,
    })
  }

  const parseJsonSchema = () => {
    try {
      const parsed = JSON.parse(schemaJson)
      if (!parsed.columns || typeof parsed.columns !== 'object') {
        throw new Error("Schema must have a 'columns' object")
      }
      
      // Convert JSON schema to columns array
      const newColumns: SchemaColumn[] = Object.entries(parsed.columns).map(([name, config]: [string, any]) => ({
        name,
        type: config.type || 'string',
        format: config.format,
        constraints: config.constraints,
      }))
      
      setColumns(newColumns)
      setActiveTab("builder")
      toast({
        title: "Schema Loaded",
        description: `Loaded ${newColumns.length} columns from JSON`,
      })
    } catch (err) {
      toast({
        title: "Invalid JSON",
        description: err instanceof Error ? err.message : "Failed to parse JSON schema",
        variant: "destructive",
      })
    }
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError("")
    
    try {
      if (!selectedProjectId) {
          throw new Error("Please select a project")
      }
      if (!datasetName.trim()) {
          throw new Error("Please provide a name for the dataset")
      }

      if (numRows < 1 || numRows > 100000) {
        throw new Error("Number of rows must be between 1 and 100,000")
      }

      // Use JSON schema if on JSON tab, otherwise use builder
      let schemaConfig: any
      
      if (activeTab === "json" && schemaJson.trim()) {
        const parsed = JSON.parse(schemaJson)
        if (!parsed.columns) {
          throw new Error("JSON schema must have a 'columns' object")
        }
        schemaConfig = { 
            columns: parsed.columns,
            project_id: selectedProjectId,
            dataset_name: datasetName,
            use_llm_seed: useLLMSeed
        }
      } else {
        // Validate columns from builder
        const validColumns = columns.filter(col => col.name.trim() !== "")
        if (validColumns.length === 0) {
          throw new Error("Please add at least one column with a name")
        }

        // Prepare schema config
        schemaConfig = {
          columns: Object.fromEntries(
            validColumns.map(col => [
              col.name,
              {
                type: col.type,
                ...(col.format && { faker: col.format }),
                ...(col.constraints && col.constraints),
              },
            ])
          ),
          project_id: selectedProjectId,
          dataset_name: datasetName,
          use_llm_seed: useLLMSeed
        }
      }

      // Call API to generate
      const result = await api.generateSchemaBased(schemaConfig, numRows)
      console.log("Schema API Raw Result:", result)
      
      // Robustly extract ID from various potential response formats
      // The backend returns a Dataset object, so 'id' is the primary field
      const rawId = result.id || result.output_dataset_id || (result as any).dataset_id
      const finalId = typeof rawId === 'object' ? rawId.toString() : rawId

      if (!finalId) {
        throw new Error("Generated dataset is missing an ID")
      }

      setGeneratedData({
        id: finalId,
        type: "schema",
        status: "completed",
        output_dataset_id: finalId,
        rows: numRows,
      })

      toast({
        title: "Success",
        description: `Generated ${numRows.toLocaleString()} rows of synthetic data`,
      })
    } catch (err) {
      console.error("Generation error:", err)
      const message = err instanceof Error ? err.message : "Failed to generate data"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedData?.output_dataset_id) {
      toast({
        title: "Error",
        description: "No dataset ID available for download. Please regenerate.",
        variant: "destructive"
      })
      return
    }
    
    setDownloading(true)
    try {
      const result = await api.downloadSyntheticDataset(generatedData.output_dataset_id)
      if (result.download_url) {
        const link = document.createElement('a');
        link.href = result.download_url;
        link.download = result.filename || "generated_dataset.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Download Started",
          description: "Your file is being downloaded",
        })
      }
    } catch (err) {
      toast({
        title: "Download Failed",
        description: err instanceof Error ? err.message : "Failed to download dataset",
        variant: "destructive",
      })
    } finally {
      setDownloading(false)
    }
  }

  const columnTypeOptions = [
    { value: "string", label: "String" },
    { value: "integer", label: "Integer" },
    { value: "float", label: "Float" },
    { value: "boolean", label: "Boolean" },
    { value: "date", label: "Date" },
    { value: "datetime", label: "DateTime" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "url", label: "URL" },
    { value: "uuid", label: "UUID" },
    { value: "name", label: "Name" },
    { value: "address", label: "Address" },
    { value: "text", label: "Text" },
  ]

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Schema-Based Generator"
          description="Generate synthetic data from a schema without model training"
          actions={
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              No Training Required
            </Badge>
          }
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Schema Builder */}
          <Card>
            <CardHeader>
              <CardTitle>Define Schema</CardTitle>
              <CardDescription>
                Specify your data structure - generation happens instantly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "builder" | "json")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="builder">Visual Builder</TabsTrigger>
                  <TabsTrigger value="json">JSON Schema</TabsTrigger>
                </TabsList>

                <TabsContent value="builder" className="space-y-4">
                  <div className="space-y-3">
                    {columns.map((column, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div>
                            <Input
                              placeholder="Column name"
                              value={column.name}
                              onChange={(e) => updateColumn(index, "name", e.target.value)}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Select
                              value={column.type}
                              onValueChange={(value) => updateColumn(index, "type", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {columnTypeOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeColumn(index)}
                              disabled={columns.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" onClick={addColumn} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Column
                  </Button>
                </TabsContent>

                <TabsContent value="json" className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder='{\n  "columns": {\n    "id": { "type": "uuid" },\n    "name": { "type": "string" },\n    "email": { "type": "email" },\n    "age": { "type": "integer" },\n    "created_at": { "type": "datetime" }\n  }\n}'
                      rows={12}
                      value={schemaJson}
                      onChange={(e) => setSchemaJson(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={parseJsonSchema}
                      className="w-full"
                    >
                      <Code className="mr-2 h-4 w-4" />
                      Load JSON to Builder
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="space-y-4 pt-4 border-t">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="project-select">Target Project</Label>
                        <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={isLoadingProjects}>
                            <SelectTrigger id="project-select">
                                <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dataset-name">Dataset Name</Label>
                        <Input 
                            id="dataset-name" 
                            placeholder="e.g. synthetic_customers_v1" 
                            value={datasetName}
                            onChange={(e) => setDatasetName(e.target.value)}
                        />
                    </div>
                 </div>

                <div className="space-y-2">
                  <Label htmlFor="num-rows" className="text-sm font-medium">
                    Number of Rows to Generate
                  </Label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {[100, 1000, 10000, 50000, 100000].map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant={numRows === preset ? "default" : "outline"}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setNumRows(preset)}
                      >
                        {preset >= 1000 ? `${preset / 1000}K` : preset}
                      </Button>
                    ))}
                  </div>
                <Input
                  id="num-rows"
                  type="number"
                  min={1}
                  max={100000}
                  step={100}
                  value={numRows}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '') {
                      setNumRows(0)
                    } else {
                      const num = parseInt(value)
                      if (!isNaN(num)) {
                        setNumRows(Math.max(1, Math.min(100000, num)))
                      }
                    }
                  }}
                  onBlur={() => {
                    if (numRows < 1) setNumRows(1)
                    if (numRows > 100000) setNumRows(100000)
                  }}
                  className="text-lg font-semibold"
                  placeholder="Custom"
                />
                <p className="text-xs text-muted-foreground">
                  Min: 1 | Max: 100,000 rows | Current: <span className="font-semibold">{numRows.toLocaleString()}</span>
                </p>
              </div>

              {/* LLM Seed Toggle */}
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center gap-3">
                  <BrainCircuit className={`h-5 w-5 ${useLLMSeed ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="llm-seed-toggle" className="font-medium cursor-pointer">
                        AI-Enhanced Generation
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-xs cursor-help">Beta</Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="text-sm">
                              Uses AI to generate realistic seed data, then trains a CTGAN model on it 
                              for higher quality output. Slower but produces more realistic correlations 
                              between columns.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Generate semantically meaningful data using LLM
                    </p>
                  </div>
                </div>
                <Switch 
                  id="llm-seed-toggle"
                  checked={useLLMSeed} 
                  onCheckedChange={setUseLLMSeed}
                />
              </div>
              </div>

              <Button onClick={handleGenerate} className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Generate Data
                  </>
                )}
              </Button>

              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
            </CardContent>
          </Card>

          {/* Preview & Results */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Schema Preview</CardTitle>
                <CardDescription>Current schema configuration</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[300px]">
                  {JSON.stringify(
                    {
                      columns: columns,
                      num_rows: numRows,
                    },
                    null,
                    2
                  )}
                </pre>
              </CardContent>
            </Card>

            {generatedData && (
              <Card className="border-green-500/50">
                <CardHeader>
                  <CardTitle className="text-green-500">✓ Generation Complete</CardTitle>
                  <CardDescription>Your synthetic data is ready</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Dataset ID</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {generatedData.output_dataset_id}
                      </code>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Rows Generated</p>
                      <p className="text-lg font-semibold">
                        {generatedData.rows.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={handleDownload}
                      disabled={downloading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {downloading ? "Downloading..." : "Download CSV"}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        if (generatedData?.output_dataset_id) {
                          router.push(`/synthetic-datasets/${generatedData.output_dataset_id}`)
                        }
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Examples */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Start Templates</CardTitle>
                <CardDescription>Click to load a pre-configured schema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => loadTemplate("customer")}
                >
                  <Code className="mr-2 h-4 w-4" />
                  Customer Database
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => loadTemplate("ecommerce")}
                >
                  <Code className="mr-2 h-4 w-4" />
                  E-commerce Orders
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => loadTemplate("healthcare")}
                >
                  <Code className="mr-2 h-4 w-4" />
                  Healthcare Records
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={() => loadTemplate("financial")}
                >
                  <Code className="mr-2 h-4 w-4" />
                  Financial Transactions
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info Box */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">About Schema-Based Generation</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>No training required:</strong> Generate data instantly from a schema definition
            </p>
            <p>
              <strong>Fast iteration:</strong> Perfect for prototyping and testing
            </p>
            <p>
              <strong>Type-aware:</strong> Realistic data based on column types (emails, phones, dates, etc.)
            </p>
            <p>
              <strong>Scalable:</strong> Generate from 1 to 100,000 rows in seconds
            </p>
            <p className="pt-2 text-muted-foreground/80">
              💡 Tip: For production use cases with statistical fidelity to real data, use model-based generators instead
            </p>
          </CardContent>
        </Card>
      </AppShell>
    </ProtectedRoute>
  )
}
