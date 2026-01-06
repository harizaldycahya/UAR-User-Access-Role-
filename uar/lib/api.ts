const API_URL = "http://localhost:5000/api";

export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
