import { useState, useEffect } from 'react'

export type UserRole = 'creator' | 'attendee' | 'admin' | 'none'

export function useRole(): UserRole {
  const [role, setRole] = useState<UserRole>('none')

  useEffect(() => {
    // Get role from localStorage (Batu's dropdown implementation)
    const storedRole = localStorage.getItem('userRole') as UserRole
    if (storedRole) {
      setRole(storedRole)
    }
  }, [])

  return role
}

export function useHasRole(requiredRole: UserRole): boolean {
  const currentRole = useRole()
  return currentRole === requiredRole
}

export function RequireRole({
  role,
  children,
}: {
  role: UserRole
  children: React.ReactNode
}) {
  const hasRole = useHasRole(role)
  return hasRole ? <>{children}</> : null
}
