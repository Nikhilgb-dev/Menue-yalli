export function readStoredSession(storageKey) {
  const rawValue = window.localStorage.getItem(storageKey);

  if (!rawValue) {
    return {};
  }

  try {
    return JSON.parse(rawValue);
  } catch (_error) {
    return {};
  }
}

export function persistSession(storageKey, session) {
  window.localStorage.setItem(storageKey, JSON.stringify(session));
}

export function clearSession(storageKey) {
  window.localStorage.removeItem(storageKey);
}

export async function parseApiResponse(response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    throw new Error(
      response.ok
        ? "Server returned an invalid response."
        : `Server returned an invalid response (${response.status}).`,
    );
  }
}
