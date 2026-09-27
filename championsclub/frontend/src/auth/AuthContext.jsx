import { createContext, useContext, useEffect, useState } from "react";
import { request, setAccessToken } from "../api/client.js";

const Context = createContext(null);
const storageKey = "championsclub.session.v2";
const readToken = () => {
  try {
    return sessionStorage.getItem(storageKey);
  } catch {
    return null;
  }
};
const storeToken = (token) => {
  try {
    token
      ? sessionStorage.setItem(storageKey, token)
      : sessionStorage.removeItem(storageKey);
  } catch {}
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(readToken() ? "checking" : "ready");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const token = readToken();
    if (!token) return;
    setAccessToken(token);
    setStatus("checking");
    const controller = new AbortController();
    request("/api/me", { signal: controller.signal })
      .then((account) => {
        if (!controller.signal.aborted) {
          setUser(account);
          setStatus("ready");
          setError("");
        }
      })
      .catch((failure) => {
        if (!controller.signal.aborted) {
          setStatus(failure.status === 401 ? "ready" : "error");
          setError(
            failure.status === 401
              ? "Your session has expired. Please sign in again."
              : failure.message,
          );
        }
      });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    const expire = () => {
      storeToken(null);
      setAccessToken(null);
      setUser(null);
      setStatus("ready");
      setError("Your session has expired. Please sign in again.");
    };
    window.addEventListener("championsclub:expired", expire);
    return () => window.removeEventListener("championsclub:expired", expire);
  }, []);
  async function login(email, password) {
    const result = await request("/api/auth/login", {
      method: "POST",
      body: { email: email.trim(), password },
      anonymous: true,
    });
    if (!["ADVISOR", "MANAGER"].includes(result.user.role))
      throw new Error(
        "This account role is not supported by the corrected service.",
      );
    setAccessToken(result.accessToken);
    storeToken(result.accessToken);
    setUser(result.user);
    setError("");
    setStatus("ready");
  }
  async function logout() {
    await request("/api/auth/logout", { method: "POST" });
    storeToken(null);
    setAccessToken(null);
    setUser(null);
    setError("");
    window.location.hash = "/";
  }
  return (
    <Context.Provider
      value={{
        user,
        status,
        error,
        login,
        logout,
        retry: () => setAttempt((value) => value + 1),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
