/**
 * Anonymous Session ID Manager for Brew Warm
 * Generates a persistent UUID stored in document.cookie / localStorage
 * so users can favorite shops without needing a login/password.
 */

const SESSION_COOKIE_NAME = "brew_warm_session_id";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  // Check localStorage first
  let sessionId = localStorage.getItem(SESSION_COOKIE_NAME);
  if (sessionId) {
    return sessionId;
  }

  // Check document.cookie
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + SESSION_COOKIE_NAME + "=([^;]*)")
  );
  if (match && match[1]) {
    sessionId = decodeURIComponent(match[1]);
    localStorage.setItem(SESSION_COOKIE_NAME, sessionId);
    return sessionId;
  }

  // Generate new UUID
  sessionId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : "bw_sess_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

  // Store in localStorage & document.cookie (valid 1 year)
  localStorage.setItem(SESSION_COOKIE_NAME, sessionId);
  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; path=/; max-age=31536000; SameSite=Lax`;

  return sessionId;
}
