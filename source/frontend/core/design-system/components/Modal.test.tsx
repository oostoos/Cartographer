// @manualReviewRequested: 2026-07-06
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders nothing when closed", () => {
    render(
      <Modal isOpen={false} title="Test modal" onClose={vi.fn()}>
        <p>Content</p>
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders its title and content when open", () => {
    render(
      <Modal isOpen title="Test modal" onClose={vi.fn()}>
        <p>Content</p>
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "Test modal" })).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen title="Test modal" onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    fireEvent.click(screen.getByRole("dialog").parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onClose when the dialog content is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen title="Test modal" onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    fireEvent.click(screen.getByText("Content"));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen title="Test modal" onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen title="Test modal" onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps focus on an autoFocus field inside its content instead of stealing it", () => {
    render(
      <Modal isOpen title="Test modal" onClose={vi.fn()}>
        <input aria-label="Title" autoFocus />
      </Modal>,
    );
    expect(screen.getByLabelText("Title")).toHaveFocus();
  });
});
