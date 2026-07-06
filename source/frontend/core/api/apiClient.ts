// @manualReviewRequested: 2026-07-06
/** The one place every API call goes through, so request/response conventions (JSON, cookies,
 * error shape) are consistent everywhere instead of re-implemented per feature.
 */
const JSON_CONTENT_TYPE = "application/json";
const NO_CONTENT_STATUS = 204;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": JSON_CONTENT_TYPE, ...options.headers },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.error ?? response.statusText, response.status);
  }
  if (response.status === NO_CONTENT_STATUS) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** Sends a GET request and parses the JSON response. */
export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: "GET" });
}

/** Sends a POST request with an optional JSON body and parses the JSON response. */
export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/** Sends a PATCH request with a JSON body and parses the JSON response. */
export function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

/** Sends a DELETE request with an optional JSON body. */
export function apiDelete(path: string, body?: unknown): Promise<void> {
  return request<void>(path, {
    method: "DELETE",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
