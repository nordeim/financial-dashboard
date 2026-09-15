import { getDashboard } from "@/lib/analytics";
import { errorResponse, ok } from "@/lib/api";
import { ensureSeeded } from "@/lib/seed";

export async function GET() {
  try {
    await ensureSeeded();
    const dashboard = await getDashboard();
    return ok(dashboard);
  } catch (error) {
    return errorResponse(error);
  }
}
