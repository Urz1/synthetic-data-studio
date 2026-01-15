"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Zap,
  MoreVertical,
  Play,
  Trash2,
  Eye,
  FileText,
  AlertTriangle,
  Cpu,
} from "lucide-react";
import type { Generator } from "@/lib/types";

interface GeneratorListRowProps {
  generator: Generator;
  onDelete?: () => void;
}

/* ---------- helpers ---------- */
const statusColors: Record<string, { dot: string; text: string }> = {
  pending: { dot: "bg-muted-foreground", text: "text-muted-foreground" },
  training: { dot: "bg-primary animate-pulse", text: "text-primary" },
  generating: { dot: "bg-primary animate-pulse", text: "text-primary" },
  completed: { dot: "bg-success", text: "text-success" },
  failed: { dot: "bg-risk", text: "text-risk" },
};

const modelTypeLabels: Record<string, string> = {
  ctgan: "CTGAN",
  tvae: "TVAE",
  "dp-ctgan": "dp_ctgan",
  "dp-tvae": "dp_tvae",
  timegan: "TimeGAN",
  schema: "Schema-based",
};

function getPrivacyBadge(generator: Generator) {
  if (generator.privacy_config?.use_differential_privacy) {
    const ε = generator.privacy_config.target_epsilon;
    if (ε && ε <= 1)
      return {
        label: "STRONG PRIVACY",
        className: "bg-success text-white border-success",
      };
    if (ε && ε <= 5)
      return {
        label: "MODERATE PRIVACY",
        className: "bg-primary text-white border-primary",
      };
    return {
      label: "DP ENABLED",
      className: "bg-warning text-black border-warning",
    };
  }
  return {
    label: "NO DP",
    className: "bg-muted text-muted-foreground border-border",
  };
}

function getIconForGenerator(generator: Generator) {
  const base = "h-4 w-4";
  if (generator.status === "failed")
    return (
      <div className="rounded-lg p-2 bg-risk/10">
        <AlertTriangle className={`${base} text-risk`} />
      </div>
    );
  if (generator.type === "schema")
    return (
      <div className="rounded-lg p-2 bg-success/10">
        <Cpu className={`${base} text-success`} />
      </div>
    );
  return (
    <div className="rounded-lg p-2 bg-primary/10">
      <Zap className={`${base} text-primary`} />
    </div>
  );
}
/* ---------- /helpers ---------- */

export function GeneratorListRow({
  generator,
  onDelete,
}: GeneratorListRowProps) {
  const privacy = getPrivacyBadge(generator);
  const status = statusColors[generator.status] || statusColors.pending;
  const created = new Date(generator.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const displayName =
    generator.name.length > 35
      ? generator.name.slice(0, 32) + "…"
      : generator.name;

  return (
    <tr className="hover:bg-muted/50 transition-colors border-b border-border/50">
      {/* Icon + Name */}
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          {getIconForGenerator(generator)}
          <div className="min-w-0">
            <Link
              href={`/generators/${generator.id}`}
              className="font-medium text-sm hover:text-primary transition-colors block"
              title={generator.name}
            >
              {displayName}
            </Link>
            <p className="text-xs text-muted-foreground">Created {created}</p>
          </div>
        </div>
      </td>

      {/* Model Type */}
      <td className="hidden md:table-cell py-4 px-4 whitespace-nowrap">
        <span className="text-sm text-muted-foreground">
          {modelTypeLabels[generator.type] || generator.type}
        </span>
      </td>

      {/* Status */}
      <td className="py-4 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status.dot}`} />
          <span className={`text-sm capitalize ${status.text}`}>
            {generator.status}
          </span>
        </div>
      </td>

      {/* Privacy */}
      <td className="hidden lg:table-cell py-4 px-4">
        <Badge variant="outline" className={`text-xs ${privacy.className}`}>
          {privacy.label}
        </Badge>
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
              <Link href={`/generators/${generator.id}`}>
                <Eye className="mr-2 h-4 w-4" /> View Details
              </Link>
            </DropdownMenuItem>

            {generator.status === "completed" && (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`/generators/${generator.id}/generate`}>
                    <Play className="mr-2 h-4 w-4" /> Generate Data
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/evaluations/new?generator=${generator.id}`}>
                    <FileText className="mr-2 h-4 w-4" /> Run Evaluation
                  </Link>
                </DropdownMenuItem>
              </>
            )}

            {onDelete && (
              <DropdownMenuItem
                onClick={onDelete}
                className="text-risk focus:text-risk"
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
