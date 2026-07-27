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

  it("does not apply the full-width modifier by default", () => {
    render(
      <PageContainer>
        <p>Page content</p>
      </PageContainer>,
    );

    expect(screen.getByRole("main")).not.toHaveClass("page-container--full-width");
  });

  it("applies the full-width modifier when fullWidth is set", () => {
    render(
      <PageContainer fullWidth>
        <p>Page content</p>
      </PageContainer>,
    );

    expect(screen.getByRole("main")).toHaveClass("page-container--full-width");
  });
});
