import { useState, useEffect } from 'react'
import type { UserRole } from '../hooks/useRole'

export default function RoleSelector() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('none')

  useEffect(() => {
    // Load role from localStorage on mount
    const storedRole = localStorage.getItem('userRole') as UserRole
    if (storedRole) {
      setSelectedRole(storedRole)
    }
  }, [])

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role)
    localStorage.setItem('userRole', role)
    // Force a page refresh to update the header
    window.location.reload()
  }

  return (
    <div className="px-2">
      <label className="text-sm">
        Role:
        <select
          value={selectedRole}
          onChange={(e) => handleRoleChange(e.target.value as UserRole)}
          className="ml-1 text-black bg-white border border-gray-300 rounded px-1"
        >
          <option value="none">None</option>
          <option value="attendee">Attendee</option>
          <option value="creator">Creator</option>
          <option value="admin">Admin</option>
        </select>
      </label>
    </div>
  )
}
