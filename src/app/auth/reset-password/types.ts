// Plain-data exports for the reset-password feature.
// Lives outside actions.ts because Next.js requires `'use server'` files to
// only export async functions.

export interface ResetPasswordState {
  error: string | null
}

export const initialResetPasswordState: ResetPasswordState = { error: null }
