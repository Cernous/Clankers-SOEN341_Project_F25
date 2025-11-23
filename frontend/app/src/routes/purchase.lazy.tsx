import * as React from 'react'
import { useNavigate, createLazyFileRoute } from '@tanstack/react-router'
import { EventsService } from '../client'
import { useUserData } from '../hooks/UserDataContext'
import type { SimpleEvent } from '../data/events.sample'
import { useAuth } from '../hooks/AuthContext'
import { CalendarService } from '../client'
export const Route = createLazyFileRoute('/purchase')({
  component: PurchasePage,
})

type TicketTier = { id: string; name: string; price: number; limit?: number }
type EventInfo = {
  id: number | string
  title: string
  date: string
  where: string
  banner?: string
  tiers: TicketTier[]
}

const FALLBACK: EventInfo = {
  id: 0,
  title: 'Event',
  date: '',
  where: '',
  banner:
    'https://images.unsplash.com/photo-1503428593586-e225b39bddfe?q=80&w=1600&auto=format&fit=crop',
  tiers: [{ id: 'default', name: 'General Admission', price: 0 }],
}

const TAX_RATE = 0.149 // example GST+QST
const CONV_FEE = 0.5   // example per-ticket fee

export default function PurchasePage() {
  const navigate = useNavigate()
  const { isSaved, toggleSave, claimTicket } = useUserData()
  const { user } = useAuth()

  async function createTicketAndGo({
    eid,
    qty,
    total,
    tier,
    ev,
  }: { eid: string | number; qty: number; total: number; tier: string; ev: SimpleEvent }) {
    const eventIdNum = Number(eid)
    if (!Number.isFinite(eventIdNum)) {
      alert('Invalid event id')
      return
    }

    try {
      // Issue ONE ticket per quantity with a unique code each time
      for (let i = 0; i < qty; i++) {
        const code = `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${i + 1}`
        await EventsService.addTicket({
          eventId: eventIdNum,
          ticket: code,   // this goes as query param ?ticket=...
        })
      }
    } catch (e) {
      // Backend rejected (e.g. not enough tickets, auth, etc.)
      console.error('addTicket failed', e)
      alert('Could not issue ticket(s). Please try again.')
      return
    }
    // Only navigate if we successfully created tickets

    // Auto-save event to "calendar" if not already there
    if (!isSaved(ev.id)) {
      try {
        const numericId = Number(ev.id)
        if (Number.isFinite(numericId)) {
          await CalendarService.saveEventCalendar({ eventId: numericId })
        }
      } catch (e) {
        console.error('saveEventCalendar from purchase failed', e)
        // maybe ignore silently, since purchase succeeded
      }
      toggleSave(ev)
    }
    // --- NEW: create local ticket(s) for the user -------------------------
    const owner = user?.username || user?.email || 'me'
    const ticketKind = total > 0 ? 'paid' : 'free' as const

    // one ticket per quantity (or change to just once if you prefer)
    for (let i = 0; i < qty; i++) {
      claimTicket(ev, owner, ticketKind)
    }
    navigate({
      to: '/payment-success',
      search: {
        eventId: eventIdNum,
        qty,
        total: total.toFixed(2),
        tier,
      },
    })

    // Only navigate if we successfully created tickets
    navigate({
      to: '/payment-success',
      search: {
        eventId: eventIdNum,
        qty,
        total: total.toFixed(2),
        tier,
      },
    })
  }

  const search = Route.useSearch() as {
    eventId?: string | number
    name?: string
    title?: string
    price?: number | string
    start?: string   // ISO
    location?: string
    qty?: number
  }


  // Build a single-tier event from search (or fallback)
  const event: EventInfo = React.useMemo(() => {
    const title = String(search?.name ?? search?.title ?? FALLBACK.title)
    const priceNum = Number(search?.price ?? 0)
    const when = search?.start
      ? new Date(search.start).toLocaleString()
      : FALLBACK.date
    const where = String(search?.location ?? FALLBACK.where)

    return {
      id: search?.eventId ?? FALLBACK.id,
      title,
      date: when,
      where,
      banner: FALLBACK.banner,
      tiers: [{ id: 'general', name: 'General Admission', price: priceNum }],
    }
  }, [search])
  const simpleEvent: SimpleEvent = React.useMemo(
    () => ({
      id: String(event.id ?? ''),
      title: event.title,
      date: event.date,                        // pretty date string
      dateISO: (search?.start as string) ?? '',// or keep '' if not available
      org: 'Organizer',                        // or map from backend if you have it
      where: event.where || 'TBD',
      category: 'Other',                       // or derive from tags
    }),
    [event, search],
  )

  const [tierId, setTierId] = React.useState<string>(event.tiers[0].id)
  const [qty, setQty] = React.useState<number>(Math.max(1, Number(search?.qty ?? 1)))
  const [promo, setPromo] = React.useState<string>('')
  const [showCardForm, setShowCardForm] = React.useState(false)

  const activeTier = event.tiers.find((t) => t.id === tierId)!
  const isFree = Number(activeTier.price) <= 0

  const discount = React.useMemo(() => {
    return promo.trim().toUpperCase() === 'CLANKERS10' ? 0.1 : 0
  }, [promo])

  const subtotal = React.useMemo(() => activeTier.price * qty, [activeTier.price, qty])
  const discountAmt = React.useMemo(() => subtotal * discount, [subtotal, discount])

  // If free, don’t apply taxes/fees
  const taxedBase = Math.max(0, subtotal - discountAmt)
  const taxes = isFree ? 0 : +(taxedBase * TAX_RATE).toFixed(2)
  const fees = isFree ? 0 : +(CONV_FEE * qty).toFixed(2)
  const total = +(taxedBase + taxes + fees).toFixed(2)

  function dec() {
    setQty((q) => Math.max(1, q - 1))
  }
  function inc() {
    const lim = activeTier.limit ?? 10
    setQty((q) => Math.min(lim, q + 1))
  }

  function openCardPay() {
    if (isFree) {
      // FREE: directly issue the ticket then go to success
      createTicketAndGo({
        eid: event.id,
        qty,
        total,
        tier: activeTier.name,
        ev: simpleEvent,
      })
      return
    }
    setShowCardForm(true)
  }
  return (
    <div className="min-h-[calc(100vh-44px)] p-6 bg-[#7A0019] flex items-start justify-center">
      <div className="w-full max-w-5xl grid lg:grid-cols-5 gap-6">
        {/* LEFT: event & selection */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl overflow-hidden">
          {event.banner && (
            <img src={event.banner} className="w-full h-44 object-cover" alt="" />
          )}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-[#7A0019]">{event.title}</h1>
            <div className="text-gray-600 mt-1">
              {event.date}
              {event.where ? ` · ${event.where}` : ''}
            </div>

            {/* Single tier (still clickable if you want) */}
            <div className="mt-6">
              <label className="block text-sm text-gray-700 mb-1">Ticket</label>
              <div className="grid sm:grid-cols-3 gap-3">
                {event.tiers.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTierId(t.id)
                      setQty(1)
                    }}
                    className={`border rounded-lg px-4 py-2 text-left hover:border-[#7A0019] transition
                      ${t.id === tierId ? 'border-[#7A0019] bg-[#7A0019]/5' : 'border-gray-300'}`}
                  >
                    <div className="font-medium">{t.name}</div>
                    <div className="text-sm text-gray-600">
                      {t.price > 0 ? `$${t.price.toFixed(2)}` : 'Free'}{' '}
                      {t.limit ? `(max ${t.limit})` : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div className="mt-6">
              <label className="block text-sm text-gray-700 mb-1">Quantity</label>
              <div className="inline-flex items-center border rounded-lg overflow-hidden">
                <button onClick={dec} className="px-3 py-2 hover:bg-gray-50" aria-label="decrease">
                  −
                </button>
                <input
                  value={qty}
                  onChange={(e) => {
                    const v = Number(e.target.value || 1)
                    const lim = activeTier.limit ?? 10
                    setQty(Math.min(Math.max(1, v), lim))
                  }}
                  type="number"
                  className="w-16 text-center py-2 outline-none"
                  min={1}
                  max={activeTier.limit ?? 10}
                />
                <button onClick={inc} className="px-3 py-2 hover:bg-gray-50" aria-label="increase">
                  ＋
                </button>
              </div>
            </div>

            {/* Promo (kept, but has no effect when free) */}
            <div className="mt-6">
              <label className="block text-sm text-gray-700 mb-1">Promo Code</label>
              <input
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="e.g. CLANKERS10"
                className="w-full border rounded-lg px-3 py-2"
                disabled={isFree}
              />
              {!isFree && discount > 0 && (
                <p className="text-xs text-green-700 mt-1">
                  Promo applied: {(discount * 100).toFixed(0)}% off
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: summary / payment */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-6 h-fit">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <Row label={`${activeTier.name} × ${qty}`} value={`$${subtotal.toFixed(2)}`} />
            {discountAmt > 0 && <Row label="Discount" value={`− $${discountAmt.toFixed(2)}`} />}
            <Row label="Taxes" value={`$${taxes.toFixed(2)}`} />
            <Row label="Fees" value={`$${fees.toFixed(2)}`} />
            <hr className="my-2" />
            <Row label="Total" value={`$${total.toFixed(2)}`} bold />
          </div>

          {!showCardForm ? (
            <button
              onClick={openCardPay}
              className="w-full mt-5 rounded-lg bg-[#7A0019] text-white font-semibold py-2.5 hover:bg-[#600013] transition"
            >
              {isFree ? 'Get Free Ticket' : 'Pay Now'}
            </button>
          ) : (
            <CardPayment
              amount={total}
              initialQty={qty}
              initialEventId={event.id}
              initialTier={activeTier.name}
              onCancel={() => setShowCardForm(false)}
              onSuccess={async (res) => {
                // PAID: issue ticket then go to success
                await createTicketAndGo({
                  eid: res.eventId ?? event.id,
                  qty: res.qty ?? qty,
                  total,
                  tier: res.tier ?? activeTier.name,
                  ev: simpleEvent,
                })
              }}
            />
          )}

          <p className="text-xs text-gray-500 mt-3">
            This is a simulated payment form for development only.
          </p>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={bold ? 'font-semibold' : ''}>{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  )
}

type CardResult = { orderId: string; total: string; qty?: number; eventId?: number | string; tier?: string }

function CardPayment({
  amount,
  onSuccess,
  onCancel,
  initialQty,
  initialEventId,
  initialTier,
}: {
  amount: number
  initialQty?: number
  initialEventId?: number | string
  initialTier?: string
  onSuccess: (res: CardResult) => void
  onCancel?: () => void
}) {
  const [name, setName] = React.useState('')
  const [card, setCard] = React.useState('')
  const [exp, setExp] = React.useState('')
  const [cvv, setCvv] = React.useState('')
  const [zip, setZip] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function formatCard(v: string) {
    return v.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim()
  }
  function onCardInput(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 19)
    setCard(digits)
  }
  function onExpInput(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value.replace(/[^\d]/g, '').slice(0, 4)
    if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2)
    setExp(v)
  }
  function luhnValidate(num: string) {
    const digits = num.replace(/\D/g, '')
    if (digits.length < 12) return false
    let sum = 0,
      dbl = false
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = digits.charCodeAt(i) - 48
      if (dbl) {
        d *= 2
        if (d > 9) d -= 9
      }
      sum += d
      dbl = !dbl
    }
    return sum % 10 === 0
  }
  function validateAll() {
    setError(null)
    if (!name.trim()) return setError('Please enter cardholder name')
    if (!/^\d{12,19}$/.test(card)) return setError('Card number looks invalid')
    if (!luhnValidate(card)) return setError('Card number failed Luhn check')
    if (!/^\d{2}\/\d{2}$/.test(exp)) return setError('Expiry must be MM/YY')
    const [mmStr, yyStr] = exp.split('/')
    const mm = Number(mmStr),
      yy = Number(yyStr)
    if (!(mm >= 1 && mm <= 12)) return setError('Expiry month invalid')
    const now = new Date()
    const fullYear = 2000 + yy
    const expDate = new Date(fullYear, mm, 0, 23, 59, 59)
    if (expDate < now) return setError('Card expired')
    if (!/^\d{3,4}$/.test(cvv)) return setError('CVV invalid')
    return null
  }

  async function handlePay(e?: React.FormEvent) {
    e?.preventDefault()
    const v = validateAll()
    if (v) return
    setBusy(true)
    setError(null)

    try {
      await new Promise((r) => setTimeout(r, 1200))
      const orderId = `CC-${new Date().getFullYear()}-${Math.random()
        .toString(36)
        .slice(2, 8)
        .toUpperCase()}`
      onSuccess({
        orderId,
        total: amount.toFixed(2),
        qty: initialQty ?? 1,
        eventId: initialEventId,
        tier: initialTier ?? '',
      })
    } catch {
      setError('Network error (simulated).')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="space-y-4 bg-white p-6 rounded-xl shadow mt-5" onSubmit={handlePay}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-zinc-600">Paying</div>
          <div className="text-2xl font-semibold">${amount.toFixed(2)}</div>
        </div>
        <div className="text-sm text-zinc-500">Mock card payment</div>
      </div>
      <div>
        <label className="text-sm block mb-1">Cardholder name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="YOUR NAME"
        />
      </div>
      <div>
        <label className="text-sm block mb-1">Card number</label>
        <div className="relative">
          <input
            value={formatCard(card)}
            onChange={onCardInput}
            inputMode="numeric"
            className="w-full border rounded px-3 py-2 pr-24 tracking-widest"
            placeholder="4111 1111 1111 1111"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
            Card
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm block mb-1">Expiry (MM/YY)</label>
          <input
            value={exp}
            onChange={onExpInput}
            placeholder="08/27"
            className="w-full border rounded px-3 py-2"
            inputMode="numeric"
          />
        </div>
        <div>
          <label className="text-sm block mb-1">CVV</label>
          <input
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="123"
            className="w-full border rounded px-3 py-2"
            inputMode="numeric"
          />
        </div>
      </div>
      <div>
        <label className="text-sm block mb-1">ZIP / Postal</label>
        <input
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="H3G 1M8"
          className="w-full border rounded px-3 py-2"
        />
      </div>
      {error && <div className="text-sm text-red-600 rounded p-2 bg-red-50">{error}</div>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded bg-[#7A0019] text-white px-4 py-2 disabled:opacity-60"
        >
          {busy ? 'Processing…' : `Pay $${amount.toFixed(2)}`}
        </button>
        <button type="button" onClick={onCancel} disabled={busy} className="rounded border px-4 py-2">
          Cancel
        </button>
      </div>
      <div className="text-xs text-zinc-500">
        This is a simulated payment. Do not enter real card data in production.
      </div>
    </form>
  )
}
