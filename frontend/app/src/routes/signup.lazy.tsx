import * as React from 'react'
import { Link, useNavigate, createLazyFileRoute } from '@tanstack/react-router'
import { useAuth } from '../hooks/AuthContext'

export const Route = createLazyFileRoute('/signup')({
  component: SignUpPage,
})

type FormDataShape = {
  firstName: string
  lastName: string
  email: string
  username: string
  role: 'student' | 'creator' | 'admin'
  password: string
  confirm: string
}

function SignUpPage() {
  //const { signup } = useAuth()
  const navigate = useNavigate()
  const [showPw, setShowPw] = React.useState(false)
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormDataShape, string>>>({})
  const [message, setMessage] = React.useState<string>('')

  function validate(d: FormDataShape) {
    const e: Partial<Record<keyof FormDataShape, string>> = {}
    if (!d.firstName) e.firstName = 'Required'
    else if (!/^[A-Za-z\s'-]{1,50}$/.test(d.firstName)) {
      e.firstName = 'Only letters, spaces, - and \' allowed (max 50 chars)'
    }

    if (!d.lastName) e.lastName = 'Required'
    else if (!/^[A-Za-z\s'-]{1,50}$/.test(d.lastName)) {
      e.lastName = 'Only letters, spaces, - and \' allowed (max 50 chars)'
    }
    if (!d.email) {
      e.email = 'Required'
    } else if (!/^\S+@\S+\.\S+$/.test(d.email)) {
      e.email = 'Invalid email'
    } else if (d.email.length > 50) {
      e.email = 'Max 50 characters'
    }
    if (!d.username) e.username = 'Required'
    if (d.password.length < 8) e.password = 'At least 8 characters'
    else if (d.password.length > 20) e.password = 'Max 20 characters'
    else if (d.username.length > 20) e.username = 'Max 20 characters'

    if (d.password !== d.confirm) e.confirm = 'Passwords do not match'
    if (!['student', 'creator', 'admin'].includes(d.role)) e.role = 'Select a role'
    return e
  }

  const { signupStudent, user } = useAuth()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const raw = Object.fromEntries(new FormData(e.currentTarget) as any) as Record<string, string>

    const data = {
      firstName: raw.firstName?.trim() ?? '',
      lastName: raw.lastName?.trim() ?? '',
      email: raw.email?.trim() ?? '',
      username: raw.username?.trim() ?? '',
      role: (raw.role as 'student' | 'creator' | 'admin') ?? 'student',
      password: raw.password ?? '',
      confirm: raw.confirm ?? '',
    }

    const errs = validate(data)
    setErrors(errs)
    if (Object.keys(errs).length) return

    try {
      await signupStudent({
        email: data.email,
        username: data.username,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role, // "creator" will be mapped to "organizer" inside the context
      })

      const dest =
        data.role === 'admin' ? '/admin'
          : data.role === 'creator' ? '/'
            : '/events'
      navigate({ to: dest })
    } catch (err: any) {
      setMessage(err.message || 'Signup failed')
    }
  }



  return (
    <div className="min-h-[calc(100vh-44px)] grid md:grid-cols-2 bg-[#7A0019]">
      {/* 左侧表单卡片 */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-[#7A0019]">Concordia Connect</h1>
            <p className="text-gray-600 text-sm">Campus Events & Ticketing · by Clankers</p>
          </header>

          <h2 className="text-xl font-semibold mb-5">Create your account</h2>

          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                name="firstName"
                label="First name"
                error={errors.firstName}
                maxLength={50}
                pattern="[A-Za-z\s'-]{1,50}"
              />
              <Field
                name="lastName"
                label="Last name"
                error={errors.lastName}
                maxLength={50}
                pattern="[A-Za-z\s'-]{1,50}"
              />
            </div>

            <Field
              name="email"
              type="email"
              label="Email"
              placeholder="you@concordia.ca"
              error={errors.email}
              maxLength={50}
            />
            <Field
              name="username"
              label="Username"
              placeholder="e.g. yifu123"
              error={errors.username}
              maxLength={20}
              pattern=".{1,20}"
            />

            <PasswordField
              name="password"
              label="Password"
              placeholder="At least 8 characters"
              show={showPw}
              setShow={setShowPw}
              error={errors.password}

            />
            <PasswordField
              name="confirm"
              label="Confirm password"
              placeholder="Repeat password"
              show={showPw}
              setShow={setShowPw}
              error={errors.confirm}
            />

            <label className="block">
              <span className="block text-sm text-gray-700 mb-1">Role</span>
              <select name="role" defaultValue="student" className="w-full border rounded-lg px-3 py-2">
                <option value="student">Student</option>
                <option value="creator">Event Creator</option>
                {user?.role === 'admin' && <option value="admin">Admin</option>}
              </select>
              {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
            </label>

            <label className="flex items-start gap-2 text-sm">
              <input required type="checkbox" className="mt-1 accent-[#7A0019]" />
              <span>
                I agree to the <a className="text-[#7A0019] hover:text-[#FFC72C]" href="#">Terms</a> and{' '}
                <a className="text-[#7A0019] hover:text-[#FFC72C]" href="#">Privacy</a>.
              </span>
            </label>

            {message && <div className="rounded-lg bg-amber-50 text-amber-800 px-3 py-2 text-sm">{message}</div>}

            <button
              type="submit"
              className="w-full mt-1 rounded-lg bg-[#7A0019] text-white font-semibold py-2.5 hover:bg-[#600013] transition"
            >
              Create Account
            </button>
          </form>

          <p className="text-sm text-gray-600 mt-6 text-center">
            Already have an account?{' '}
            <Link className="text-[#7A0019] font-medium hover:text-[#FFC72C]" to="/login">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {/* right side image */}
      <div
        className="hidden md:block bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1503428593586-e225b39bddfe?q=80&w=1600&auto=format&fit=crop)' }}
        aria-hidden="true"
      />
    </div>
  )
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  error,
  maxLength,
  pattern,
}: {
  label: string
  name: string
  type?: string
  placeholder?: string
  error?: string
  maxLength?: number
  pattern?: string
}) {
  return (
    <label className="block">
      <span className="block text-sm text-gray-700 mb-1">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        maxLength={maxLength}
        pattern={pattern}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#FFC72C]"
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  )
}

function PasswordField({
  label,
  name,
  placeholder,
  show,
  setShow,
  error,
}: {
  label: string
  name: string
  placeholder?: string
  show: boolean
  setShow: (v: boolean) => void
  error?: string
}) {
  return (
    <label className="block">
      <span className="block text-sm text-gray-700 mb-1">{label}</span>
      <div className="relative">
        <input
          name={name}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          minLength={8}
          maxLength={20}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-12 outline-none focus:ring-2 focus:ring-[#FFC72C]"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900"
          aria-label="Toggle password visibility"
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </label>
  )
}
