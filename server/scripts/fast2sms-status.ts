/**
 * Check Fast2SMS WhatsApp setup and print .env values to copy.
 * Run: npm run fast2sms:status --prefix server
 */
import "dotenv/config";

const API_BASE = "https://www.fast2sms.com";

async function fetchJson(path: string) {
  const key = process.env.FAST2SMS_API_KEY?.trim();
  if (!key) throw new Error("FAST2SMS_API_KEY is not set");

  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: key },
  });
  return res.json();
}

type WabaNumber = {
  phone_number_id?: string;
  number?: string;
  verified_name?: string;
  connection_status?: string;
};

type WabaTemplate = {
  message_id?: string | number;
  phone_number_id?: string;
  template_name?: string;
  status?: string;
  category?: string;
  body?: string;
};

async function main() {
  console.log("\n=== Fast2SMS configuration check ===\n");

  const key = process.env.FAST2SMS_API_KEY?.trim();
  if (!key) {
    console.error("❌ FAST2SMS_API_KEY missing in .env");
    process.exit(1);
  }
  console.log("✅ FAST2SMS_API_KEY is set");

  const admin = process.env.FAST2SMS_ADMIN_NUMBER?.trim();
  console.log(admin ? `✅ FAST2SMS_ADMIN_NUMBER=${admin}` : "⚠️  FAST2SMS_ADMIN_NUMBER not set (no admin SMS alerts)");

  const numbersRes = (await fetchJson("/dev/dlt_manager/whatsapp?type=number")) as {
    success?: boolean;
    data?: WabaNumber[];
  };
  const templatesRes = (await fetchJson("/dev/dlt_manager/whatsapp?type=template")) as {
    success?: boolean;
    data?: WabaTemplate[];
  };

  const numbers = numbersRes.data ?? [];
  const templates = templatesRes.data ?? [];

  console.log(`\nWhatsApp numbers on account: ${numbers.length}`);
  if (numbers.length === 0) {
    console.log("❌ No WhatsApp Business number linked yet.");
    console.log("   → Fast2SMS panel → Dev API → WhatsApp Manager → connect Facebook Business");
  } else {
    for (const n of numbers) {
      console.log(`   • ${n.verified_name ?? "—"} | ${n.number} | id=${n.phone_number_id} | ${n.connection_status}`);
    }
  }

  console.log(`\nWhatsApp templates: ${templates.length}`);
  if (templates.length === 0) {
    console.log("❌ No approved templates yet.");
    console.log("   → Create a UTILITY template in WhatsApp Manager, wait for Meta approval");
  } else {
    for (const t of templates) {
      console.log(
        `   • message_id=${t.message_id} | ${t.template_name} | ${t.status} | ${t.category}`,
      );
      if (t.body) console.log(`     Body: ${t.body.slice(0, 120)}…`);
    }
  }

  const orderTemplate =
    templates.find((t) =>
      /order|confirm|purchase/i.test(String(t.template_name ?? "")),
    ) ?? templates.find((t) => String(t.status ?? "").toLowerCase() === "approved") ?? templates[0];

  const phoneNumberId =
    process.env.FAST2SMS_WHATSAPP_PHONE_NUMBER_ID?.trim() ||
    orderTemplate?.phone_number_id ||
    numbers[0]?.phone_number_id ||
    "";

  const messageId =
    process.env.FAST2SMS_ORDER_MESSAGE_ID?.trim() ||
    (orderTemplate?.message_id != null ? String(orderTemplate.message_id) : "");

  console.log("\n--- Suggested .env (copy after onboarding) ---\n");
  console.log(`FAST2SMS_WHATSAPP_PHONE_NUMBER_ID=${phoneNumberId || "<phone_number_id>"}`);
  console.log(`FAST2SMS_ORDER_MESSAGE_ID=${messageId || "<message_id>"}`);
  console.log(`FAST2SMS_ADMIN_NUMBER=${admin || "9703455666"}`);
  console.log(`FAST2SMS_SEND_SMS=false`);

  if (phoneNumberId && messageId) {
    console.log("\n✅ WhatsApp order confirmations can be enabled with the values above.");
  } else {
    console.log("\n⏳ Complete WhatsApp Manager setup, then run this script again.");
  }

  console.log("\nTemplate body your app expects (4 variables, pipe-separated in API):");
  console.log("  {{1}} = customer name");
  console.log("  {{2}} = order id");
  console.log("  {{3}} = items summary");
  console.log("  {{4}} = total amount (Rs)\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
