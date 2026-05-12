import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentWorker } from "@/lib/workforce";
import { loadPaystubDetail } from "@/lib/paystub";
import { PaystubPDF } from "@/lib/paystub-pdf";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ period: string }> },
) {
  const { period } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    return new NextResponse("Invalid period format", { status: 400 });
  }

  const worker = await getCurrentWorker();
  if (!worker) return new NextResponse("Unauthorized", { status: 401 });

  const data = await loadPaystubDetail(worker.id, period);
  if (!data) return new NextResponse("Paystub not found", { status: 404 });

  const buffer = await renderToBuffer(PaystubPDF({ data }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="vertex-paystub-${period}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
