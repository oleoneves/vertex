import "server-only";
import { Resend } from "resend";
import { brand } from "./brand";

export function emailReady() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function getEmailClient() {
  if (!emailReady()) return null;
  return new Resend(process.env.RESEND_API_KEY!);
}

export function fromAddress() {
  const name = process.env.INVOICE_FROM_NAME ?? brand.legalName;
  const email = process.env.INVOICE_FROM_EMAIL ?? `invoices@${brand.domain}`;
  return `${name} <${email}>`;
}

export function invoiceEmailHtml({
  employerName,
  invoiceNumber,
  amount,
  dueDate,
  periodStart,
  periodEnd,
  viewUrl,
}: {
  employerName: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string | null;
  periodStart: string;
  periodEnd: string;
  viewUrl?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Invoice ${invoiceNumber}</title>
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif;color:#1F2A3D;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:14px;border:1px solid #e5e5e5;overflow:hidden;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:24px 28px;background:#1F2A3D;color:#fff;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 80 80"><path d="M51 26 L78 2 L78 27 L49 53 Z" fill="#EDB23E"/><path d="M2 27 L25 27 L49 78 L25 53 Z" fill="#EDB23E"/><path d="M2 53 L25 78 L2 78 Z" fill="#EDB23E"/><path d="M65 78 L78 67 L78 78 Z" fill="#EDB23E"/></svg>
                </td>
                <td style="font-weight:900;font-size:18px;letter-spacing:2px;">VERTEX</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 28px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1.5px;color:#EDB23E;">New invoice</p>
            <h1 style="margin:0 0 18px;font-size:24px;line-height:1.3;">Hi ${escapeHtml(employerName)},</h1>
            <p style="margin:0 0 16px;color:#444;line-height:1.6;">
              Attached is invoice <strong>${escapeHtml(invoiceNumber)}</strong> for restoration services
              from ${escapeHtml(periodStart)} through ${escapeHtml(periodEnd)}.
            </p>

            <table cellpadding="0" cellspacing="0" style="width:100%;margin:18px 0 22px;background:#fafafa;border:1px solid #e5e5e5;border-radius:10px;">
              <tr>
                <td style="padding:14px 16px;border-bottom:1px solid #eee;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:1px;">
                  Amount due
                </td>
                <td style="padding:14px 16px;border-bottom:1px solid #eee;text-align:right;font-weight:900;font-size:22px;">
                  $${escapeHtml(amount)}
                </td>
              </tr>
              <tr>
                <td style="padding:12px 16px;color:#666;">Due date</td>
                <td style="padding:12px 16px;text-align:right;">${escapeHtml(dueDate ?? "On receipt")}</td>
              </tr>
            </table>

            ${
              viewUrl
                ? `<p style="margin:0 0 20px;"><a href="${escapeHtml(viewUrl)}" style="display:inline-block;background:#EDB23E;color:#1F2A3D;text-decoration:none;font-weight:900;padding:13px 24px;border-radius:8px;">View invoice online →</a></p>`
                : ""
            }

            <p style="margin:0 0 8px;color:#444;line-height:1.6;">
              Please pay via ACH or check made out to <strong>${escapeHtml(brand.legalName)}</strong>,
              referencing <strong>${escapeHtml(invoiceNumber)}</strong>.
            </p>
            <p style="margin:0;color:#444;line-height:1.6;">
              Questions? Reply to this email or write to
              <a href="mailto:${escapeHtml(brand.supportEmail)}" style="color:#1F2A3D;">${escapeHtml(brand.supportEmail)}</a>.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px;border-top:1px solid #e5e5e5;color:#888;font-size:11px;line-height:1.5;">
            © ${new Date().getFullYear()} ${escapeHtml(brand.legalName)}. All rights reserved.<br/>
            Built in the United States. Hablamos español. Falamos português.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
