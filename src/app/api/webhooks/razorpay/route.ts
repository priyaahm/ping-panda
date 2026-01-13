import { db } from "@/db"
import { verifyWebhookSignature } from "@/lib/razorpay"
import { headers } from "next/headers"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("x-razorpay-signature")

  if (!signature) {
    return new Response("Missing signature", { status: 400 })
  }

  const isValid = verifyWebhookSignature(
    body,
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET ?? ""
  )

  if (!isValid) {
    return new Response("Invalid signature", { status: 400 })
  }

  const event = JSON.parse(body)

  // Handle payment.captured event (payment successful)
  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity

    const userId = payment.notes?.userId

    if (!userId) {
      return new Response("Invalid metadata", { status: 400 })
    }

    await db.user.update({
      where: { id: userId },
      data: { plan: "PRO" },
    })
  }

  return new Response("OK")
}
