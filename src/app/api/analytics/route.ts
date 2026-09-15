import { getAnalytics } from "@/lib/analytics";
import { errorResponse, ok } from "@/lib/api";
import { ensureSeeded } from "@/lib/seed";

export async function GET(request: Request) {
  try {
    await ensureSeeded();
    const monthsParam = new URL(request.url).searchParams.get("months");
    const months = monthsParam ? Number.parseInt(monthsParam, 10) : 6;
    const analytics = await getAnalytics(Number.isFinite(months) ? months : 6);
    return ok(analytics);
  } catch (error) {
    return errorResponse(error);
  }
}
