import { getAnalytics } from "@/lib/analytics";
import { errorResponse, ok } from "@/lib/api";
import { ensureSeeded } from "@/lib/seed";

export async function GET() {
  try {
    await ensureSeeded();
    const analytics = await getAnalytics();
    return ok(analytics);
  } catch (error) {
    return errorResponse(error);
  }
}
