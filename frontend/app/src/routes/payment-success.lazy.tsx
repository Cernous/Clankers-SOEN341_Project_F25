import * as React from 'react'
import { Link, createLazyFileRoute } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/payment-success')({
  // 简化处理：直接透传 search 参数
  validateSearch: (s: Record<string, any>) => s as any,
  component: SuccessPage,
})

function SuccessPage() {
  const { eventId = 0, qty = 1, total = '0.00', tier = 'Standard' } = Route.useSearch() as any

  return (
    <div className="min-h-[calc(100vh-44px)] flex items-center justify-center p-6 bg-[#7A0019]">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-2xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-[#0f5132]">Payment Successful</h1>
        <p className="text-gray-600 mt-2">Your order is confirmed.</p>

        <div className="mt-5 text-sm text-gray-800 space-y-1">
          <div>Event ID: <span className="font-semibold">{eventId}</span></div>
          <div>Ticket: <span className="font-semibold">{tier}</span></div>
          <div>Quantity: <span className="font-semibold">{qty}</span></div>
          <div>Total Paid: <span className="font-semibold">${total}</span></div>
          <div className="text-xs text-gray-500">Order No: {generateOrderId()}</div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link to="/purchase" className="px-4 py-2 rounded-lg border">Back to Purchase</Link>
          <Link to="/events/$id" params={{ id: String(eventId) }} className="px-4 py-2 rounded-lg bg-[#7A0019] text-white">
            View Event
          </Link>
          <button onClick={() => window.print()} className="px-4 py-2 rounded-lg border">
            Print / Save Receipt
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          A confirmation email will be sent to your address. Keep this receipt for entry.
        </p>
      </div>
    </div>
  )
}

function generateOrderId() {
  // 简易本地订单号：2025-xxxxx
  const base = Date.now().toString(36).toUpperCase().slice(-6)
  return `CC-${new Date().getFullYear()}-${base}`
}
