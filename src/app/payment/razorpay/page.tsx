"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Script from "next/script"

declare global {
  interface Window {
    Razorpay: any
  }
}

const RazorpayPaymentPage = () => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get("order_id")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  const initializePayment = useCallback(async () => {
    if (!orderId || !window.Razorpay) {
      return
    }

    try {
      setLoading(true)
      // Fetch order details from your API
      const response = await fetch(
        `/api/payment/razorpay/order?order_id=${orderId}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch order details")
      }

      if (!data.keyId) {
        throw new Error("Razorpay key ID is missing. Please check your environment variables.")
      }

      const options: any = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "PingPanda",
        description: "Lifetime access to PingPanda",
        order_id: orderId,
        method: {
          upi: true,
          netbanking: true,
          wallet: true,
          card: true,
        },
        handler: function (response: any) {
          // Payment successful
          router.push(
            `/dashboard?success=true&payment_id=${response.razorpay_payment_id}`
          )
        },
        prefill: {
          email: data.userEmail || "",
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: function () {
            router.push("/pricing")
          },
        },
      }

      // Add configuration ID if available (for default payment gateway settings)
      if (data.configId) {
        options.config_id = data.configId
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
      setLoading(false)
    } catch (err: any) {
      console.error("Payment initialization error:", err)
      setError(err.message || "Failed to initialize payment")
      setLoading(false)
    }
  }, [orderId, router])

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is missing")
      setLoading(false)
      return
    }

    // If script is already loaded, initialize payment
    if (scriptLoaded && window.Razorpay) {
      initializePayment()
    }
  }, [orderId, scriptLoaded, initializePayment])

  const handleScriptLoad = () => {
    setScriptLoaded(true)
    if (orderId && window.Razorpay) {
      initializePayment()
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/pricing")}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            Go back to pricing
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={() => {
          setError("Failed to load Razorpay checkout script")
          setLoading(false)
        }}
      />
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {scriptLoaded ? "Opening payment gateway..." : "Loading payment gateway..."}
          </p>
        </div>
      </div>
    </>
  )
}

export default RazorpayPaymentPage
