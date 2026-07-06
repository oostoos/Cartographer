// @manualReviewRequested: 2026-07-06
import { useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../core/design-system/components/Button";
import { Card } from "../../core/design-system/components/Card";
import { EmojiIcon } from "../../core/design-system/components/EmojiIcon";
import { TextInput } from "../../core/design-system/components/TextInput";
import { login } from "./authApi";
import { AUTH_STATUS_QUERY_KEY } from "./useAuthStatus";
import "./LoginPage.css";

const INCORRECT_CREDENTIALS_MESSAGE = "Incorrect username or password.";

/** The login screen shown to anyone without an active session. */
export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage("");
    try {
      await login(username, password);
      queryClient.setQueryData(AUTH_STATUS_QUERY_KEY, { loggedIn: true });
      navigate("/");
    } catch {
      setErrorMessage(INCORRECT_CREDENTIALS_MESSAGE);
    }
  }

  return (
    <div className="cg-login-page">
      <Card className="cg-login-page__card">
        <h1>
          Cartographer <EmojiIcon symbol="🧭" label="Cartographer" />
        </h1>
        <form onSubmit={handleSubmit}>
          <label className="cg-login-page__field">
            Username
            <TextInput
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoFocus
            />
          </label>
          <label className="cg-login-page__field">
            Password
            <TextInput
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {errorMessage && <p className="cg-login-page__error">{errorMessage}</p>}
          <Button type="submit" emphasis="solid">
            Log in
          </Button>
        </form>
      </Card>
    </div>
  );
}
