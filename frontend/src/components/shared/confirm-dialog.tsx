"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl p-6 sm:p-8 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold text-navy-800 mb-2">{title}</DialogTitle>
          <DialogDescription className="text-sm text-navy-500 font-body">{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 mt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm text-navy-600 hover:bg-navy-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-body font-semibold text-white transition-all shadow-sm disabled:opacity-50",
              destructive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-500 hover:to-gold-600"
            )}
          >
            {loading ? "Procesando..." : confirmLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
