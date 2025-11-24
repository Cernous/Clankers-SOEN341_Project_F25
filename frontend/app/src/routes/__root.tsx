import '../setupApi'

import {
  HeadContent,
  Scripts,
  createRootRoute,
  useLocation,
} from '@tanstack/react-router'
import { UserDataProvider } from '../hooks/UserDataContext'

import Header from '../components/Header'
import { AuthProvider } from '../hooks/AuthContext'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Campus Events' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body
        className={
          isLogin
            ? 'login-page h-screen overflow-hidden flex flex-col'
            : 'min-h-screen'
        }
      >
        {/* Provide Auth globally */}
        <AuthProvider>
          <UserDataProvider>
            {/* Conditionally render header (hide on /login) */}
            {/* Always show header, even on login */}
            <Header />
            {children}
          </UserDataProvider>
        </AuthProvider>

        {/* Enable when needed */}
        {/* <TanstackDevtools
          config={{ position: 'bottom-left' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        /> */}

        <Scripts />
      </body>
    </html>
  )
}
