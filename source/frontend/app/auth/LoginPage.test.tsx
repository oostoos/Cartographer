// @manualReviewRequested: 2026-07-06
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LoginPage } from "./LoginPage";
import * as authApi from "./authApi";
import { AUTH_STATUS_QUERY_KEY } from "./useAuthStatus";

function renderLoginPage() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return queryClient;
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("logs in with the entered username and password", async () => {
    const loginSpy = vi.spyOn(authApi, "login").mockResolvedValue({ loggedIn: true });
    renderLoginPage();

    await userEvent.type(screen.getByLabelText("Username"), "admin");
    await userEvent.type(screen.getByLabelText("Password"), "secret");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(loginSpy).toHaveBeenCalledWith("admin", "secret");
  });

  it("marks the auth-status cache as logged in immediately, without waiting for a refetch", async () => {
    vi.spyOn(authApi, "login").mockResolvedValue({ loggedIn: true });
    const queryClient = renderLoginPage();

    await userEvent.type(screen.getByLabelText("Username"), "admin");
    await userEvent.type(screen.getByLabelText("Password"), "secret");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(queryClient.getQueryData(AUTH_STATUS_QUERY_KEY)).toEqual({ loggedIn: true });
  });

  it("shows an error message when login fails", async () => {
    vi.spyOn(authApi, "login").mockRejectedValue(new Error("nope"));
    renderLoginPage();

    await userEvent.type(screen.getByLabelText("Username"), "admin");
    await userEvent.type(screen.getByLabelText("Password"), "wrong");
    await userEvent.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByText(/incorrect username or password/i)).toBeInTheDocument();
  });
});
