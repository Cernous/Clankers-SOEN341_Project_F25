import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import QRCode from 'react-qr-code'
import { useAuth } from '../hooks/AuthContext'
import { EventsService } from '../client'

type TicketWithEvent = {
  ticketCode: string // full string "1:ORD-I7J7VA-1"
  eventId: number | null
  event?: any
}
export const Route = createFileRoute('/tickets')({
  component: TicketsPage,
})

function TicketsPage() {
  const { user, isLoggedIn } = useAuth()

  const [tickets, setTickets] = React.useState<Array<TicketWithEvent>>([])

  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const ownerId = user?.username || user?.email || ''

  React.useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        const res = await EventsService.getTickets()

        // getTickets returns e.g. "1:ORD-I7J7VA-1,1:ORD-C60OSP-2,..."
        const raw =
          typeof res === 'string'
            ? res
            : (((res as any).tickets as string | undefined) ?? '')

        const ticketCodes = raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)

        // Parse "eventId:ORD-XYZ-1"
        const baseTickets: Array<TicketWithEvent> = ticketCodes.map((code) => {
          const [eventIdPart] = code.split(':')
          const eventIdNum = Number(eventIdPart)
          return {
            ticketCode: code,
            eventId: Number.isFinite(eventIdNum) ? eventIdNum : null,
          }
        })

        // Unique valid event ids
        const uniqueEventIds = Array.from(
          new Set(
            baseTickets
              .map((t) => t.eventId)
              .filter((id): id is number => id != null && Number.isFinite(id)),
          ),
        )

        const eventsById: Record<number, any> = {}

        // Fetch each event once
        await Promise.all(
          uniqueEventIds.map(async (id) => {
            try {
              const ev = await EventsService.readEvent({ eventId: id })
              eventsById[id] = ev
            } catch (e) {
              console.error('Failed to load event for ticket eventId=', id, e)
            }
          }),
        )

        // Attach events back onto tickets
        const withEvents: Array<TicketWithEvent> = baseTickets.map((t) => ({
          ...t,
          event: t.eventId != null ? eventsById[t.eventId] : undefined,
        }))

        setTickets(withEvents)
      } catch (e: any) {
        console.error('Failed to load tickets', e)
        setError(e?.message ?? 'Failed to load tickets')
      } finally {
        setLoading(false)
      }
    })()
  }, [isLoggedIn])

  const fmtDateTime = (iso?: string) =>
    iso ? new Date(iso + 'Z').toLocaleString() : '—'

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
      ) : tickets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-6 text-neutral-600">
          No tickets yet. Purchase or claim a ticket from an event page.
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((t) => (
            <li
              key={t.ticketCode}
              className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
            >
              {/* Event details if available */}
              <h3 className="m-0 text-lg font-semibold truncate">
                {t.event?.name ?? 'Ticket'}
              </h3>

              {t.event && (
                <p className="mt-1 text-sm text-neutral-600">
                  {t.event.location ?? 'TBD'} •{' '}
                  {fmtDateTime(t.event.start_time)}
                </p>
              )}

              <p className="mt-2 text-sm text-neutral-600">
                Ticket Code: {t.ticketCode}
              </p>

              <div className="mt-4 flex justify-center">
                <TicketQR
                  payload={{
                    ticketId: t.ticketCode,
                    owner: ownerId,
                  }}
                />
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-neutral-500">
                  Owner: {ownerId}
                </span>
                <DownloadQRButton fileName={`${t.ticketCode}.png`} />
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
