import type { ReactElement } from "react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "../design-language/global.css";

const ROOT_ELEMENT_ID = "root";

/** Mount a React root component into the page's #root element. */
export function mountReactApp(rootComponent: ReactElement): void {
  const container = document.getElementById(ROOT_ELEMENT_ID);
  if (!container) {
    throw new Error(`mountReactApp: no element with id "${ROOT_ELEMENT_ID}" found`);
  }
  createRoot(container).render(<StrictMode>{rootComponent}</StrictMode>);
}
