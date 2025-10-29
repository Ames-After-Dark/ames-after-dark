// src/lib/api.ts
const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:3000";

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Accept": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${body}`);
  }
  return res.json() as Promise<T>;
}
