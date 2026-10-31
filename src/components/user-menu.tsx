import { LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";

export async function UserMenu() {
  const { supabase, userId } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", userId).single();

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-muted-foreground sm:inline">{profile?.full_name ?? "Pemilik"}</span>
      <form action={logout}>
        <Button variant="ghost" size="icon" aria-label="Keluar" type="submit">
          <LogOut className="size-4" />
        </Button>
      </form>
    </div>
  );
}
