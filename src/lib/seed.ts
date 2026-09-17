import { db } from "@/lib/db";

/**
 * Idempotent demo seed — populates a fresh database with a realistic
 * six-month financial history so every dashboard surface has meaningful data.
 *
 * Concurrency safety: multiple API routes call ensureSeeded() on first load;
 * a module-global promise mutex guarantees the seed body runs exactly once
 * per process (a second check inside the lock catches cross-process races).
 */

interface ExpenseSeed {
  description: string;
  amountMinor: number;
  category: string;
  subcategory: string;
  monthsAgo: number;
  day: number;
  recurring: boolean;
  notes?: string;
}

const RECURRING_SEEDS: ExpenseSeed[] = [
  { description: "Monthly rent", amountMinor: 245000, category: "Needs", subcategory: "rent", monthsAgo: 0, day: 1, recurring: true },
  { description: "Whole Foods groceries", amountMinor: 62000, category: "Needs", subcategory: "groceries", monthsAgo: 0, day: 6, recurring: false },
  { description: "Trader Joe's run", amountMinor: 28000, category: "Needs", subcategory: "groceries", monthsAgo: 0, day: 18, recurring: false },
  { description: "Electric bill", amountMinor: 14200, category: "Needs", subcategory: "utilities", monthsAgo: 0, day: 12, recurring: true },
  { description: "Internet - Fiber 1Gbps", amountMinor: 8900, category: "Needs", subcategory: "utilities", monthsAgo: 0, day: 14, recurring: true },
  { description: "Metro transit pass", amountMinor: 9600, category: "Needs", subcategory: "transportation", monthsAgo: 0, day: 2, recurring: true },
  { description: "Health insurance premium", amountMinor: 24500, category: "Needs", subcategory: "healthcare", monthsAgo: 0, day: 5, recurring: true },
  { description: "Pharmacy pickup", amountMinor: 4300, category: "Needs", subcategory: "healthcare", monthsAgo: 0, day: 21, recurring: false },
  { description: "Student loan payment", amountMinor: 42000, category: "Needs", subcategory: "other-needs", monthsAgo: 0, day: 10, recurring: true },
  { description: "Netflix + Spotify bundle", amountMinor: 3599, category: "Wants", subcategory: "subscriptions", monthsAgo: 0, day: 8, recurring: true },
  { description: "Dinner at Trattoria Roma", amountMinor: 12500, category: "Wants", subcategory: "dining", monthsAgo: 0, day: 9, recurring: false },
  { description: "Cinema - weekend show", amountMinor: 3200, category: "Wants", subcategory: "entertainment", monthsAgo: 0, day: 16, recurring: false },
  { description: "Emergency fund transfer", amountMinor: 40000, category: "Savings", subcategory: "emergency-fund", monthsAgo: 0, day: 3, recurring: true },
  { description: "Brokerage index purchase", amountMinor: 60000, category: "Savings", subcategory: "investments", monthsAgo: 0, day: 15, recurring: true },
  { description: "401k contribution", amountMinor: 52000, category: "Savings", subcategory: "retirement", monthsAgo: 0, day: 25, recurring: true },
];

function recurringForMonth(monthsAgo: number, maxDay: number): ExpenseSeed[] {
  const jitter = (base: number, pct: number): number =>
    Math.round(base * (1 + (Math.random() * 2 - 1) * pct));
  return RECURRING_SEEDS.filter((seed) => seed.day <= maxDay).map((seed) => ({
    ...seed,
    monthsAgo,
    amountMinor: jitter(seed.amountMinor, 0.1),
    notes: undefined,
  }));
}

