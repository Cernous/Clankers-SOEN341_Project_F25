import * as React from 'react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../hooks/AuthContext'
import { Button } from '../components/ui/Button'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const { loginWithCredentials } = useAuth()
  const navigate = useNavigate()

  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [showResetModal, setShowResetModal] = React.useState(false)
  const [resetEmail, setResetEmail] = React.useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const raw = Object.fromEntries(
      new FormData(e.currentTarget) as any,
    ) as Record<string, string>
    const usernameOrEmail = (raw.username || '').trim()
    const password = raw.password || ''

    if (!usernameOrEmail || !password) {
      setError('Please enter both username/email and password.')
      return
    }

    setSubmitting(true)
    try {
      // Backend expects OAuth2 form: username + password
      // You can log in with the same email used at signup (recommended).
      await loginWithCredentials(usernameOrEmail, password)

      // Redirect after login. Adjust if you want role-based routing.
      navigate({ to: '/' })
    } catch (err: any) {
      // Surface backend detail if available
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        'Login failed. Please check your credentials.'
      setError(String(msg))
    } finally {
      setSubmitting(false)
    }
  }

  async function onResetSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // TODO: call your real reset endpoint here
    console.log('Reset link requested for:', resetEmail)
    setShowResetModal(false)
    setResetEmail('')
  }

  return (
    <div className="w-screen flex flex-1 h-[calc(100vh-64px)]" id="login">
      <div className="flex flex-col w-[500px]" id="form">
        <div className="bg-primary min-h-[200px] w-full flex flex-col justify-center items-center px-5">
          <Link
            to="/"
            className="bg-[#912338] min-h-[200px] w-full flex flex-col justify-center items-center px-5 no-underline"
          >
            <h1 className="text-4xl md:text-5xl text-white font-extrabold mt-0">
              Concordia
            </h1>
            <h2 className="text-xl md:text-2xl text-white font-medium">
              Campus Events & Ticketing Web App
            </h2>
          </Link>
        </div>

        <div className="flex justify-center items-center flex-col">
          <div className="mb-5 text-center">
            <p className="mb-3 mt-10 text-4xl font-semibold text-primary">
              Login
            </p>
            <p>
              Don&apos;t have an account?{' '}
              <Link to="/signup" id="s_l">
                Create Account Now
              </Link>
            </p>
          </div>

          <div className="px-[30px] w-full">
            <form onSubmit={onSubmit}>
              <div className="mb-5">
                <label htmlFor="username" className="text-lg block">
                  Email or Username
                </label>
                <input
                  required
                  name="username"
                  id="username"
                  type="text"
                  placeholder="e.g. you@concordia.ca"
                  className="h-10 w-full border border-neutral-300 rounded-md pl-3 focus:border-primary"
                  autoComplete="username"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="text-lg block">
                  Password
                </label>
                <input
                  required
                  name="password"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-10 w-full border border-neutral-300 rounded-md pl-3 focus:border-primary"
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="mb-4 rounded bg-amber-50 text-amber-800 px-3 py-2 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-6 text-center">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="mb-3 text-lg px-14 py-2"
                  loading={submitting}
                >
                  Login
                </Button>
                <p>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(true)}
                    className="text-primary underline"
                  >
                    Forgot Password?
                  </button>
                </p>
              </div>

              <div className="text-center mt-auto">
                <p className="text-xs">Copyright © 2025 Clanker, LLC.</p>
                <p className="text-xs mb-3">
                  Clanker™ is a trademark of Clanker, LLC.
                </p>
                <p className="text-xs">
                  <Link to="/" id="s_l">
                    Terms of Service
                  </Link>{' '}
                  | <Link to="/">Privacy Policy</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div
        className="bg-[url('/Login.jpg')] bg-cover bg-no-repeat w-full"
        id="image"
      />

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-[400px] rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold">Reset Password</h2>
            <form onSubmit={onResetSubmit}>
              <label htmlFor="resetEmail" className="mb-2 block text-sm">
                Enter your email:
              </label>
              <input
                id="resetEmail"
                type="email"
                required
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="rounded bg-gray-200 px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-primary px-4 py-2 text-white hover:bg-primaryHover"
                >
                  Send Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
