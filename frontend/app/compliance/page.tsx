"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, FileCheck, AlertCircle, Download, CheckCircle2, XCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import ProtectedRoute from "@/components/layout/protected-route"
import type { ComplianceReport } from "@/lib/types"

// Mock compliance reports
const mockComplianceReports: ComplianceReport[] = [
  {
    id: "comp-1",
    generator_id: "gen-123",
    framework: "GDPR",
    status: "compliant",
    report_data: {
      privacy_by_design: true,
      data_minimization: true,
      purpose_limitation: true,
      storage_limitation: true,
      integrity_confidentiality: true,
      consent_mechanism: "explicit",
      right_to_erasure: true,
    },
    generated_at: "2024-12-03T14:30:00Z",
  },
  {
    id: "comp-2",
    generator_id: "gen-456",
    framework: "HIPAA",
    status: "compliant",
    report_data: {
      phi_protection: true,
      access_controls: true,
      audit_controls: true,
      integrity_controls: true,
      transmission_security: true,
      encryption_at_rest: true,
      encryption_in_transit: true,
    },
    generated_at: "2024-12-02T10:15:00Z",
  },
  {
    id: "comp-3",
    generator_id: "gen-789",
    framework: "CCPA",
    status: "warning",
    report_data: {
      consumer_notice: true,
      opt_out_mechanism: true,
      data_deletion: true,
      non_discrimination: false,  // Warning trigger
      privacy_policy_updated: true,
    },
    generated_at: "2024-12-01T08:00:00Z",
  },
  {
    id: "comp-4",
    generator_id: "gen-old",
    framework: "SOC2",
    status: "non_compliant",
    report_data: {
      security_controls: true,
      availability_controls: false,  // Failure
      processing_integrity: true,
      confidentiality: true,
      privacy: false,  // Failure
    },
    generated_at: "2024-11-28T16:45:00Z",
  },
]

const frameworkInfo = {
  GDPR: {
    name: "General Data Protection Regulation",
    description: "EU data protection and privacy regulation",
    icon: "🇪🇺",
  },
  HIPAA: {
    name: "Health Insurance Portability and Accountability Act",
    description: "US healthcare data protection",
    icon: "🏥",
  },
  CCPA: {
    name: "California Consumer Privacy Act", 
    description: "California consumer privacy law",
    icon: "🇺🇸",
  },
  SOC2: {
    name: "Service Organization Control 2",
    description: "Security, availability, and confidentiality controls",
    icon: "🔒",
  },
}

export default function CompliancePage() {
  const { user } = useAuth()
  const [selectedFramework, setSelectedFramework] = useState<"all" | "GDPR" | "HIPAA" | "CCPA" | "SOC2">("all")

  const filteredReports = selectedFramework === "all" 
    ? mockComplianceReports
    : mockComplianceReports.filter(r => r.framework === selectedFramework)

  const complianceColumns = [
    {
      key: "framework",
      header: "Framework",
      accessor: (row: ComplianceReport) => (
        <div className="flex items-center gap-2">
          <span className="text-xl">{frameworkInfo[row.framework].icon}</span>
          <div>
            <div className="font-medium">{row.framework}</div>
            <div className="text-xs text-muted-foreground">{frameworkInfo[row.framework].name}</div>
          </div>
        </div>
      ),
    },
    {
      key: "generator",
      header: "Generator",
      accessor: (row: ComplianceReport) => (
        <code className="text-xs bg-muted px-2 py-1 rounded">{row.generator_id}</code>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (row: ComplianceReport) => {
        const statusConfig = {
          compliant: { variant: "default" as const, icon: CheckCircle2, label: "Compliant" },
          warning: { variant: "secondary" as const, icon: AlertCircle, label: "Warning" },
          non_compliant: { variant: "destructive" as const, icon: XCircle, label: "Non-Compliant" },
        }
        const config = statusConfig[row.status]
        const Icon = config.icon

        return (
          <Badge variant={config.variant} className="gap-1">
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        )
      },
    },
    {
      key: "generated_at",
      header: "Generated",
      accessor: (row: ComplianceReport) => new Date(row.generated_at).toLocaleDateString(),
    },
  ]

  const getComplianceStats = () => {
    const total = mockComplianceReports.length
    const compliant = mockComplianceReports.filter(r => r.status === "compliant").length
    const warnings = mockComplianceReports.filter(r => r.status === "warning").length
    const nonCompliant = mockComplianceReports.filter(r => r.status === "non_compliant").length

    return { total, compliant, warnings, nonCompliant }
  }

  const stats = getComplianceStats()

  return (
    <ProtectedRoute>
      <AppShell user={user || { full_name: "", email: "" }}>
        <PageHeader
          title="Compliance"
          description="Monitor compliance status across various frameworks"
          actions={
            <Button>
              <FileCheck className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          }
        />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Compliant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.compliant}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{stats.warnings}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Non-Compliant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.nonCompliant}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4" onValueChange={(v) => setSelectedFramework(v as any)}>
          <TabsList>
            <TabsTrigger value="all">All Frameworks</TabsTrigger>
            <TabsTrigger value="GDPR">GDPR</TabsTrigger>
            <TabsTrigger value="HIPAA">HIPAA</TabsTrigger>
            <TabsTrigger value="CCPA">CCPA</TabsTrigger>
            <TabsTrigger value="SOC2">SOC 2</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Reports</CardTitle>
                <CardDescription>All compliance assessments across frameworks</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable
                  data={filteredReports}
                  columns={complianceColumns}
                  keyExtractor={(row) => row.id}
                  compact
                  emptyMessage="No compliance reports generated yet"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {(["GDPR", "HIPAA", "CCPA", "SOC2"] as const).map((framework) => (
            <TabsContent key={framework} value={framework} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{frameworkInfo[framework].icon}</span>
                    <div>
                      <CardTitle>{frameworkInfo[framework].name}</CardTitle>
                      <CardDescription>{frameworkInfo[framework].description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable
                    data={filteredReports}
                    columns={complianceColumns}
                    keyExtractor={(row) => row.id}
                    compact
                    emptyMessage={`No ${framework} reports generated yet`}
                  />
                </CardContent>
              </Card>

              {/* Framework-specific details */}
              {filteredReports.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Latest Assessment Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(filteredReports[0].report_data).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                          <span className="text-sm">{key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</span>
                          {typeof value === "boolean" ? (
                            value ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )
                          ) : (
                            <Badge variant="outline">{String(value)}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </AppShell>
    </ProtectedRoute>
  )
}
