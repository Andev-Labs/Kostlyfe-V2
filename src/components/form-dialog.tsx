"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/actions";
import { cn } from "@/lib/utils";

export function FormDialog({
  trigger,
  title,
  description,
  action,
  children,
  submitLabel = "Simpan",
  className,
}: {
  trigger: React.ReactNode;
  title: string;
  description?: string;
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  submitLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(async (_prev, formData) => {
    const result = await action(formData);
    if (result.ok) {
      toast.success(result.message ?? "Tersimpan");
      setOpen(false);
    }
    return result;
  }, null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className={cn("max-h-[90svh] overflow-y-auto sm:max-w-lg", className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {children}
          {state && !state.ok && <p className="text-sm text-destructive">{state.message}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
