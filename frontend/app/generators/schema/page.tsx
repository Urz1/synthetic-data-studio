"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Code, Sparkles, Plus, Trash2, Download, Zap } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"

interface SchemaColumn {
  name: string
  type: string
  format?: string
  constraints?: Record<string, unknown>
}

export default function SchemaGeneratorPage() {
  const { user } = useAuth()
  const [columns, setColumns] = useState<SchemaColumn[]>([
    { name: "id", type: "integer", format: "auto_increment" },
  ])
  const [numRows, setNumRows] = useState(1000)
  const [schemaJson, setSchemaJson] = useState("")
  const [generatedData, setGeneratedData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

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

  const handleGenerate = async () => {
    setLoading(true)
    // Mock generation - in real implementation, call api.generateSchemaBased()
    setTimeout(() => {
      setGeneratedData({
        id: "gen-schema-123",
        type: "schema",
        status: "completed",
        output_dataset_id: "ds-generated-456",
        rows: numRows,
      })
      setLoading(false)
    }, 2000)
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
              <Tabs defaultValue="builder">
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
                  <Textarea
                    placeholder='{\n  "columns": [\n    {"name": "id", "type": "integer"},\n    {"name": "email", "type": "email"}\n  ]\n}'
                    rows={12}
                    value={schemaJson}
                    onChange={(e) => setSchemaJson(e.target.value)}
                    className="font-mono text-sm"
                  />
                </TabsContent>
              </Tabs>

              <div className="space-y-2">
                <Label>Number of Rows</Label>
                <Input
                  type="number"
                  min={1}
                  max={100000}
                  value={numRows}
                  onChange={(e) => setNumRows(parseInt(e.target.value) || 1000)}
                />
                <p className="text-xs text-muted-foreground">
                  Generate up to 100,000 rows instantly
                </p>
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
                    <Button className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Download CSV
                    </Button>
                    <Button variant="outline" className="flex-1">
                      View Dataset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Examples */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quick Start Templates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Code className="mr-2 h-4 w-4" />
                  Customer Database
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Code className="mr-2 h-4 w-4" />
                  E-commerce Orders
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Code className="mr-2 h-4 w-4" />
                  Healthcare Records
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
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
