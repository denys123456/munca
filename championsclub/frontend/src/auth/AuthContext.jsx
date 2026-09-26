import { createContext, useContext, useEffect, useRef, useState } from "react";
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
  const restore = useRef(null);
  useEffect(() => {
    const token = readToken();
    if (!token) return;
    setAccessToken(token);
    setStatus("checking");
    const controller = new AbortController();
    restore.current = controller;
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
      restore.current?.abort();
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
    restore.current?.abort();
    const result = await request("/api/auth/login", {
      method: "POST",
      body: { email: email.trim(), password },
      anonymous: true,
    });
    if (!result?.accessToken || !result?.user?.id)
      throw new Error(
        "The sign-in service returned an invalid session. Please try again.",
      );
    if (!["ADVISOR", "MANAGER"].includes(result.user.role))
      throw new Error(
        "This account does not have access to this workspace. Please contact your program coordinator.",
      );
    setAccessToken(result.accessToken);
    storeToken(result.accessToken);
    setUser(result.user);
    setError("");
    setStatus("ready");
  }
  async function logout() {
    restore.current?.abort();
    let message = "";
    try {
      await request("/api/auth/logout", { method: "POST" });
    } catch (failure) {
      if (failure.status !== 401)
        message =
          "You are signed out on this device. The service could not confirm sign-out for other sessions.";
    } finally {
      storeToken(null);
      setAccessToken(null);
      setUser(null);
      setStatus("ready");
      setError(message);
      window.location.hash = "/";
    }
  }
  function resetSession() {
    restore.current?.abort();
    storeToken(null);
    setAccessToken(null);
    setUser(null);
    setStatus("ready");
    setError("");
  }
  return (
    <Context.Provider
      value={{
        user,
        status,
        error,
        login,
        logout,
        resetSession,
        retry: () => setAttempt((value) => value + 1),
      }}
    >
      {children}
    </Context.Provider>
  );
}
export const useAuth = () => useContext(Context);
