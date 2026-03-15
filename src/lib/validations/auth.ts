import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export const magicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export type SignInInput = z.infer<typeof signInSchema>
export type MagicLinkInput = z.infer<typeof magicLinkSchema>
