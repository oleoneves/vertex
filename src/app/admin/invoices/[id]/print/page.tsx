import { notFound } from "next/navigation";
import { getInvoiceDetail } from "@/lib/workforce";
import { brand } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function PrintInvoice({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inv = await getInvoiceDetail(id);
  if (!inv) notFound();
  return (
    <html lang="en">
      <head>
        <title>{inv.invoice_number}</title>
        <style>{`
          body { font-family: system-ui, -apple-system, sans-serif; color: #0a0a0a; padding: 48px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 28px; margin: 0; }
          .muted { color: #666; }
          .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
          .accent { color: #facc15; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #eee; font-size: 14px; }
          th { text-transform: uppercase; font-size: 11px; color: #666; letter-spacing: 0.05em; }
          .right { text-align: right; }
          .mono { font-family: monospace; }
          .total { font-size: 20px; font-weight: 800; }
          @media print { body { padding: 24px; } }
        `}</style>
      </head>
      <body>
        <div className="row">
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "inline-block", width: 14, height: 14, borderRadius: 3, background: "#facc15" }} />
              {brand.name}
            </h1>
            <p className="muted" style={{ margin: "4px 0 0", fontSize: 12 }}>
              {brand.legalName}
            </p>
            <p className="muted" style={{ margin: 0, fontSize: 12 }}>
              {brand.supportEmail}
            </p>
          </div>
          <div className="right">
            <div className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Invoice
            </div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{inv.invoice_number}</div>
            <div className="muted" style={{ fontSize: 12 }}>
              Issued: {new Date(inv.created_at).toLocaleDateString()}
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              Due: {inv.due_date ?? "—"}
            </div>
          </div>
        </div>

        <div className="row" style={{ marginTop: 32 }}>
          <div>
            <div className="muted" style={{ fontSize: 11, textTransform: "uppercase" }}>
              Bill to
            </div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>{inv.employer?.name}</div>
            <div className="muted" style={{ whiteSpace: "pre-line", fontSize: 13 }}>
              {(inv.employer as { billing_address?: string } | null)?.billing_address ?? ""}
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              {inv.employer?.billing_email}
            </div>
          </div>
          <div className="right">
            <div className="muted" style={{ fontSize: 11, textTransform: "uppercase" }}>
              Period
            </div>
            <div style={{ marginTop: 4 }}>
              {inv.period_start} → {inv.period_end}
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th className="right">Hours</th>
              <th className="right">Rate</th>
              <th className="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l) => (
              <tr key={l.id}>
                <td>{l.description}</td>
                <td className="right mono">{Number(l.hours).toFixed(2)}</td>
                <td className="right mono">${Number(l.rate).toFixed(2)}</td>
                <td className="right mono">${Number(l.amount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="right muted">
                Subtotal
              </td>
              <td className="right mono">${Number(inv.subtotal).toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="right muted">
                Tax
              </td>
              <td className="right mono">${Number(inv.tax).toFixed(2)}</td>
            </tr>
            <tr>
              <td colSpan={3} className="right total">
                Total due
              </td>
              <td className="right mono total">${Number(inv.total).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="muted" style={{ marginTop: 48, fontSize: 12 }}>
          Make checks payable to {brand.legalName}. Questions? {brand.supportEmail}.
        </p>
      </body>
    </html>
  );
}
