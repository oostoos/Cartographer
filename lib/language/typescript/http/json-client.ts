/** Generic fetch-and-parse-JSON-or-throw helper. No knowledge of any specific app, API prefix, or endpoint. */
export async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!isResponseSuccess(response)) {
    throw ResponseFailureError(response);
  }
  return (await response.json()) as T;
}

function isResponseSuccess(response: Response): boolean {
  return response.ok;
}

function ResponseFailureError(response: Response): Error {
  return new Error(RESPONSE_FAILURE_MESSAGE(response));
}

function RESPONSE_FAILURE_MESSAGE(response: Response): string {
  return `Request to ${response.url} failed with status ${response.status}`;
}