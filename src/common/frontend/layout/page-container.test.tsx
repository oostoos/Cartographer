import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageContainer } from "./page-container";

describe("PageContainer", () => {
  it("renders its children inside a main landmark with the page-container class", () => {
    render(
      <PageContainer>
        <p>Page content</p>
      </PageContainer>,
    );

    const main = screen.getByRole("main");
    expect(main).toHaveClass("page-container");
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });
});
