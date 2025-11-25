// src/routes/purchase.tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

export const purchaseSearchSchema = z.object({
  title: z.string().optional(),
  price: z.coerce.number().optional(),
  start: z.string().optional(),
  location: z.string().optional(),
  eventId: z.union([z.string(), z.number()]).optional(),
  qty: z.coerce.number().optional(),
})

export const Route = createFileRoute('/purchase')({
  validateSearch: purchaseSearchSchema,
})
