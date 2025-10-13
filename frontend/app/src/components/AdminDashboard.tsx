import { RequireRole } from '../hooks/useRole'

export default function AdminDashboard() {
  return (
    <RequireRole role="admin">
      <div className="p-4 bg-white border-b">
        <h2 className="text-lg font-bold mb-4">Admin Dashboard</h2>
        <div className="flex flex-row gap-4">
          <div className="px-2 font-bold">
            <a href="/admin/users" className="text-black hover:underline">
              Manage Users
            </a>
          </div>
          <div className="px-2 font-bold">
            <a href="/admin/events" className="text-black hover:underline">
              Approve Events
            </a>
          </div>
          <div className="px-2 font-bold">
            <a href="/admin/settings" className="text-black hover:underline">
              Settings
            </a>
          </div>
          <div className="px-2 font-bold">
            <a href="/admin/analytics" className="text-black hover:underline">
              Analytics
            </a>
          </div>
        </div>
      </div>
    </RequireRole>
  )
}
