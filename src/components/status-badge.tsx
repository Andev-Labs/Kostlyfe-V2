import { Badge } from "@/components/ui/badge";
import { statusMeta } from "@/lib/billing";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: string | null; className?: string }) {
  const meta = statusMeta(status);
  return (
    <Badge variant="outline" className={cn(meta.className, className)}>
      {meta.label}
    </Badge>
  );
}
