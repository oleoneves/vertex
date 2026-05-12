"use client";

import { useState, useTransition, type ReactNode } from "react";
import { MapPin, Loader2 } from "lucide-react";

type ServerAction = (formData: FormData) => Promise<void>;

export function ClockForm({
  action,
  children,
  captureGeo = false,
  className,
}: {
  action: ServerAction;
  children: ReactNode;
  captureGeo?: boolean;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [geoStatus, setGeoStatus] = useState<
    "idle" | "requesting" | "captured" | "denied"
  >("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    if (captureGeo && typeof navigator !== "undefined" && navigator.geolocation) {
      setGeoStatus("requesting");
      const pos = await new Promise<GeolocationPosition | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (p) => resolve(p),
          () => resolve(null),
          { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 },
        );
      });
      if (pos) {
        fd.set(
          "location",
          `${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`,
        );
        setGeoStatus("captured");
      } else {
        setGeoStatus("denied");
      }
    }

    startTransition(async () => {
      await action(fd);
    });
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      {children}
      {captureGeo && (
        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          {geoStatus === "requesting" || pending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <MapPin className="h-3 w-3" />
          )}
          {geoStatus === "requesting"
            ? "Locating…"
            : geoStatus === "captured"
            ? "Location captured ✓"
            : geoStatus === "denied"
            ? "Location not shared — that's OK"
            : "Location will be recorded with your clock-in"}
        </p>
      )}
    </form>
  );
}
