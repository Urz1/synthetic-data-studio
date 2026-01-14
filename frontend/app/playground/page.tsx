"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Plus, 
  Trash2, 
  Download, 
  Sparkles, 
  ArrowRight, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Home,
  Upload,
  FileSpreadsheet,
  Wand2,
  Info,
  Database,
  Rocket,
  ShieldCheck,
  Lock,
  Zap,
  FileJson,
  GripVertical
} from "lucide-react"
import { Reorder } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

// Types
interface PlaygroundColumn {
  id: string
  name: string
  type: string
}

interface Template {
  id: string
  name: string
  description: string
  columns: PlaygroundColumn[]
  suggested_rows: number
}

interface DemoDataset {
  id: string
  name: string
  description: string
  row_count: number
  column_count: number
  columns: string[]
}

// Constants
const COLUMN_TYPES = [
  { value: "string", label: "Text" },
  { value: "integer", label: "Integer" },
  { value: "float", label: "Decimal" },
  { value: "boolean", label: "Yes/No" },
  { value: "date", label: "Date" },
  { value: "datetime", label: "DateTime" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "uuid", label: "UUID" },
  { value: "name", label: "Name" },
  { value: "address", label: "Address" },
]

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "customer",
    name: "Customer Database",
    description: "Names, emails, and contact info",
    columns: [
      { id: "t1-1", name: "customer_id", type: "uuid" },
      { id: "t1-2", name: "first_name", type: "string" },
      { id: "t1-3", name: "last_name", type: "string" },
      { id: "t1-4", name: "email", type: "email" },
      { id: "t1-5", name: "phone", type: "phone" },
    ],
    suggested_rows: 1000,
  },
  {
    id: "transactions",
    name: "Transactions",
    description: "Financial transaction records",
    columns: [
      { id: "t2-1", name: "transaction_id", type: "uuid" },
      { id: "t2-2", name: "amount", type: "float" },
      { id: "t2-3", name: "currency", type: "string" },
      { id: "t2-4", name: "timestamp", type: "datetime" },
    ],
    suggested_rows: 500,
  },
]

const ML_MODELS = [
  { value: "ctgan", label: "CTGAN", description: "Best for mixed data types" },
  { value: "tvae", label: "TVAE", description: "Best for numerical data" },
]

