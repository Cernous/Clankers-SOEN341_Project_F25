// routes/route.tsx (very top)
import { OpenAPI } from '../client'
import { getToken } from '../client/tokenStore'

OpenAPI.BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'
OpenAPI.TOKEN = async () => getToken() ?? ''



import { HeadContent, Scripts, createRootRoute, useLocation } from '@tanstack/react-router'
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

  // paths where the header should be hidden
  const hideHeaderPaths = ['/login']
  const shouldHideHeader = hideHeaderPaths.includes(location.pathname)

  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {/* Provide Auth globally */}
        <AuthProvider>
          <UserDataProvider>
          {/* Conditionally render header (hide on /login) */}
          {!shouldHideHeader && <Header />}
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
