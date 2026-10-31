import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function WaButton({ href, label = "Kirim pengingat WhatsApp" }: { href: string | null; label?: string }) {
  if (!href) {
    return (
      <Button variant="ghost" size="icon-sm" disabled aria-label="Nomor WA belum diisi">
        <MessageCircle />
      </Button>
    );
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" asChild aria-label={label}>
          <a href={href} target="_blank" rel="noreferrer">
            <MessageCircle className="text-emerald-600" />
          </a>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
