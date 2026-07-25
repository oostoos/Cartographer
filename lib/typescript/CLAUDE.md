# lib/typescript/

TypeScript library barrel: `index.ts`. Import definitions from there rather
than reaching into individual modules directly.

## http — generic HTTP helpers

- **`requestJson<T>(url: string, options?: RequestInit) -> Promise<T>`** —
  fetch `url` and parse the response as JSON. Rejects if the response status
  isn't 2xx. No knowledge of any specific app, API prefix, or endpoint.
