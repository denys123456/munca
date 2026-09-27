const configured = import.meta.env?.VITE_API_BASE_URL ?? "";
export const API_BASE_URL = configured.endsWith("/")
  ? configured.slice(0, -1)
  : configured;
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
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(30000)])
        : AbortSignal.timeout(30000),
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(!anonymous && accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new ApiError(
      "Unable to reach ChampionsClub. Check your connection and try again.",
    );
  }
  const content = await response.text();
  let result = null;
  if (content) {
    try {
      result = JSON.parse(content);
    } catch {
      throw new ApiError(
        "The service returned an unexpected response. Please try again.",
        response.status,
      );
    }
  }
  if (!response.ok) {
    if (response.status === 401 && !anonymous)
      window.dispatchEvent(new Event("championsclub:expired"));
    const message =
      response.status >= 500
        ? "The service could not complete this request. Please try again."
        : result?.message || "This request could not be completed.";
    throw new ApiError(
      message,
      response.status,
      result?.fieldErrors ?? [],
      result?.code,
    );
  }
  return result;
}
