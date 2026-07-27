# lib/language/typescript/

TypeScript library barrel: `index.ts`. Import definitions from there rather
than reaching into individual modules directly.

## http — generic HTTP helpers

- **`requestJson<T>(url: string, options?: RequestInit) -> Promise<T>`** —
  fetch `url` and parse the response as JSON. Rejects if the response status
  isn't 2xx. No knowledge of any specific app, API prefix, or endpoint.

## date — generic date/time formatting helpers

- **`isSameLocalYear(a: Date, b: Date) -> boolean`** — true if `a` and `b`
  fall in the same local calendar year.
- **`isSameLocalMonth(a: Date, b: Date) -> boolean`** — true if `a` and `b`
  fall in the same local calendar month of the same year.
- **`isSameLocalDay(a: Date, b: Date) -> boolean`** — true if `a` and `b`
  fall on the same calendar day in the local timezone.
- **`formatLocalClockTime(date: Date) -> string`** — formats `date` as a
  local clock time, e.g. `"3:45 PM"`.
- **`formatShortLocalDate(date: Date, now?: Date) -> string`** — formats
  `date` as a short local date, e.g. `"Jul 20"`. Appends the year
  (`"Jul 20, 2025"`) if `date`'s year differs from `now`'s (`now` defaults
  to the current time).

## string — generic string helpers

- **`getInitials(name: string, maxInitials?: number) -> string`** — uppercase
  initials from a name's first `maxInitials` words (default `2`), e.g.
  `"Austin Shank"` -> `"AS"`. Returns `""` for a blank name.