const MAX_COLUMNS = 10
const MAX_ROWS = 5000
const MIN_ROWS_FOR_TRAINING = 100
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export default function PlaygroundPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Schema mode state
  const [columns, setColumns] = useState<PlaygroundColumn[]>([
    { id: "1", name: "id", type: "uuid" },
    { id: "2", name: "name", type: "string" },
    { id: "3", name: "email", type: "email" },
  ])
  const [numRows, setNumRows] = useState(1000)
  
  // ML mode state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedDemo, setSelectedDemo] = useState<string>("")
  const [modelType, setModelType] = useState("ctgan")
  const [mlNumRows, setMlNumRows] = useState(1000)
  const [demoDatasets, setDemoDatasets] = useState<DemoDataset[]>([])
  
  // Shared state
  const [loading, setLoading] = useState(false)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [generationComplete, setGenerationComplete] = useState(false)
  const [generationsUsed, setGenerationsUsed] = useState(0)
  const [activeTab, setActiveTab] = useState("schema")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  // Load generations count and demo datasets on mount
  useEffect(() => {
    // Load generations counter
    const stored = localStorage.getItem("playground_generations")
    if (stored) {
      try {
        const data = JSON.parse(stored)
        const hourAgo = Date.now() - 3600000
        if (data.timestamp > hourAgo) {
          setGenerationsUsed(data.count)
        } else {
          localStorage.removeItem("playground_generations")
        }
      } catch {
        localStorage.removeItem("playground_generations")
      }
    }
    
    // Fetch demo datasets (fail silently - demos are optional)
    const fetchDemoDatasets = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/playground/demo-datasets`)
        if (res.ok) {
          const data = await res.json()
          setDemoDatasets(data.demo_datasets || [])
        }
      } catch {
        // Backend might not be running - that's okay, demos are optional
        console.log("Demo datasets unavailable - backend may not be running")
      }
    }
    fetchDemoDatasets()
  }, [])

  const remainingGenerations = Math.max(0, 3 - generationsUsed)

  // Schema mode handlers
  const addColumn = () => {
    if (columns.length >= MAX_COLUMNS) {
      toast({
        title: "Column limit reached",
        description: `Maximum ${MAX_COLUMNS} columns in playground mode. Sign up for more.`,
        variant: "destructive",
      })
      return
    }
    setColumns([...columns, { id: crypto.randomUUID(), name: "", type: "string" }])
  }

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index))
  }

  const updateColumn = (index: number, field: keyof PlaygroundColumn, value: string) => {
    const updated = [...columns]
    updated[index] = { ...updated[index], [field]: value }
    setColumns(updated)
  }

  const loadTemplate = (template: Template) => {
    // Generate fresh IDs to avoid potential conflicts if logic changes to append
    const freshColumns = template.columns.map(c => ({
      ...c,
      id: crypto.randomUUID()
    }))
    setColumns(freshColumns)
    setNumRows(template.suggested_rows)
    toast({
      title: "Template loaded",
      description: `Loaded "${template.name}" template`,
    })
  }

  // File upload handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please upload a CSV file",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file)
      setSelectedDemo("")
    }
  }

  const handleDemoSelect = (demoId: string) => {
    setSelectedDemo(demoId)
    setSelectedFile(null)
  }

  // Keyboard handler for file upload area
  const handleUploadKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      fileInputRef.current?.click()
    }
  }

  // Update generation counter
  const incrementGenerationCounter = () => {
    const newCount = generationsUsed + 1
    setGenerationsUsed(newCount)
    localStorage.setItem("playground_generations", JSON.stringify({
      count: newCount,
      timestamp: Date.now(),
    }))
  }

  // Schema-based generation
  const handleSchemaGenerate = async () => {
    const validColumns = columns.filter(c => c.name.trim())
    if (validColumns.length === 0) {
      toast({ title: "No columns defined", description: "Add at least one column with a name", variant: "destructive" })
      return
    }

    // Check for duplicate column names (case-insensitive)
    const names = validColumns.map(c => c.name.toLowerCase())
    const duplicates = validColumns.filter(c => names.filter(n => n === c.name.toLowerCase()).length > 1)
    if (duplicates.length > 0) {
      toast({ 
        title: "Duplicate column names", 
        description: `Column names must be unique: ${[...new Set(duplicates.map(d => d.name))].join(", ")}`, 
        variant: "destructive" 
      })
      return
    }

    if (remainingGenerations <= 0) {
      toast({ title: "Generation limit reached", description: "Create a free account to continue", variant: "destructive" })
      return
    }

    setLoading(true)
    setGenerationComplete(false)

    try {
      const response = await fetch(`${BACKEND_URL}/playground/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ columns: validColumns, num_rows: numRows }),
      })

      if (response.status === 429) {
        toast({ title: "Rate limit exceeded", description: "Hourly limit reached. Create an account for unlimited access.", variant: "destructive" })
        return
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Generation failed")
      }

      // Download CSV
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "synth_studio_schema.csv"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      incrementGenerationCounter()
      setGenerationComplete(true)
      setShowSuccessDialog(true)
      toast({ title: "Download started!", description: `Generated ${numRows.toLocaleString()} rows of synthetic data` })

    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        toast({ 
          title: "Backend unavailable", 
          description: "The server is not running. Please start the backend server.", 
          variant: "destructive" 
        })
      } else {
        toast({ 
          title: "Generation failed", 
          description: error instanceof Error ? error.message : "Unknown error", 
          variant: "destructive" 
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // ML-based generation
  const handleMLGenerate = async () => {
    if (!selectedFile && !selectedDemo) {
      toast({ title: "No data source", description: "Upload a CSV file or select a demo dataset", variant: "destructive" })
      return
    }

    if (remainingGenerations <= 0) {
      toast({ title: "Generation limit reached", description: "Create a free account to continue", variant: "destructive" })
      return
    }

    setLoading(true)
    setGenerationComplete(false)
    setTrainingProgress(0)

    // Simulate training progress
    const progressInterval = setInterval(() => {
      setTrainingProgress(prev => Math.min(prev + 5, 90))
    }, 1000)

    try {
      const formData = new FormData()
      if (selectedFile) {
        formData.append("file", selectedFile)
      } else {
        formData.append("demo_dataset", selectedDemo)
      }
      formData.append("model_type", modelType)
      formData.append("num_rows", mlNumRows.toString())

      const response = await fetch(`${BACKEND_URL}/playground/train-and-generate`, {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setTrainingProgress(100)

      if (response.status === 429) {
        toast({ title: "Rate limit exceeded", description: "Hourly limit reached. Create an account for unlimited access.", variant: "destructive" })
        return
      }

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Training failed")
      }

      // Download CSV
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `synth_studio_${modelType}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      incrementGenerationCounter()
      setGenerationComplete(true)
      setShowSuccessDialog(true)
      toast({ title: "Download started!", description: `Generated ${mlNumRows.toLocaleString()} synthetic rows using ${modelType.toUpperCase()}` })

    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        toast({ 
          title: "Backend unavailable", 
          description: "The server is not running. Please start the backend server.", 
          variant: "destructive" 
        })
      } else {
        toast({ 
          title: "Training failed", 
          description: error instanceof Error ? error.message : "Unknown error", 
          variant: "destructive" 
        })
      }
    } finally {
      clearInterval(progressInterval)
      setLoading(false)
      setTrainingProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Responsive */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-base sm:text-lg" aria-label="Go to Synth Studio homepage">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl overflow-hidden flex items-center justify-center bg-muted border border-border">
              <Image src="/FInal_Logo.png" alt="" width={40} height={40} className="object-contain" aria-hidden="true" />
            </div>
            <span className="hidden xs:inline">Synth Studio</span>
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/" aria-label="Back to home page">
              <Home className="h-4 w-4 sm:mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Hero - Responsive */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            Generate Synthetic Data <span className="text-primary">Instantly</span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-4 sm:mb-6 px-2">
            No sign-up required. Define a schema or upload your data.
          </p>
          <Badge variant="secondary" className="gap-2">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Data processed locally. Zero server storage.
          </Badge>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Main Tabs - Responsive */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-12 sm:h-14">
              <TabsTrigger value="schema" className="gap-1 sm:gap-2 text-sm sm:text-base px-2 sm:px-4" aria-label="Define schema for instant generation">
                <Wand2 className="h-4 w-4" aria-hidden="true" />
                <span className="hidden xs:inline">Define</span> Schema
                <Badge variant="outline" className="ml-1 hidden sm:inline-flex text-xs">Instant</Badge>
              </TabsTrigger>
              <TabsTrigger value="upload" className="gap-1 sm:gap-2 text-sm sm:text-base px-2 sm:px-4" aria-label="Upload data and train ML model">
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload <span className="hidden xs:inline">& Train</span>
                <Badge variant="outline" className="ml-1 hidden sm:inline-flex text-xs">ML</Badge>
              </TabsTrigger>
            </TabsList>

            {/* Schema Tab */}
            <TabsContent value="schema" className="space-y-4 sm:space-y-6">
              
              <Alert className="bg-primary/5 border-primary/20">
                <Zap className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-medium">Don't know your schema structure?</AlertTitle>
                <AlertDescription className="flex items-center gap-2 mt-1">
                  Use our <span className="font-semibold">AI Generator</span> to create schemas from natural language.
                  <Link href="/register" className="underline hover:text-primary/80">Sign up free</Link>
                </AlertDescription>
              </Alert>

              <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="text-lg sm:text-xl">Define Your Schema</CardTitle>
                      <CardDescription className="text-sm">
                        Add up to {MAX_COLUMNS} columns. Max {MAX_ROWS.toLocaleString()} rows.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Column List - Responsive & Draggable */}
                      <Reorder.Group axis="y" values={columns} onReorder={setColumns} className="space-y-3">
                        {columns.map((column, index) => (
                          <Reorder.Item key={column.id} value={column}>
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 sm:items-center bg-card">
                              <div className="flex items-center justify-center p-2 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground transition-colors">
                                <GripVertical className="h-4 w-4" />
                              </div>
                              <Input
                                id={`column-name-${column.id}`}
                                placeholder="Column name"
                                value={column.name}
                                onChange={(e) => updateColumn(index, "name", e.target.value)}
                                className="flex-1"
                                aria-label={`Column ${index + 1} name`}
                              />
                              <div className="flex gap-2 items-center">
                                <Select value={column.type} onValueChange={(value) => updateColumn(index, "type", value)}>
                                  <SelectTrigger className="w-full sm:w-[140px]" aria-label={`Column ${index + 1} type`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {COLUMN_TYPES.map((type) => (
                                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button 
                                  type="button"
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeColumn(index)} 
                                  disabled={columns.length === 1}
                                  aria-label={`Remove column ${column.name || index + 1}`}
                                  className="shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </Button>
                              </div>
                            </div>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>

                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={addColumn} 
                        className="w-full" 
                        disabled={columns.length >= MAX_COLUMNS}
                        aria-label={`Add new column. ${MAX_COLUMNS - columns.length} remaining`}
                      >
                        <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Add Column
                      </Button>

                      {/* Row Count - Responsive */}
                      <div className="pt-4 border-t space-y-2">
                        <Label htmlFor="row-count">Number of Rows</Label>
                        <div className="flex flex-wrap gap-2 mb-2" role="group" aria-label="Preset row counts">
                          {[100, 500, 1000, 2500, 5000].map((preset) => (
                            <Button 
                              key={preset} 
                              type="button"
                              variant={numRows === preset ? "default" : "outline"} 
                              size="sm" 
                              onClick={() => setNumRows(preset)}
                              aria-pressed={numRows === preset}
                              className="min-w-[60px]"
                            >
                              {preset.toLocaleString()}
                            </Button>
                          ))}
                        </div>
                        <Input 
                          id="row-count"
                          type="number" 
                          min={10} 
                          max={MAX_ROWS} 
                          value={numRows} 
                          onChange={(e) => setNumRows(Math.min(MAX_ROWS, Math.max(10, parseInt(e.target.value) || 10)))}
                          aria-describedby="row-count-hint"
                        />
                        <p id="row-count-hint" className="sr-only">Enter a number between 10 and {MAX_ROWS.toLocaleString()}</p>
                      </div>

                      {/* Generate Button */}
                      <Button 
                        type="button"
                        onClick={handleSchemaGenerate} 
                        className="w-full h-11 sm:h-12 text-base sm:text-lg font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" 
                        disabled={loading || remainingGenerations <= 0}
                        aria-busy={loading}
                        aria-describedby="generation-status"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-5 w-5" aria-hidden="true" />
                            <span>Generate & Download CSV</span>
                          </>
                        )}
                      </Button>

                      {/* Remaining Counter */}
                      <div id="generation-status" className="flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
                        {remainingGenerations > 0 ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                            <span>{remainingGenerations} free generation{remainingGenerations !== 1 ? 's' : ''} remaining</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                            <span>Limit reached. <Link href="/register" className="text-primary underline hover:no-underline focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">Sign up</Link> for unlimited access.</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar - Templates & Upsells */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Quick Templates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                       {DEFAULT_TEMPLATES.map((template) => (
                        <Button 
                          key={template.id} 
                          type="button"
                          variant="outline" 
                          className="w-full justify-start h-auto py-3 text-left transition-all duration-200 hover:bg-muted/50" 
                          onClick={() => loadTemplate(template)}
                        >
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-xs text-muted-foreground">{template.description}</div>
                          </div>
                        </Button>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Upsell Card */}
                  <Card className="bg-gradient-to-br from-primary/5 to-muted border-primary/10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                      <Rocket className="h-24 w-24" />
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-primary" />
                        Unlock Full Potential
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex gap-2 items-start">
                        <Lock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p>Generate <strong>1M</strong> rows</p>
                      </div>
                      <div className="flex gap-2 items-start">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p>Get detailed <strong>Privacy Reports</strong></p>
                      </div>
                      <div className="flex gap-2 items-start">
                        <FileJson className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p>Export as <strong>JSON</strong></p>
                      </div>
                      <Button className="w-full mt-2" size="sm" asChild>
                        <Link href="/register">Sign up for free</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-4 sm:space-y-6">
              {/* Min Rows Alert */}
              <Alert>
                <Info className="h-4 w-4" aria-hidden="true" />
                <AlertTitle>Minimum {MIN_ROWS_FOR_TRAINING} rows required</AlertTitle>
                <AlertDescription className="text-sm">
                  ML models need sufficient data to learn patterns. For smaller datasets, use the schema-based approach.
                </AlertDescription>
              </Alert>

              <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="text-lg sm:text-xl">Upload Your Data</CardTitle>
                      <CardDescription className="text-sm">
                        Train a model on your data and generate a synthetic twin.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 sm:space-y-6">
                      {/* File Upload - Accessible */}
                      <div className="space-y-3">
                        <Label htmlFor="file-upload">Source Data</Label>
                        <div 
                          role="button"
                          tabIndex={0}
                          className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                            ${selectedFile ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
                          onClick={() => fileInputRef.current?.click()}
                          onKeyDown={handleUploadKeyDown}
                          aria-label={selectedFile ? `Selected file: ${selectedFile.name}. Press Enter to change file.` : "Click or press Enter to upload a CSV file"}
                        >
                          <input 
                            ref={fileInputRef} 
                            id="file-upload"
                            type="file" 
                            accept=".csv" 
                            className="sr-only" 
                            onChange={handleFileSelect}
                            aria-describedby="upload-hint"
                          />
                          {selectedFile ? (
                            <div className="space-y-2">
                              <FileSpreadsheet className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-primary" aria-hidden="true" />
                              <p className="font-medium text-sm sm:text-base truncate max-w-[200px] mx-auto">{selectedFile.name}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">Click to change file</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-muted-foreground" aria-hidden="true" />
                              <p className="font-medium text-sm sm:text-base">Click to upload CSV</p>
                              <p id="upload-hint" className="text-xs sm:text-sm text-muted-foreground">Max 5MB, min {MIN_ROWS_FOR_TRAINING} rows</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Demo Datasets - Responsive Grid */}
                      {demoDatasets.length > 0 && (
                        <div className="space-y-3">
                          <Label>Or try a demo dataset</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3" role="group" aria-label="Demo datasets">
                            {demoDatasets.map((demo) => (
                              <Button
                                key={demo.id}
                                type="button"
                                variant={selectedDemo === demo.id ? "default" : "outline"}
                                className="h-auto py-3 justify-start transition-all duration-200"
                                onClick={() => handleDemoSelect(demo.id)}
                                aria-pressed={selectedDemo === demo.id}
                              >
                                <Database className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                                <div className="text-left min-w-0">
                                  <div className="font-medium truncate">{demo.name}</div>
                                  <div className="text-xs opacity-80">{demo.row_count} rows</div>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Model Selection */}
                      <div className="space-y-3">
                        <Label htmlFor="model-type">Model Type</Label>
                        <Select value={modelType} onValueChange={setModelType}>
                          <SelectTrigger id="model-type" aria-describedby="model-hint">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ML_MODELS.map((model) => (
                              <SelectItem key={model.value} value={model.value}>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                  <span className="font-medium">{model.label}</span>
                                  <span className="text-muted-foreground text-xs sm:text-sm">– {model.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p id="model-hint" className="sr-only">CTGAN is best for mixed data types, TVAE is best for numerical data</p>
                      </div>

                      {/* Privacy Upsell */}
                      <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium flex items-center gap-1.5">
                              <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                              Privacy Protection
                            </Label>
                            <p className="text-[10px] text-muted-foreground">Differential Privacy & Anonymization</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="h-5 text-[10px] px-1.5">PRO</Badge>
                            <Switch disabled id="privacy-mode" />
                          </div>
                        </div>
                        <Button variant="link" className="h-auto p-0 text-xs text-primary w-full justify-start" asChild>
                           <Link href="/register">Sign up to unlock privacy safeguards</Link>
                        </Button>
                      </div>

                      {/* Row Count - Responsive */}
                      <div className="space-y-2">
                        <Label htmlFor="ml-row-count">Rows to Generate</Label>
                        <div className="flex flex-wrap gap-2 mb-2" role="group" aria-label="Preset row counts">
                          {[100, 500, 1000, 2500, 5000].map((preset) => (
                            <Button 
                              key={preset} 
                              type="button"
                              variant={mlNumRows === preset ? "default" : "outline"} 
                              size="sm" 
                              onClick={() => setMlNumRows(preset)}
                              aria-pressed={mlNumRows === preset}
                              className="min-w-[60px]"
                            >
                              {preset.toLocaleString()}
                            </Button>
                          ))}
                        </div>
                        <Input 
                          id="ml-row-count"
                          type="number" 
                          min={10} 
                          max={MAX_ROWS} 
                          value={mlNumRows} 
                          onChange={(e) => setMlNumRows(Math.min(MAX_ROWS, Math.max(10, parseInt(e.target.value) || 10)))}
                        />
                      </div>

                      {/* Training Progress */}
                      {loading && (
                        <div className="space-y-2" role="progressbar" aria-valuenow={trainingProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Training progress">
                          <div className="flex justify-between text-sm">
                            <span>Training {modelType.toUpperCase()}...</span>
                            <span>{trainingProgress}%</span>
                          </div>
                          <Progress value={trainingProgress} className="h-2" />
                          <p className="text-xs text-muted-foreground">This may take 30s-2min depending on data size</p>
                        </div>
                      )}

                      {/* Generate Button */}
                      <Button 
                        type="button"
                        onClick={handleMLGenerate} 
                        className="w-full h-11 sm:h-12 text-base sm:text-lg font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]" 
                        disabled={loading || remainingGenerations <= 0 || (!selectedFile && !selectedDemo)}
                        aria-busy={loading}
                        aria-describedby="ml-generation-status"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                            <span>Training...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-5 w-5" aria-hidden="true" />
                            <span>Train & Generate</span>
                          </>
                        )}
                      </Button>

                      {/* Remaining Counter */}
                      <div id="ml-generation-status" className="flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
                        {remainingGenerations > 0 ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                            <span>{remainingGenerations} free generation{remainingGenerations !== 1 ? 's' : ''} remaining</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                            <span>Limit reached. <Link href="/register" className="text-primary underline hover:no-underline focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded">Sign up</Link> for unlimited access.</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Info Sidebar */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Why ML Training?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <p>ML models learn your data's patterns:</p>
                      <ul className="space-y-2" role="list">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                          <span>Preserves column correlations</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                          <span>Matches original distributions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                          <span>Realistic edge cases</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Need More?</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-muted-foreground">
                      <p>Sign up free to unlock:</p>
                      <ul className="space-y-2" role="list">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                          <span>Up to 1,000,000 rows</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                          <span>300 training epochs</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                          <span>Save & manage datasets</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                          <span>Privacy reports</span>
                        </li>
                      </ul>
                      <Button asChild className="w-full mt-4 font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                        <Link href="/register">
                          Sign Up Free <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Success Message */}
          {generationComplete && (
            <Card className="border-primary/50 bg-primary/5 mt-6" role="alert" aria-live="polite">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-primary shrink-0" aria-hidden="true" />
                  <div className="space-y-3">
                    <h3 className="font-semibold">Download Complete!</h3>
                    <p className="text-sm text-muted-foreground">
                      Want to save your datasets, train longer, and generate up to 1M rows?
                    </p>
                    <Button asChild className="font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
                      <Link href="/register">
                        Create Free Account <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 sm:mt-16 py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6 text-center text-xs sm:text-sm text-muted-foreground">
          © 2025 Synth Studio. Open Source under MIT License.
        </div>
      </footer>
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Generation Successful!
            </DialogTitle>
            <DialogDescription>
              Your dataset has been downloaded to your device.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <h4 className="font-semibold text-primary flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4" />
                Want more realistic data?
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Our <strong>AI-Enhanced Generator</strong> understands context and relationships better than simple rules.
              </p>
              <Button size="sm" className="w-full" asChild>
                <Link href="/register">Try AI Generator Free</Link>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex flex-col gap-1 p-3 rounded-md bg-muted/50">
                <ShieldCheck className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="font-medium">Privacy Reports</span>
                <span className="text-xs text-muted-foreground">Verify safety & utility</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-md bg-muted/50">
                <FileJson className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="font-medium">Model Cards</span>
                <span className="text-xs text-muted-foreground">Track data lineage</span>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={() => setShowSuccessDialog(false)}>
              Continue Testing
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/register">Create Free Account</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
