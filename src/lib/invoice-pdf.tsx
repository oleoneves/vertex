import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Path,
  Font,
} from "@react-pdf/renderer";
import type { Invoice, InvoiceLineItem, Worker, Employer } from "@/types/db";
import { brand } from "./brand";
import { groupInvoiceLines } from "./invoice-grouping";

Font.registerHyphenationCallback((word) => [word]);

const COLORS = {
  black: "#1F2A3D",         // Vertex navy (was pure black)
  ink: "#1F2A3D",
  muted: "#5C6470",
  faint: "#8A8F99",
  line: "#E5E5E5",
  zebra: "#FAFAFA",
  yellow: "#EDB23E",        // Vertex amber (was #FACC15)
  yellowDark: "#CA9518",
  white: "#FFFFFF",
};

const COMPANY = {
  legalName: brand.legalName,
  addressLine1: "2699 Jumping Jack Way",
  addressLine2: "Clermont, FL 34714",
  ein: "EIN 33-4892177",
  phone: "+1 (689) 686-3236",
  email: brand.supportEmail,
  web: brand.domain,
};

const BANK = {
  beneficiary: brand.legalName,
  bankName: "Mercury Bank",
  routing: "084009519",
  account: "9876 ••••• 4421",
  swift: "CTBKUS33",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9.5,
    color: COLORS.ink,
    paddingBottom: 56,
  },

  // Header band (full bleed black)
  headerBand: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 28,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  brandText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 22,
    color: COLORS.white,
    letterSpacing: 4,
    marginLeft: 10,
  },
  brandTagline: {
    color: COLORS.faint,
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 6,
    marginLeft: 1,
  },
  invoiceTitle: {
    fontFamily: "Helvetica-Bold",
    fontSize: 28,
    color: COLORS.yellow,
    letterSpacing: 6,
  },
  invoiceNumber: {
    color: COLORS.white,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
    textAlign: "right",
    letterSpacing: 1,
  },

  body: {
    paddingHorizontal: 40,
    paddingTop: 22,
  },

  // From / Bill-to / Meta
  topGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 22,
  },
  card: {
    flex: 1,
  },
  cardLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: COLORS.faint,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  partyName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: COLORS.black,
  },
  partyLine: {
    fontSize: 9.5,
    color: COLORS.ink,
    marginTop: 2,
    lineHeight: 1.4,
  },

  // Meta strip
  metaStrip: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
    marginBottom: 20,
  },
  metaCell: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: COLORS.line,
  },
  metaCellLast: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  metaLabel: {
    fontSize: 7.5,
    color: COLORS.faint,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 3,
    fontFamily: "Helvetica-Bold",
  },
  metaValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: COLORS.black,
  },
  metaValueAccent: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: COLORS.yellowDark,
  },

  // Service banner
  serviceBanner: {
    backgroundColor: COLORS.zebra,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.yellow,
  },
  serviceBannerLabel: {
    fontSize: 7.5,
    color: COLORS.faint,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  serviceBannerValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    color: COLORS.black,
    marginTop: 2,
  },

  // Table
  tableHead: {
    flexDirection: "row",
    backgroundColor: COLORS.black,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  th: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    color: COLORS.white,
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  tr: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.line,
  },
  trZebra: {
    backgroundColor: COLORS.zebra,
  },
  cDescription: { flex: 4 },
  cHours: { flex: 1, textAlign: "right" },
  cRate: { flex: 1, textAlign: "right" },
  cAmount: { flex: 1.2, textAlign: "right" },
  descPrimary: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9.5,
    color: COLORS.black,
  },
  descSecondary: {
    fontSize: 8.5,
    color: COLORS.muted,
    marginTop: 1,
  },
  num: { fontSize: 9.5, color: COLORS.ink },
  numBold: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: COLORS.black },

  // Totals
  totalsWrap: {
    flexDirection: "row",
    marginTop: 14,
  },
  totalsSpacer: { flex: 1.6 },
  totalsBox: { flex: 1, paddingHorizontal: 4 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsLabel: { fontSize: 9.5, color: COLORS.muted },
  totalsValue: { fontSize: 9.5, color: COLORS.ink, fontFamily: "Helvetica-Bold" },
  totalDivider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginTop: 6,
    marginBottom: 6,
  },
  totalBig: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: COLORS.black,
    borderRadius: 3,
  },
  totalBigLabel: {
    fontSize: 10,
    color: COLORS.faint,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  totalBigValue: {
    fontSize: 16,
    color: COLORS.yellow,
    fontFamily: "Helvetica-Bold",
  },

  // Payment block (two columns)
  paymentGrid: {
    flexDirection: "row",
    gap: 14,
    marginTop: 26,
  },
  paymentCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 4,
    padding: 12,
  },
  paymentCardYellow: {
    flex: 1,
    backgroundColor: COLORS.yellow,
    borderRadius: 4,
    padding: 12,
  },
  payHeading: {
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    color: COLORS.black,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  payRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  payLabel: { fontSize: 9, color: COLORS.muted },
  payValue: { fontSize: 9, color: COLORS.black, fontFamily: "Helvetica-Bold" },
  payNote: { fontSize: 9, color: COLORS.black, lineHeight: 1.45 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  footerLeft: { fontSize: 7.5, color: COLORS.faint, lineHeight: 1.45 },
  footerRight: { fontSize: 7.5, color: COLORS.faint, textAlign: "right" },

  // Status pill
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  statusPaid: { backgroundColor: "#DCFCE7" },
  statusSent: { backgroundColor: "#FEF3C7" },
  statusDraft: { backgroundColor: "#F1F5F9" },
  statusVoid: { backgroundColor: "#FEE2E2" },
  statusOverdue: { backgroundColor: "#FEE2E2" },
  statusText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
});

