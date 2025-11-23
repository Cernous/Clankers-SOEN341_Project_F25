import { Link, useLocation } from '@tanstack/react-router'
import { useAuth } from '../hooks/AuthContext'
import { useUserData } from '../hooks/UserDataContext'

export default function Header() {
  const { isLoggedIn, user, logout } = useAuth()
  const { saved, tickets } = useUserData()

  // Show per-user ticket count in the nav
  const ownerId = user?.username || user?.email || ''
  const myTicketsCount = isLoggedIn ? tickets.filter(t => t.owner === ownerId).length : 0

  const location = useLocation()
  const isActive = (path: string) => location.pathname === path

  return (
    <header className="sticky top-0 z-20 bg-white/60 backdrop-blur-md shadow-sm">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        {/* Accent bar */}
        <div className="pointer-events-none absolute inset-x-0 -bottom-1 h-[3px] bg-gradient-to-r from-primary via-accentSunny to-accentMint opacity-70 rounded-full" />
        {/* Brand */}
        <Link
          to="/"
          className="text-xl font-extrabold tracking-tight text-primary flex items-center gap-2"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white font-bold">CE</span>
          <span>CampusEvents</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            to="/"
            className={[
              'transition-colors duration-200 relative',
              isActive('/') ? 'text-primary font-semibold' : 'text-neutral-700 hover:text-primary'
            ].join(' ')}
          >
            Home
            {isActive('/') && <span className="absolute -bottom-2 left-0 h-[3px] w-full rounded-full bg-primary/70" />}
          </Link>
          <Link
            to="/events"
            className={[
              'transition-colors duration-200 relative',
              isActive('/events') ? 'text-primary font-semibold' : 'text-neutral-700 hover:text-primary'
            ].join(' ')}
          >
            Events
            {isActive('/events') && <span className="absolute -bottom-2 left-0 h-[3px] w-full rounded-full bg-primary/70" />}
          </Link>

          {/* Creator-only */}
          {isLoggedIn && user?.role === 'creator' && (
            <Link
              to="/event-creation"
              className={[
                'relative transition-colors duration-200 font-semibold',
                isActive('/event-creation') ? 'text-primary' : 'text-primary hover:text-primary-active'
              ].join(' ')}
            >
              + Create Event
              {isActive('/event-creation') && <span className="absolute -bottom-2 left-0 h-[3px] w-full rounded-full bg-primary/70" />}
            </Link>
          )}

          {/* Admin-only */}
          {isLoggedIn && user?.role === 'admin' && (
            <Link
              to="/admin"
              className={[
                'relative transition-colors duration-200 font-semibold',
                isActive('/admin') ? 'text-primary' : 'text-primary hover:text-primary-active'
              ].join(' ')}
            >
              Admin
              {isActive('/admin') && <span className="absolute -bottom-2 left-0 h-[3px] w-full rounded-full bg-primary/70" />}
            </Link>
          )}

          {/* Logged-in only */}
          {isLoggedIn && (
            <>
              <Link
                to="/calendar"
                className={[
                  'relative transition-colors duration-200',
                  isActive('/calendar') ? 'text-primary font-semibold' : 'text-neutral-700 hover:text-primary'
                ].join(' ')}
              >
                My Calendar
                {saved.length > 0 && (
                  <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {saved.length}
                  </span>
                )}
                {isActive('/calendar') && <span className="absolute -bottom-2 left-0 h-[3px] w-full rounded-full bg-primary/70" />}
              </Link>
              <Link
                to="/tickets"
                className={[
                  'relative transition-colors duration-200',
                  isActive('/tickets') ? 'text-primary font-semibold' : 'text-neutral-700 hover:text-primary'
                ].join(' ')}
              >
                My Tickets
                {myTicketsCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {myTicketsCount}
                  </span>
                )}
                {isActive('/tickets') && <span className="absolute -bottom-2 left-0 h-[3px] w-full rounded-full bg-primary/70" />}
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
              <span className="max-w-[180px] truncate rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary border border-primary/20">
                {user.firstName || user.username} · {user.role}
              </span>
              <button
                onClick={logout}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primaryHover"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white hover:bg-primaryHover"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-xl border border-neutral-300 bg-white px-5 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
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
