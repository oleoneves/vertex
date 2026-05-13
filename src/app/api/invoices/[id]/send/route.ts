import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getInvoiceDetail, supabaseReady } from "@/lib/workforce";
import { InvoicePDF } from "@/lib/invoice-pdf";
import { getSupabaseServer } from "@/lib/supabase/server";
import { emailReady, fromAddress, getEmailClient, invoiceEmailHtml } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isExampleDomain(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase();
  return (
    domain.endsWith(".example") ||
    domain === "example.com" ||
    domain === "example.org" ||
    domain === "example.net"
  );
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!emailReady()) {
    return new NextResponse(
      "RESEND_API_KEY not set. Add it to your Vercel environment to enable invoice emails.",
      { status: 503 },
    );
  }

  // Optional: read override recipient from request body
  let overrideTo: string | null = null;
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const body = (await req.json().catch(() => null)) as { to?: string } | null;
      if (body && typeof body.to === "string" && body.to.includes("@")) {
        overrideTo = body.to.trim();
      }
    }
  } catch {
    // ignore
  }

  // Auth check only when Supabase is configured (demo mode skips auth)
  if (supabaseReady()) {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });
  }

  const inv = await getInvoiceDetail(id);
  if (!inv) return new NextResponse("Invoice not found", { status: 404 });

  const employer = inv.employer;
  if (!employer) return new NextResponse("Invoice missing employer", { status: 500 });

  const recipient = overrideTo ?? employer.billing_email;
  if (!recipient) {
    return new NextResponse(
      "No recipient. Set billing_email on the employer or pass { to } in the request body.",
      { status: 400 },
    );
  }
  if (isExampleDomain(recipient)) {
    return new NextResponse(
      `Cannot send to ${recipient}. The .example domain is reserved (RFC 2606) and bounces. Use the "Send to..." override with a real email.`,
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
      to: recipient,
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

    // Only update the invoice record when Supabase is wired up AND we sent
    // to the real billing email (not a test override)
    if (supabaseReady() && !overrideTo) {
      const supabase = await getSupabaseServer();
      await supabase
        .from("invoices")
        .update({
          status: inv.status === "draft" ? "sent" : inv.status,
          sent_at: new Date().toISOString(),
        })
        .eq("id", inv.id);
    }

    return NextResponse.json({
      ok: true,
      id: data?.id,
      to: recipient,
      override: !!overrideTo,
    });
  } catch (e) {
    console.error("[invoice send] failed", e);
    return new NextResponse(
      e instanceof Error ? e.message : "Failed to send invoice email",
      { status: 500 },
    );
  }
}
