const configured = (import.meta.env?.VITE_API_BASE_URL ?? "").trim();
export const API_BASE_URL = configured.replace(/\/+$/, "");
let accessToken = null;

export class ApiError extends Error {
  constructor(message, status = 0, fields = [], code = "") {
    super(message);
    this.status = status;
    this.fields = fields;
    this.code = code;
  }
}

export function setAccessToken(token) {
  accessToken = token;
}

export function query(path, parameters = {}) {
  const search = new URLSearchParams();
  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "")
      search.set(key, String(value));
  });
  return search.size ? `${path}?${search}` : path;
}

export async function request(
  path,
  { method = "GET", body, signal, anonymous = false } = {},
) {
  const requestToken = anonymous ? null : accessToken;
  let response;
  let content;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(30000)])
        : AbortSignal.timeout(30000),
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(requestToken ? { Authorization: `Bearer ${requestToken}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    content = await response.text();
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(
      "Unable to reach ChampionsClub. Check your connection and try again.",
    );
  }
  if (response.status === 401 && requestToken && requestToken === accessToken)
    window.dispatchEvent(new Event("championsclub:expired"));
  let result = null;
  if (content) {
    try {
      result = JSON.parse(content);
    } catch {
      // Proxies and static hosts can return HTML or plain text on failure.
    }
  }
  if (
    path === "/api/auth/login" &&
    ([404, 405].includes(response.status) ||
      (response.ok && (!result || typeof result !== "object")))
  )
    throw new ApiError(
      "Sign-in is unavailable because this site is not connected to the authentication service. Please contact your program coordinator.",
      response.status,
      [],
      "AUTH_SERVICE_UNAVAILABLE",
    );
  if (!response.ok) {
    const message =
      path === "/api/auth/login" && response.status === 401
        ? "Invalid email or password. Please try again."
        : response.status >= 500
          ? "The service could not complete this request. Please try again."
          : result?.message || "This request could not be completed.";
    throw new ApiError(
      message,
      response.status,
      result?.fieldErrors ?? [],
      result?.code,
    );
  }
  if (content && result === null)
    throw new ApiError(
      "The service returned an unexpected response. Please try again.",
      response.status,
    );
  return result;
}
