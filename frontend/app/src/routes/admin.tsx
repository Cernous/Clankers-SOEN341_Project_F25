import * as React from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useAuth } from '../hooks/AuthContext'

export const Route = createFileRoute('/admin')({
  component: AdminDashboard,
})

function AdminDashboard() {
  const { isLoggedIn, user } = useAuth()
  const navigate = useNavigate()

  React.useEffect(() => {
    if (!isLoggedIn) {
      navigate({ to: '/' })
      return
    }
    if (user?.role !== 'admin') {
      navigate({ to: '/' })
    }
  }, [isLoggedIn, user, navigate])

  if (!isLoggedIn || user?.role !== 'admin') {
    return <div className="mx-auto max-w-4xl px-4 py-10">Checking permissions…</div>
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
      <p className="text-neutral-600 mb-6">Platform-wide overview & moderation.</p>

      {/* Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Total Events" value="—" hint="(mock stat)" />
        <Card title="Tickets Issued" value="—" hint="(mock stat)" />
        <Card title="Active Organizers" value="—" hint="(mock stat)" />
      </div>

      {/* Sections */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Moderation Queue</h2>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-neutral-600">No pending items. (stub)</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Organizations</h2>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm text-neutral-600">Org management coming soon…</p>
        </div>
      </section>
    </main>
  )
}

function Card({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="text-sm text-neutral-500">{title}</div>
      <div className="text-3xl font-extrabold">{value}</div>
      {hint ? <div className="text-xs text-neutral-400 mt-1">{hint}</div> : null}
    </div>
  )
}
