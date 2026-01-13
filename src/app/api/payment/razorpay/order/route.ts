import { razorpay } from "@/lib/razorpay"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const orderId = searchParams.get("order_id")

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
  }

  try {
    const order = await razorpay.orders.fetch(orderId)

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      userEmail: order.notes?.userEmail || "",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
      configId: process.env.NEXT_PUBLIC_RAZORPAY_CONFIG_ID || "",
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch order" },
      { status: 500 }
    )
  }
}
