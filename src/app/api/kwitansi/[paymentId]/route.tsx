import { renderToBuffer } from "@react-pdf/renderer";
import { ReceiptDocument } from "@/features/pembayaran/receipt-pdf";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: Request, ctx: RouteContext<"/api/kwitansi/[paymentId]">) {
  const { paymentId } = await ctx.params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const [{ data: payment }, { data: profile }] = await Promise.all([
    supabase
      .from("payments")
      .select("*, leases(properties(name, address), tenants(name)), payment_allocations(amount, invoices(period_month))")
      .eq("id", paymentId)
      .maybeSingle(),
    supabase.from("profiles").select("*").eq("id", userId).single(),
  ]);
  if (!payment) return new Response("Not found", { status: 404 });

  const buffer = await renderToBuffer(
    <ReceiptDocument
      data={{
        receiptNo: payment.receipt_no,
        paidAt: payment.paid_at,
        amount: payment.amount,
        method: payment.method,
        notes: payment.notes,
        propertyName: payment.leases?.properties?.name ?? "-",
        propertyAddress: payment.leases?.properties?.address ?? null,
        tenantName: payment.leases?.tenants?.name ?? "-",
        owner: {
          name: profile?.full_name ?? null,
          phone: profile?.phone ?? null,
          bank: profile?.bank_name ? `${profile.bank_name} ${profile.bank_account ?? ""} a.n. ${profile.bank_holder ?? ""}`.trim() : null,
        },
        allocations: payment.payment_allocations
          .map((a) => ({ month: a.invoices?.period_month ?? "", amount: a.amount }))
          .filter((a) => a.month)
          .sort((a, b) => a.month.localeCompare(b.month)),
      }}
    />,
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="kwitansi-${payment.receipt_no}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
