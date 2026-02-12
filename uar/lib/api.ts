import axios from "axios";

const API_URL = "http://localhost:5000/api";

export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("token")
      : null;

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body,
  });

  let data: any = null;

  try {
    data = await res.json();
  } catch {
    // backend tidak kirim json? fine.
  }

  if (!res.ok) {
    const message =
      data?.message ||
      `API Error ${res.status}: ${res.statusText}`;

    console.error("API ERROR:", {
      path,
      status: res.status,
      message,
      data,
    });

    throw new Error(message);
  }

  return data;
}

export const apiAxios = axios.create({
  baseURL: API_URL,
});

apiAxios.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Optional: normalisasi error biar mirip apiFetch
apiAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      "Unknown API error";

    console.error("AXIOS API ERROR:", {
      url: error.config?.url,
      status: error.response?.status,
      message,
      data: error.response?.data,
    });

    return Promise.reject(new Error(message));
  }
);

