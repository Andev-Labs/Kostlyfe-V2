import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { toLeaseOption } from "@/features/pembayaran/lease-option";

type Client = SupabaseClient<Database>;

export async function getActiveLeaseOptions(supabase: Client) {
  const { data } = await supabase
    .from("lease_summaries")
    .select("id, property_name, tenant_name, monthly_rent, outstanding, first_unpaid_month, last_invoice_month")
    .eq("status", "active")
    .order("property_name");
  return (data ?? []).map(toLeaseOption);
}

export async function getWaTemplate(supabase: Client, userId: string) {
  const { data } = await supabase.from("profiles").select("wa_template").eq("id", userId).single();
  return data?.wa_template ?? null;
}
