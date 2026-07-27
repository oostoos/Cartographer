# lib/stack/flask/

Flask stack library barrel: `index.py`. Import definitions from there rather
than reaching into individual modules directly.

## app_factory — bare Flask app + JSON error handling

- **`createApp() -> Flask`** — builds a bare `Flask` app and registers error
  handlers (`HTTPException` and generic `Exception`) that both funnel into
  `buildErrorResponse`, so every error response — expected or not — is valid
  JSON. No business routes registered.

## responses — JSON success/error envelope helpers

Every envelope always carries all three keys — `success`, `data`, and
`error` — with whichever one doesn't apply set to `null`.

- **`buildSuccessResponse(data=None, status_code=200) -> tuple[Response, int]`**
  — builds a `(jsonify({"success": True, "data": data, "error": None}), status_code)`
  tuple.
- **`buildErrorResponse(message, status_code=400) -> tuple[Response, int]`**
  — builds a `(jsonify({"success": False, "data": None, "error": message}), status_code)`
  tuple.
