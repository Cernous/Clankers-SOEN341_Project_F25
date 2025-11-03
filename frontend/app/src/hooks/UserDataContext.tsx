import * as React from 'react'
import type { SimpleEvent } from '../data/events.sample'

export type TicketType = 'free' | 'paid'

export type Ticket = {
  id: string
  eventId: string
  title: string
  date: string
  org: string
  where: string
  owner: string
  issuedAt: string
  type: TicketType
}

type Ctx = {
  saved: string[]
  tickets: Ticket[]
  isSaved: (eventId: string) => boolean
  toggleSave: (ev: SimpleEvent) => void
  claimTicket: (ev: SimpleEvent, owner: string, type?: TicketType) => Ticket
  clearAll: () => void
}

const UserDataContext = React.createContext<Ctx | null>(null)

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [saved, setSaved] = React.useState<string[]>([])
  const [tickets, setTickets] = React.useState<Ticket[]>([])

  const isSaved = React.useCallback(
    (eventId: string) => saved.includes(eventId),
    [saved]
  )

  const toggleSave = React.useCallback((ev: SimpleEvent) => {
    setSaved(prev => prev.includes(ev.id) ? prev.filter(id => id !== ev.id) : [...prev, ev.id])
  }, [])

  const claimTicket = React.useCallback(
    (ev: SimpleEvent, owner: string, type: TicketType = 'free'): Ticket => {
      const t: Ticket = {
        id: `t_${ev.id}_${Date.now()}`,
        eventId: ev.id,
        title: ev.title,
        date: ev.date,
        org: ev.org,
        where: ev.where,
        owner,
        issuedAt: new Date().toISOString(),
        type,
      }
      setTickets(prev => [t, ...prev])
      return t
    },
    []
  )

  const clearAll = React.useCallback(() => {
    setSaved([])
    setTickets([])
  }, [])

  const value: Ctx = { saved, tickets, isSaved, toggleSave, claimTicket, clearAll }

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  )
}

export function useUserData() {
  const ctx = React.useContext(UserDataContext)
  if (!ctx) throw new Error('useUserData must be used within <UserDataProvider>')
  return ctx
}
