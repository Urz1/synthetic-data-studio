"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Database,
  MoreVertical,
  Eye,
  Trash2,
  Download,
  AlertTriangle,
} from "lucide-react";
import type { Dataset } from "@/lib/types";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import * as React from "react";

interface DatasetListRowProps {
  dataset: Dataset;
  onDelete?: () => void;
}

const statusColors: Record<string, { dot: string; text: string }> = {
  uploaded: { dot: "bg-success", text: "text-success" },
  profiling: { dot: "bg-primary animate-pulse", text: "text-primary" },
  profiled: { dot: "bg-success", text: "text-success" },
  error: { dot: "bg-risk", text: "text-risk" },
};

export function DatasetListRow({ dataset, onDelete }: DatasetListRowProps) {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = React.useState(false);
  const status = statusColors[dataset.status] || statusColors.uploaded;

  const uploadedDate = new Date(dataset.uploaded_at).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  const formatSize = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Truncate long names
  const displayName =
    dataset.name.length > 35
      ? dataset.name.substring(0, 32) + "..."
      : dataset.name;

  const hasPii = dataset.pii_flags && Object.keys(dataset.pii_flags).length > 0;
  const piiCount = hasPii ? Object.keys(dataset.pii_flags!).length : 0;

  const handleDownload = async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    toast({
      title: "Preparing download...",
      description: `Getting ${dataset.name} ready`,
    });

    try {
      const result = await api.downloadDataset(dataset.id);
      if (result.download_url) {
        window.open(result.download_url, "_blank");
        toast({
          title: "Download Started",
          description: "Your file is being downloaded",
        });
      }
    } catch (err) {
      toast({
        title: "Download Failed",
        description:
          err instanceof Error ? err.message : "Failed to download dataset",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <tr className="hover:bg-muted/50 transition-colors border-b border-border/50">
      {/* Icon + Name */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg p-2 bg-primary/10">
            <Database className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <Link
              href={`/datasets/${dataset.id}`}
              className="font-medium text-sm hover:text-primary transition-colors block"
              title={dataset.name}
            >
              {displayName}
            </Link>
            <p className="text-xs text-muted-foreground">
              Uploaded {uploadedDate}
            </p>
          </div>
        </div>
      </td>

      {/* Rows */}
      <td className="hidden sm:table-cell py-4 px-4 whitespace-nowrap">
        <span className="text-sm font-mono">
          {dataset.row_count?.toLocaleString() || "-"}
        </span>
      </td>

      {/* Columns */}
      <td className="hidden sm:table-cell py-4 px-4 whitespace-nowrap">
        <span className="text-sm font-mono">
          {dataset.column_count ||
            Object.keys(dataset.schema_data || {}).length ||
            0}
        </span>
      </td>

      {/* Size */}
      <td className="hidden md:table-cell py-4 px-4 whitespace-nowrap">
        <span className="text-sm font-mono text-muted-foreground">
          {formatSize(dataset.size_bytes)}
        </span>
      </td>

      {/* Status */}
      <td className="py-4 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status.dot}`} />
          <span className={`text-sm capitalize ${status.text}`}>
            {dataset.status}
          </span>
        </div>
      </td>

      {/* PII */}
      <td className="hidden lg:table-cell py-4 px-4">
        {hasPii ? (
          <Badge
            variant="outline"
            className="text-xs bg-warning/10 text-warning-foreground border-warning/20"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            {piiCount} PII
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        )}
      </td>

      {/* Actions */}
      <td className="py-4 px-4 w-12">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/datasets/${dataset.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload} disabled={isDownloading}>
              <Download
                className={`mr-2 h-4 w-4 ${
                  isDownloading ? "animate-pulse" : ""
                }`}
              />
              {isDownloading ? "Downloading..." : "Download"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onDelete && (
              <DropdownMenuItem
                className="text-risk focus:text-risk"
                onClick={onDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
