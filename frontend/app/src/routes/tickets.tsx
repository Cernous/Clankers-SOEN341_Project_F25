import { createFileRoute } from '@tanstack/react-router'
import QRCode from 'react-qr-code'
import { useUserData } from '../hooks/UserDataContext'
import { useAuth } from '../hooks/AuthContext'
import { EventsService } from '../client'
import * as React from 'react'
export const Route = createFileRoute('/tickets')({
  component: TicketsPage,
})

function TicketsPage() {
  const { user, isLoggedIn } = useAuth()

  const [ticketIds, setTicketIds] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const ownerId = user?.username || user?.email || ''

  React.useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }

    let mounted = true

      ; (async () => {
        try {
          const res = await EventsService.getTickets()

          // getTickets returns e.g. "ORD-I7J7VA-1,ORD-C60OSP-2,..."
          const raw =
            typeof res === 'string'
              ? res
              : ((res as any).tickets as string | undefined) ?? ''

          const ids =
            raw
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean) ?? []

          if (mounted) {
            setTicketIds(ids)
          }
        } catch (e: any) {
          if (mounted) {
            setError(e?.message ?? 'Failed to load tickets')
          }
        } finally {
          if (mounted) setLoading(false)
        }
      })()

    return () => {
      mounted = false
    }
  }, [isLoggedIn])

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-extrabold">My Tickets</h1>
        <p className="mt-1 text-neutral-600">Show this QR at check-in.</p>
      </header>

      {!isLoggedIn ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-neutral-600">
          Please log in to see your tickets.
        </div>
      ) : loading ? (
        <div className="rounded-xl border bg-white p-6">Loading…</div>
      ) : error ? (
        <div className="rounded-xl border bg-white p-6 text-red-600">
          {error}
        </div>
      ) : ticketIds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-neutral-600">
          No tickets yet. Purchase or claim a ticket from an event page.
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ticketIds.map((id) => (
            <li
              key={id}
              className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              {/* We no longer know event title/date/where from backend; show what we can */}
              <h3 className="m-0 text-lg font-semibold truncate">
                Ticket
              </h3>
              <p className="mt-1 text-sm text-neutral-600">
                Ticket Code: {id}
              </p>

              <div className="mt-4 flex justify-center">
                <TicketQR
                  payload={{
                    ticketId: id,
                    owner: ownerId,
                  }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  Owner: {ownerId}
                </span>
                <DownloadQRButton fileName={`${id}.png`} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
/** Renders a QR as SVG using react-qr-code */
function TicketQR({ payload }: { payload: any }) {
  const text = JSON.stringify(payload)
  return (
    <div className="rounded-xl bg-white p-2">
      <QRCode value={text} size={160} />
    </div>
  )
}

/** Exports the nearest QR SVG (react-qr-code renders an <svg>) to PNG and downloads it */
function DownloadQRButton({ fileName }: { fileName: string }) {
  const onDownload = () => {
    // Find the nearest SVG within the same card

    const card = (event?.target as HTMLElement | null)?.closest('li')
    const svg = card?.querySelector('svg')
    if (!svg) return

    // Serialize SVG → draw onto a canvas → toDataURL → download
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    const img = new Image()
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width * 2 // 2x for crisper PNG
      canvas.height = img.height * 2
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.setTransform(2, 0, 0, 2, 0, 0) // scale up
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)

      const png = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = png
      a.download = fileName
      a.click()
    }
    img.src = url
  }

  return (
    <button
      type="button"
      onClick={onDownload}
      className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50"
    >
      Download
    </button>
  )
}
