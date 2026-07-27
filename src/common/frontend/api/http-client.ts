import { requestJson } from "@lib/http/json-client";

/** Every Cartographer backend endpoint is served under this prefix, proxied to Flask by Vite. */
const API_BASE_PATH = "/api";

interface IApiSuccessEnvelope<T> {
  success: true;
  data: T;
}

async function requestApiJson<T>(path: string, options?: RequestInit): Promise<T> {
  const envelope = await requestJson<IApiSuccessEnvelope<T>>(`${API_BASE_PATH}${path}`, options);
  return envelope.data;
}

/** GET a Cartographer API endpoint and return its unwrapped response data. */
export function getJson<T>(path: string): Promise<T> {
  return requestApiJson<T>(path);
}

/** Send a JSON body to a Cartographer API endpoint via the given method and return its unwrapped response data. */
function requestApiJsonWithBody<T>(method: string, path: string, body: unknown): Promise<T> {
  return requestApiJson<T>(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** POST a JSON body to a Cartographer API endpoint and return its unwrapped response data. */
export function postJson<T>(path: string, body: unknown): Promise<T> {
  return requestApiJsonWithBody<T>("POST", path, body);
}

/** PATCH a JSON body to a Cartographer API endpoint and return its unwrapped response data. */
export function patchJson<T>(path: string, body: unknown): Promise<T> {
  return requestApiJsonWithBody<T>("PATCH", path, body);
}

/** PUT a JSON body to a Cartographer API endpoint and return its unwrapped response data. */
export function putJson<T>(path: string, body: unknown): Promise<T> {
  return requestApiJsonWithBody<T>("PUT", path, body);
}

/** DELETE a Cartographer API endpoint and return its unwrapped response data. */
export function deleteJson<T>(path: string): Promise<T> {
  return requestApiJson<T>(path, { method: "DELETE" });
}
