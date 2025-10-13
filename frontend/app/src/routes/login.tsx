import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Login Page</h1>
      <p>
        This is a placeholder login page. The creator buttons should not appear
        in the header on this page.
      </p>
    </div>
  )
}
