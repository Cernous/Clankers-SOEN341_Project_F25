import { Link } from '@tanstack/react-router'
import { useAuth } from '../hooks/AuthContext'

export default function Header() {
  const { isLoggedIn, login, logout } = useAuth()

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
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <button
              onClick={logout}
              className="rounded-full border border-neutral-300 bg-white px-4 py-1 text-sm font-medium hover:bg-neutral-50"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={login}
              className="rounded-full bg-black px-4 py-1 text-sm font-medium text-white hover:bg-neutral-900"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
