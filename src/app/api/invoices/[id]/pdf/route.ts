import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getInvoiceDetail, supabaseReady } from "@/lib/workforce";
import { InvoicePDF } from "@/lib/invoice-pdf";
import { getSupabaseServer } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(req.url);
  const download = url.searchParams.get("download") === "1";

  // Demo mode: skip auth check, render from demo data
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

  const buffer = await renderToBuffer(
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

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${inv.invoice_number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
