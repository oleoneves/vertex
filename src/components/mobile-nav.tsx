"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export function MobileNav({
  items,
}: {
  items: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted sm:hidden"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <div
          className="fixed inset-x-0 top-16 z-40 border-b border-border bg-background shadow-lg sm:hidden"
          onClick={() => setOpen(false)}
        >
          <ul className="mx-auto flex max-w-6xl flex-col py-2">
            {items.map((it) => (
              <li key={it.href}>
                <Link
                  href={it.href}
                  className="block px-4 py-3 text-base font-medium hover:bg-muted"
                >
                  {it.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
