import { Search } from "lucide-react";

export type FilterOption = { value: string; label: string };

export function FilterBar({
  searchValue,
  searchPlaceholder,
  filters = [],
}: {
  searchValue?: string;
  searchPlaceholder?: string;
  filters?: { name: string; label: string; options: FilterOption[]; value?: string }[];
}) {
  return (
    <form
      method="GET"
      className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-muted/30 p-3"
    >
      {searchPlaceholder !== undefined && (
        <label className="relative flex-1 min-w-[14rem]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={searchValue ?? ""}
            placeholder={searchPlaceholder}
            className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      )}
      {filters.map((f) => (
        <label key={f.name} className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">{f.label}:</span>
          <select
            name={f.name}
            defaultValue={f.value ?? ""}
            className="h-9 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">All</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button
        type="submit"
        className="h-9 rounded-md bg-foreground px-3 text-sm font-bold text-background hover:opacity-90"
      >
        Apply
      </button>
    </form>
  );
}
