/**
 * Thin API client — wraps fetch with auth headers and error handling.
 * Falls back to the mock service when the API is unreachable.
 */

const BASE = import.meta.env.VITE_API_URL ?? "";

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function request<T>(
  method: string,
  path: string,
  options: { body?: unknown; token?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (options.token) headers["Authorization"] = `Bearer ${options.token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(data?.error ?? `HTTP ${res.status}`, res.status);
  return data as T;
}

export const client = {
  get: <T>(path: string, token?: string | null) => request<T>("GET", path, { token }),
  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>("POST", path, { body, token }),
};
