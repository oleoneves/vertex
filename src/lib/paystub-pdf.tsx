import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
} from "@react-pdf/renderer";
import type { Worker } from "@/types/db";
import { brand } from "./brand";

const styles = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: "#1F2A3D" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerRow: { paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: "#E5E5E5" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandText: { fontFamily: "Helvetica-Bold", fontSize: 18, letterSpacing: 2 },
  small: { fontSize: 9, color: "#666", marginTop: 2 },
  label: { fontSize: 9, color: "#666", textTransform: "uppercase", letterSpacing: 1 },
  value: { fontFamily: "Helvetica-Bold", fontSize: 12, marginTop: 3 },
  bigNumber: { fontFamily: "Helvetica-Bold", fontSize: 30, marginTop: 4 },
  twoCol: { flexDirection: "row", justifyContent: "space-between", marginTop: 28, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: "#E5E5E5" },
  tableHeader: { flexDirection: "row", paddingTop: 24, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#1F2A3D" },
  tableHeaderCell: { fontFamily: "Helvetica-Bold", fontSize: 9, textTransform: "uppercase", letterSpacing: 1, color: "#666" },
  tableRow: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#EEE" },
  cellLeft: { flex: 3, textAlign: "left" },
  cellRight: { flex: 1, textAlign: "right" },
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
  totalsLabel: { width: 130, textAlign: "right", color: "#666", fontSize: 10 },
  totalsValue: { width: 90, textAlign: "right", fontSize: 10 },
  grandTotalLabel: { width: 130, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 13, marginTop: 8 },
  grandTotalValue: { width: 90, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 16, marginTop: 8 },
  payBlock: { backgroundColor: "#EDB23E", color: "#1F2A3D", paddingVertical: 10, paddingHorizontal: 14, marginTop: 14, borderRadius: 6 },
  payTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" },
  footer: { marginTop: 40, paddingTop: 18, borderTopWidth: 1, borderTopColor: "#E5E5E5", fontSize: 9, color: "#666", lineHeight: 1.5 },
});

export type PaystubData = {
  worker: Pick<Worker, "full_name" | "employee_code" | "payment_method">;
  periodStart: string;
  periodEnd: string;
  lines: { date: string; placement: string; hours: number; rate: number; amount: number }[];
  totals: { hours: number; gross: number };
  paid: { at: string | null; method: string | null; reference: string | null };
};

export function PaystubPDF({ data }: { data: PaystubData }) {
  const { worker, periodStart, periodEnd, lines, totals, paid } = data;
  return (
    <Document
      title={`Paystub ${worker.full_name} ${periodStart}-${periodEnd}`}
      author={brand.legalName}
    >
      <Page size="LETTER" style={styles.page}>
        <View style={[styles.row, styles.headerRow]}>
          <View>
            <View style={styles.brandRow}>
              <Svg width={22} height={22} viewBox="0 0 80 80">
                <Path d="M51 26 L78 2 L78 27 L49 53 Z" fill="#EDB23E" />
                <Path d="M2 27 L25 27 L49 78 L25 53 Z" fill="#EDB23E" />
                <Path d="M2 53 L25 78 L2 78 Z" fill="#EDB23E" />
                <Path d="M65 78 L78 67 L78 78 Z" fill="#EDB23E" />
              </Svg>
              <Text style={styles.brandText}>VERTEX</Text>
            </View>
            <Text style={styles.small}>{brand.legalName}</Text>
            <Text style={styles.small}>{brand.supportEmail}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.label}>Earnings statement</Text>
            <Text style={[styles.value, { fontSize: 16 }]}>
              {periodStart} → {periodEnd}
            </Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Paid to</Text>
            <Text style={styles.value}>{worker.full_name}</Text>
            {worker.employee_code && (
              <Text style={styles.small}>Employee {worker.employee_code}</Text>
            )}
            <Text style={[styles.label, { marginTop: 10 }]}>Payment method</Text>
            <Text style={[styles.value, { textTransform: "uppercase" }]}>
              {worker.payment_method}
            </Text>
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={styles.label}>Gross pay</Text>
            <Text style={styles.bigNumber}>${totals.gross.toFixed(2)}</Text>
            <Text style={styles.small}>{totals.hours.toFixed(2)} hours total</Text>
            {paid.at && (
              <Text style={[styles.small, { marginTop: 6 }]}>
                Paid: {new Date(paid.at).toLocaleDateString()}
                {paid.reference ? ` · ${paid.reference}` : ""}
              </Text>
            )}
          </View>
        </View>

        {/* Lines */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.cellLeft]}>Date</Text>
          <Text style={[styles.tableHeaderCell, styles.cellLeft]}>Assignment</Text>
          <Text style={[styles.tableHeaderCell, styles.cellRight]}>Hours</Text>
          <Text style={[styles.tableHeaderCell, styles.cellRight]}>Rate</Text>
          <Text style={[styles.tableHeaderCell, styles.cellRight]}>Amount</Text>
        </View>
        {lines.length === 0 ? (
          <View style={{ paddingVertical: 16 }}>
            <Text style={{ color: "#666", textAlign: "center" }}>
              No approved hours in this period.
            </Text>
          </View>
        ) : (
          lines.map((l, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cellLeft, { flex: 1 }]}>{l.date}</Text>
              <Text style={[styles.cellLeft, { flex: 3 }]}>{l.placement}</Text>
              <Text style={styles.cellRight}>{l.hours.toFixed(2)}</Text>
              <Text style={styles.cellRight}>${l.rate.toFixed(2)}</Text>
              <Text style={[styles.cellRight, { fontFamily: "Helvetica-Bold" }]}>
                ${l.amount.toFixed(2)}
              </Text>
            </View>
          ))
        )}

        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Total hours</Text>
          <Text style={styles.totalsValue}>{totals.hours.toFixed(2)}</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.grandTotalLabel}>Gross pay</Text>
          <Text style={styles.grandTotalValue}>${totals.gross.toFixed(2)}</Text>
        </View>

        <View style={styles.payBlock}>
          <Text style={styles.payTitle}>About this statement</Text>
          <Text style={{ marginTop: 4 }}>
            This earnings statement reflects approved hours for the period above. Payment is
            issued via the method on file. Questions about your pay? Contact{" "}
            {brand.supportEmail}.
          </Text>
        </View>

        <Text style={styles.footer}>
          {brand.legalName} · Earnings statement only — not a tax document. Your annual W-2 will be
          provided by Vertex in January.
        </Text>
      </Page>
    </Document>
  );
}
