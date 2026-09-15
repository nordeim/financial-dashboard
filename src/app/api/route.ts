import { ok } from "@/lib/api";

/** Health probe — keeps the uniform API envelope contract. */
export async function GET() {
  return ok({ status: "ok", service: "finara-api" });
}
