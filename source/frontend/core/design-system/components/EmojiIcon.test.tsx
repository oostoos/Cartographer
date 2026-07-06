// @manualReviewRequested: 2026-07-06
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmojiIcon } from "./EmojiIcon";

describe("EmojiIcon", () => {
  it("renders the emoji with an accessible label", () => {
    render(<EmojiIcon symbol="✅" label="Mark complete" />);
    const icon = screen.getByRole("img", { name: "Mark complete" });
    expect(icon).toHaveTextContent("✅");
  });
});
