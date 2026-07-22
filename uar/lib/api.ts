import axios from "axios";

const API_URL = "http://localhost:5000/api";

// ================================================================
// apiFetch — pakai credentials: "include" agar cookie ikut terkirim
// Tidak ada lagi baca/kirim token dari localStorage
// ================================================================
export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // ✅ kirim httpOnly cookie otomatis
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
      data?.message || `API Error ${res.status}: ${res.statusText}`;

    console.error("API ERROR:", { path, status: res.status, message, data });

    throw new Error(message);
  }

  return data;
}

// ================================================================
// apiAxios — withCredentials: true agar cookie ikut di setiap request
// ================================================================
export const apiAxios = axios.create({
  baseURL: API_URL,
  withCredentials: true, // ✅ kirim httpOnly cookie otomatis
});

// Tidak ada lagi interceptor yang baca localStorage
// Cookie dikirim otomatis oleh browser

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

    // Redirect ke login kalau 401
    if (error.response?.status === 401 && typeof window !== "undefined") {
      window.location.replace("/login");
    }

    return Promise.reject(new Error(message));
  }
);
