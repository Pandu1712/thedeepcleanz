const nodemailer = require("nodemailer");

// Create dynamic transport using app password or SMTP settings
function getTransporter() {
  const user = process.env.EMAIL_USER || "thedeepcleanerz.info@gmail.com";
  const pass = process.env.EMAIL_PASS || "wwzn nitn bczi xvtv";
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;

  if (host) {
    return nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Number(port) === 465,
      auth: { user, pass },
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}


/**
 * Sends HTML confirmation and official Tax Invoice emails to the customer and admin.
 * @param {object} booking The created booking record.
 */
async function sendBookingEmails(booking) {
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

  const customerEmail = customer.email ? customer.email.trim() : "";
  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL || "thedeepcleanerz.info@gmail.com";
  const senderEmail =
    process.env.EMAIL_USER || "thedeepcleanerz.info@gmail.com";

  // Calculate pricing & advance payments accurately
  const totalAmount = Number(booking.total) || 0;
  const discountAmount = Number(booking.discount) || 0;
  
  let depositPaid = 0;
  let balanceDue = totalAmount;
  const isAdvanceMatch = String(booking.paymentStatus || "").match(/Paid Advance\s*\(\s*₹?\s*(\d+)\s*\)/i);

  if (isAdvanceMatch) {
    depositPaid = Number(isAdvanceMatch[1]) || 0;
    balanceDue = Math.max(0, totalAmount - depositPaid);
  } else if (
    String(booking.paymentStatus || "").toLowerCase().includes("paid in full") ||
    String(booking.paymentStatus || "").toLowerCase().includes("success")
  ) {
    depositPaid = totalAmount;
    balanceDue = 0;
  } else if (
    String(booking.paymentStatus || "").toLowerCase().includes("pending") ||
    String(booking.paymentStatus || "").toLowerCase().includes("cod") ||
    String(booking.paymentStatus || "").toLowerCase().includes("free advance")
  ) {
    depositPaid = 0;
    balanceDue = totalAmount;
  } else if (booking.paymentId) {
    depositPaid = totalAmount;
    balanceDue = 0;
  }

  const invoiceNumber = `INV-${String(booking.id || "").toUpperCase()}`;
  const bookingRef = `#${String(booking.id || "").toUpperCase()}`;
  const formattedBookingDate = schedule.date || "Scheduled Date";
  const formattedTimeSlot = schedule.time || "Scheduled Time";
  const issueDate = new Date(booking.createdAt || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Calculate items subtotal
  const itemsSubtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
    0,
  );

  // Build items rows for HTML table
  const itemsHtml = items.length > 0 ? items
    .map(
      (item, idx) => `
    <tr style="border-bottom: 1px solid #cb9f5a20; ${idx % 2 === 1 ? 'background-color: #001a15;' : ''}">
      <td style="padding: 14px 16px; color: #fdfcf7; font-size: 13px; font-weight: 600;">
        ${item.title || "Deep Cleaning Service"}
      </td>
      <td style="padding: 14px 16px; color: #fdfcf7aa; text-align: center; font-size: 13px; font-weight: bold;">
        x${item.qty || 1}
      </td>
      <td style="padding: 14px 16px; color: #fdfcf7aa; text-align: right; font-size: 13px;">
        ₹${Number(item.price) || 0}
      </td>
      <td style="padding: 14px 16px; color: #cb9f5a; text-align: right; font-weight: 700; font-size: 13px;">
        ₹${(Number(item.price) || 0) * (Number(item.qty) || 1)}
      </td>
    </tr>
  `,
    )
    .join("") : `
    <tr>
      <td colspan="4" style="padding: 14px 16px; color: #fdfcf7; text-align: center; font-size: 13px;">
        Custom Deep Cleaning Package
      </td>
    </tr>
  `;

  // Customer Email (Booking Confirmation + Official Tax Invoice / Receipt)
  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Booking Confirmation &amp; Invoice ${bookingRef} - TheDeep CleanerZ</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #00120f; color: #fdfcf7; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #00120f; padding: 30px 15px;">
        <tr>
          <td align="center">
            <table width="620" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; width: 100%; background-color: #00221c; border: 1px solid #cb9f5a35; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.4);">
              
              <!-- Top Branding Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #002e25 0%, #001d17 100%); padding: 32px 30px; text-align: center; border-bottom: 2px solid #cb9f5a40;">
                  <div style="display: inline-block; padding: 6px 16px; background-color: #cb9f5a20; border: 1px solid #cb9f5a50; border-radius: 30px; margin-bottom: 12px;">
                    <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #cb9f5a; letter-spacing: 2px;">
                      ✦ Official Booking Confirmation &amp; Tax Invoice ✦
                    </span>
                  </div>
                  <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: 1.5px; text-transform: uppercase;">TheDeep CleanerZ</h1>
                  <p style="margin: 6px 0 0 0; font-size: 11px; font-weight: 600; text-transform: uppercase; color: #cb9f5a; letter-spacing: 3px;">
                    Pristine Luxury Deep Cleaning • Guntur, AP
                  </p>
                </td>
              </tr>
              
              <!-- Greeting & Hero Status -->
              <tr>
                <td style="padding: 30px 30px 20px 30px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #00362c; border: 1px solid #10b98140; border-radius: 16px; padding: 18px 20px; margin-bottom: 24px;">
                    <tr>
                      <td>
                        <div style="font-size: 18px; font-weight: 800; color: #10b981; margin-bottom: 4px;">
                          ✓ Booking Confirmed &amp; Scheduled!
                        </div>
                        <div style="font-size: 13px; color: #fdfcf7cc; line-height: 1.5;">
                          Dear <strong>${customer.name || "Valued Customer"}</strong>, thank you for choosing TheDeep CleanerZ. Your booking request has been registered and verified. Our certified cleaning specialists will arrive promptly on your scheduled date.
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Appointment Schedule Card -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #001914; border: 1px solid #cb9f5a25; border-radius: 16px; padding: 20px; margin-bottom: 25px;">
                    <tr>
                      <td width="50%" style="padding-bottom: 14px; border-bottom: 1px solid #cb9f5a15;">
                        <span style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Booking ID</span>
                        <strong style="font-size: 15px; color: #ffffff; font-family: monospace; letter-spacing: 1px;">${bookingRef}</strong>
                      </td>
                      <td width="50%" style="padding-bottom: 14px; border-bottom: 1px solid #cb9f5a15;">
                        <span style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Invoice No</span>
                        <strong style="font-size: 15px; color: #ffffff; font-family: monospace; letter-spacing: 1px;">${invoiceNumber}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td width="50%" style="padding-top: 14px;">
                        <span style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Scheduled Date</span>
                        <strong style="font-size: 14px; color: #ffffff;">📅 ${formattedBookingDate}</strong>
                      </td>
                      <td width="50%" style="padding-top: 14px;">
                        <span style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Preferred Time Slot</span>
                        <strong style="font-size: 14px; color: #ffffff;">🕒 ${formattedTimeSlot}</strong>
                      </td>
                    </tr>
                  </table>

                  <!-- OFFICIAL TAX INVOICE SECTION -->
                  <div style="background-color: #001a15; border: 1px solid #cb9f5a35; border-radius: 16px; padding: 24px 20px; margin-bottom: 25px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px; border-bottom: 1px solid #cb9f5a25; padding-bottom: 14px;">
                      <tr>
                        <td width="55%">
                          <span style="font-size: 13px; font-weight: 800; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px; display: block; margin-bottom: 4px;">
                            Tax Invoice &amp; Payment Receipt
                          </span>
                          <span style="font-size: 11px; color: #fdfcf780;">Date of Issue: ${issueDate}</span>
                        </td>
                        <td width="45%" align="right">
                          <span style="display: inline-block; padding: 4px 10px; background-color: ${depositPaid > 0 ? '#10b98125' : '#f59e0b25'}; border: 1px solid ${depositPaid > 0 ? '#10b98160' : '#f59e0b60'}; border-radius: 8px; font-size: 10px; font-weight: 800; color: ${depositPaid > 0 ? '#10b981' : '#f59e0b'}; text-transform: uppercase;">
                            ${depositPaid > 0 ? `✓ Paid Advance (₹${depositPaid})` : 'Pending (Pay After Service)'}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- Billed To & Billed From -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; font-size: 12px; line-height: 1.5;">
                      <tr>
                        <td width="50%" valign="top" style="padding-right: 10px;">
                          <strong style="color: #cb9f5a; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; display: block; margin-bottom: 4px;">Billed To (Customer)</strong>
                          <strong style="color: #ffffff; font-size: 13px;">${customer.name || "Customer"}</strong><br>
                          <span style="color: #fdfcf7aa;">Phone: +91 ${customer.phone}</span><br>
                          ${customerEmail ? `<span style="color: #fdfcf7aa;">Email: ${customerEmail}</span><br>` : ""}
                          <span style="color: #fdfcf7aa;">${customer.address}</span><br>
                          ${customer.landmark ? `<span style="color: #fdfcf7aa;">Landmark: ${customer.landmark}</span><br>` : ""}
                          <span style="color: #fdfcf7aa;">${customer.city || "Guntur"} - ${customer.pincode}</span>
                        </td>
                        <td width="50%" valign="top" style="padding-left: 10px; border-left: 1px solid #cb9f5a15;">
                          <strong style="color: #cb9f5a; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; display: block; margin-bottom: 4px;">Service Provider (Billed By)</strong>
                          <strong style="color: #ffffff; font-size: 13px;">TheDeep CleanerZ</strong><br>
                          <span style="color: #fdfcf7aa;">Arundelpet, Guntur</span><br>
                          <span style="color: #fdfcf7aa;">Andhra Pradesh, India - 522002</span><br>
                          <span style="color: #fdfcf7aa;">Official Email: thedeepcleanerz.info@gmail.com</span><br>
                          <span style="color: #fdfcf7aa;">Helpline: +91 9154351636</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Itemized Services Table -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px; border-collapse: collapse; border-radius: 10px; overflow: hidden;">
                      <thead>
                        <tr style="background-color: #002a22; border-bottom: 2px solid #cb9f5a30;">
                          <th align="left" style="padding: 12px 16px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Service Description</th>
                          <th align="center" style="padding: 12px 16px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Qty</th>
                          <th align="right" style="padding: 12px 16px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Rate</th>
                          <th align="right" style="padding: 12px 16px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsHtml}
                      </tbody>
                    </table>

                    <!-- Pricing & Tax Calculations -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #cb9f5a25; padding-top: 14px; font-size: 13px;">
                      <tr>
                        <td style="color: #fdfcf780; padding-bottom: 8px;">Subtotal (Services):</td>
                        <td align="right" style="color: #ffffff; font-weight: 600; padding-bottom: 8px;">₹${itemsSubtotal > 0 ? itemsSubtotal : totalAmount}</td>
                      </tr>
                      ${
                        discountAmount > 0
                          ? `
                      <tr>
                        <td style="color: #fdfcf780; padding-bottom: 8px;">Special Coupon Discount (${booking.coupon || "Applied"}):</td>
                        <td align="right" style="color: #f87171; font-weight: bold; padding-bottom: 8px;">-₹${discountAmount}</td>
                      </tr>
                      `
                          : ""
                      }
                      <tr style="border-top: 1px dashed #cb9f5a20;">
                        <td style="color: #fdfcf7; font-weight: 700; padding: 10px 0;">Total Service Value:</td>
                        <td align="right" style="color: #ffffff; font-weight: 800; font-size: 15px; padding: 10px 0;">₹${totalAmount}</td>
                      </tr>
                      <tr>
                        <td style="color: #10b981; font-weight: 700; padding-bottom: 8px;">
                          Advance Paid ${booking.paymentId ? `<span style="font-size: 10px; color: #10b98190; font-family: monospace;">(ID: ${booking.paymentId})</span>` : ''}:
                        </td>
                        <td align="right" style="color: #10b981; font-weight: 800; font-size: 15px; padding-bottom: 8px;">₹${depositPaid}</td>
                      </tr>
                      <tr style="background-color: #002820; border-radius: 8px;">
                        <td style="color: #cb9f5a; font-weight: 800; font-size: 14px; padding: 12px 10px; border-top: 1px solid #cb9f5a30;">
                          Balance to Collect (After Service / COD):
                        </td>
                        <td align="right" style="color: #cb9f5a; font-weight: 900; font-size: 16px; padding: 12px 10px; border-top: 1px solid #cb9f5a30;">
                          ₹${balanceDue}
                        </td>
                      </tr>
                    </table>
                  </div>

                  <!-- Delivery Location Details -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #001914; border: 1px solid #cb9f5a20; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
                    <tr>
                      <td>
                        <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px; display: block; margin-bottom: 8px;">
                          📍 Service Location &amp; Contact
                        </span>
                        <div style="font-size: 13px; color: #fdfcf7cc; line-height: 1.6;">
                          <strong>Address:</strong> ${customer.address}<br>
                          ${customer.landmark ? `<strong>Landmark:</strong> ${customer.landmark}<br>` : ""}
                          <strong>City &amp; Pincode:</strong> ${customer.city || "Guntur"} - ${customer.pincode}<br>
                          <strong>Customer Phone:</strong> +91 ${customer.phone}<br>
                          ${customer.gpsCoords ? `<strong>GPS Coordinates:</strong> <a href="https://www.google.com/maps?q=${customer.gpsCoords}" style="color: #cb9f5a; text-decoration: underline;">${customer.gpsCoords}</a><br>` : ""}
                          ${customer.avoidCalling ? `<span style="display: inline-block; margin-top: 6px; padding: 2px 8px; background-color: #f59e0b20; border: 1px solid #f59e0b50; border-radius: 6px; color: #f59e0b; font-size: 11px; font-weight: bold;">Preference: Avoid calling before arrival</span>` : ""}
                        </div>
                        ${
                          booking.notes
                            ? `
                        <div style="margin-top: 12px; background-color: #cb9f5a10; border-left: 3px solid #cb9f5a; padding: 10px 14px; border-radius: 6px; font-size: 12px; font-style: italic; color: #fdfcf7cc;">
                          <strong>Your Notes:</strong> "${booking.notes}"
                        </div>
                        `
                            : ""
                        }
                      </td>
                    </tr>
                  </table>

                  <!-- What to Expect Next -->
                  <div style="background-color: #00251e; border: 1px solid #cb9f5a25; border-radius: 14px; padding: 18px 20px; margin-bottom: 25px;">
                    <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px; display: block; margin-bottom: 10px;">
                      ✦ What Happens Next?
                    </span>
                    <ul style="margin: 0; padding-left: 18px; font-size: 12px; color: #fdfcf7cc; line-height: 1.8;">
                      <li><strong>Supervisor Allocation:</strong> Our supervisor assigns our certified cleaning crew to your slot.</li>
                      <li><strong>Punctual Arrival:</strong> Crew arrives with heavy-duty machines and eco-friendly chemicals.</li>
                      <li><strong>Deep Clean &amp; Inspection:</strong> Comprehensive cleaning conducted per our 50+ point checklist.</li>
                      <li><strong>Payment of Balance:</strong> Settle the remaining ₹${balanceDue} via Cash/UPI upon 100% satisfaction.</li>
                    </ul>
                  </div>

                  <!-- Customer Support Callout -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="text-align: center; padding: 10px 0;">
                    <tr>
                      <td>
                        <p style="margin: 0 0 6px 0; font-size: 12px; color: #fdfcf799;">
                          Need to reschedule or have special instructions? Contact our 24/7 Guntur Helpdesk:
                        </p>
                        <p style="margin: 0; font-size: 14px; font-weight: 800; color: #cb9f5a;">
                          📞 +91 9154351636 &nbsp;|&nbsp; ✉️ thedeepcleanerz.info@gmail.com
                        </p>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #001511; padding: 25px 30px; text-align: center; border-top: 1px solid #cb9f5a20; font-size: 11px; color: #fdfcf760; line-height: 1.6;">
                  <p style="margin: 0 0 8px 0;">
                    This is an authentic system generated booking confirmation and invoice sent directly from <strong>TheDeep CleanerZ</strong>.
                  </p>
                  <p style="margin: 0; font-weight: bold; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">
                    &copy; ${new Date().getFullYear()} TheDeep CleanerZ. Arundelpet, Guntur, Andhra Pradesh. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Admin Notification Email HTML (Sent to official admin address)
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order Alert ${bookingRef} - TheDeep CleanerZ Admin</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #00120f; color: #fdfcf7; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #00120f; padding: 30px 15px;">
        <tr>
          <td align="center">
            <table width="620" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; width: 100%; background-color: #00221c; border: 1px solid #cb9f5a40; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.4);">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #002e25; padding: 28px 30px; text-align: center; border-bottom: 2px solid #cb9f5a30;">
                  <span style="display: inline-block; padding: 4px 14px; background-color: #ef444425; border: 1px solid #ef444460; border-radius: 20px; font-size: 10px; font-weight: 800; color: #f87171; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">
                    🚨 NEW BOOKING ALERT 🚨
                  </span>
                  <h1 style="margin: 0; font-size: 26px; font-weight: 900; color: #fdfcf7; letter-spacing: 1px;">TheDeep CleanerZ</h1>
                  <span style="display: block; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #cb9f5a; letter-spacing: 2px; margin-top: 4px;">
                    Order Reference: ${bookingRef}
                  </span>
                </td>
              </tr>
              
              <!-- Body Content -->
              <tr>
                <td style="padding: 30px;">
                  <div style="background-color: #00362c; border: 1px solid #10b98140; border-radius: 14px; padding: 16px 20px; margin-bottom: 24px;">
                    <div style="font-size: 16px; font-weight: 800; color: #10b981; margin-bottom: 4px;">
                      New Customer Appointment Registered!
                    </div>
                    <div style="font-size: 13px; color: #fdfcf7cc;">
                      A new booking has been placed by <strong>${customer.name || "Customer"}</strong> (+91 ${customer.phone}). Please assign a technician in the admin dashboard.
                    </div>
                  </div>
                  
                  <!-- Booking metadata grid -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #001914; border: 1px solid #cb9f5a20; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
                    <tr>
                      <td width="50%" style="padding-bottom: 12px; border-bottom: 1px solid #cb9f5a15;">
                        <span style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Booking ID</span>
                        <strong style="font-size: 15px; color: #ffffff; font-family: monospace;">${bookingRef}</strong>
                      </td>
                      <td width="50%" style="padding-bottom: 12px; border-bottom: 1px solid #cb9f5a15;">
                        <span style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Total Value</span>
                        <strong style="font-size: 15px; color: #10b981;">₹${totalAmount}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top: 12px;">
                        <span style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Scheduled Date</span>
                        <strong style="font-size: 13px; color: #ffffff;">📅 ${formattedBookingDate}</strong>
                      </td>
                      <td style="padding-top: 12px;">
                        <span style="display: block; font-size: 9px; font-weight: 800; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Scheduled Time</span>
                        <strong style="font-size: 13px; color: #ffffff;">🕒 ${formattedTimeSlot}</strong>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Services Table -->
                  <h3 style="font-size: 12px; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px; margin: 0 0 10px 0;">Ordered Services</h3>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; border-collapse: collapse;">
                    <thead>
                      <tr style="background-color: #001914; border-bottom: 1px solid #cb9f5a30;">
                        <th align="left" style="padding: 10px 14px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #cb9f5a;">Service</th>
                        <th align="center" style="padding: 10px 14px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #cb9f5a;">Qty</th>
                        <th align="right" style="padding: 10px 14px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #cb9f5a;">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                  
                  <!-- Financial details -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #001914; border: 1px solid #cb9f5a20; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px;">
                    <tr>
                      <td style="color: #fdfcf780; padding-bottom: 6px;">Total Booking Amount:</td>
                      <td align="right" style="color: #ffffff; font-weight: bold; padding-bottom: 6px;">₹${totalAmount}</td>
                    </tr>
                    <tr>
                      <td style="color: #10b981; font-weight: bold; padding-bottom: 6px;">Advance Collected:</td>
                      <td align="right" style="color: #10b981; font-weight: bold; padding-bottom: 6px;">₹${depositPaid}</td>
                    </tr>
                    <tr style="font-size: 14px; font-weight: bold; border-top: 1px solid #cb9f5a20;">
                      <td style="color: #cb9f5a; padding-top: 8px;">COD Balance to Collect at Site:</td>
                      <td align="right" style="color: #cb9f5a; padding-top: 8px;">₹${balanceDue}</td>
                    </tr>
                    ${
                      booking.paymentId
                        ? `
                    <tr>
                      <td style="color: #fdfcf760; font-size: 11px; padding-top: 6px;">Payment Transaction ID:</td>
                      <td align="right" style="color: #10b981; font-size: 11px; font-family: monospace; padding-top: 6px;">${booking.paymentId}</td>
                    </tr>
                    `
                        : ""
                    }
                  </table>
                  
                  <!-- Customer Details -->
                  <h3 style="font-size: 12px; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px; margin: 0 0 10px 0;">Customer Contact &amp; Site Location</h3>
                  <div style="background-color: #001914; border: 1px solid #cb9f5a20; border-radius: 12px; padding: 16px 18px; font-size: 13px; line-height: 1.6; color: #fdfcf7cc; margin-bottom: 24px;">
                    <strong>Customer Name:</strong> ${customer.name || "Customer"}<br>
                    <strong>Email:</strong> ${customerEmail || "No Email Provided"}<br>
                    <strong>Phone:</strong> <a href="tel:+91${customer.phone}" style="color: #10b981; font-weight: bold; text-decoration: none;">+91 ${customer.phone}</a><br>
                    <strong>Address:</strong> ${customer.address}<br>
                    ${customer.landmark ? `<strong>Landmark:</strong> ${customer.landmark}<br>` : ""}
                    <strong>City &amp; Pincode:</strong> ${customer.city || "Guntur"} - ${customer.pincode}<br>
                    ${customer.gpsCoords ? `<strong>GPS Location:</strong> <a href="https://www.google.com/maps?q=${customer.gpsCoords}" style="color: #cb9f5a; text-decoration: underline;">View on Google Maps</a><br>` : ""}
                    ${customer.avoidCalling ? `<span style="display: inline-block; margin-top: 6px; padding: 2px 8px; background-color: #f59e0b20; border: 1px solid #f59e0b50; border-radius: 6px; color: #f59e0b; font-size: 11px; font-weight: bold;">Customer Preference: Avoid calling before arrival</span>` : ""}
                  </div>
                  
                  ${
                    booking.notes
                      ? `
                  <div style="margin-bottom: 24px; background-color: #cb9f5a10; border-left: 3px solid #cb9f5a; padding: 12px 16px; border-radius: 8px; font-size: 12px; font-style: italic; color: #fdfcf7cc;">
                    <strong>Special Instructions from Customer:</strong> "${booking.notes}"
                  </div>
                  `
                      : ""
                  }
                  
                  <!-- Admin Action CTA -->
                  <div style="text-align: center; padding-top: 10px;">
                    <a href="http://localhost:4000/admin" style="display: inline-block; background-color: #cb9f5a; color: #00221c; text-decoration: none; padding: 14px 30px; border-radius: 12px; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(203, 159, 90, 0.3);">
                      Open Admin Dashboard &amp; Assign Crew →
                    </a>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #001511; padding: 20px 30px; text-align: center; border-top: 1px solid #cb9f5a20; font-size: 10px; color: #fdfcf750;">
                  <p style="margin: 0;">Automated alert generated by TheDeep CleanerZ Server Engine.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const transporter = getTransporter();

  // 1. Send Booking Confirmation & Tax Invoice to Customer
  if (customerEmail && customerEmail.includes("@") && !customerEmail.endsWith("@thedeepcleanerz.com")) {
    try {
      const customerMailInfo = await transporter.sendMail({
        from: `"TheDeep CleanerZ" <${senderEmail}>`,
        replyTo: `"TheDeep CleanerZ Support" <${senderEmail}>`,
        to: customerEmail,
        subject: `Booking Confirmed & Invoice ${bookingRef} - TheDeep CleanerZ`,
        html: customerHtml,
      });
      console.log(
        `[Mailer] Booking confirmation & Tax Invoice email sent to customer: ${customerEmail} (MessageId: ${customerMailInfo.messageId})`,
      );
    } catch (err) {
      console.error(
        `[Mailer] Failed to send email to customer (${customerEmail}): ${err.message}`,
      );
    }
  } else {
    console.warn(
      `[Mailer] Customer email is missing or placeholder (${customerEmail || "none"}). Skipping customer email.`,
    );
  }

  // 2. Send Realtime Notification to Admin Mailbox
  try {
    const adminMailInfo = await transporter.sendMail({
      from: `"TheDeep CleanerZ Alerts" <${senderEmail}>`,
      to: adminEmail,
      subject: `🔔 [NEW BOOKING] ${bookingRef} - ${customer.name || "Customer"} (₹${totalAmount})`,
      html: adminHtml,
    });
    console.log(`[Mailer] Admin booking alert email sent successfully to: ${adminEmail} (MessageId: ${adminMailInfo.messageId})`);
  } catch (err) {
    console.error(
      `[Mailer] Failed to send alert email to admin (${adminEmail}): ${err.message}`,
    );
  }
}

/**
 * Sends a 6-digit verification code (OTP) for admin login.
 * @param {string} email The recipient admin email address.
 * @param {string} otp The 6-digit OTP code.
 */
async function sendAdminOtpEmail(email, otp) {
  const otpHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Admin Verification Code - TheDeep CleanerZ</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #001713; color: #fdfcf7; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #001713; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="500" border="0" cellspacing="0" cellpadding="0" style="background-color: #00221c; border: 1px solid #cb9f5a30; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #002a22; padding: 30px; text-align: center; border-bottom: 1px solid #cb9f5a20;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #fdfcf7; letter-spacing: 1px;">TheDeep CleanerZ</h1>
                  <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #cb9f5a; letter-spacing: 3px; margin-top: 6px;">Secure Login Access</span>
                </td>
              </tr>
              
              <!-- Body Content -->
              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <h2 style="margin-top: 0; font-size: 18px; color: #cb9f5a; font-weight: 700;">Admin Verification Code</h2>
                  <p style="font-size: 13px; line-height: 1.6; color: #fdfcf7cd; margin-bottom: 30px;">
                    Please enter the following 6-digit one-time password (OTP) code in your browser login interface to authenticate access to the admin area.
                  </p>
                  
                  <!-- OTP Code Display Card -->
                  <div style="display: inline-block; background-color: #001712; border: 1px solid #cb9f5a30; border-radius: 16px; padding: 18px 40px; margin-bottom: 30px;">
                    <span style="font-size: 32px; font-weight: 850; letter-spacing: 6px; color: #cb9f5a; font-family: monospace;">${otp}</span>
                  </div>
                  
                  <p style="font-size: 11px; color: #fdfcf760; margin: 0;">
                    This code is valid for exactly 5 minutes. If you did not request this login attempt, please secure your credentials immediately.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #001712; padding: 25px; text-align: center; border-top: 1px solid #cb9f5a15; font-size: 10px; color: #fdfcf760;">
                  <p style="margin: 0; font-weight: bold; text-transform: uppercase; color: #cb9f5a;">&copy; TheDeep CleanerZ. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const transporter = getTransporter();
    const senderEmail = process.env.EMAIL_USER || "thedeepcleanerz.info@gmail.com";
    const info = await transporter.sendMail({
      from: `"TheDeep CleanerZ Security" <${senderEmail}>`,
      to: email,
      subject: `Admin Verification Code: ${otp} - TheDeep CleanerZ`,
      html: otpHtml,
    });
    console.log(`[Mailer] OTP verification email sent successfully to admin: ${email} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Mailer] Failed to send admin OTP email to ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a 6-digit verification code (OTP) for mobile confirmation during checkout.
 * @param {string} email The customer email address.
 * @param {string} otp The 6-digit OTP code.
 * @param {string} phone The customer mobile number.
 */
async function sendMobileOtpEmail(email, otp, phone) {
  const otpHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Mobile Verification Code - TheDeep CleanerZ</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #001713; color: #fdfcf7; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #001713; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="500" border="0" cellspacing="0" cellpadding="0" style="background-color: #00221c; border: 1px solid #cb9f5a30; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #002a22; padding: 30px; text-align: center; border-bottom: 1px solid #cb9f5a20;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #fdfcf7; letter-spacing: 1px;">TheDeep CleanerZ</h1>
                  <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #cb9f5a; letter-spacing: 3px; margin-top: 6px;">Mobile Verification</span>
                </td>
              </tr>
              
              <!-- Body Content -->
              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <h2 style="margin-top: 0; font-size: 18px; color: #cb9f5a; font-weight: 700;">Verify Your Mobile Number</h2>
                  <p style="font-size: 13px; line-height: 1.6; color: #fdfcf7cd; margin-bottom: 30px;">
                    Please enter the following 6-digit one-time password (OTP) code in your browser booking window to verify the mobile number: <strong>+91 ${phone}</strong>.
                  </p>
                  
                  <!-- OTP Code Display Card -->
                  <div style="display: inline-block; background-color: #001712; border: 1px solid #cb9f5a30; border-radius: 16px; padding: 18px 40px; margin-bottom: 30px;">
                    <span style="font-size: 32px; font-weight: 850; letter-spacing: 6px; color: #cb9f5a; font-family: monospace;">${otp}</span>
                  </div>
                  
                  <p style="font-size: 11px; color: #fdfcf760; margin: 0;">
                    If you did not request this booking verification, please ignore this email.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #001712; padding: 25px; text-align: center; border-top: 1px solid #cb9f5a15; font-size: 10px; color: #fdfcf760;">
                  <p style="margin: 0; font-weight: bold; text-transform: uppercase; color: #cb9f5a;">&copy; TheDeep CleanerZ. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const transporter = getTransporter();
    const senderEmail = process.env.EMAIL_USER || "thedeepcleanerz.info@gmail.com";
    const info = await transporter.sendMail({
      from: `"TheDeep CleanerZ Security" <${senderEmail}>`,
      to: email,
      subject: `Mobile Verification Code: ${otp} - TheDeep CleanerZ`,
      html: otpHtml,
    });
    console.log(`[Mailer] Mobile OTP verification email sent successfully to: ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Mailer] Failed to send mobile OTP email to ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a 6-digit verification code (OTP) for password recovery.
 * @param {string} email The recipient email address.
 * @param {string} otp The 6-digit OTP code.
 */
async function sendForgotPasswordOtpEmail(email, otp) {
  const otpHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Password OTP - TheDeep CleanerZ</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #001713; color: #fdfcf7; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #001713; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="500" border="0" cellspacing="0" cellpadding="0" style="background-color: #00221c; border: 1px solid #cb9f5a30; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #002a22; padding: 30px; text-align: center; border-bottom: 1px solid #cb9f5a20;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #fdfcf7; letter-spacing: 1px;">TheDeep CleanerZ</h1>
                  <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #cb9f5a; letter-spacing: 3px; margin-top: 6px;">Password Recovery</span>
                </td>
              </tr>
              
              <!-- Body Content -->
              <tr>
                <td style="padding: 40px 30px; text-align: center;">
                  <h2 style="margin-top: 0; font-size: 18px; color: #cb9f5a; font-weight: 700;">Reset Your Password</h2>
                  <p style="font-size: 13px; line-height: 1.6; color: #fdfcf7cd; margin-bottom: 30px;">
                    Please enter the following 6-digit OTP code to verify your identity and set a new password.
                  </p>
                  
                  <!-- OTP Code Display Card -->
                  <div style="display: inline-block; background-color: #001712; border: 1px solid #cb9f5a30; border-radius: 16px; padding: 18px 40px; margin-bottom: 30px;">
                    <span style="font-size: 32px; font-weight: 850; letter-spacing: 6px; color: #cb9f5a; font-family: monospace;">${otp}</span>
                  </div>
                  
                  <p style="font-size: 11px; color: #fdfcf760; margin: 0;">
                    This code is valid for exactly 10 minutes. If you did not request a password reset, please ignore this email.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #001712; padding: 25px; text-align: center; border-top: 1px solid #cb9f5a15; font-size: 10px; color: #fdfcf760;">
                  <p style="margin: 0; font-weight: bold; text-transform: uppercase; color: #cb9f5a;">&copy; TheDeep CleanerZ. All rights reserved.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const transporter = getTransporter();
    const senderEmail = process.env.EMAIL_USER || "thedeepcleanerz.info@gmail.com";
    const info = await transporter.sendMail({
      from: `"TheDeep CleanerZ Security" <${senderEmail}>`,
      to: email,
      subject: `Password Reset Verification Code: ${otp} - TheDeep CleanerZ`,
      html: otpHtml,
    });
    console.log(`[Mailer] Password reset OTP verification email sent successfully to: ${email}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[Mailer] Failed to send password reset OTP to ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendBookingEmails,
  sendAdminOtpEmail,
  sendMobileOtpEmail,
  sendForgotPasswordOtpEmail,
};

