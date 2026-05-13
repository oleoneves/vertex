import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getInvoiceDetail } from "@/lib/workforce";
import { InvoicePDF } from "@/lib/invoice-pdf";
import { getSupabaseServer } from "@/lib/supabase/server";
import { emailReady, fromAddress, getEmailClient, invoiceEmailHtml } from "@/lib/email";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return new NextResponse("Supabase not configured", { status: 503 });
  }
  if (!emailReady()) {
    return new NextResponse(
      "RESEND_API_KEY not set. Add it to your Vercel environment to enable invoice emails.",
      { status: 503 },
    );
  }

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const inv = await getInvoiceDetail(id);
  if (!inv) return new NextResponse("Invoice not found", { status: 404 });

  const employer = inv.employer;
  if (!employer) return new NextResponse("Invoice missing employer", { status: 500 });
  if (!employer.billing_email) {
    return new NextResponse(
      "Employer has no billing_email — set one on the employer record first.",
      { status: 400 },
    );
  }

  const pdfBuffer = await renderToBuffer(
    InvoicePDF({
      data: {
        invoice: inv,
        employer: {
          name: employer.name,
          contact_name: employer.contact_name,
          billing_email: employer.billing_email,
          billing_address: employer.billing_address,
        },
        lines: inv.lines,
      },
    }),
  );

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const viewUrl = siteUrl ? `${siteUrl}/employer/invoices/${inv.id}` : undefined;

  const html = invoiceEmailHtml({
    employerName: employer.name,
    invoiceNumber: inv.invoice_number,
    amount: Number(inv.total).toFixed(2),
    dueDate: inv.due_date,
    periodStart: inv.period_start,
    periodEnd: inv.period_end,
    viewUrl,
  });

  const client = getEmailClient();
  if (!client) {
    return new NextResponse("Resend client unavailable", { status: 503 });
  }

  try {
    const { data, error } = await client.emails.send({
      from: fromAddress(),
      to: employer.billing_email,
      subject: `Invoice ${inv.invoice_number} — $${Number(inv.total).toFixed(2)} due`,
      html,
      attachments: [
        {
          filename: `${inv.invoice_number}.pdf`,
          content: pdfBuffer,
        },
      ],
    });
    if (error) {
      console.error("[invoice send] resend error", error);
      return new NextResponse(`Email failed: ${error.message}`, { status: 502 });
    }

    await supabase
      .from("invoices")
      .update({
        status: inv.status === "draft" ? "sent" : inv.status,
        sent_at: new Date().toISOString(),
      })
      .eq("id", inv.id);

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (e) {
    console.error("[invoice send] failed", e);
    return new NextResponse(
      e instanceof Error ? e.message : "Failed to send invoice email",
      { status: 500 },
    );
  }
}
