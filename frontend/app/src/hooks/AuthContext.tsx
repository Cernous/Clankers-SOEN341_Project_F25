import React from 'react'

export type UserRole = 'student' | 'creator'

export type User = {
  id?: string
  firstName: string
  lastName: string
  email: string
  username: string
  role: UserRole
}

type AuthContextShape = {
  user: User | null
  isLoggedIn: boolean
  login: (u: User) => void                    // fake login (later will call backend)
  signup: (u: User) => void                   // fake signup -> logs in
  logout: () => void
}

const AuthContext = React.createContext<AuthContextShape | undefined>(undefined)

const STORAGE_KEY = 'auth:user'

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

function saveUser(u: User | null) {
  try {
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(() => loadUser())

  const login = React.useCallback((u: User) => {
    setUser(u)
    saveUser(u)
  }, [])

  const signup = React.useCallback((u: User) => {
    // in the future, call backend signup then set returned user
    setUser(u)
    saveUser(u)
  }, [])

  const logout = React.useCallback(() => {
    setUser(null)
    saveUser(null)
  }, [])

  const value: AuthContextShape = React.useMemo(
    () => ({
      user,
      isLoggedIn: !!user,
      login,
      signup,
      logout,
    }),
    [user, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
