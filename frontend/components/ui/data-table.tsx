"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, ChevronsUpDown, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Column<T> {
  key: string
  header: string
  accessor: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
  align?: "left" | "center" | "right"
}

interface RowAction<T> {
  label: string
  icon?: React.ReactNode
  onClick: (row: T) => void
  variant?: "default" | "destructive"
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  rowActions?: RowAction<T>[]
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  emptyAction?: { label: string; onClick: () => void }
  className?: string
  compact?: boolean
  stickyHeader?: boolean
  striped?: boolean
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  rowActions,
  emptyMessage = "No data available",
  emptyIcon,
  emptyAction,
  className,
  compact = false,
  stickyHeader = false,
  striped = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null)
  const [sortDirection, setSortDirection] = React.useState<"asc" | "desc">("asc")

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const sortedData = React.useMemo(() => {
    if (!sortKey) return data

    return [...data].sort((a, b) => {
      const column = columns.find((c) => c.key === sortKey)
      if (!column) return 0

      const aValue = column.accessor(a)
      const bValue = column.accessor(b)

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue
      }

      return 0
    })
  }, [data, sortKey, sortDirection, columns])

  const alignmentClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }

  const hasActions = rowActions && rowActions.length > 0
  const totalColumns = hasActions ? columns.length + 1 : columns.length

  return (
    <div className={cn("rounded-xl border bg-card overflow-hidden", className)}>
      <div className={cn(stickyHeader && "max-h-[500px] overflow-auto scrollbar-thin")}>
        <Table>
          <TableHeader className={cn(stickyHeader && "sticky top-0 z-10")}>
            <TableRow className="bg-muted/40 hover:bg-muted/40 border-b-0">
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={cn(
                    "font-medium text-muted-foreground text-xs uppercase tracking-wider",
                    compact ? "py-2.5 px-3" : "py-3 px-4",
                    column.sortable && "cursor-pointer select-none hover:text-foreground transition-colors group",
                    alignmentClasses[column.align || "left"],
                    column.className,
                  )}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                >
                  <div
                    className={cn(
                      "flex items-center gap-1.5",
                      column.align === "right" && "justify-end",
                      column.align === "center" && "justify-center",
                    )}
                  >
                    {column.header}
                    {column.sortable && (
                      <span
                        className={cn(
                          "transition-colors",
                          sortKey === column.key
                            ? "text-foreground"
                            : "text-muted-foreground/50 group-hover:text-muted-foreground",
                        )}
                      >
                        {sortKey === column.key ? (
                          sortDirection === "asc" ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3 w-3" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
              {hasActions && (
                <TableHead className={cn("w-12", compact ? "py-2.5 px-3" : "py-3 px-4")}>
                  <span className="sr-only">Actions</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={totalColumns} className="py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    {emptyIcon && <div className="mb-3 text-muted-foreground/40">{emptyIcon}</div>}
                    <p className="text-sm text-muted-foreground mb-1">{emptyMessage}</p>
                    {emptyAction && (
                      <Button variant="link" size="sm" onClick={emptyAction.onClick} className="mt-2">
                        {emptyAction.label}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, rowIndex) => (
                <TableRow
                  key={keyExtractor(row)}
                  className={cn(
                    "transition-colors group",
                    onRowClick && "cursor-pointer",
                    striped && rowIndex % 2 === 1 && "bg-muted/20",
                    "hover:bg-muted/50",
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={cn(
                        compact ? "py-2.5 px-3" : "py-3.5 px-4",
                        alignmentClasses[column.align || "left"],
                        column.className,
                      )}
                    >
                      {column.accessor(row)}
                    </TableCell>
                  ))}
                  {hasActions && (
                    <TableCell className={cn(compact ? "py-2.5 px-3" : "py-3.5 px-4")}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {rowActions.map((action, index) => (
                            <DropdownMenuItem
                              key={index}
                              onClick={(e) => {
                                e.stopPropagation()
                                action.onClick(row)
                              }}
                              className={cn(action.variant === "destructive" && "text-risk focus:text-risk")}
                            >
                              {action.icon && <span className="mr-2">{action.icon}</span>}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
