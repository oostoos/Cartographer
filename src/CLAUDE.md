# src/

Stack- and business-specific code, split into two top-level directories. See `.ajx/AustinsSweManifesto.md` ("Code organization" section).

- `common/` — stack-specific shared logic that does not include business or app-specific logic.
- `main/` — app-specific logic that actually drives what the application does.

Within each, group code by functional area, not by file type (no top-level "hooks" or "utils" dumping grounds).
