import { notFound } from "next/navigation";
import { getInvoiceDetail } from "@/lib/workforce";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";

const COMPANY = {
  legalName: brand.legalName,
  addressLine1: "1209 N Orange St, Suite 100",
  addressLine2: "Wilmington, DE 19801",
  ein: "EIN 33-4892177",
  phone: "+1 (302) 555-0124",
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

function fmtMoney(n: number | string | null | undefined): string {
  return (Number(n) || 0).toLocaleString("en-US", {
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

function statusColor(s: string): { bg: string; fg: string } {
  switch (s) {
    case "paid":
      return { bg: "#DCFCE7", fg: "#166534" };
    case "sent":
      return { bg: "#FEF3C7", fg: "#92400E" };
    case "overdue":
    case "void":
      return { bg: "#FEE2E2", fg: "#991B1B" };
    default:
      return { bg: "#F1F5F9", fg: "#475569" };
  }
}

export default async function PrintInvoice({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inv = await getInvoiceDetail(id);
  if (!inv) notFound();

  const employer = inv.employer;
  const termsDays = inv.due_date
    ? Math.max(
        0,
        Math.round(
          (new Date(inv.due_date).getTime() - new Date(inv.created_at).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : employer?.payment_terms_days ?? 15;
  const status = statusColor(inv.status);
  const totalHours = inv.lines.reduce((s, l) => s + (Number(l.hours) || 0), 0);

  return (
    <html lang="en">
      <head>
        <title>{inv.invoice_number} — {brand.legalName}</title>
        <style>{`
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            color: #1a1a1a;
            margin: 0;
            background: #f5f5f5;
            font-size: 13px;
            line-height: 1.45;
          }
          .sheet {
            max-width: 820px;
            margin: 24px auto;
            background: #fff;
            box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          }
          .header {
            background: #0a0a0a;
            color: #fff;
            padding: 32px 48px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .brand-row { display: flex; align-items: center; gap: 12px; }
          .brand-text {
            font-weight: 900;
            font-size: 26px;
            letter-spacing: 5px;
          }
          .brand-tagline {
            color: #8a8a8a;
            font-size: 10px;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin-top: 6px;
          }
          .invoice-title {
            font-weight: 900;
            font-size: 32px;
            letter-spacing: 8px;
            color: #FACC15;
          }
          .invoice-number {
            font-weight: 700;
            font-size: 13px;
            text-align: right;
            margin-top: 4px;
            letter-spacing: 1px;
          }
          .body { padding: 28px 48px; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
          .label {
            font-weight: 700;
            font-size: 10px;
            color: #8a8a8a;
            letter-spacing: 1.6px;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .party-name { font-weight: 700; font-size: 14px; color: #0a0a0a; }
          .party-line { color: #1a1a1a; margin-top: 2px; }
          .pill {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.4px;
            margin-top: 8px;
          }
          .meta-strip {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            border-top: 1px solid #e5e5e5;
            border-bottom: 1px solid #e5e5e5;
            margin-bottom: 22px;
          }
          .meta-cell {
            padding: 12px 6px;
            border-right: 1px solid #e5e5e5;
          }
          .meta-cell:last-child { border-right: 0; }
          .meta-label {
            font-size: 9px;
            color: #8a8a8a;
            letter-spacing: 1.4px;
            text-transform: uppercase;
            font-weight: 700;
            margin-bottom: 4px;
          }
          .meta-value { font-weight: 700; font-size: 12px; color: #0a0a0a; }
          .meta-value.accent { color: #ca9f0c; }
          .service-banner {
            background: #fafafa;
            border-left: 3px solid #FACC15;
            padding: 10px 14px;
            margin-bottom: 16px;
          }
          .service-banner-label {
            font-size: 9px;
            color: #8a8a8a;
            letter-spacing: 1.4px;
            text-transform: uppercase;
            font-weight: 700;
          }
          .service-banner-value {
            font-weight: 700;
            font-size: 13px;
            margin-top: 2px;
            color: #0a0a0a;
          }
          table.lines { width: 100%; border-collapse: collapse; }
          table.lines thead th {
            background: #0a0a0a;
            color: #fff;
            text-align: left;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1.4px;
            text-transform: uppercase;
            padding: 10px 10px;
          }
          table.lines tbody td {
            padding: 10px 10px;
            border-bottom: 0.5px solid #e5e5e5;
            vertical-align: top;
          }
          table.lines tbody tr:nth-child(even) td { background: #fafafa; }
          .desc-primary { font-weight: 700; color: #0a0a0a; }
          .desc-secondary { font-size: 11px; color: #5c5c5c; margin-top: 1px; }
          .right { text-align: right; }
          .num-bold { font-weight: 700; color: #0a0a0a; }
          .totals {
            display: grid;
            grid-template-columns: 1.4fr 1fr;
            gap: 16px;
            margin-top: 16px;
          }
          .totals-hint { font-size: 11px; color: #8a8a8a; padding-top: 8px; }
          .totals-hint strong { color: #0a0a0a; }
          .totals-rows .row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 13px;
          }
          .totals-rows .row .lbl { color: #5c5c5c; }
          .totals-rows .row .val { font-weight: 700; }
          .totals-divider { height: 1px; background: #e5e5e5; margin: 6px 0; }
          .total-big {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 14px;
            background: #0a0a0a;
            border-radius: 4px;
            margin-top: 6px;
          }
          .total-big .lbl {
            color: #8a8a8a;
            font-weight: 700;
            font-size: 11px;
            letter-spacing: 1.4px;
            text-transform: uppercase;
          }
          .total-big .val {
            color: #FACC15;
            font-weight: 900;
            font-size: 22px;
          }
          .pay-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 32px;
          }
          .pay-card {
            border: 1px solid #e5e5e5;
            border-radius: 6px;
            padding: 16px;
          }
          .pay-card.yellow {
            background: #FACC15;
            border: 0;
            color: #0a0a0a;
          }
          .pay-heading {
            font-weight: 700;
            font-size: 11px;
            letter-spacing: 1.6px;
            text-transform: uppercase;
            margin-bottom: 10px;
            color: #0a0a0a;
          }
          .pay-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            font-size: 12px;
          }
          .pay-row .lbl { color: #5c5c5c; }
          .pay-row .val { font-weight: 700; color: #0a0a0a; }
          .pay-note { font-size: 12px; line-height: 1.5; }
          .footer {
            padding: 18px 48px 28px;
            border-top: 1px solid #e5e5e5;
            margin-top: 28px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #8a8a8a;
            line-height: 1.5;
          }
          .notes {
            margin-top: 20px;
            padding-top: 12px;
            border-top: 1px solid #e5e5e5;
          }
          .toolbar {
            position: fixed;
            top: 12px;
            right: 12px;
            display: flex;
            gap: 8px;
            z-index: 10;
          }
          .toolbar button, .toolbar a {
            background: #0a0a0a;
            color: #fff;
            border: 0;
            padding: 8px 14px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
          }
          .toolbar a.secondary { background: #fff; color: #0a0a0a; border: 1px solid #e5e5e5; }
          @media print {
            body { background: #fff; }
            .sheet { box-shadow: none; margin: 0; max-width: 100%; }
            .toolbar { display: none; }
            .header { padding: 28px 32px; }
            .body { padding: 24px 32px; }
            .footer { padding: 16px 32px 24px; }
          }
        `}</style>
      </head>
      <body>
        <div className="toolbar">
          <a className="secondary" href={`/admin/invoices/${inv.id}`}>← Back</a>
          <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noreferrer">
            Download PDF
          </a>
        </div>
        <div className="sheet">
          <div className="header">
            <div>
              <div className="brand-row">
                <svg width="32" height="32" viewBox="0 0 40 40" aria-hidden>
                  <path d="M3 4 L20 38 L37 4 L29 4 L20 22 L11 4 Z" fill="#FACC15" />
                </svg>
                <span className="brand-text">VERTEX</span>
              </div>
              <div className="brand-tagline">Labor Service · Workforce Solutions</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="invoice-title">INVOICE</div>
              <div className="invoice-number">{inv.invoice_number}</div>
            </div>
          </div>

          <div className="body">
            <div className="grid-2">
              <div>
                <div className="label">From</div>
                <div className="party-name">{COMPANY.legalName}</div>
                <div className="party-line">{COMPANY.addressLine1}</div>
                <div className="party-line">{COMPANY.addressLine2}</div>
                <div className="party-line" style={{ marginTop: 6 }}>
                  {COMPANY.phone}
                </div>
                <div className="party-line">{COMPANY.email}</div>
                <div className="party-line" style={{ color: "#5c5c5c", marginTop: 6 }}>
                  {COMPANY.ein}
                </div>
              </div>
              <div>
                <div className="label">Bill to</div>
                <div className="party-name">{employer?.name ?? "—"}</div>
                {employer?.contact_name && (
                  <div className="party-line">Attn: {employer.contact_name}</div>
                )}
                {employer?.billing_address && (
                  <div className="party-line">{employer.billing_address}</div>
                )}
                {employer?.billing_email && (
                  <div className="party-line" style={{ marginTop: 6 }}>
                    {employer.billing_email}
                  </div>
                )}
                <span
                  className="pill"
                  style={{ background: status.bg, color: status.fg }}
                >
                  {inv.status}
                </span>
              </div>
            </div>

            <div className="meta-strip">
              <div className="meta-cell">
                <div className="meta-label">Invoice #</div>
                <div className="meta-value">{inv.invoice_number}</div>
              </div>
              <div className="meta-cell">
                <div className="meta-label">Issue date</div>
                <div className="meta-value">{fmtDate(inv.created_at)}</div>
              </div>
              <div className="meta-cell">
                <div className="meta-label">Due date</div>
                <div className="meta-value accent">{fmtDate(inv.due_date)}</div>
              </div>
              <div className="meta-cell">
                <div className="meta-label">Terms</div>
                <div className="meta-value">NET {termsDays}</div>
              </div>
            </div>

            <div className="service-banner">
              <div className="service-banner-label">Services rendered — Period</div>
              <div className="service-banner-value">
                {fmtDate(inv.period_start)} → {fmtDate(inv.period_end)}
              </div>
            </div>

            <table className="lines">
              <thead>
                <tr>
                  <th>Description</th>
                  <th className="right" style={{ width: 80 }}>Hours</th>
                  <th className="right" style={{ width: 90 }}>Rate</th>
                  <th className="right" style={{ width: 110 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {inv.lines.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "#5c5c5c" }}>
                      No line items on this invoice.
                    </td>
                  </tr>
                ) : (
                  inv.lines.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <div className="desc-primary">
                          {l.worker?.full_name ?? "Labor services"}
                        </div>
                        <div className="desc-secondary">{l.description}</div>
                      </td>
                      <td className="right">{Number(l.hours).toFixed(2)}</td>
                      <td className="right">{fmtMoney(l.rate)}</td>
                      <td className="right num-bold">{fmtMoney(l.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="totals">
              <div className="totals-hint">
                <div>
                  Total hours billed: <strong>{totalHours.toFixed(2)}</strong>
                </div>
                <div style={{ marginTop: 3 }}>Line items: {inv.lines.length}</div>
              </div>
              <div className="totals-rows">
                <div className="row">
                  <span className="lbl">Subtotal</span>
                  <span className="val">{fmtMoney(inv.subtotal)}</span>
                </div>
                <div className="row">
                  <span className="lbl">Tax</span>
                  <span className="val">{fmtMoney(inv.tax)}</span>
                </div>
                <div className="totals-divider" />
                <div className="total-big">
                  <span className="lbl">Total due</span>
                  <span className="val">{fmtMoney(inv.total)}</span>
                </div>
              </div>
            </div>

            <div className="pay-grid">
              <div className="pay-card">
                <div className="pay-heading">ACH / Wire transfer</div>
                <div className="pay-row">
                  <span className="lbl">Beneficiary</span>
                  <span className="val">{BANK.beneficiary}</span>
                </div>
                <div className="pay-row">
                  <span className="lbl">Bank</span>
                  <span className="val">{BANK.bankName}</span>
                </div>
                <div className="pay-row">
                  <span className="lbl">Routing</span>
                  <span className="val">{BANK.routing}</span>
                </div>
                <div className="pay-row">
                  <span className="lbl">Account</span>
                  <span className="val">{BANK.account}</span>
                </div>
                <div className="pay-row">
                  <span className="lbl">SWIFT</span>
                  <span className="val">{BANK.swift}</span>
                </div>
              </div>
              <div className="pay-card yellow">
                <div className="pay-heading">How to pay</div>
                <div className="pay-note">
                  Please remit payment by{" "}
                  <strong>{fmtDate(inv.due_date)}</strong>. Reference invoice{" "}
                  <strong>{inv.invoice_number}</strong> on your remittance.
                </div>
                <div className="pay-note" style={{ marginTop: 8 }}>
                  Checks payable to <strong>{COMPANY.legalName}</strong>.
                </div>
                <div className="pay-note" style={{ marginTop: 8 }}>
                  Questions? <strong>{COMPANY.email}</strong>
                </div>
              </div>
            </div>

            {inv.notes && (
              <div className="notes">
                <div className="label" style={{ marginBottom: 4 }}>Notes</div>
                <div className="pay-note">{inv.notes}</div>
              </div>
            )}
          </div>

          <div className="footer">
            <div>
              <div>
                {COMPANY.legalName} · {COMPANY.ein} · {COMPANY.web}
              </div>
              <div>
                Payments are due NET {termsDays}. A 1.5% monthly finance charge applies to balances past due.
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
