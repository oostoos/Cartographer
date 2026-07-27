// React stack library barrel: generic, framework-aware building blocks.
// Import from here (or a deep path under this directory) rather than
// reaching into src/frontend's app-specific code.

// bootstrap — mounts a React root
export { mountReactApp } from "./bootstrap/main";

// design-language — design tokens-driven UI primitives (consuming app supplies the tokens)
export { Button } from "./design-language/button";
export type { TButtonVariant } from "./design-language/button";
export { Card } from "./design-language/card";
export { IconButton } from "./design-language/icon-button";
export { InitialsChip } from "./design-language/initials-chip";
export { Modal } from "./design-language/modal";
export { ChevronDownIcon, CloseIcon, GripIcon, PencilIcon, PlusIcon, TrashIcon } from "./design-language/icons";

// layout — page structure primitives
export { PageContainer } from "./layout/page-container";
export { TopNavBar } from "./layout/top-nav-bar";
export type { ITopNavBarLink } from "./layout/top-nav-bar";

// hooks — generic React hooks
export { useLoadingState } from "./hooks/use-loading-state";
export { useAsyncResource } from "./hooks/use-async-resource";

// api — JSON API client with envelope unwrapping
export { deleteJson, getJson, patchJson, postJson, putJson } from "./api/http-client";
