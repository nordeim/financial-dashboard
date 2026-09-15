import { NextResponse } from "next/server";

/**
 * Uniform JSON result envelope so client callers never parse error prose.
 * Modeled on the ActionResult<T> convention: { ok: true, data } | { ok: false, error }.
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export function ok<T>(data: T, init?: number): NextResponse<ApiResult<T>> {
  return NextResponse.json({ ok: true, data }, { status: init ?? 200 });
}

export function fail(error: string, status: number): NextResponse<ApiResult<never>> {
  return NextResponse.json({ ok: false, error }, { status });
}

/** Parse a JSON body defensively; returns null on malformed payloads. */
export async function safeJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function requireNonNegativeInt(value: unknown, field: string): number {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > Number.MAX_SAFE_INTEGER) {
    throw new ValidationError(`${field} must be a non-negative integer (minor units)`);
  }
  return parsed;
}

export function requirePositiveNumber(value: unknown, field: string): number {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new ValidationError(`${field} must be a positive number`);
  }
  return parsed;
}

export function requireString(value: unknown, field: string, maxLength = 200): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new ValidationError(`${field} must be a non-empty string of at most ${maxLength} characters`);
  }
  return value.trim();
}

export function optionalString(value: unknown, maxLength = 500): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string" || value.length > maxLength) return null;
  return value.trim() || null;
}

export function requireIsoDate(value: unknown, field: string): Date {
  if (typeof value !== "string") throw new ValidationError(`${field} must be an ISO date string`);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ValidationError(`${field} is not a valid date`);
  return date;
}

export class ValidationError extends Error {}

/** Maps a thrown error to a JSON response without leaking internals. */
export function errorResponse(error: unknown): NextResponse<ApiResult<never>> {
  if (error instanceof ValidationError) {
    return fail(error.message, 400);
  }
  console.error("[api] unhandled error:", error);
  return fail("Something went wrong. Please try again.", 500);
}
