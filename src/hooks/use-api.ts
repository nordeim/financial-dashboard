"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Minimal typed fetch hook with loading/error state and manual refresh.
 * Avoids global state duplication: each view owns its own slice of data.
 */

interface ApiEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useQuery<T>(url: string, options: { manual?: boolean } = {}): QueryState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      const payload = (await response.json()) as ApiEnvelope<T>;
      if (!response.ok || !payload.ok || payload.data === undefined) {
        throw new Error(payload.error ?? `Request failed with status ${response.status}`);
      }
      if (mounted.current) setData(payload.data);
    } catch (cause) {
      if (mounted.current) {
        setError(cause instanceof Error ? cause.message : "Unable to load data");
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    mounted.current = true;
    if (!options.manual) void load();
    return () => {
      mounted.current = false;
    };
  }, [load, options.manual]);

  return { data, loading, error, refresh: () => void load() };
}

/** Typed mutation helper returning the parsed envelope. */
export async function mutate<T>(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
): Promise<ApiEnvelope<T>> {
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const payload = (await response.json()) as ApiEnvelope<T>;
    if (!response.ok || !payload.ok) {
      return { ok: false, error: payload.error ?? `Request failed with status ${response.status}` };
    }
    return payload;
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : "Network error" };
  }
}
