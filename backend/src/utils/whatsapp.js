const https = require("https");
const db = require("../config/db");

/**
 * Send WhatsApp booking alert to Admin via CallMeBot API
 * @param {object} booking The created booking record.
 */
async function sendAdminWhatsAppAlert(booking) {
  try {
    const settings = await db.getSettings().catch(() => ({}));
    const isEnabled =
      settings.whatsapp_enabled !== undefined
        ? settings.whatsapp_enabled !== "0"
        : process.env.WHATSAPP_NOTIFICATIONS_ENABLED !== "false";

    if (!isEnabled) {
      console.log("[WhatsApp] WhatsApp notifications are disabled in settings.");
      return { success: false, reason: "disabled" };
    }

    const adminPhone =
      settings.whatsapp_admin_phone ||
      process.env.ADMIN_WHATSAPP_PHONE ||
      "919154351636";
    const apiKey =
      settings.whatsapp_api_key || process.env.CALLMEBOT_API_KEY || "";

    if (!adminPhone || !apiKey) {
      console.warn(
        "[WhatsApp] Admin phone or CallMeBot API key is not configured. Skipping WhatsApp alert."
      );
      return { success: false, reason: "missing_credentials" };
    }

    const customer =
      typeof booking.customer === "string"
        ? JSON.parse(booking.customer)
        : booking.customer || {};
    const schedule =
      typeof booking.schedule === "string"
        ? JSON.parse(booking.schedule)
        : booking.schedule || {};
    const items =
      typeof booking.items === "string"
        ? JSON.parse(booking.items)
        : booking.items || [];

    const itemsSummary = items
      .map(
        (i) =>
          `  • ${i.title || i.name || "Service"} (${i.qty || 1}x) - ₹${
            (i.price || 0) * (i.qty || 1)
          }`
      )
      .join("\n");

    const messageText = `🔔 *NEW BOOKING ALERT — TheDeep CleanerZ* 🔔

📋 *Order ID*: #${(booking.id || "").toUpperCase()}
👤 *Customer*: ${customer.name || "Customer"}
📞 *Phone*: +91 ${customer.phone || ""}
📍 *Address*: ${customer.address || ""}${
      customer.landmark ? ", Near " + customer.landmark : ""
    }, ${customer.city || "Guntur"} (${customer.pincode || "522002"})
🗓️ *Schedule Date*: ${schedule.date || "Not specified"}
⏰ *Time Slot*: ${schedule.time || "Not specified"}

🧹 *Services Booked*:
${itemsSummary || "  • General Deep Cleaning"}

💰 *Total Amount*: ₹${booking.total || 0}
💳 *Payment*: ${booking.paymentStatus || "Pending"}
${booking.notes ? `📝 *Notes*: "${booking.notes}"\n` : ""}
👉 *Admin Dashboard*: https://thedeepcleanerz.in/admin`;

    const cleanPhone = adminPhone.replace(/\D/g, "");
    const encodedText = encodeURIComponent(messageText);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedText}&apikey=${apiKey}`;

    return new Promise((resolve) => {
      https
        .get(url, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            if (res.statusCode === 200) {
              console.log(
                `[WhatsApp] Booking alert sent successfully to +${cleanPhone}`
              );
              resolve({ success: true, response: data });
            } else {
              console.warn(
                `[WhatsApp] CallMeBot returned status ${res.statusCode}: ${data}`
              );
              resolve({ success: false, status: res.statusCode, response: data });
            }
          });
        })
        .on("error", (err) => {
          console.error("[WhatsApp] Error sending WhatsApp message:", err.message);
          resolve({ success: false, error: err.message });
        });
    });
  } catch (err) {
    console.error("[WhatsApp] Unexpected error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Send a quick test WhatsApp message to verify CallMeBot credentials
 */
async function sendTestWhatsAppAlert(phone, apiKey) {
  const cleanPhone = (phone || "").replace(/\D/g, "");
  if (!cleanPhone || !apiKey) {
    throw new Error("Phone number and CallMeBot API Key are required.");
  }

  const testText = encodeURIComponent(
    `✅ *TheDeep CleanerZ — WhatsApp Alert Integration Test*\n\nYour CallMeBot WhatsApp notifications are successfully configured and active!\n\nYou will receive instant alerts here whenever a customer places an order.\n\n🌐 https://thedeepcleanerz.in`
  );

  const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${testText}&apikey=${apiKey}`;

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            resolve({
              success: true,
              message: "Test WhatsApp message sent successfully!",
              data,
            });
          } else {
            reject(
              new Error(`CallMeBot returned status ${res.statusCode}: ${data}`)
            );
          }
        });
      })
      .on("error", (err) => {
        reject(new Error(`Network error: ${err.message}`));
      });
  });
}

module.exports = {
  sendAdminWhatsAppAlert,
  sendTestWhatsAppAlert,
};
