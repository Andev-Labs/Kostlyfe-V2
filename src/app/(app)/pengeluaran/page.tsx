import type { Metadata } from "next";
import { Paperclip, Pencil, Plus, Trash2 } from "lucide-react";
import { ConfirmAction } from "@/components/confirm-action";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { UrlSelect } from "@/components/url-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { deleteExpense, saveExpense } from "@/features/pengeluaran/actions";
import { ExpenseFormDialog } from "@/features/pengeluaran/expense-form";
import { requireUser } from "@/lib/auth";
import { EXPENSE_CATEGORIES, categoryLabel } from "@/lib/billing";
import { dateLabel, rupiah } from "@/lib/format";
import { signedUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Pengeluaran" };

export default async function PengeluaranPage({ searchParams }: PageProps<"/pengeluaran">) {
  const { supabase } = await requireUser();
  const params = await searchParams;
  const kategori = typeof params.kategori === "string" ? params.kategori : "";
  const kontrakan = typeof params.kontrakan === "string" ? params.kontrakan : "";

  let query = supabase.from("expenses").select("*, properties(name)").order("expense_date", { ascending: false }).limit(300);
  if (kategori) query = query.eq("category", kategori as (typeof EXPENSE_CATEGORIES)[number]["value"]);
  if (kontrakan) query = query.eq("property_id", kontrakan);

  const [{ data: expenses }, { data: properties }] = await Promise.all([
    query,
    supabase.from("properties").select("id, name").order("name"),
  ]);
  const rows = await Promise.all(
    (expenses ?? []).map(async (e) => ({ ...e, receiptUrl: await signedUrl(supabase, "expense-receipts", e.receipt_path) })),
  );
  const total = rows.reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <PageHeader
        title="Pengeluaran"
        description={`Total ${rupiah(total)}`}
        actions={
          <ExpenseFormDialog
            action={saveExpense.bind(null, null)}
            properties={properties ?? []}
            trigger={
              <Button>
                <Plus /> Catat pengeluaran
              </Button>
            }
          />
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <UrlSelect
          param="kategori"
          label="Kategori"
          value={kategori}
          options={[{ value: "", label: "Semua kategori" }, ...EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))]}
        />
        <UrlSelect
          param="kontrakan"
          label="Kontrakan"
          value={kontrakan}
          options={[{ value: "", label: "Semua kontrakan" }, ...(properties ?? []).map((p) => ({ value: p.id, label: p.name }))]}
        />
      </div>
      {rows.length === 0 ? (
        <EmptyState title="Belum ada pengeluaran" />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Kontrakan</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{dateLabel(e.expense_date)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{categoryLabel(e.category)}</Badge>
                  </TableCell>
                  <TableCell>{e.properties?.name ?? <span className="text-muted-foreground">Umum</span>}</TableCell>
                  <TableCell className="max-w-64 truncate">{e.notes}</TableCell>
                  <TableCell className="text-right font-medium">{rupiah(e.amount)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {e.receiptUrl && (
                        <Button variant="ghost" size="icon-sm" asChild aria-label="Lihat struk">
                          <a href={e.receiptUrl} target="_blank" rel="noreferrer">
                            <Paperclip />
                          </a>
                        </Button>
                      )}
                      <ExpenseFormDialog
                        action={saveExpense.bind(null, e.id)}
                        properties={properties ?? []}
                        expense={e}
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label="Ubah">
                            <Pencil />
                          </Button>
                        }
                      />
                      <ConfirmAction
                        title="Hapus pengeluaran?"
                        action={deleteExpense.bind(null, e.id)}
                        trigger={
                          <Button variant="ghost" size="icon-sm" aria-label="Hapus">
                            <Trash2 />
                          </Button>
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
