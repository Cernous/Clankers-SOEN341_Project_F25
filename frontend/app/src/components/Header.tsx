import { Link } from '@tanstack/react-router'
import { useAuth } from '../hooks/AuthContext'
import { useUserData } from '../hooks/UserDataContext'

export default function Header() {
  const { isLoggedIn, user, logout } = useAuth()
  const { saved, tickets } = useUserData()

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        {/* Brand */}
        <Link
          to="/"
          className="text-xl font-extrabold tracking-tight text-[#7A0019]"
        >
          CampusEvents
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            to="/"
            className="text-gray-700 hover:text-[#7A0019] transition-colors duration-200"
          >
            Home
          </Link>
          <Link
            to="/events"
            className="text-gray-700 hover:text-[#7A0019] transition-colors duration-200"
          >
            Events
          </Link>

          {/* Creator-only */}
          {isLoggedIn && user?.role === 'creator' && (
            <Link
              to="/event-creation"
              className="text-[#7A0019] hover:text-[#600013] font-semibold transition-colors duration-200"
            >
              + Create Event
            </Link>
          )}

          {/* Admin-only */}
          {isLoggedIn && user?.role === 'admin' && (
            <Link
              to="/admin"
              className="text-purple-600 hover:text-purple-700 font-semibold transition-colors duration-200"
            >
              Admin
            </Link>
          )}

          {/* Logged-in only */}
          {isLoggedIn && (
            <>
              <Link
                to="/calendar"
                className="text-gray-700 hover:text-[#7A0019] transition-colors duration-200"
              >
                My Calendar{saved.length ? ` (${saved.length})` : ''}
              </Link>
              <Link
                to="/tickets"
                className="text-gray-700 hover:text-[#7A0019] transition-colors duration-200"
              >
                My Tickets{tickets.length ? ` (${tickets.length})` : ''}
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <button className="md:hidden p-2 text-gray-600 hover:text-gray-900">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-3">
          {isLoggedIn && user ? (
            <>
              <span className="max-w-[180px] truncate rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700">
                {user.firstName || user.username} ({user.role})
              </span>
              <button
                onClick={logout}
                className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full bg-[#7A0019] px-5 py-2 text-sm font-medium text-white hover:bg-[#600013] transition-colors duration-200"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full border-2 border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
