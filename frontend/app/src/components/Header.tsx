import { Link } from '@tanstack/react-router'
import { useAuth } from '../hooks/AuthContext'
import { useUserData } from '../hooks/UserDataContext'   

export default function Header() {
  const { isLoggedIn, user, logout } = useAuth()
  const { saved, tickets } = useUserData()                

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link to="/" className="text-lg font-extrabold tracking-tight">
          CampusEvents
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link to="/" className="hover:underline">Home</Link>
          <Link to="/events" className="hover:underline">Events</Link>

          {/* Creator-only */}
          {isLoggedIn && user?.role === 'creator' && (
            <Link to="/event-creation" className="hover:underline text-[#7A0019] font-semibold">
              + Create Event
            </Link>
          )}

          {/* Admin-only */}
          {isLoggedIn && user?.role === 'admin' && (
            <Link to="/admin" className="hover:underline font-semibold">
              Admin
            </Link>
          )}

          {/* Logged-in only */}
          {isLoggedIn && (
            <>
              <Link to="/calendar" className="hover:underline">
                My Calendar{saved.length ? ` (${saved.length})` : ''}
              </Link>
              <Link to="/tickets" className="hover:underline">
                My Tickets{tickets.length ? ` (${tickets.length})` : ''}
              </Link>
            </>
          )}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-3">
          {isLoggedIn && user ? (
            <>
              <span className="max-w-[180px] truncate rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-medium text-neutral-700">
                {user.firstName || user.username} ({user.role})
              </span>
              <button
                onClick={logout}
                className="rounded-full border border-neutral-300 bg-white px-4 py-1 text-sm font-medium hover:bg-neutral-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full bg-black px-4 py-1 text-sm font-medium text-white hover:bg-neutral-900">
                Login
              </Link>
              <Link to="/signup" className="rounded-full border border-neutral-300 bg-white px-4 py-1 text-sm font-medium hover:bg-neutral-50">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
