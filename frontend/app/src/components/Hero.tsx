import { useAuth } from '../hooks/AuthContext' 

export default function Hero() {
  const { isLoggedIn } = useAuth() 

  return (
    <section className="mx-auto max-w-4xl px-4 pt-14 pb-10 md:pt-20 md:pb-14">
      <h1 className="m-0 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl">
        Discover what’s happening on campus.
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-neutral-600 md:text-xl">
        Browse events, grab tickets, and never miss out.
      </p>

      <div className="mt-6 flex gap-3">
        <a
          href="#events"
          className="inline-block rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-900"
        >
          Explore Events
        </a>

        {/*Hide Sign Up button when logged in */}
        {!isLoggedIn && (
          <a
            href="/signup"
            className="inline-block rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold hover:bg-neutral-50"
          >
            Sign Up
          </a>
        )}
      </div>

      {/* Placeholder hero art block */}
      <div className="mt-8 h-64 rounded-2xl bg-neutral-100 md:h-80 lg:h-96" />
    </section>
  );
}
