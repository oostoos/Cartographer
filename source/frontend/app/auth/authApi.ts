import { apiGet, apiPost } from "../../core/api/apiClient";

export type AuthStatus = {
  loggedIn: boolean;
};

/** Reads whether anyone is currently logged in. */
export function fetchAuthStatus(): Promise<AuthStatus> {
  return apiGet<AuthStatus>("/api/auth/status");
}

/** Logs the single local user in.
 *
 * Raises (as a rejected promise): ApiError with status 401 on a wrong username/password.
 */
export function login(username: string, password: string): Promise<AuthStatus> {
  return apiPost<AuthStatus>("/api/auth/login", { username, password });
}

/** Logs the current user out. */
export function logout(): Promise<AuthStatus> {
  return apiPost<AuthStatus>("/api/auth/logout");
}