const ONE_OFF_SEEDS: ExpenseSeed[] = [
  { description: "Weekend brunch", amountMinor: 5400, category: "Wants", subcategory: "dining", monthsAgo: 0, day: 22, recurring: false },
  { description: "Uniqlo wardrobe refresh", amountMinor: 12900, category: "Wants", subcategory: "shopping", monthsAgo: 1, day: 11, recurring: false },
  { description: "Weekend trip to Kyoto", amountMinor: 86500, category: "Wants", subcategory: "other-wants", monthsAgo: 2, day: 17, recurring: false },
  { description: "Concert tickets", amountMinor: 15800, category: "Wants", subcategory: "entertainment", monthsAgo: 3, day: 20, recurring: false },
  { description: "Gym membership", amountMinor: 4900, category: "Wants", subcategory: "other-wants", monthsAgo: 1, day: 7, recurring: false },
  { description: "Online course - ML specialization", amountMinor: 24900, category: "Wants", subcategory: "other-wants", monthsAgo: 4, day: 13, recurring: false },
  { description: "Laptop repair", amountMinor: 18700, category: "Needs", subcategory: "other-needs", monthsAgo: 3, day: 26, recurring: false },
  { description: "Dentist checkup", amountMinor: 13500, category: "Needs", subcategory: "healthcare", monthsAgo: 2, day: 24, recurring: false },
  { description: "Car service - oil change", amountMinor: 8900, category: "Needs", subcategory: "transportation", monthsAgo: 1, day: 19, recurring: false },
  { description: "Birthday gift for Mia", amountMinor: 7500, category: "Wants", subcategory: "shopping", monthsAgo: 2, day: 5, recurring: false },
  { description: "Uber rides", amountMinor: 4360, category: "Needs", subcategory: "transportation", monthsAgo: 0, day: 27, recurring: false },
  { description: "Coffee beans subscription", amountMinor: 2200, category: "Wants", subcategory: "subscriptions", monthsAgo: 5, day: 9, recurring: false },
];

function seedDate(monthsAgo: number, day: number): Date {
  const now = new Date();
  // 01:00 local — current-month entries must be in the past at any hour of
  // the seed run, or month-to-date aggregations would exclude them until noon.
  return new Date(now.getFullYear(), now.getMonth() - monthsAgo, day, 1, 0, 0);
}

async function waitForSeedCompletion(attempt = 0): Promise<void> {
  if (attempt > 20) return; // bounded wait (~5s) — degrade to reading whatever exists
  const done = await db.setting.findUnique({ where: { key: "_seeded" } });
  if (done) return;
  await new Promise((resolve) => setTimeout(resolve, 250));
  await waitForSeedCompletion(attempt + 1);
}

