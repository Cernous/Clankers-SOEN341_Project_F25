//This is the general login page for all users (organizer, student and admin)
import { createFileRoute,Link } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: RouteComponent,
})

function RouteComponent() {
  return(
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
          <p>Don't have an account? <a href="/signup" id = "s_l">Create Account Now</a></p>
        </div>
        <div className="px-[30px]">
          <form>
            <div className="mb-5" >
              <label htmlFor="username" className="text-lg block">Username</label>
              <input required name="username" id="username" type="text" placeholder="e.g noob" className="h-10 w-100 border border-[#757575] rounded-[5px] pl-3" />
            </div>

            <div className="mb-10">
              <label htmlFor="password" className="text-lg block">Password</label>
              <input required name="password" id="password" type="password" placeholder="e.g ILOVEpuppies!" className="h-10 w-100 border border-[#757575] rounded-[5px] pl-3" />
            </div>
            
            <div className="mb-15 text-center">
              <button  className="mb-5 text-[20px] bg-[#912338] text-white py-[5px] px-[60px] rounded-[5px]">Login</button>
              <p><a href="/forgot-password" id = "s_l">Forgot Password?</a></p>
            </div>

            <div className="text-center mt-auto">
              <p className="text-xs">Copyright © 2025 Clanker, LLC.</p>
              <p className="text-xs mb-3">Clanker™ is a trademark of Clanker, LLC.</p>
              <p className="text-xs"><a href="/terms-of-service" id = "s_l">Terms of Service</a> | <a href="/privacy-policy">Privacy Policy</a></p>
            </div>

          </form>
        </div>
      </div>
    </div>
    <div className="bg-[url('/Login.jpg')] bg-cover bg-no-repeat w-full" id="image"></div>
  </div>
  
  )
}
