import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getInvoiceDetail } from "@/lib/workforce";
import { InvoicePDF } from "@/lib/invoice-pdf";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(
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

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const inv = await getInvoiceDetail(id);
  if (!inv) return new NextResponse("Invoice not found", { status: 404 });

  const employer = inv.employer as
    | { name: string; billing_email: string | null; billing_address: string | null }
    | null;
  if (!employer) return new NextResponse("Invoice missing employer", { status: 500 });

  const buffer = await renderToBuffer(
    InvoicePDF({
      data: {
        invoice: inv,
        employer: {
          name: employer.name,
          billing_email: employer.billing_email,
          billing_address: employer.billing_address,
        },
        lines: inv.lines,
      },
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${inv.invoice_number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
