"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-9 items-center gap-1 rounded-md bg-foreground px-3 text-sm font-bold text-background hover:opacity-90 print:hidden"
    >
      <Printer className="h-3.5 w-3.5" /> Print report
    </button>
  );
}