async function seed(): Promise<void> {
  // DB-level mutex: the Setting.key UNIQUE constraint guarantees exactly one
  // seeder across processes and route bundles. A duplicate-key failure means
  // another seeder holds the lock — wait for it to publish the _seeded marker
  // so callers never observe a partially seeded database.
  try {
    await db.setting.create({ data: { key: "_seed_lock", value: "acquired" } });
  } catch {
    await waitForSeedCompletion();
    return;
  }

  const existingExpense = await db.expense.findFirst({ select: { id: true } });
  if (existingExpense) return;

  await db.account.createMany({
    data: [
      { name: "Everyday Checking", type: "checking", institution: "Chase Bank", balanceMinor: 487350 },
      { name: "High-Yield Savings", type: "savings", institution: "Ally Bank", balanceMinor: 1254900 },
      { name: "Amex Gold Card", type: "credit-card", institution: "American Express", balanceMinor: -128430 },
      { name: "Brokerage Cash", type: "investment", institution: "Vanguard", balanceMinor: 61200 },
    ],
  });

  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
  await db.incomeSource.createMany({
    data: [
      { name: "Software Engineer Salary", amountMinor: 480000, frequency: "biweekly", category: "primary", active: true, nextPaymentDate: nextMonth },
      { name: "Freelance Web Projects", amountMinor: 60000, frequency: "monthly", category: "secondary", active: true, nextPaymentDate: nextMonth },
      { name: "Rental Income - Unit 4B", amountMinor: 95000, frequency: "monthly", category: "passive", active: true, nextPaymentDate: nextMonth },
      { name: "Dividend Portfolio", amountMinor: 12400, frequency: "annual", category: "passive", active: true, nextPaymentDate: nextMonth },
    ],
  });

  const today = new Date();
  const todayDay = today.getDate();
  const monthlyRecurring = [0, 1, 2, 3, 4, 5].flatMap((monthsAgo) => {
    const maxDay = monthsAgo === 0 ? todayDay : 28;
    return recurringForMonth(monthsAgo, maxDay);
  });
  const oneOffs = ONE_OFF_SEEDS.filter((seed) => !(seed.monthsAgo === 0 && seed.day > todayDay));
  const allExpenses = [...monthlyRecurring, ...oneOffs].map((seed) => ({
    description: seed.description,
    amountMinor: seed.amountMinor,
    category: seed.category,
    subcategory: seed.subcategory,
    date: seedDate(seed.monthsAgo, seed.day),
    recurring: seed.recurring,
    notes: seed.notes ?? null,
  }));
  await db.expense.createMany({ data: allExpenses });

  await db.budget.createMany({
    data: [
      { category: "Needs", monthlyLimitMinor: 460000 },
      { category: "Wants", monthlyLimitMinor: 600000 },
      { category: "Savings", monthlyLimitMinor: 160000 },
    ],
  });

  const goalDeadline = (months: number): Date => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date;
  };
  await db.goal.createMany({
    data: [
      { name: "Emergency Fund", targetAmountMinor: 1500000, currentAmountMinor: 962500, deadline: goalDeadline(8), category: "emergency", priority: "high" },
      { name: "Trip to Bali", targetAmountMinor: 450000, currentAmountMinor: 178300, deadline: goalDeadline(11), category: "vacation", priority: "medium" },
      { name: "New MacBook Pro", targetAmountMinor: 280000, currentAmountMinor: 210000, deadline: goalDeadline(3), category: "other", priority: "low" },
    ],
  });

  await db.investment.createMany({
    data: [
      { symbol: "AAPL", name: "Apple Inc.", type: "stock", shares: 45, avgPriceMinor: 14250, currentPriceMinor: 22880, sector: "Technology" },
      { symbol: "MSFT", name: "Microsoft Corp.", type: "stock", shares: 28, avgPriceMinor: 30500, currentPriceMinor: 42110, sector: "Technology" },
      { symbol: "NVDA", name: "NVIDIA Corp.", type: "stock", shares: 60, avgPriceMinor: 21800, currentPriceMinor: 48950, sector: "Technology" },
      { symbol: "VTI", name: "Vanguard Total Stock Market ETF", type: "etf", shares: 120, avgPriceMinor: 21300, currentPriceMinor: 27460, sector: "Other" },
      { symbol: "JNJ", name: "Johnson & Johnson", type: "stock", shares: 25, avgPriceMinor: 15800, currentPriceMinor: 16420, sector: "Healthcare" },
      { symbol: "JPM", name: "JPMorgan Chase & Co.", type: "stock", shares: 30, avgPriceMinor: 13900, currentPriceMinor: 21980, sector: "Finance" },
      { symbol: "O", name: "Realty Income Corp.", type: "stock", shares: 80, avgPriceMinor: 5600, currentPriceMinor: 5890, sector: "Real Estate" },
      { symbol: "XOM", name: "Exxon Mobil Corp.", type: "stock", shares: 18, avgPriceMinor: 10400, currentPriceMinor: 11730, sector: "Energy" },
    ],
  });

  await db.setting.createMany({
    data: [
      { key: "currency", value: "USD" },
      { key: "dateFormat", value: "MM/dd/yyyy" },
      // Round-10: the preferred theme persists like the live user record's
      // theme field; a fresh account starts light.
      { key: "theme", value: "light" },
      { key: "pushNotifications", value: "false" },
      { key: "emailAlerts", value: "false" },
      { key: "budgetWarnings", value: "false" },
      { key: "monthlyReports", value: "false" },
    ],
  });

  // Publish completion last: waiters poll for this marker.
  await db.setting.create({ data: { key: "_seeded", value: new Date().toISOString() } });
}

const globalForSeed = globalThis as unknown as {
  finaraSeedPromise?: Promise<void>;
};

export function ensureSeeded(): Promise<void> {
  if (!globalForSeed.finaraSeedPromise) {
    globalForSeed.finaraSeedPromise = seed().catch((error: unknown) => {
      // Allow a retry on the next call if the seed run failed.
      globalForSeed.finaraSeedPromise = undefined;
      throw error;
    });
  }
  return globalForSeed.finaraSeedPromise;
}
