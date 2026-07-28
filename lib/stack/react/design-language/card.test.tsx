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

  it("applies a given style override", () => {
    render(
      <Card style={{ backgroundColor: "#f3d9c4" }}>
        <p>Task content</p>
      </Card>,
    );

    const card = screen.getByText("Task content").closest(".card");
    expect(card).toHaveStyle({ backgroundColor: "#f3d9c4" });
  });
});
