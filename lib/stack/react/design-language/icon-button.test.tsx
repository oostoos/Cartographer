import { createRef } from "react";

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IconButton } from "./icon-button";
import { CloseIcon } from "./icons";

describe("IconButton", () => {
  it("renders with the given aria-label as its accessible name", () => {
    render(
      <IconButton aria-label="Close">
        <CloseIcon />
      </IconButton>,
    );

    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("forwards native button props like onClick and disabled", () => {
    const onClick = vi.fn();
    render(
      <IconButton aria-label="Close" onClick={onClick} disabled>
        <CloseIcon />
      </IconButton>,
    );

    const button = screen.getByRole("button", { name: "Close" });
    expect(button).toBeDisabled();
    button.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("merges a given className with the base icon-button class", () => {
    render(
      <IconButton aria-label="Close" className="extra">
        <CloseIcon />
      </IconButton>,
    );

    const button = screen.getByRole("button", { name: "Close" });
    expect(button).toHaveClass("icon-button");
    expect(button).toHaveClass("extra");
  });

  it("forwards its ref to the underlying button element", () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <IconButton aria-label="Close" ref={ref}>
        <CloseIcon />
      </IconButton>,
    );

    expect(ref.current).toBe(screen.getByRole("button", { name: "Close" }));
  });
});
