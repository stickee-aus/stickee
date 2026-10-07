// Plain-data exports for the forgot-password feature.
// Lives outside actions.ts because Next.js requires `'use server'` files to
// only export async functions.

export interface ForgotPasswordState {
  email: string
  error: string | null
  sent: boolean
}

export const initialForgotPasswordState: ForgotPasswordState = {
  email: '',
  error: null,
  sent: false,
}
