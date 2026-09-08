import Razorpay from "razorpay";
import crypto from "node:crypto";

let client: Razorpay | null = null;

export function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not configured");
  }
  if (!client) {
    client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return client;
}

export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) return false;
  const body = `${params.orderId}|${params.paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === params.signature;
}

export function isLiveRazorpay() {
  return (process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_live_");
}

export async function fetchCapturedPayment(paymentId: string) {
  const razorpay = getRazorpay();
  const payment = await razorpay.payments.fetch(paymentId);
  const status = String(payment.status ?? "");
  const captured = status === "captured" || status === "authorized";
  return { captured, status, payment };
}
