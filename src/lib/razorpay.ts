import Razorpay from "razorpay"
import crypto from "crypto"

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID ?? "",
  key_secret: process.env.RAZORPAY_KEY_SECRET ?? "",
})

export const createCheckoutSession = async ({
  userEmail,
  userId,
  amount,
}: {
  userEmail: string
  userId: string
  amount: number // Amount in paise (smallest currency unit)
}) => {
  // Convert incoming amount to INR paise (approx USD->INR using factor 90)
  const amountInPaise = Math.round(amount * 90)

  // Razorpay limits receipt length to 40 characters.
  // Use a compact, deterministic receipt to avoid validation errors.
  const compactReceipt = `rp_${userId.slice(0, 16)}_${Date.now()
    .toString()
    .slice(-6)}`

  const options = {
    amount: amountInPaise, // Amount in paise (INR)
    currency: "INR",
    receipt: compactReceipt,
    notes: {
      userId,
      userEmail,
    },
  }

  const order = await razorpay.orders.create(options)

  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "",
    url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/razorpay?order_id=${order.id}`,
  }
}

export const verifyWebhookSignature = (
  webhookBody: string,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(webhookBody)
    .digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}
