import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { dateLabel, monthLabel, rupiah } from "@/lib/format";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  muted: { color: "#666" },
  box: { border: "1pt solid #ddd", borderRadius: 6, padding: 14, marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  label: { color: "#666", width: 140 },
  amount: { fontSize: 18, fontFamily: "Helvetica-Bold" },
  tableHead: { flexDirection: "row", borderBottom: "1pt solid #ddd", paddingBottom: 4, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  tableRow: { flexDirection: "row", paddingVertical: 3 },
  footer: { marginTop: 40, flexDirection: "row", justifyContent: "flex-end" },
  sign: { width: 180, alignItems: "center" },
});

export type ReceiptData = {
  receiptNo: string;
  paidAt: string;
  amount: number;
  method: string;
  notes: string | null;
  propertyName: string;
  propertyAddress: string | null;
  tenantName: string;
  owner: { name: string | null; phone: string | null; bank: string | null };
  allocations: { month: string; amount: number }[];
};

export function ReceiptDocument({ data }: { data: ReceiptData }) {
  return (
    <Document title={`Kwitansi ${data.receiptNo}`}>
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>KWITANSI</Text>
            <Text style={styles.muted}>No. {data.receiptNo}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{data.owner.name ?? "Pemilik"}</Text>
            {data.owner.phone && <Text style={styles.muted}>{data.owner.phone}</Text>}
            {data.owner.bank && <Text style={styles.muted}>{data.owner.bank}</Text>}
          </View>
        </View>

        <View style={styles.box}>
          <View style={styles.row}>
            <Text style={styles.label}>Telah terima dari</Text>
            <Text style={{ flex: 1 }}>{data.tenantName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Untuk pembayaran</Text>
            <Text style={{ flex: 1 }}>
              Sewa {data.propertyName}
              {data.propertyAddress ? ` (${data.propertyAddress})` : ""}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tanggal / metode</Text>
            <Text style={{ flex: 1 }}>
              {dateLabel(data.paidAt)} · {data.method === "cash" ? "Tunai" : "Transfer"}
            </Text>
          </View>
          {data.notes && (
            <View style={styles.row}>
              <Text style={styles.label}>Catatan</Text>
              <Text style={{ flex: 1 }}>{data.notes}</Text>
            </View>
          )}
          <View style={[styles.row, { marginTop: 8, marginBottom: 0 }]}>
            <Text style={styles.label}>Jumlah</Text>
            <Text style={[styles.amount, { flex: 1 }]}>{rupiah(data.amount)}</Text>
          </View>
        </View>

        {data.allocations.length > 0 && (
          <View>
            <View style={styles.tableHead}>
              <Text style={{ flex: 1 }}>Periode sewa</Text>
              <Text style={{ width: 120, textAlign: "right" }}>Dialokasikan</Text>
            </View>
            {data.allocations.map((a) => (
              <View key={a.month} style={styles.tableRow}>
                <Text style={{ flex: 1 }}>{monthLabel(a.month)}</Text>
                <Text style={{ width: 120, textAlign: "right" }}>{rupiah(a.amount)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.sign}>
            <Text style={styles.muted}>Penerima,</Text>
            <Text style={{ marginTop: 40, fontFamily: "Helvetica-Bold" }}>{data.owner.name ?? "Pemilik"}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
