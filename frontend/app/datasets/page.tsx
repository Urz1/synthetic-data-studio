"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DatasetCard } from "@/components/datasets/dataset-card"
import { Plus, Search, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Dataset } from "@/lib/types"

// Mock data
const mockDatasets: Dataset[] = [
  {
    id: "1",
    project_id: "p1",
    name: "patients.csv",
    original_filename: "patients.csv",
    size_bytes: 2457600,
    row_count: 10000,
    schema_data: {
      columns: ["id", "name", "age", "gender", "diagnosis", "ssn", "email"],
      dtypes: {
        id: "int64",
        name: "object",
        age: "int64",
        gender: "object",
        diagnosis: "object",
        ssn: "object",
        email: "object",
      },
    },
    status: "profiled",
    checksum: "sha256:abc123",
    pii_flags: {
      name: { pii_type: "PERSON_NAME", confidence: 0.95 },
      ssn: { pii_type: "US_SSN", confidence: 0.99 },
      email: { pii_type: "EMAIL_ADDRESS", confidence: 0.98 },
    },
    version: 1,
    uploader_id: "user1",
    uploaded_at: "2024-12-10T10:00:00Z",
  },
  {
    id: "2",
    project_id: "p1",
    name: "transactions.csv",
    original_filename: "transactions.csv",
    size_bytes: 5242880,
    row_count: 50000,
    schema_data: {
      columns: ["transaction_id", "amount", "date", "merchant", "category"],
      dtypes: {
        transaction_id: "int64",
        amount: "float64",
        date: "datetime64",
        merchant: "object",
        category: "object",
      },
    },
    status: "profiled",
    checksum: "sha256:def456",
    version: 1,
    uploader_id: "user1",
    uploaded_at: "2024-12-12T14:30:00Z",
  },
  {
    id: "3",
    project_id: "p1",
    name: "customers.json",
    original_filename: "customers.json",
    size_bytes: 1048576,
    row_count: 5000,
    schema_data: {
      columns: ["customer_id", "first_name", "last_name", "email", "phone", "address"],
      dtypes: {
        customer_id: "int64",
        first_name: "object",
        last_name: "object",
        email: "object",
        phone: "object",
        address: "object",
      },
    },
    status: "uploaded",
    checksum: "sha256:ghi789",
    pii_flags: {
      email: { pii_type: "EMAIL_ADDRESS", confidence: 0.97 },
      phone: { pii_type: "PHONE_NUMBER", confidence: 0.92 },
    },
    version: 1,
    uploader_id: "user1",
    uploaded_at: "2024-12-14T09:15:00Z",
  },
]

export default function DatasetsPage() {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const { user } = useAuth()

  const filteredDatasets = mockDatasets.filter((dataset) => {
    const matchesSearch = dataset.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || dataset.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <AppShell user={user || { full_name: "", email: "" }}>
      <PageHeader
        title="Datasets"
        description="Manage your uploaded datasets for synthetic data generation"
        actions={
          <Button asChild>
            <Link href="/datasets/upload">
              <Plus className="mr-2 h-4 w-4" />
              Upload Dataset
            </Link>
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search datasets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="uploaded">Uploaded</SelectItem>
              <SelectItem value="profiling">Profiling</SelectItem>
              <SelectItem value="profiled">Profiled</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dataset Grid */}
      {filteredDatasets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDatasets.map((dataset) => (
            <DatasetCard key={dataset.id} dataset={dataset} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {search || statusFilter !== "all" ? "No datasets match your filters" : "No datasets uploaded yet"}
          </p>
          {!search && statusFilter === "all" && (
            <Button asChild>
              <Link href="/datasets/upload">
                <Plus className="mr-2 h-4 w-4" />
                Upload your first dataset
              </Link>
            </Button>
          )}
        </div>
      )}
    </AppShell>
  )
}
