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
import { INVESTMENT_TYPES, SECTORS, normalizeSector } from "@/lib/categories";
import { ensureSeeded } from "@/lib/seed";

function toDto(holding: {
  id: string;
  symbol: string;
  name: string;
  type: string;
  shares: number;
  avgPriceMinor: number;
  currentPriceMinor: number;
  portfolioPercent: number | null;
  sector: string;
}) {
  return {
    id: holding.id,
    symbol: holding.symbol,
    name: holding.name,
    type: holding.type,
    shares: holding.shares,
    avgPriceMinor: holding.avgPriceMinor,
    currentPriceMinor: holding.currentPriceMinor,
    portfolioPercent: holding.portfolioPercent,
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
  type?: unknown;
  shares?: unknown;
  avgPriceMinor?: unknown;
  currentPriceMinor?: unknown;
  portfolioPercent?: unknown;
  sector?: unknown;
}

export async function POST(request: Request) {
  try {
    const body = await safeJson<InvestmentPayload>(request);
    if (!body) return fail("Invalid JSON body", 400);
    const symbol = requireString(body.symbol, "Symbol", 12).toUpperCase();
    const name = requireString(body.name, "Name", 120);
    const type =
      typeof body.type === "string" && INVESTMENT_TYPES.some((option) => option.id === body.type)
        ? body.type
        : "stock";
    const shares = requirePositiveNumber(body.shares, "Shares");
    const avgPriceMinor = requireNonNegativeInt(body.avgPriceMinor, "Average price");
    const currentPriceMinor = requireNonNegativeInt(body.currentPriceMinor, "Current price");
    const sector = normalizeSector(requireString(body.sector, "Sector", 40));
    if (!(SECTORS as readonly string[]).includes(sector)) {
      return fail("Sector must be one of the supported sectors", 400);
    }
    const portfolioPercent =
      body.portfolioPercent === undefined || body.portfolioPercent === null
        ? null
        : requirePositiveNumber(body.portfolioPercent, "Portfolio percent");
    const created = await db.investment.create({
      data: { symbol, name, type, shares, avgPriceMinor, currentPriceMinor, portfolioPercent, sector },
    });
    return ok(toDto(created), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
