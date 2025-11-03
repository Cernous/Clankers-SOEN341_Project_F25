//This is the general login page for all users (organizer, student and admin)
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="w-screen h-screen flex" id="login">
      <div className="flex flex-col w-[500px]" id="form">
        <div className="bg-[#7A0019] min-h-[200px] w-full flex flex-col justify-center items-center px-5">
          <Link
            to="/"
            className="bg-[#7A0019] min-h-[200px] w-full flex flex-col justify-center items-center px-5 no-underline"
          >
            <h1 className="text-[40px] text-white font-bold mt-0">
              CampusEvents
            </h1>
            <h2 className="text-[20px] text-white/90">
              Campus Events & Ticketing Web App
            </h2>
          </Link>
        </div>

        <div className="flex justify-center items-center flex-col bg-white">
          <div className="mb-5 text-center">
            <p className="mb-3 mt-10 text-4xl font-bold text-gray-900">Login</p>
            <p className="text-gray-600">
              Don't have an account?
              <Link
                to="/signup"
                className="text-[#7A0019] hover:text-[#600013] font-semibold ml-1 transition-colors duration-200"
              >
                Create Account Now
              </Link>
            </p>
          </div>

          <div className="px-[30px] w-full max-w-sm">
            <form>
              <div className="mb-5">
                <label
                  htmlFor="username"
                  className="text-lg block mb-2 font-medium text-gray-700"
                >
                  Username
                </label>
                <input
                  required
                  name="username"
                  id="username"
                  type="text"
                  placeholder="e.g noob"
                  className="h-12 w-full border-2 border-gray-300 rounded-lg pl-3 focus:border-[#7A0019] focus:outline-none transition-colors duration-200"
                />
              </div>

              <div className="mb-8">
                <label
                  htmlFor="password"
                  className="text-lg block mb-2 font-medium text-gray-700"
                >
                  Password
                </label>
                <input
                  required
                  name="password"
                  id="password"
                  type="password"
                  placeholder="e.g ILOVEpuppies!"
                  className="h-12 w-full border-2 border-gray-300 rounded-lg pl-3 focus:border-[#7A0019] focus:outline-none transition-colors duration-200"
                />
              </div>

              <div className="mb-15 text-center">
                <button className="mb-5 text-[18px] bg-[#7A0019] text-white py-3 px-12 rounded-lg hover:bg-[#600013] transition-colors duration-200 font-semibold">
                  Login
                </button>
                <p>
                  <a
                    href="/forgot-password"
                    className="text-[#7A0019] hover:text-[#600013] transition-colors duration-200"
                  >
                    Forgot Password?
                  </a>
                </p>
              </div>

              <div className="text-center mt-auto">
                <p className="text-xs text-gray-500">
                  Copyright © 2025 Clanker, LLC.
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Clanker™ is a trademark of Clanker, LLC.
                </p>
                <p className="text-xs text-gray-500">
                  <a
                    href="/terms-of-service"
                    className="text-[#7A0019] hover:text-[#600013] transition-colors duration-200"
                  >
                    Terms of Service
                  </a>{' '}
                  |
                  <a
                    href="/privacy-policy"
                    className="text-[#7A0019] hover:text-[#600013] transition-colors duration-200 ml-1"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div
        className="bg-[url('/Login.jpg')] bg-cover bg-no-repeat w-full"
        id="image"
      ></div>
    </div>
  )
}
