import { useAuth } from '../hooks/AuthContext'

export default function Hero() {
  const { isLoggedIn } = useAuth()

  return (
    <section className="relative mx-auto max-w-5xl px-4 pt-16 pb-12 md:pt-24 md:pb-20">
      {/* Decorative background shapes */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-accentSunny opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute top-10 -right-20 h-64 w-64 rounded-full bg-accentLavender opacity-25 blur-2xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-accentMint opacity-20 blur-2xl" />

      <h1 className="m-0 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
        Discover what's <span className="text-primary">happening</span> on campus.
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-neutral-700 md:text-xl">
        Browse events, grab tickets, and never miss out. Fun, fresh & student-powered.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <a
          href="#events"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primaryHover"
        >
          <span>Explore Events</span>
        </a>
        {!isLoggedIn && (
          <a
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold hover:bg-neutral-50"
          >
            Sign Up
          </a>
        )}
        <a
          href="/tickets"
          className="inline-flex items-center gap-2 rounded-full bg-accentSunny px-6 py-3 text-sm font-semibold text-neutral-900 hover:brightness-105"
        >
          My Tickets
        </a>
      </div>

      <div className="mt-12 h-64 rounded-3xl bg-gradient-to-br from-primary/10 via-accentLavender/20 to-accentMint/20 md:h-80 lg:h-[420px] shadow-card flex items-center justify-center">
        <div className="rounded-2xl bg-white/70 backdrop-blur-sm px-8 py-6 shadow-soft max-w-md">
          <p className="m-0 text-center text-sm text-neutral-700">
            Stay tuned: more interactive dashboards & creator tools are coming soon.
          </p>
        </div>
      </div>
    </section>
  )
}
