import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChevronDownIcon, CloseIcon, GripIcon, PlusIcon } from "./icons";

describe.each([
  ["PlusIcon", PlusIcon],
  ["CloseIcon", CloseIcon],
  ["ChevronDownIcon", ChevronDownIcon],
  ["GripIcon", GripIcon],
])("%s", (_name, Icon) => {
  it("renders an svg that is hidden from assistive tech", () => {
    const { container } = render(<Icon />);

    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("defaults to a 16px size", () => {
    const { container } = render(<Icon />);

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "16");
    expect(svg).toHaveAttribute("height", "16");
  });

  it("respects a custom size prop", () => {
    const { container } = render(<Icon size={24} />);

    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "24");
    expect(svg).toHaveAttribute("height", "24");
  });

  it("applies a given className", () => {
    const { container } = render(<Icon className="my-icon" />);

    expect(container.querySelector("svg")).toHaveClass("my-icon");
  });
});