function VertexMark({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 80 80">
      {/* Top-right diagonal slash */}
      <Path d="M51 26 L78 2 L78 27 L49 53 Z" fill={COLORS.yellow} />
      {/* Main blade (upper-left to lower-center) */}
      <Path d="M2 27 L25 27 L49 78 L25 53 Z" fill={COLORS.yellow} />
      {/* Bottom-left triangle */}
      <Path d="M2 53 L25 78 L2 78 Z" fill={COLORS.yellow} />
      {/* Bottom-right small triangle */}
      <Path d="M65 78 L78 67 L78 78 Z" fill={COLORS.yellow} />
    </Svg>
  );
}

function fmtMoney(n: number | string): string {
  const v = Number(n) || 0;
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusStyle(status: string) {
  switch (status) {
    case "paid":
      return { pill: styles.statusPaid, color: "#166534" };
    case "sent":
      return { pill: styles.statusSent, color: "#92400E" };
    case "overdue":
      return { pill: styles.statusOverdue, color: "#991B1B" };
    case "void":
      return { pill: styles.statusVoid, color: "#991B1B" };
    default:
      return { pill: styles.statusDraft, color: "#475569" };
  }
}

export type InvoicePDFData = {
  invoice: Invoice;
  employer: Pick<Employer, "name" | "billing_email" | "billing_address" | "contact_name">;
  lines: (InvoiceLineItem & { worker: Pick<Worker, "full_name"> | null })[];
};

export function InvoicePDF({ data }: { data: InvoicePDFData }) {
  const { invoice, employer, lines } = data;
  const termsDays = invoice.due_date
    ? Math.max(
        0,
        Math.round(
          (new Date(invoice.due_date).getTime() - new Date(invoice.created_at).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 15;
  const status = statusStyle(invoice.status);

  return (
    <Document
      title={`${invoice.invoice_number} — ${brand.legalName}`}
      author={brand.legalName}
      subject={`Invoice ${invoice.invoice_number}`}
    >
      <Page size="LETTER" style={styles.page}>
        {/* Black header band */}
        <View style={styles.headerBand} fixed>
          <View>
            <View style={styles.brandRow}>
              <VertexMark size={30} />
              <Text style={styles.brandText}>VERTEX</Text>
            </View>
            <Text style={styles.brandTagline}>Restoration · Recovery Services</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* From / Bill-to */}
          <View style={styles.topGrid}>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>From</Text>
              <Text style={styles.partyName}>{COMPANY.legalName}</Text>
              <Text style={styles.partyLine}>{COMPANY.addressLine1}</Text>
              <Text style={styles.partyLine}>{COMPANY.addressLine2}</Text>
              <Text style={[styles.partyLine, { marginTop: 4 }]}>{COMPANY.phone}</Text>
              <Text style={styles.partyLine}>{COMPANY.email}</Text>
              <Text style={[styles.partyLine, { color: COLORS.muted, marginTop: 4 }]}>
                {COMPANY.ein}
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Bill to</Text>
              <Text style={styles.partyName}>{employer.name}</Text>
              {employer.contact_name && (
                <Text style={styles.partyLine}>Attn: {employer.contact_name}</Text>
              )}
              {employer.billing_address && (
                <Text style={styles.partyLine}>{employer.billing_address}</Text>
              )}
              {employer.billing_email && (
                <Text style={[styles.partyLine, { marginTop: 4 }]}>
                  {employer.billing_email}
                </Text>
              )}
              <View style={[styles.statusPill, status.pill]}>
                <Text style={[styles.statusText, { color: status.color }]}>
                  {invoice.status}
                </Text>
              </View>
            </View>
          </View>

          {/* Meta strip */}
          <View style={styles.metaStrip}>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Invoice #</Text>
              <Text style={styles.metaValue}>{invoice.invoice_number}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Issue date</Text>
              <Text style={styles.metaValue}>{fmtDate(invoice.created_at)}</Text>
            </View>
            <View style={styles.metaCell}>
              <Text style={styles.metaLabel}>Due date</Text>
              <Text style={styles.metaValueAccent}>{fmtDate(invoice.due_date)}</Text>
            </View>
            <View style={styles.metaCellLast}>
              <Text style={styles.metaLabel}>Terms</Text>
              <Text style={styles.metaValue}>NET {termsDays}</Text>
            </View>
          </View>

          {/* Service period banner */}
          <View style={styles.serviceBanner}>
            <Text style={styles.serviceBannerLabel}>Services rendered — Period</Text>
            <Text style={styles.serviceBannerValue}>
              {fmtDate(invoice.period_start)}  →  {fmtDate(invoice.period_end)}
            </Text>
          </View>

          {/* Line items */}
          <View style={styles.tableHead}>
            <Text style={[styles.th, styles.cDescription]}>Service</Text>
            <Text style={[styles.th, styles.cHours]}>Qty</Text>
            <Text style={[styles.th, styles.cRate]}>Rate</Text>
            <Text style={[styles.th, styles.cAmount]}>Amount</Text>
          </View>

          {groupInvoiceLines(lines, invoice.period_start, invoice.period_end).map((c, i) => (
            <View
              key={c.key}
              style={[styles.tr, i % 2 === 1 ? styles.trZebra : {}, !c.hasData ? { opacity: 0.5 } : {}]}
              wrap={false}
            >
              <View style={styles.cDescription}>
                <Text style={{ fontSize: 7.5, color: COLORS.muted, letterSpacing: 0.8, fontWeight: 700 }}>
                  {c.label.toUpperCase()}
                </Text>
                <Text style={styles.descPrimary}>{c.description}</Text>
              </View>
              <Text style={[styles.num, styles.cHours]}>{c.qtyText}</Text>
              <Text style={[styles.num, styles.cRate]}>{c.rateText}</Text>
              <Text style={[styles.numBold, styles.cAmount]}>
                {c.hasData ? fmtMoney(c.amount) : "—"}
              </Text>
            </View>
          ))}

          {/* Totals */}
          <View style={styles.totalsWrap}>
            <View style={styles.totalsSpacer}>
              <View
                style={{
                  paddingHorizontal: 4,
                  paddingTop: 8,
                }}
              >
                <Text style={{ fontSize: 8.5, color: COLORS.faint }}>
                  Service period: {fmtDate(invoice.period_start)} → {fmtDate(invoice.period_end)}
                </Text>
              </View>
            </View>
            <View style={styles.totalsBox}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Subtotal</Text>
                <Text style={styles.totalsValue}>{fmtMoney(invoice.subtotal)}</Text>
              </View>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Tax</Text>
                <Text style={styles.totalsValue}>{fmtMoney(invoice.tax)}</Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalBig}>
                <Text style={styles.totalBigLabel}>Total due</Text>
                <Text style={styles.totalBigValue}>{fmtMoney(invoice.total)}</Text>
              </View>
            </View>
          </View>

          {/* Payment block */}
          <View style={styles.paymentGrid}>
            <View style={styles.paymentCard}>
              <Text style={styles.payHeading}>ACH / Wire transfer</Text>
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>Beneficiary</Text>
                <Text style={styles.payValue}>{BANK.beneficiary}</Text>
              </View>
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>Bank</Text>
                <Text style={styles.payValue}>{BANK.bankName}</Text>
              </View>
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>Routing</Text>
                <Text style={styles.payValue}>{BANK.routing}</Text>
              </View>
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>Account</Text>
                <Text style={styles.payValue}>{BANK.account}</Text>
              </View>
              <View style={styles.payRow}>
                <Text style={styles.payLabel}>SWIFT</Text>
                <Text style={styles.payValue}>{BANK.swift}</Text>
              </View>
            </View>
            <View style={styles.paymentCardYellow}>
              <Text style={styles.payHeading}>How to pay</Text>
              <Text style={styles.payNote}>
                Please remit payment by{" "}
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{fmtDate(invoice.due_date)}</Text>
                . Reference invoice{" "}
                <Text style={{ fontFamily: "Helvetica-Bold" }}>{invoice.invoice_number}</Text>{" "}
                on your remittance.
              </Text>
              <Text style={[styles.payNote, { marginTop: 6 }]}>
                Checks payable to <Text style={{ fontFamily: "Helvetica-Bold" }}>{COMPANY.legalName}</Text>.
              </Text>
              <Text style={[styles.payNote, { marginTop: 6 }]}>
                Questions? <Text style={{ fontFamily: "Helvetica-Bold" }}>{COMPANY.email}</Text>
              </Text>
            </View>
          </View>

          {invoice.notes && (
            <View
              style={{
                marginTop: 18,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: COLORS.line,
              }}
            >
              <Text style={[styles.cardLabel, { marginBottom: 4 }]}>Notes</Text>
              <Text style={styles.payNote}>{invoice.notes}</Text>
            </View>
          )}
        </View>

        {/* Footer (fixed across pages) */}
        <View style={styles.footer} fixed>
          <View>
            <Text style={styles.footerLeft}>
              {COMPANY.legalName} · {COMPANY.ein} · {COMPANY.web}
            </Text>
            <Text style={styles.footerLeft}>
              Payments are due NET {termsDays}. A 1.5% monthly finance charge applies to balances
              past due.
            </Text>
          </View>
          <Text
            style={styles.footerRight}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
