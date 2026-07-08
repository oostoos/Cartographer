// @manualReviewRequested: 2026-07-06
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MasterDetailLayout } from "./MasterDetailLayout";

describe("MasterDetailLayout", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders only the list, centered, when detail is null", () => {
    const { container } = render(
      <MasterDetailLayout list={<p>List content</p>} detail={null} onCloseDetail={vi.fn()} />,
    );
    expect(screen.getByText("List content")).toBeInTheDocument();
    expect(container.querySelector(".cg-master-detail--split")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("splits into list + detail with a close button when detail is given", () => {
    const { container } = render(
      <MasterDetailLayout
        list={<p>List content</p>}
        detail={<p>Detail content</p>}
        onCloseDetail={vi.fn()}
      />,
    );
    expect(screen.getByText("Detail content")).toBeInTheDocument();
    expect(container.querySelector(".cg-master-detail--split")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("calls onCloseDetail when the close button is clicked", () => {
    const onCloseDetail = vi.fn();
    render(
      <MasterDetailLayout
        list={<p>List content</p>}
        detail={<p>Detail content</p>}
        onCloseDetail={onCloseDetail}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onCloseDetail).toHaveBeenCalledTimes(1);
  });

  it("keeps detail content mounted through the close transition, then clears it", () => {
    const { rerender } = render(
      <MasterDetailLayout
        list={<p>List content</p>}
        detail={<p>Detail content</p>}
        onCloseDetail={vi.fn()}
      />,
    );
    rerender(
      <MasterDetailLayout list={<p>List content</p>} detail={null} onCloseDetail={vi.fn()} />,
    );
    // Still mounted immediately after detail becomes null — the transition hasn't finished yet.
    expect(screen.getByText("Detail content")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByText("Detail content")).not.toBeInTheDocument();
  });
});
