// @manualReviewRequested: 2026-07-06
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ModalButton } from "./ModalButton";

describe("ModalButton", () => {
  it("opens its modal when the trigger button is clicked", () => {
    render(<ModalButton label="New task" renderContent={() => <p>Task form</p>} />);
    expect(screen.queryByText("Task form")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "New task" }));
    expect(screen.getByText("Task form")).toBeInTheDocument();
  });

  it("closes when renderContent's close callback is invoked", () => {
    render(
      <ModalButton
        label="New task"
        renderContent={(close) => (
          <button type="button" onClick={close}>
            Save
          </button>
        )}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "New task" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
  });

  it("requires an aria-label for icon-only triggers", () => {
    render(
      <ModalButton
        label="Delete"
        iconOnly
        icon={{ symbol: "🗑️", label: "Delete" }}
        renderContent={() => <p>Confirm delete</p>}
      />,
    );
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });
});
