"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";

export interface UseDeleteWithProgressOptions {
  /** Entity type for toast messages (e.g., "Dataset", "Generator") */
  entityType: string;
  /** Callback to remove item from local state after successful deletion */
  onSuccess?: (id: string) => void;
  /** Callback on deletion error */
  onError?: (id: string, error: Error) => void;
}

export interface UseDeleteWithProgressReturn {
  /** Whether any deletion is in progress */
  isDeleting: boolean;
  /** The ID currently being deleted (null if none) */
  deletingId: string | null;
  /** Set of IDs in "ghost" state (being deleted or animating out) */
  ghostIds: Set<string>;
  /** Start deletion for an item */
  startDelete: (
    id: string,
    name: string,
    deleteFn: () => Promise<void>
  ) => Promise<void>;
  /** Check if a specific ID is being deleted */
  isDeletingId: (id: string) => boolean;
  /** Check if a specific ID is in ghost state */
  isGhostId: (id: string) => boolean;
}

/**
 * Hook for consistent deletion UX with progress indication.
 *
 * Features:
 * - Shows "Deleting <name>…" toast immediately on start
 * - Tracks items in "ghost" state (opacity-40) during deletion
 * - Updates toast to success/error on completion
 * - Provides ghost state for row styling
 * - Ensures deleted item is removed from UI
 */
export function useDeleteWithProgress({
  entityType,
  onSuccess,
  onError,
}: UseDeleteWithProgressOptions): UseDeleteWithProgressReturn {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [ghostIds, setGhostIds] = React.useState<Set<string>>(new Set());

  const startDelete = React.useCallback(
    async (id: string, name: string, deleteFn: () => Promise<void>) => {
      // Prevent concurrent deletions
      if (deletingId) return;

      setDeletingId(id);
      setGhostIds((prev) => new Set(prev).add(id));

      // Show "Deleting..." toast
      const { dismiss } = toast({
        title: `Deleting ${name}...`,
        description: "Please wait while the item is being removed.",
      });

      try {
        await deleteFn();

        // Dismiss the "Deleting..." toast
        dismiss();

        // Show success toast
        toast({
          title: `${entityType} deleted`,
          description: `${name} has been permanently removed.`,
        });

        // Call success callback to remove from local state
        onSuccess?.(id);

        // Keep in ghost state briefly for animation, then remove
        setTimeout(() => {
          setGhostIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        }, 200);
      } catch (error) {
        // Dismiss the "Deleting..." toast
        dismiss();

        // Show error toast
        toast({
          title: `Could not delete ${name}`,
          description: "Please try again.",
          variant: "destructive",
        });

        // Remove from ghost state (revert to normal)
        setGhostIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });

        // Call error callback
        onError?.(
          id,
          error instanceof Error ? error : new Error(String(error))
        );
      } finally {
        setDeletingId(null);
      }
    },
    [deletingId, entityType, onSuccess, onError, toast]
  );

  const isDeletingId = React.useCallback(
    (id: string) => deletingId === id,
    [deletingId]
  );

  const isGhostId = React.useCallback(
    (id: string) => ghostIds.has(id),
    [ghostIds]
  );

  return {
    isDeleting: deletingId !== null,
    deletingId,
    ghostIds,
    startDelete,
    isDeletingId,
    isGhostId,
  };
}
