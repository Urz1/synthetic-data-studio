"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DataTable } from "@/components/ui/data-table"
import { BarChart3, Hash, Calendar, Type, AlertTriangle } from "lucide-react"
import type { Dataset, ColumnProfile, PiiFlag } from "@/lib/types"

interface DatasetProfileViewProps {
  dataset: Dataset
  className?: string
}

interface ColumnInfo {
  name: string
  dtype: string
  profile?: ColumnProfile
  piiFlag?: PiiFlag
}

const typeIcons = {
  numeric: Hash,
  categorical: Type,
  datetime: Calendar,
  text: Type,
}

export function DatasetProfileView({ dataset, className }: DatasetProfileViewProps) {
  const columns: ColumnInfo[] = React.useMemo(() => {
    // Handle different schema_data formats (flat string record vs nested object)
    let schemaMap: Record<string, any> = {};
    if (dataset.schema_data) {
      if ('dtypes' in dataset.schema_data && typeof dataset.schema_data.dtypes === 'object') {
        // Handle nested structure: { dtypes: { col: type }, ... }
        schemaMap = dataset.schema_data.dtypes as Record<string, any>;
      } else {
        // Handle flat structure: { col: type }
        schemaMap = dataset.schema_data;
      }
    }

    const columnNames = Object.keys(schemaMap);
    
    return columnNames.map((colName: string) => {
      // Ensure dtype is a string, not an object
      const typesVal = schemaMap[colName];
      const dtype = typeof typesVal === 'string' ? typesVal : JSON.stringify(typesVal);

      return {
        name: colName,
        dtype: dtype || "unknown",
        profile: dataset.profiling_data?.columns?.[colName],
        piiFlag: dataset.pii_flags?.[colName],
      }
    })
  }, [dataset])

  const piiColumns = columns.filter((col) => col.piiFlag)

  const tableColumns = [
    {
      key: "name",
      header: "Column",
      accessor: (row: ColumnInfo) => (
        <div className="flex items-center gap-2">
          {row.piiFlag && <AlertTriangle className="h-4 w-4 text-warning-foreground shrink-0" />}
          <span className="font-mono text-sm">{row.name}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "type",
      header: "Type",
      accessor: (row: ColumnInfo) => {
        const Icon = typeIcons[row.profile?.type || "text"]
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm capitalize">{row.profile?.type || row.dtype}</span>
          </div>
        )
      },
    },
    {
      key: "missing",
      header: "Missing",
      accessor: (row: ColumnInfo) => (
        <span
          className={cn("text-sm font-mono", (row.profile?.missing_percent || 0) > 10 && "text-warning-foreground")}
        >
          {row.profile?.missing_percent?.toFixed(1) || 0}%
        </span>
      ),
      sortable: true,
    },
    {
      key: "stats",
      header: "Statistics",
      accessor: (row: ColumnInfo) => {
        if (!row.profile) return <span className="text-muted-foreground text-sm">-</span>

        if (row.profile.type === "numeric") {
          return (
            <div className="text-xs text-muted-foreground space-x-2">
              <span>min: {row.profile.min?.toFixed(1)}</span>
              <span>max: {row.profile.max?.toFixed(1)}</span>
              <span>μ: {row.profile.mean?.toFixed(1)}</span>
            </div>
          )
        }

        if (row.profile.type === "categorical") {
          return <span className="text-xs text-muted-foreground">{row.profile.unique_count} unique values</span>
        }

        return <span className="text-muted-foreground text-sm">-</span>
      },
    },
    {
      key: "pii",
      header: "PII",
      accessor: (row: ColumnInfo) => {
        if (!row.piiFlag) {
          return (
            <Badge variant="outline" className="text-xs">
              None
            </Badge>
          )
        }
        return (
          <Badge
            variant="secondary"
            className={cn("text-xs", row.piiFlag.confidence > 0.9 && "bg-risk/10 text-risk border-risk/20")}
          >
            {row.piiFlag.pii_type}
            <span className="ml-1 opacity-60">{(row.piiFlag.confidence * 100).toFixed(0)}%</span>
          </Badge>
        )
      },
    },
  ]

  return (
    <Card className={className}>
      <CardHeader className="pb-2 sm:pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Dataset Profile
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {dataset.row_count?.toLocaleString()} rows, {dataset.schema_data ? Object.keys(dataset.schema_data).length : 0} columns
            </CardDescription>
          </div>
          {piiColumns.length > 0 && (
            <Badge variant="secondary" className="bg-warning/10 text-warning-foreground border-warning/20 w-fit text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {piiColumns.length} PII
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="columns">
          <div className="overflow-x-auto -mx-1 px-1">
            <TabsList className="w-max min-w-full">
              <TabsTrigger value="columns" className="text-xs sm:text-sm">Columns</TabsTrigger>
              <TabsTrigger value="pii" disabled={piiColumns.length === 0} className="text-xs sm:text-sm">
                <span className="hidden sm:inline">PII Detection</span>
                <span className="sm:hidden">PII</span>
                {piiColumns.length > 0 && (
                  <Badge variant="secondary" className="ml-1 sm:ml-2 h-4 sm:h-5 px-1 sm:px-1.5 text-xs">
                    {piiColumns.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="correlations" className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Correlations</span>
                <span className="sm:hidden">Corr</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="columns" className="mt-4">
            <div className="overflow-x-auto -mx-2 px-2">
              <DataTable data={columns} columns={tableColumns} keyExtractor={(row) => row.name} compact />
            </div>
          </TabsContent>

          <TabsContent value="pii" className="mt-4">
            {piiColumns.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-warning/20 bg-warning/5 p-4">
                  <p className="text-sm text-warning-foreground">
                    Detected potentially sensitive columns. Consider excluding or transforming these before generating
                    synthetic data.
                  </p>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {piiColumns.map((col) => (
                      <div key={col.name} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono font-medium">{col.name}</span>
                          <Badge
                            className={cn(
                              col.piiFlag!.confidence > 0.9
                                ? "bg-risk/10 text-risk border-risk/20"
                                : "bg-warning/10 text-warning-foreground border-warning/20",
                            )}
                          >
                            {col.piiFlag!.pii_type}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Confidence</span>
                          <span className="font-mono">{(col.piiFlag!.confidence * 100).toFixed(0)}%</span>
                        </div>
                        {col.piiFlag!.sample_matches && (
                          <div className="mt-2 pt-2 border-t">
                            <span className="text-xs text-muted-foreground">Sample matches:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {col.piiFlag!.sample_matches.slice(0, 3).map((match, i) => (
                                <code key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                  {match}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No PII detected in this dataset</div>
            )}
          </TabsContent>

          <TabsContent value="correlations" className="mt-4">
            {dataset.profiling_data?.correlations ? (
              <div className="text-sm text-muted-foreground">Correlation matrix would be displayed here</div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Run profiling to generate correlation analysis
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
