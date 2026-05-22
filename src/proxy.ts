import { NextResponse, type NextRequest } from "next/server";

// TEMP: open access — auth disabled, every visitor treated as super_admin.
// Re-enable login by restoring the previous cookie-based check.
export function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/worker/:path*", "/employer/:path*"],
};
