// src/client/tokenStore.ts
const KEY = 'auth:token'

export function getToken(): string | null {
  if (typeof window === 'undefined') return null // SSR guard
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return // SSR guard
  try {
    localStorage.setItem(KEY, token)
  } catch {}
}

export function clearToken() {
  if (typeof window === 'undefined') return // SSR guard
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
