import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card } from "./card";

describe("Card", () => {
  it("renders its children inside a card-styled container", () => {
    render(
      <Card>
        <p>Task content</p>
      </Card>,
    );

    const content = screen.getByText("Task content");
    expect(content.closest(".card")).not.toBeNull();
  });
});
