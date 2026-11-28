import { verifyStripeSignature } from '@/lib/stripe/webhook-signature'
import {
  processStripeDonationWebhook,
  type StripeEvent,
} from '@/lib/stripe/webhook-handler'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return Response.json({ error: 'Stripe webhook secret is not configured.' }, { status: 500 })
  }

  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!verifyStripeSignature(payload, signature, webhookSecret)) {
    return Response.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  let event: StripeEvent
  try {
    event = JSON.parse(payload) as StripeEvent
  } catch {
    return Response.json({ error: 'Malformed payload.' }, { status: 400 })
  }

  if (!event || typeof event.type !== 'string') {
    return Response.json({ error: 'Malformed payload.' }, { status: 400 })
  }

  const result = await processStripeDonationWebhook(event)
  if (!result.ok) {
    if (result.reason === 'malformed') {
      return Response.json({ error: 'Malformed payload.' }, { status: 400 })
    }
    return Response.json({ error: 'Donation update failed.' }, { status: 500 })
  }

  return Response.json({ received: true })
}
