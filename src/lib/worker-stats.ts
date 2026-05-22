import "server-only";
import { getSupabaseServer } from "./supabase/server";

export type WorkerStats = {
  // Money
  earningsThisWeek: number;
  earningsPrevWeek: number;
  earningsMtd: number;
  earningsYtd: number;
  earningsLifetime: number;
  nextPaymentEstimate: number;
  nextPaymentDate: string | null;

  // Hours
  hoursThisWeek: number;
  hoursMtd: number;
  hoursLifetime: number;
  avgHoursPerWorkedDay: number;

  // Days
  daysWorkedThisWeek: number;
  daysMissedThisWeek: number;
  consecutiveDaysStreak: number;

  // Approval
  approvedHours: number;
  pendingHours: number;
  approvalRate: number;

  // Performance
  noShowCount: number;
  rating: number | null;
  ratingsCount: number;

  // Ranking
  rankAmongPeers: number;
  totalPeers: number;
  peerRoleLabel: string;

  // Monthly trend (last 12 months)
  monthlyEarnings: { month: string; label: string; value: number; hours: number }[];

  // Compliance
  hasW9: boolean;
  hasSSN: boolean;
  hasZelle: boolean;

  // Counters
  pendingShiftOffers: number;
  unreadMessages: number;
};

function mondayOf(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  const dow = out.getDay();
  out.setDate(out.getDate() - ((dow + 6) % 7));
  return out;
}

