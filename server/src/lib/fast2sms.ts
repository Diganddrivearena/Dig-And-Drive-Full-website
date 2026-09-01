/**
 * Fast2SMS WhatsApp + Quick SMS helpers.
 *
 * WhatsApp (customer order confirmation) uses an approved template:
 *   GET https://www.fast2sms.com/dev/whatsapp
 *   Header: Authorization: <FAST2SMS_API_KEY>
 *   Query: message_id, phone_number_id, numbers, variables_values
 *
 * Suggested UTILITY template body (4 variables, pipe-joined in API):
 *   Hi {{1}}, your DIG & DRIVE order #{{2}} is confirmed.
 *   Items: {{3}}
 *   Total paid: Rs {{4}}. We'll start packing shortly.
 *
 * Env:
 *   FAST2SMS_API_KEY
 *   FAST2SMS_WHATSAPP_PHONE_NUMBER_ID  (WABA phone number id)
 *   FAST2SMS_ORDER_MESSAGE_ID          (template message_id from WhatsApp Manager)
 *   FAST2SMS_ADMIN_NUMBER              (optional shop alert via Quick SMS)
 *   FAST2SMS_SEND_SMS                  ("true" to also send customer Quick SMS)
 */

const API_BASE = "https://www.fast2sms.com";

export type OrderNotifyPayload = {
  orderId: number;
  customerName: string;
  phone: string;
  email?: string | null;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string | null;
};

function apiKey() {
  return process.env.FAST2SMS_API_KEY?.trim() || "";
}

function normalizeIndianPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) return digits;
  if (digits.length === 12 && digits.startsWith("91") && /^[6-9]/.test(digits.slice(2))) {
    return digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1))) {
    return digits.slice(1);
  }
  return null;
}

function sanitizeVar(value: string, max = 200) {
  return value.replace(/\|/g, "/").replace(/\s+/g, " ").trim().slice(0, max);
}

function formatItemsSummary(
  items: OrderNotifyPayload["items"],
  max = 180,
): string {
  const parts = items.map((i) => `${i.name} x${i.quantity}`);
  let text = parts.join(", ");
  if (text.length > max) {
    text = `${text.slice(0, max - 1)}…`;
  }
  return sanitizeVar(text, max);
}

function formatInr(amount: number) {
  return amount.toLocaleString("en-IN");
}

async function getJson(url: string): Promise<{ ok: boolean; body: unknown }> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Authorization: apiKey() },
    });
    const body = await res.json().catch(() => null);
    return { ok: res.ok, body };
  } catch (err) {
    console.error("[fast2sms] network error", err);
    return { ok: false, body: { error: String(err) } };
  }
}

/** Send approved WhatsApp template to a 10-digit Indian mobile. */
export async function sendWhatsAppTemplate(params: {
  numbers: string;
  variables: string[];
  messageId?: string;
  phoneNumberId?: string;
}) {
  const key = apiKey();
  const messageId =
    params.messageId || process.env.FAST2SMS_ORDER_MESSAGE_ID?.trim();
  const phoneNumberId =
    params.phoneNumberId ||
    process.env.FAST2SMS_WHATSAPP_PHONE_NUMBER_ID?.trim();

  if (!key || !messageId || !phoneNumberId) {
    console.warn(
      "[fast2sms] WhatsApp skipped — set FAST2SMS_API_KEY, FAST2SMS_ORDER_MESSAGE_ID, FAST2SMS_WHATSAPP_PHONE_NUMBER_ID",
    );
    return { skipped: true as const, reason: "missing_config" };
  }

  const phone = normalizeIndianPhone(params.numbers);
  if (!phone) {
    console.warn("[fast2sms] invalid phone", params.numbers);
    return { skipped: true as const, reason: "invalid_phone" };
  }

  const qs = new URLSearchParams({
    message_id: messageId,
    phone_number_id: phoneNumberId,
    numbers: phone,
  });
  if (params.variables.length > 0) {
    qs.set(
      "variables_values",
      params.variables.map((v) => sanitizeVar(v)).join("|"),
    );
  }

  const url = `${API_BASE}/dev/whatsapp?${qs.toString()}`;
  const result = await getJson(url);
  if (!result.ok) {
    console.error("[fast2sms] WhatsApp send failed", result.body);
  }
  return { skipped: false as const, ...result };
}

/** Quick SMS (route=q). Prefer DLT for production transactional SMS. */
export async function sendQuickSms(params: {
  numbers: string;
  message: string;
}) {
  const key = apiKey();
  if (!key) {
    console.warn("[fast2sms] SMS skipped — FAST2SMS_API_KEY missing");
    return { skipped: true as const, reason: "missing_config" };
  }

  const phone = normalizeIndianPhone(params.numbers);
  if (!phone) {
    return { skipped: true as const, reason: "invalid_phone" };
  }

  const qs = new URLSearchParams({
    route: "q",
    message: params.message.slice(0, 750),
    numbers: phone,
  });

  const url = `${API_BASE}/dev/bulkV2?${qs.toString()}`;
  const result = await getJson(url);
  if (!result.ok) {
    console.error("[fast2sms] SMS send failed", result.body);
  }
  return { skipped: false as const, ...result };
}

export function buildCustomerSmsMessage(order: OrderNotifyPayload) {
  const items = order.items
    .map((i) => `${i.name} x${i.quantity}`)
    .join(", ");
  return [
    `DIG & DRIVE: Order #${order.orderId} confirmed.`,
    `Items: ${items}`,
    `Total: Rs ${formatInr(order.total)}. Thank you!`,
  ].join(" ");
}

export function buildAdminSmsMessage(order: OrderNotifyPayload) {
  const items = order.items
    .map((i) => `${i.name} x${i.quantity} (Rs ${i.price * i.quantity})`)
    .join("; ");
  return [
    `New order #${order.orderId}`,
    `Customer: ${order.customerName} ${order.phone}`,
    order.email ? `Email: ${order.email}` : null,
    `Items: ${items}`,
    order.discount > 0
      ? `Discount: Rs ${formatInr(order.discount)}${order.couponCode ? ` (${order.couponCode})` : ""}`
      : null,
    `Total: Rs ${formatInr(order.total)}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

/**
 * After payment succeeds: WhatsApp template to customer,
 * optional Quick SMS to customer, optional admin Quick SMS.
 */
export async function notifyOrderPaid(order: OrderNotifyPayload) {
  if (!apiKey()) {
    console.warn("[fast2sms] notify skipped — no API key");
    return;
  }

  const phone = normalizeIndianPhone(order.phone);
  if (!phone) {
    console.warn("[fast2sms] notify skipped — invalid customer phone");
    return;
  }

  const variables = [
    sanitizeVar(order.customerName || "Customer", 60),
    String(order.orderId),
    formatItemsSummary(order.items),
    formatInr(order.total),
  ];

  await sendWhatsAppTemplate({ numbers: phone, variables });

  if (process.env.FAST2SMS_SEND_SMS === "true") {
    await sendQuickSms({
      numbers: phone,
      message: buildCustomerSmsMessage(order),
    });
  }

  const admin = process.env.FAST2SMS_ADMIN_NUMBER?.trim();
  if (admin) {
    await sendQuickSms({
      numbers: admin,
      message: buildAdminSmsMessage({ ...order, phone }),
    });
  }
}

export { normalizeIndianPhone };
