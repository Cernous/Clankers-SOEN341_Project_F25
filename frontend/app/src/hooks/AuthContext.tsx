import React from 'react'
import { OpenAPI, LoginService } from '../client'
import { setToken, getToken, clearToken } from '../lib/tokenStore'

export type UserRole = 'student' | 'creator' | 'admin'

export type User = {
  id?: string
  firstName?: string
  lastName?: string
  email: string
  username: string
  role: UserRole
}

type AuthContextShape = {
  user: User | null
  isLoggedIn: boolean
  loginWithCredentials: (email: string, password: string) => Promise<void>
  signupStudent: (args: {
    email: string
    username: string
    password: string
    first_name?: string
    last_name?: string
    pronouns?: string
    date_of_birth?: string
    role: 'student' | 'creator' | 'admin'
  }) => Promise<void>
  logout: () => void
}

const AuthContext = React.createContext<AuthContextShape | undefined>(undefined)

const USER_KEY = 'auth:user'

function saveUser(u: User | null) {
  if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
  else localStorage.removeItem(USER_KEY)
}

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(() => loadUser())
  const [token, setTokenState] = React.useState<string | null>(() => getToken())

  const fetchMe = React.useCallback(async (tkn?: string) => {
    const res = await fetch(`${OpenAPI.BASE}/clank/users/me`, {
      headers: { Authorization: `Bearer ${tkn ?? token}` },
    })
    if (!res.ok) throw new Error('Failed to fetch user')
    const me = await res.json()
    const mapped: User = {
      id: me.id,
      firstName: me.first_name,
      lastName: me.last_name,
      email: me.email,
      username: me.username,
      role: me.role === 'organizer' ? 'creator' : me.role,
    }
    setUser(mapped)
    saveUser(mapped)
  }, [token])

  const loginWithCredentials = React.useCallback(async (email: string, password: string) => {
    const resp = await LoginService.loginAccessToken({
      formData: { username: email, password },
    })
    setToken(resp.access_token)
    setTokenState(resp.access_token)
    await fetchMe(resp.access_token)
  }, [fetchMe])

  const signupStudent = React.useCallback(async (args: any) => {
    const backendRole = args.role === 'creator' ? 'organizer' : 'student'

    const res = await fetch(`${OpenAPI.BASE}/clank/users/signup/${backendRole}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: args.email,
        username: args.username,
        password: args.password,
        first_name: args.first_name,
        last_name: args.last_name,
        pronouns: args.pronouns,
        date_of_birth: args.date_of_birth,
      }),
    })
    if (!res.ok) throw new Error(await res.text())

    const data = await res.json() // expected { access_token, token_type }
    setToken(data.access_token)
    setTokenState(data.access_token)
    await fetchMe(data.access_token)
  }, [fetchMe])

  const logout = React.useCallback(() => {
    clearToken()
    setTokenState(null)
    setUser(null)
    saveUser(null)
  }, [])

  const value: AuthContextShape = React.useMemo(
    () => ({
      user,
      isLoggedIn: !!token,
      loginWithCredentials,
      signupStudent,
      logout,
    }),
    [user, token, loginWithCredentials, signupStudent, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
