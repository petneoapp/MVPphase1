"use client";

// utils/api.ts
// Make sure to restart Next.js after editing .env.local
import { API_BASE } from "@/lib/api/config";

const API_BASE_URL = API_BASE;

const ACCESS_TOKEN_KEY = "accessToken";
const PARTNER_ACCESS_TOKEN_KEY = "partnerAccessToken";

// Toggle adding the ngrok skip header (set this in .env.local during dev)
const SKIP_NGROK_HEADER =
  (process.env.NEXT_PUBLIC_SKIP_NGROK_HEADER || "true").toLowerCase() === "true";

let unauthorizedCallback: ((flow: "partner" | "customer") => void) | null = null;

/**
 * Register a callback to be called when the API returns a 401 or 403.
 * Used by AuthContext to handle global session expiration.
 */
export function onUnauthorized(cb: (flow: "partner" | "customer") => void) {
  unauthorizedCallback = cb;
}

// --- Token helpers ---
export function setAccessToken(token: string) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch {
    try {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch {}
  }
}

export function getAccessToken(): string | null {
  try {
    const fromLocal = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (fromLocal) return fromLocal;
  } catch {}
  try {
    const fromSession = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    if (fromSession) return fromSession;
  } catch {}
  return null;
}

export function getPartnerAccessToken(): string | null {
    try {
        const fromLocal = localStorage.getItem(PARTNER_ACCESS_TOKEN_KEY);
        if (fromLocal) return fromLocal;
    } catch {}
    try {
        const fromSession = sessionStorage.getItem(PARTNER_ACCESS_TOKEN_KEY);
        if (fromSession) return fromSession;
    } catch {}
    return null;
}

export function clearAccessToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {}
  try {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch {}
}

// Clear all auth
export function clearAuth(flow: "partner" | "customer" = "customer")  {
    try {
        if (flow === "partner") {
            //remove the partner token
            localStorage.removeItem("partnerAccessToken");
            // Clear cookie
            document.cookie = 'partnerAuthToken=; path=/; max-age=0; SameSite=Strict';
        } else if (flow === "customer") {
            //remove the customer token
            localStorage.removeItem("accessToken");
            // Clear cookie
            document.cookie = 'customerAuthToken=; path=/; max-age=0; SameSite=Strict';
        }
    } catch (e) {}
};

const DEFAULT_TIMEOUT = 60000; // 60 seconds

