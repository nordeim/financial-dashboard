import { db } from "@/lib/db";
import { errorResponse, fail, ok, requireSignedInt, requireFiniteNumber, safeJson } from "@/lib/api";
import { INVESTMENT_TYPES, SECTORS, normalizeSector } from "@/lib/categories";

interface InvestmentPatch {
  symbol?: unknown;
  name?: unknown;
  type?: unknown;
  shares?: unknown;
  avgPriceMinor?: unknown;
  currentPriceMinor?: unknown;
  portfolioPercent?: unknown;
  sector?: unknown;
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await safeJson<InvestmentPatch>(request);
    if (!body) return fail("Invalid JSON body", 400);
    const existing = await db.investment.findUnique({ where: { id } });
    if (!existing) return fail("Investment not found", 404);

    if (body.type !== undefined && !INVESTMENT_TYPES.some((option) => option.id === body.type)) {
      return fail("Type must be one of stock, etf, bond, crypto, mutual-fund, other", 400);
    }
    if (body.sector !== undefined) {
      const sector = normalizeSector(String(body.sector));
      if (!(SECTORS as readonly string[]).includes(sector)) {
        return fail("Sector must be one of the supported sectors", 400);
      }
      body.sector = sector;
    }

    const updated = await db.investment.update({
      where: { id },
      data: {
        symbol:
          body.symbol === undefined
            ? undefined
            : String(body.symbol).toUpperCase().slice(0, 12) || existing.symbol,
        name: typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 120) : undefined,
        type: body.type === undefined ? undefined : String(body.type),
        shares: body.shares === undefined ? undefined : requireFiniteNumber(body.shares, "Shares"),
        avgPriceMinor:
          body.avgPriceMinor === undefined ? undefined : requireSignedInt(body.avgPriceMinor, "Average price"),
        currentPriceMinor:
          body.currentPriceMinor === undefined
            ? undefined
            : requireSignedInt(body.currentPriceMinor, "Current price"),
        portfolioPercent:
          body.portfolioPercent === undefined || body.portfolioPercent === null
            ? undefined
            : requireFiniteNumber(body.portfolioPercent, "Portfolio percent"),
        sector: body.sector === undefined ? undefined : String(body.sector),
      },
    });
    return ok({
      id: updated.id,
      symbol: updated.symbol,
      name: updated.name,
      type: updated.type,
      shares: updated.shares,
      avgPriceMinor: updated.avgPriceMinor,
      currentPriceMinor: updated.currentPriceMinor,
      portfolioPercent: updated.portfolioPercent,
      sector: updated.sector,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const existing = await db.investment.findUnique({ where: { id } });
    if (!existing) return fail("Investment not found", 404);
    await db.investment.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return errorResponse(error);
  }
}
