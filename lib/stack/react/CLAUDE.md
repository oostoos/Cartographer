# lib/stack/react/

React stack library barrel: `index.ts`. Import definitions from there (or a
deep path under this directory, e.g. `@lib-stack/design-language/button`)
rather than reaching into `src/frontend`'s app-specific code.

Every design-language component reads only CSS custom properties (design
tokens) — no hardcoded colors/fonts — so the consuming app supplies its own
look by loading its own token stylesheet before anything here renders.

## bootstrap — mounts a React root

- **`mountReactApp(rootComponent: ReactElement) -> void`** — finds `#root`
  in the DOM (throws if missing) and renders `rootComponent` into it inside
  `<StrictMode>`. Does not load any stylesheet itself — the caller imports
  its own global CSS before calling this.

## design-language — design tokens-driven UI primitives

- **`Button({ variant?, ...ButtonHTMLAttributes })`** — styled button;
  `variant: "primary" | "secondary" | "danger"` (default `"primary"`) drives
  the class name. Exports `TButtonVariant`.
- **`Card({ children })`** — a surface-colored, shadowed container for
  grouped content.
- **`IconButton({ "aria-label", ...ButtonHTMLAttributes })`** — a
  square/icon-only button; `aria-label` is required by the prop type for
  accessibility. Forwards its ref.
- **`InitialsChip({ initials })`** — a small circular chip rendering a
  person's initials text (e.g. a profile avatar placeholder).
- **`Modal({ isOpen, onClose, title, children })`** — a centered dialog
  overlay; closes on Escape or a backdrop click, renders nothing while
  `isOpen` is false.
- **`PlusIcon`, `CloseIcon`, `ChevronDownIcon`, `GripIcon`, `PencilIcon`,
  `TrashIcon`** — shared `24x24` stroke icons, each taking `IIconProps`
  (standard SVG props).

## layout — page structure primitives

- **`PageContainer({ children, fullWidth? })`** — centers and constrains a
  page's content with mobile-friendly padding; `fullWidth` drops the
  centered max-width constraint.
- **`TopNavBar({ brand, links, trailing? })`** — persistent top navigation:
  brand on the left, centered nav links, optional trailing content (e.g. a
  profile chip) on the right. Fully prop-driven, presentational only.
  Exports `ITopNavBarLink`.

## hooks — generic React hooks

- **`useLoadingState(initialIsLoading?) -> { isLoading, withLoading }`** —
  `withLoading` wraps any async operation, toggling `isLoading` around it.
  No knowledge of what the operation does.
- **`useAsyncResource(load, initialValue, errorMessage) -> { value, setValue, isLoading, error }`**
  — loads `initialValue` via `load` once on mount (built on
  `useLoadingState`), guards against post-unmount `setState`, and catches
  errors into the fixed `errorMessage` string.

## api — JSON API client with envelope unwrapping

- **`getJson<T>(path, basePath = "/api") -> Promise<T>`**,
  **`postJson<T>(path, body, basePath = "/api") -> Promise<T>`**,
  **`patchJson<T>(path, body, basePath = "/api") -> Promise<T>`**,
  **`putJson<T>(path, body, basePath = "/api") -> Promise<T>`**,
  **`deleteJson<T>(path, basePath = "/api") -> Promise<T>`** — call a JSON
  endpoint under `basePath` and unwrap a `{success, data}` response envelope
  (matching `lib/stack/flask/responses.py`'s shape) into just `T`.