export async function loadWorkerStats(workerId: string): Promise<WorkerStats> {
  const supabase = await getSupabaseServer();
  const now = new Date();
  const weekStart = mondayOf(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const since12mo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // All time entries for this worker, ordered desc (1000-row Supabase cap, but workers rarely have more than 365 entries/year)
  const { data: entriesRaw } = await supabase
    .from("time_entries")
    .select("hours_worked, clock_in_at, pay_rate_at_entry, approved, placement_id")
    .eq("worker_id", workerId)
    .order("clock_in_at", { ascending: false })
    .limit(1000);
  type Row = {
    hours_worked: number | null;
    clock_in_at: string;
    pay_rate_at_entry: number | null;
    approved: boolean;
    placement_id: string;
  };
  const entries = (entriesRaw as Row[]) ?? [];

  let earningsThisWeek = 0,
    earningsPrevWeek = 0,
    earningsMtd = 0,
    earningsYtd = 0,
    earningsLifetime = 0;
  let hoursThisWeek = 0,
    hoursMtd = 0,
    hoursLifetime = 0;
  let approvedHours = 0,
    pendingHours = 0;
  const workedDates = new Set<string>();
  const monthBuckets = new Map<string, { earnings: number; hours: number }>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthBuckets.set(k, { earnings: 0, hours: 0 });
  }

  for (const e of entries) {
    const t = new Date(e.clock_in_at);
    const h = Number(e.hours_worked) || 0;
    const $$$ = h * (Number(e.pay_rate_at_entry) || 0);
    hoursLifetime += h;
    earningsLifetime += $$$;
    if (t >= yearStart) earningsYtd += $$$;
    if (t >= monthStart) {
      earningsMtd += $$$;
      hoursMtd += h;
    }
    if (t >= weekStart && t < weekEnd) {
      earningsThisWeek += $$$;
      hoursThisWeek += h;
      workedDates.add(t.toISOString().slice(0, 10));
    }
    if (t >= prevWeekStart && t < weekStart) earningsPrevWeek += $$$;
    if (e.approved) approvedHours += h;
    else if (e.hours_worked != null) pendingHours += h;
    if (t >= since12mo) {
      const k = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}`;
      const b = monthBuckets.get(k);
      if (b) {
        b.earnings += $$$;
        b.hours += h;
      }
    }
  }

  // Days worked this week + missed weekdays
  const daysWorkedThisWeek = workedDates.size;
  const todayMs = Date.now();
  let weekdaysSoFar = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    if (d.getTime() <= todayMs && d.getDay() !== 0 && d.getDay() !== 6) weekdaysSoFar++;
  }
  const daysMissedThisWeek = Math.max(0, weekdaysSoFar - daysWorkedThisWeek);

  // Consecutive days streak (walk backwards from today)
  const allWorkedDates = new Set<string>();
  for (const e of entries) {
    allWorkedDates.add(new Date(e.clock_in_at).toISOString().slice(0, 10));
  }
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    if (allWorkedDates.has(iso)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  // Approval rate
  const closedHours = approvedHours + pendingHours;
  const approvalRate = closedHours > 0 ? approvedHours / closedHours : 0;

  // Avg hours per worked day
  const avgHoursPerWorkedDay =
    allWorkedDates.size > 0 ? hoursLifetime / allWorkedDates.size : 0;

  // Worker rating + role from workers table
  const { data: workerRow } = await supabase
    .from("workers")
    .select(
      "rating, ratings_count, no_show_count, w9_document_id, ssn, zelle_full_name, payment_method, default_pay_rate",
    )
    .eq("id", workerId)
    .single();
  const wr = workerRow as {
    rating: number | null;
    ratings_count: number;
    no_show_count: number;
    w9_document_id: string | null;
    ssn: string | null;
    zelle_full_name: string | null;
    payment_method: string;
    default_pay_rate: number | null;
  } | null;
  const rating = wr?.rating ?? null;
  const ratingsCount = wr?.ratings_count ?? 0;
  const noShowCount = wr?.no_show_count ?? 0;
  const hasW9 = Boolean(wr?.w9_document_id);
  const hasSSN = Boolean(wr?.ssn);
  const hasZelle = Boolean(wr?.zelle_full_name) || wr?.payment_method !== "zelle";

  // Ranking among workers with same role (uses active placements' role_title as proxy)
  const { data: placementRows } = await supabase
    .from("placements")
    .select("role_title")
    .eq("worker_id", workerId)
    .eq("status", "active")
    .limit(1);
  const peerRoleLabel =
    (placementRows?.[0] as { role_title: string } | undefined)?.role_title ?? "labor";

  // Compute rank from hoursThisWeek vs peers in same role (last 1000 placements is plenty)
  const { data: peerRows } = await supabase
    .from("placements")
    .select("worker_id")
    .eq("role_title", peerRoleLabel)
    .eq("status", "active")
    .limit(500);
  const peerIds = Array.from(
    new Set(((peerRows as { worker_id: string }[] | null) ?? []).map((p) => p.worker_id)),
  );
  let rankAmongPeers = 0;
  if (peerIds.length > 0) {
    const { data: peerEntries } = await supabase
      .from("time_entries")
      .select("worker_id, hours_worked")
      .in("worker_id", peerIds)
      .gte("clock_in_at", weekStart.toISOString())
      .lt("clock_in_at", weekEnd.toISOString())
      .order("clock_in_at", { ascending: false })
      .limit(5000);
    const peerHours = new Map<string, number>();
    for (const pe of ((peerEntries as { worker_id: string; hours_worked: number | null }[] | null) ?? [])) {
      peerHours.set(
        pe.worker_id,
        (peerHours.get(pe.worker_id) ?? 0) + (Number(pe.hours_worked) || 0),
      );
    }
    const sorted = Array.from(peerHours.entries()).sort((a, b) => b[1] - a[1]);
    const idx = sorted.findIndex(([id]) => id === workerId);
    rankAmongPeers = idx >= 0 ? idx + 1 : sorted.length + 1;
  }

  // Pending shift offers (status='offered' or 'scheduled' awaiting response)
  const { count: pendingShiftOffers } = await supabase
    .from("shifts")
    .select("id, placement:placements!inner(worker_id)", { count: "exact", head: true })
    .eq("placement.worker_id", workerId)
    .in("status", ["offered", "scheduled"])
    .gte("scheduled_start", now.toISOString());

  // Next payment estimate: this week's unpaid earnings (approved hours not yet on a paid payment)
  const nextPaymentEstimate = pendingHours * (wr?.default_pay_rate ?? 15);

  // Next payment date: most recent invoice paid date + ~7 days (rough heuristic)
  const { data: lastPayment } = await supabase
    .from("payments")
    .select("occurred_at")
    .eq("worker_id", workerId)
    .order("occurred_at", { ascending: false })
    .limit(1);
  const lastPaymentDate = (lastPayment?.[0] as { occurred_at: string } | undefined)?.occurred_at;
  const nextPaymentDate = lastPaymentDate
    ? new Date(new Date(lastPaymentDate).getTime() + 7 * 86400000).toISOString().slice(0, 10)
    : null;

  const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyEarnings = Array.from(monthBuckets.entries()).map(([month, bucket]) => {
    const [y, m] = month.split("-").map((s) => Number(s));
    return {
      month,
      label: `${MONTH_LABELS[m - 1]} ${String(y).slice(2)}`,
      value: Math.round(bucket.earnings),
      hours: Math.round(bucket.hours),
    };
  });

  return {
    earningsThisWeek,
    earningsPrevWeek,
    earningsMtd,
    earningsYtd,
    earningsLifetime,
    nextPaymentEstimate,
    nextPaymentDate,
    hoursThisWeek,
    hoursMtd,
    hoursLifetime,
    avgHoursPerWorkedDay,
    daysWorkedThisWeek,
    daysMissedThisWeek,
    consecutiveDaysStreak: streak,
    approvedHours,
    pendingHours,
    approvalRate,
    noShowCount,
    rating,
    ratingsCount,
    rankAmongPeers,
    totalPeers: peerIds.length,
    peerRoleLabel,
    monthlyEarnings,
    hasW9,
    hasSSN,
    hasZelle,
    pendingShiftOffers: pendingShiftOffers ?? 0,
    unreadMessages: 0,
  };
}

export function reliabilityTier(rating: number | null, ratingsCount: number) {
  if (!rating || ratingsCount < 3)
    return { tier: "New", color: "blue", desc: "Working on first ratings", emoji: "🌱" };
  if (rating >= 4.7)
    return { tier: "Elite", color: "yellow", desc: "Top 10% of workers", emoji: "⭐" };
  if (rating >= 4.2) return { tier: "Pro", color: "green", desc: "Reliable performer", emoji: "💪" };
  return { tier: "Standard", color: "slate", desc: "Building reputation", emoji: "👍" };
}
