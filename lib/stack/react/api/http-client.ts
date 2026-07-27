import { requestJson } from "@lib/http/json-client";

/** Base path prefixed onto every call below, unless the caller overrides it. */
const DEFAULT_API_BASE_PATH = "/api";

interface IApiSuccessEnvelope<T> {
  success: true;
  data: T;
}

async function requestApiJson<T>(path: string, basePath: string, options?: RequestInit): Promise<T> {
  const envelope = await requestJson<IApiSuccessEnvelope<T>>(`${basePath}${path}`, options);
  return envelope.data;
}

/** GET a JSON API endpoint under `basePath` (default `/api`) and return its unwrapped response data. */
export function getJson<T>(path: string, basePath: string = DEFAULT_API_BASE_PATH): Promise<T> {
  return requestApiJson<T>(path, basePath);
}

/** Send a JSON body to an endpoint under `basePath` via the given method and return its unwrapped response data. */
function requestApiJsonWithBody<T>(
  method: string,
  path: string,
  body: unknown,
  basePath: string,
): Promise<T> {
  return requestApiJson<T>(path, basePath, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** POST a JSON body to an endpoint under `basePath` (default `/api`) and return its unwrapped response data. */
export function postJson<T>(path: string, body: unknown, basePath: string = DEFAULT_API_BASE_PATH): Promise<T> {
  return requestApiJsonWithBody<T>("POST", path, body, basePath);
}

/** PATCH a JSON body to an endpoint under `basePath` (default `/api`) and return its unwrapped response data. */
export function patchJson<T>(path: string, body: unknown, basePath: string = DEFAULT_API_BASE_PATH): Promise<T> {
  return requestApiJsonWithBody<T>("PATCH", path, body, basePath);
}

/** PUT a JSON body to an endpoint under `basePath` (default `/api`) and return its unwrapped response data. */
export function putJson<T>(path: string, body: unknown, basePath: string = DEFAULT_API_BASE_PATH): Promise<T> {
  return requestApiJsonWithBody<T>("PUT", path, body, basePath);
}

/** DELETE an endpoint under `basePath` (default `/api`) and return its unwrapped response data. */
export function deleteJson<T>(path: string, basePath: string = DEFAULT_API_BASE_PATH): Promise<T> {
  return requestApiJson<T>(path, basePath, { method: "DELETE" });
}
