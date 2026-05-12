import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
  Rect,
  Font,
} from "@react-pdf/renderer";
import type { Invoice, InvoiceLineItem, Worker, Employer } from "@/types/db";
import { brand } from "./brand";

// Use default Helvetica family — no remote font fetch needed.
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0A0A0A",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    letterSpacing: 2,
  },
  small: {
    fontSize: 9,
    color: "#666",
    marginTop: 2,
  },
  invoiceMetaLabel: {
    fontSize: 9,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  invoiceNumber: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    marginTop: 4,
  },
  twoCol: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 28,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  colLabel: {
    fontSize: 9,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  colValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
  },
  colSubvalue: {
    fontSize: 10,
    color: "#444",
    marginTop: 2,
    lineHeight: 1.45,
  },
  tableHeader: {
    flexDirection: "row",
    paddingTop: 24,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#0A0A0A",
  },
  tableHeaderCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#666",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  cellLeft: { flex: 3, textAlign: "left" },
  cellRight: { flex: 1, textAlign: "right" },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  totalsLabel: {
    width: 100,
    textAlign: "right",
    color: "#666",
    fontSize: 10,
  },
  totalsValue: {
    width: 90,
    textAlign: "right",
    fontSize: 10,
  },
  grandTotalLabel: {
    width: 100,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    marginTop: 8,
  },
  grandTotalValue: {
    width: 90,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    marginTop: 8,
  },
  footer: {
    marginTop: 40,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    fontSize: 9,
    color: "#666",
    lineHeight: 1.5,
  },
  payBlock: {
    backgroundColor: "#FACC15",
    color: "#0A0A0A",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 14,
    borderRadius: 6,
  },
  payTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});

export type InvoicePDFData = {
  invoice: Invoice;
  employer: Pick<Employer, "name" | "billing_email" | "billing_address">;
  lines: (InvoiceLineItem & { worker: Pick<Worker, "full_name"> | null })[];
};

export function InvoicePDF({ data }: { data: InvoicePDFData }) {
  const { invoice, employer, lines } = data;

  return (
    <Document
      title={`${invoice.invoice_number} — ${brand.legalName}`}
      author={brand.legalName}
      subject={`Invoice ${invoice.invoice_number}`}
    >
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <View style={styles.brand}>
              <Svg width={18} height={28} viewBox="0 0 40 48">
                <Path
                  d="M2 4 L20 44 L38 4 L30 4 L20 26 L10 4 Z"
                  fill="#FACC15"
                />
              </Svg>
              <Text style={styles.brandText}>VERTEX</Text>
            </View>
            <Text style={styles.small}>{brand.legalName}</Text>
            <Text style={styles.small}>{brand.supportEmail}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.invoiceMetaLabel}>Invoice</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
            <Text style={styles.small}>
              Issued: {new Date(invoice.created_at).toLocaleDateString()}
            </Text>
            <Text style={styles.small}>Due: {invoice.due_date ?? "—"}</Text>
          </View>
        </View>

        {/* Bill to / period */}
        <View style={styles.twoCol}>
          <View style={{ flex: 1 }}>
            <Text style={styles.colLabel}>Bill to</Text>
            <Text style={styles.colValue}>{employer.name}</Text>
            {employer.billing_address && (
              <Text style={styles.colSubvalue}>{employer.billing_address}</Text>
            )}
            {employer.billing_email && (
              <Text style={styles.colSubvalue}>{employer.billing_email}</Text>
            )}
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={styles.colLabel}>Period</Text>
            <Text style={styles.colValue}>
              {invoice.period_start} → {invoice.period_end}
            </Text>
            <Text style={[styles.colSubvalue, { marginTop: 8 }]}>
              Status: {invoice.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Line items */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, styles.cellLeft]}>Description</Text>
          <Text style={[styles.tableHeaderCell, styles.cellRight]}>Hours</Text>
          <Text style={[styles.tableHeaderCell, styles.cellRight]}>Rate</Text>
          <Text style={[styles.tableHeaderCell, styles.cellRight]}>Amount</Text>
        </View>
        {lines.length === 0 ? (
          <View style={{ paddingVertical: 16 }}>
            <Text style={{ color: "#666", textAlign: "center" }}>No line items.</Text>
          </View>
        ) : (
          lines.map((l) => (
            <View key={l.id} style={styles.tableRow}>
              <Text style={styles.cellLeft}>{l.description}</Text>
              <Text style={styles.cellRight}>{Number(l.hours).toFixed(2)}</Text>
              <Text style={styles.cellRight}>${Number(l.rate).toFixed(2)}</Text>
              <Text style={[styles.cellRight, { fontFamily: "Helvetica-Bold" }]}>
                ${Number(l.amount).toFixed(2)}
              </Text>
            </View>
          ))
        )}

        {/* Totals */}
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Subtotal</Text>
          <Text style={styles.totalsValue}>${Number(invoice.subtotal).toFixed(2)}</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>Tax</Text>
          <Text style={styles.totalsValue}>${Number(invoice.tax).toFixed(2)}</Text>
        </View>
        <View style={styles.totalsRow}>
          <Text style={styles.grandTotalLabel}>Total due</Text>
          <Text style={styles.grandTotalValue}>${Number(invoice.total).toFixed(2)}</Text>
        </View>

        {/* Payment block */}
        <View style={styles.payBlock}>
          <Text style={styles.payTitle}>How to pay</Text>
          <Text style={{ marginTop: 4 }}>
            Remit via ACH or check payable to {brand.legalName}. Reference{" "}
            {invoice.invoice_number} on your payment. Questions: {brand.supportEmail}.
          </Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Thank you for partnering with {brand.legalName}. This invoice covers the period
          {" "}{invoice.period_start} through {invoice.period_end}. Payment is due
          {invoice.due_date ? ` on ${invoice.due_date}` : " on receipt"}. Late payments may
          incur a 1.5% monthly finance charge.
        </Text>
      </Page>
    </Document>
  );
}
