// src/data/events.sample.ts
export type SimpleEvent = {
  id: string
  title: string
  date: string
  dateISO: string
  org: string
  where: string
  category: 'Workshop' | 'Music' | 'Sports' | 'Film' | 'Arts' | 'Other'
  heroUrl?: string
}
