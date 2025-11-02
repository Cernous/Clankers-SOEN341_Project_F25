//This is the general login page for all users (organizer, student and admin)
import { createFileRoute,Link } from '@tanstack/react-router'
import type { Body_login_login_access_token as AccessToken } from '@/client'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

import { useState } from 'react';




function RouteComponent() {
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Send email to backend for password reset
    console.log('Reset link sent to:', email);
    setShowModal(false);
    setEmail('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: perform login
    console.log('Login submitted');
  };

  return (
    <>
      <div className="w-screen h-screen flex" id="login">
        <div className="flex flex-col w-[500px]" id="form">
          <div className="bg-[#912338] min-h-[200px] w-full flex flex-col justify-center items-center px-5">
            <Link to="/" className="bg-[#912338] min-h-[200px] w-full flex flex-col justify-center items-center px-5 no-underline">
              <h1 className="text-[40px] text-white font-bold mt-0">Concordia</h1>
              <h2 className="text-[25px] text-white">Campus Events & Ticketing Web App</h2>
            </Link>
          </div>
          <div className="flex justify-center items-center flex-col">
            <div className="mb-5 text-center">
              <p className="mb-3 mt-10 text-5xl font-normal">Login</p>
              <p>Don't have an account? <a href="/signup" id="s_l">Create Account Now</a></p>
            </div>
            <div className="px-[30px]">
              <form onSubmit={handleLogin}>
                <div className="mb-5" >
                  <label htmlFor="username" className="text-lg block">Username</label>
                  <input required name="username" id="username" type="text" placeholder="e.g noob" className="h-10 w-100 border border-[#757575] rounded-[5px] pl-3" />
                </div>

                <div className="mb-10">
                  <label htmlFor="password" className="text-lg block">Password</label>
                  <input required name="password" id="password" type="password" placeholder="e.g ILOVEpuppies!" className="h-10 w-100 border border-[#757575] rounded-[5px] pl-3" />
                </div>
                
                <div className="mb-15 text-center">
                  <button type="submit" className="mb-5 text-[20px] bg-[#912338] text-white py-[5px] px-[60px] rounded-[5px]">Login</button>
                  <p><button type="button" onClick={() => setShowModal(true)} className="text-[#912338] underline">Forgot Password?</button></p>
                </div>

                <div className="text-center mt-auto">
                  <p className="text-xs">Copyright © 2025 Clanker, LLC.</p>
                  <p className="text-xs mb-3">Clanker™ is a trademark of Clanker, LLC.</p>
                  <p className="text-xs"><a href="/terms-of-service" id="s_l">Terms of Service</a> | <a href="/privacy-policy">Privacy Policy</a></p>
                </div>

              </form>
            </div>
          </div>
        </div>
        <div className="bg-[url('/Login.jpg')] bg-cover bg-no-repeat w-full" id="image"></div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
            <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
            <form onSubmit={handleSubmit}>
              <label htmlFor="resetEmail" className="block mb-2 text-sm">Enter your email:</label>
              <input
                type="email"
                id="resetEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
              />
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#912338] text-white rounded">Send Link</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