// --- Wrapper for fetch with auth ---
async function request(
  endpoint: string,
  options: RequestInit = {},
  queryParams?: Record<string, any>,
  flow: "partner" | "customer" = "customer",
  isFormData: boolean = false
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  const token = flow === "customer" ? getAccessToken() : flow === "partner" ? getPartnerAccessToken() : null;

  const defaultHeaders: HeadersInit = {
    Accept: "application/json",
    ...(SKIP_NGROK_HEADER && !isFormData ? { "ngrok-skip-browser-warning": "69420" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Only add Content-Type: application/json if it's not FormData
  if (!isFormData) {
    (defaultHeaders as any)["Content-Type"] = "application/json";
  }

  const mergedHeaders: HeadersInit = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  let urlString = `${API_BASE_URL}${endpoint}`;
  if (!API_BASE_URL || !API_BASE_URL.startsWith("http")) {
    urlString = `https://casie-unregrettable-distinguishably.ngrok-free.dev/api/v1${endpoint}`;
  }
  const url = new URL(urlString);

  const safeParams = queryParams ?? {};
  Object.entries(safeParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  try {
    const res = await fetch(url.toString(), {
      ...options,
      headers: mergedHeaders,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.status === 204 || res.status === 205) {
      return null;
    }

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    const body = await (contentType.includes("application/json") ? res.json().catch(() => ({})) : res.text());

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        clearAuth(flow);
        if (unauthorizedCallback) {
          unauthorizedCallback(flow);
        }
        throw new Error(`Unauthorized (${res.status}) - session expired`);
      }
      const errorMsg = (typeof body === "object" && body !== null) 
        ? (body.message || body.detail || JSON.stringify(body)) 
        : (typeof body === "string" ? body : `API request failed with status ${res.status}`);
      
      throw new Error(errorMsg);
    }

    // Handle standard response format: { success, message, data }
    if (typeof body === "object" && body !== null && "success" in body) {
      if (!body.success) {
        throw new Error(body.message || "Operation failed");
      }
      return body.data;
    }

    return body;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please check your internet connection.");
    }
    throw error;
  }
}

// --- Public API methods ---
export const api = {
  get: (endpoint: string, queryParams?: Record<string, any>, flow?: "partner" | "customer") =>
    request(endpoint, { method: "GET" }, queryParams, flow),
  post: (endpoint: string, body: any, flow?: "partner" | "customer") =>
    request(endpoint, { method: "POST", body: JSON.stringify(body) }, undefined, flow),
  formDatapost: (endpoint: string, body: any, flow?: "partner" | "customer"): Promise<any> => {
      return new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let urlString = `${API_BASE_URL}${endpoint}`;
        if (!API_BASE_URL || !API_BASE_URL.startsWith("http")) {
          urlString = `https://casie-unregrettable-distinguishably.ngrok-free.dev/api/v1${endpoint}`;
        }
        xhr.open("POST", urlString);
        const token = flow === "partner" ? getPartnerAccessToken() : getAccessToken();
        xhr.setRequestHeader("Accept", "application/json");
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        if (SKIP_NGROK_HEADER) xhr.setRequestHeader("ngrok-skip-browser-warning", "69420");
        xhr.onload = () => {
            try {
                if (xhr.status === 204 || xhr.status === 205) return resolve(null);
                const res = JSON.parse(xhr.responseText);
                if (xhr.status === 401 || xhr.status === 403) {
                    clearAuth(flow);
                    if (unauthorizedCallback) unauthorizedCallback(flow || "customer");
                    reject(new Error(`Unauthorized (${xhr.status}) - session expired`));
                    return;
                }
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (res && typeof res === 'object' && 'success' in res) {
                        if (!res.success) reject(new Error(res.message || "Operation failed"));
                        else resolve(res.data);
                    } else resolve(res);
                }
                else reject(new Error(res.message || "Request failed"));
            } catch(e) { reject(new Error("Failed to parse response")); }
        };
        xhr.onerror = () => reject(new Error("Network request failed."));
        xhr.timeout = 60000;
        xhr.ontimeout = () => reject(new Error("Request timed out. Please check your internet connection."));
        xhr.send(body);
      });
  },
  put: (endpoint: string, body: any, flow?: "partner" | "customer") =>
    request(endpoint, { method: "PUT", body: JSON.stringify(body) }, undefined, flow),
  formDataPut: (endpoint: string, body: any, flow?: "partner" | "customer"): Promise<any> => {
      return new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let urlString = `${API_BASE_URL}${endpoint}`;
        if (!API_BASE_URL || !API_BASE_URL.startsWith("http")) {
          urlString = `https://casie-unregrettable-distinguishably.ngrok-free.dev/api/v1${endpoint}`;
        }
        xhr.open("PUT", urlString);
        const token = flow === "partner" ? getPartnerAccessToken() : getAccessToken();
        xhr.setRequestHeader("Accept", "application/json");
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        if (SKIP_NGROK_HEADER) xhr.setRequestHeader("ngrok-skip-browser-warning", "69420");
        xhr.onload = () => {
            try {
                if (xhr.status === 204 || xhr.status === 205) return resolve(null);
                const res = JSON.parse(xhr.responseText);
                if (xhr.status === 401 || xhr.status === 403) {
                    clearAuth(flow);
                    if (unauthorizedCallback) unauthorizedCallback(flow || "customer");
                    reject(new Error(`Unauthorized (${xhr.status}) - session expired`));
                    return;
                }
                if (xhr.status >= 200 && xhr.status < 300) {
                    if (res && typeof res === 'object' && 'success' in res) {
                        if (!res.success) reject(new Error(res.message || "Operation failed"));
                        else resolve(res.data);
                    } else resolve(res);
                }
                else reject(new Error(res.message || "Request failed"));
            } catch(e) { reject(new Error("Failed to parse response")); }
        };
        xhr.onerror = () => reject(new Error("Network request failed."));
        xhr.timeout = 60000;
        xhr.ontimeout = () => reject(new Error("Request timed out. Please check your internet connection."));
        xhr.send(body);
      });
  },
  patch: (endpoint: string, body?: any, queryParams?: Record<string, any>, flow?: "partner" | "customer") =>
    request(
      endpoint,
      { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined },
      queryParams,
      flow
    ),
  delete: (endpoint: string, flow?: "partner" | "customer") => request(endpoint, { method: "DELETE" }, undefined, flow),
};

