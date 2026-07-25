/** Generic fetch-and-parse-JSON-or-throw helper. No knowledge of any specific app, API prefix, or endpoint. */
export async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}
