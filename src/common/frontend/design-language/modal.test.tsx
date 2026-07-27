import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "./modal";

describe("Modal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="New project">
        <p>Content</p>
      </Modal>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the title and children when open", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="New project">
        <p>Content</p>
      </Modal>,
    );

    expect(screen.getByRole("dialog", { name: "New project" })).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("calls onClose when the backdrop is clicked", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen onClose={onClose} title="New project">
        <p>Content</p>
      </Modal>,
    );

    fireEvent.click(container.querySelector(".modal-overlay")!);

    expect(onClose).toHaveBeenCalled();
  });

  it("does not call onClose when the modal content is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="New project">
        <p>Content</p>
      </Modal>,
    );

    fireEvent.click(screen.getByText("Content"));

    expect(onClose).not.toHaveBeenCalled();
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="New project">
        <p>Content</p>
      </Modal>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="New project">
        <p>Content</p>
      </Modal>,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });
});
