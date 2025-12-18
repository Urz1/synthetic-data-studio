"use client"

import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

export interface DeleteConfirmationDialogProps {
  /** The type of entity being deleted (e.g., "Dataset", "Generator") */
  entityType: string
  /** The name of the specific entity being deleted */
  entityName?: string
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void
  /** Callback when deletion is confirmed */
  onConfirm: () => void | Promise<void>
  /** Whether deletion is in progress */
  isDeleting?: boolean
}

/**
 * Standard deletion confirmation dialog following Synth Studio UX guidelines.
 * 
 * Features:
 * - Headline: "Delete <Entity-Type>?"
 * - Body: "This <entity-type> will be permanently erased. You cannot undo this action."
 * - Checkbox confirmation: "I understand this is permanent."
 * - Primary CTA: "Delete <Entity-Type>" in danger red (disabled until checkbox checked)
 * - Cancel button is default focus
 */
export function DeleteConfirmationDialog({
  entityType,
  entityName,
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
}: DeleteConfirmationDialogProps) {
  const [confirmed, setConfirmed] = React.useState(false)

  // Reset confirmation when dialog closes
  React.useEffect(() => {
    if (!open) {
      setConfirmed(false)
    }
  }, [open])

  const handleConfirm = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirmed || isDeleting) return
    await onConfirm()
  }

  const entityTypeLower = entityType.toLowerCase()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {entityType}?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                {entityName ? (
                  <>
                    <strong>{entityName}</strong> will be permanently erased.
                  </>
                ) : (
                  <>This {entityTypeLower} will be permanently erased.</>
                )}{" "}
                You cannot undo this action.
              </p>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm-delete"
                  checked={confirmed}
                  onCheckedChange={(checked) => setConfirmed(checked === true)}
                  disabled={isDeleting}
                />
                <Label
                  htmlFor="confirm-delete"
                  className="text-sm font-normal cursor-pointer"
                >
                  I understand this is permanent
                </Label>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!confirmed || isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              `Delete ${entityType}`
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
