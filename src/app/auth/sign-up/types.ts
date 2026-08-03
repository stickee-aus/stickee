// Plain-data exports for the sign-up feature.
// Lives outside actions.ts because Next.js requires `'use server'` files to
// only export async functions.

export interface SignUpState {
  email: string
  displayName: string
  handle: string
  error: string | null
  needsConfirmation: boolean
}

export const initialSignUpState: SignUpState = {
  email: '',
  displayName: '',
  handle: '',
  error: null,
  needsConfirmation: false,
}

export interface HandleCheckState {
  handle: string
  available: boolean
  error: string | null
}
