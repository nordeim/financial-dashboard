import { db } from "@/lib/db";
import {
  errorResponse,
  fail,
  ok,
  requireNonNegativeInt,
  requirePositiveNumber,
  requireString,
  safeJson,
} from "@/lib/api";
import { ensureSeeded } from "@/lib/seed";

function toDto(holding: {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  avgPriceMinor: number;
  currentPriceMinor: number;
  sector: string;
}) {
  return {
    id: holding.id,
    symbol: holding.symbol,
    name: holding.name,
    shares: holding.shares,
    avgPriceMinor: holding.avgPriceMinor,
    currentPriceMinor: holding.currentPriceMinor,
    sector: holding.sector,
  };
}

export async function GET() {
  try {
    await ensureSeeded();
    const holdings = await db.investment.findMany({ orderBy: { createdAt: "asc" } });
    return ok(holdings.map(toDto));
  } catch (error) {
    return errorResponse(error);
  }
}

interface InvestmentPayload {
  symbol?: unknown;
  name?: unknown;
  shares?: unknown;
  avgPriceMinor?: unknown;
  currentPriceMinor?: unknown;
  sector?: unknown;
}

export async function POST(request: Request) {
  try {
    const body = await safeJson<InvestmentPayload>(request);
    if (!body) return fail("Invalid JSON body", 400);
    const symbol = requireString(body.symbol, "Symbol", 12).toUpperCase();
    const name = requireString(body.name, "Name", 120);
    const shares = requirePositiveNumber(body.shares, "Shares");
    const avgPriceMinor = requireNonNegativeInt(body.avgPriceMinor, "Average price");
    const currentPriceMinor = requireNonNegativeInt(body.currentPriceMinor, "Current price");
    const sector = requireString(body.sector, "Sector", 40);
    const created = await db.investment.create({
      data: { symbol, name, shares, avgPriceMinor, currentPriceMinor, sector },
    });
    return ok(toDto(created), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
