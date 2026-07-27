import { act } from "react-dom/test-utils";
import { afterEach, describe, expect, it } from "vitest";

import { mountReactApp } from "./main";

describe("mountReactApp", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("throws when no #root element exists", () => {
    expect(() => mountReactApp(<div />)).toThrow(/no element with id "root"/);
  });

  it("renders the given component into the #root element", () => {
    const root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);

    act(() => {
      mountReactApp(<div data-testid="mounted">hello</div>);
    });

    expect(root.textContent).toContain("hello");
  });
});
