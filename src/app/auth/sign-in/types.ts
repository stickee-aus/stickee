// Plain-data exports for the sign-in feature.
// Lives outside actions.ts because Next.js requires `'use server'` files to
// only export async functions.

export interface SignInState {
  email: string
  error: string | null
  sent: boolean
}

export const initialSignInState: SignInState = {
  email: '',
  error: null,
  sent: false,
}

export interface PasswordSignInState {
  email: string
  error: string | null
}

export const initialPasswordSignInState: PasswordSignInState = {
  email: '',
  error: null,
}
