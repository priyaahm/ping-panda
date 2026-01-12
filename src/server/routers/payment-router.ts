import { createCheckoutSession } from "@/lib/razorpay"
import { router } from "../__internals/router"
import { privateProcedure } from "../procedures"

export const paymentRouter = router({
  createCheckoutSession: privateProcedure.mutation(async ({ c, ctx }) => {
    const { user } = ctx

    // Amount in paise (4900 paise = $49 USD)
    // Note: Razorpay uses paise for INR, but for USD you might need to adjust
    // For USD, amount should be in cents (4900 cents = $49)
    const amountInCents = 4900 // $49 USD

    const session = await createCheckoutSession({
      userEmail: user.email,
      userId: user.id,
      amount: amountInCents,
    })

    return c.json({ url: session.url })
  }),

  getUserPlan: privateProcedure.query(async ({ c, ctx }) => {
    const { user } = ctx
    return c.json({ plan: user.plan })
  }),
})
