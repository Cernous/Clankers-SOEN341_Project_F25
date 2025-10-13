import { Link, useLocation } from '@tanstack/react-router'
import { useHasRole } from '../hooks/useRole'
import RoleSelector from './RoleSelector'

export default function Header() {
  const location = useLocation()
  const hasCreatorRole = useHasRole('creator')

  // Don't show creator buttons on sign/login routes
  const isAuthRoute =
    location.pathname.includes('/sign') || location.pathname.includes('/login')

  return (
    <header className="p-2 flex gap-2 bg-white text-black justify-between">
      <nav className="flex flex-row">
        <div className="px-2 font-bold">
          <Link to="/">Home</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/start/server-funcs">Start - Server Functions</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/start/api-request">Start - API Request</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/form/simple">Simple Form</Link>
        </div>

        <div className="px-2 font-bold">
          <Link to="/demo/form/address">Address Form</Link>
        </div>
      </nav>

      <div className="flex flex-row items-center">
        {/* Role selector for testing (Batu's dropdown) */}
        <RoleSelector />

        {/* Creator buttons - only show if user has creator role and not on auth routes */}
        {hasCreatorRole && !isAuthRoute && (
          <>
            <div className="px-2 font-bold">
              <a href="/events/new" className="text-black hover:underline">
                Create Event
              </a>
            </div>
            <div className="px-2 font-bold">
              <a href="/events/mine" className="text-black hover:underline">
                My Events
              </a>
            </div>
          </>
        )}

        {/* Login button */}
        <div className="px-2 font-bold">
          <a href="/login" className="text-black hover:underline">
            Login
          </a>
        </div>
      </div>
    </header>
  )
}
