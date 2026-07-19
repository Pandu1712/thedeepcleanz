const nodemailer = require("nodemailer");

// Create Gmail transport using app password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "admin@thedeepcleanerz.com",
    pass: process.env.EMAIL_PASS || "oare nefw mkpa pwbj",
  },
});

/**
 * Sends HTML confirmation emails to the customer and the admin.
 * @param {object} booking The created booking record.
 */
async function sendBookingEmails(booking) {
  const customer =
    typeof booking.customer === "string"
      ? JSON.parse(booking.customer)
      : booking.customer;
  const schedule =
    typeof booking.schedule === "string"
      ? JSON.parse(booking.schedule)
      : booking.schedule;
  const items =
    typeof booking.items === "string"
      ? JSON.parse(booking.items)
      : booking.items;

  const customerEmail = customer.email;
  const adminEmail =
    process.env.ADMIN_NOTIFICATION_EMAIL || "admin@thedeepcleanerz.com";

  if (!customerEmail) {
    console.warn(
      `[Mailer] Booking #${booking.id} placed without a customer email. Skipping customer email.`,
    );
  }

  // Calculate prices
  const isRazorpay =
    booking.paymentStatus && !booking.paymentStatus.includes("COD");
  const paidAmount = isRazorpay ? booking.total : 0;
  const isPaid =
    booking.paymentStatus &&
    (booking.paymentStatus.includes("Paid") ||
      booking.paymentStatus.includes("Success"));
  const isFullyPaid =
    booking.paymentStatus && booking.paymentStatus.includes("Paid In Full");

  const depositPaid = isFullyPaid
    ? booking.total
    : isPaid
      ? Math.round(booking.total * 0.25)
      : 0;
  const balanceDue = booking.total - depositPaid;

  // Build items rows
  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #cb9f5a20; color: #fdfcf7;">${item.title}</td>
      <td style="padding: 12px; border-bottom: 1px solid #cb9f5a20; color: #fdfcf7; text-align: center;">x${item.qty}</td>
      <td style="padding: 12px; border-bottom: 1px solid #cb9f5a20; color: #cb9f5a; text-align: right; font-weight: bold;">₹${item.price * item.qty}</td>
    </tr>
  `,
    )
    .join("");

  // Customer Email HTML
  const customerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Booking Confirmation - TheDeep CleanerZ</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #001713; color: #fdfcf7; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #001713; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #00221c; border: 1px solid #cb9f5a30; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #002a22; padding: 30px; text-align: center; border-bottom: 1px solid #cb9f5a20;">
                  <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #fdfcf7; letter-spacing: 1px;">TheDeep CleanerZ</h1>
                  <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #cb9f5a; letter-spacing: 3px; margin-top: 6px;">Pristine Luxury Deep Cleaning</span>
                </td>
              </tr>
              
              <!-- Body Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin-top: 0; font-size: 20px; color: #cb9f5a; font-weight: 700;">Booking Confirmed!</h2>
                  <p style="font-size: 14px; line-height: 1.6; color: #fdfcf7cd; margin-bottom: 30px;">
                    Dear ${customer.name}, thank you for choosing TheDeep CleanerZ. Your booking request has been successfully registered. Our certified cleaning professional will arrive on your scheduled date.
                  </p>
                  
                  <!-- Booking Metadata Grid -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #001c17; border: 1px solid #cb9f5a15; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                    <tr>
                      <td width="50%" style="padding-bottom: 15px;">
                        <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Booking ID</span>
                        <strong style="font-size: 14px; color: #fdfcf7; font-family: monospace;">#${booking.id.toUpperCase()}</strong>
                      </td>
                      <td width="50%" style="padding-bottom: 15px;">
                        <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Status</span>
                        <strong style="font-size: 14px; color: #fdfcf7;">Confirmed (Pending Assign)</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Date</span>
                        <strong style="font-size: 14px; color: #fdfcf7;">${schedule.date}</strong>
                      </td>
                      <td>
                        <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Time Slot</span>
                        <strong style="font-size: 14px; color: #fdfcf7;">${schedule.time}</strong>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Service Summary Table -->
                  <h3 style="font-size: 14px; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #cb9f5a15; padding-bottom: 6px;">Services Checklist</h3>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                    <thead>
                      <tr style="background-color: #001713;">
                        <th align="left" style="padding: 10px 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #cb9f5a;">Service</th>
                        <th align="center" style="padding: 10px 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #cb9f5a;">Qty</th>
                        <th align="right" style="padding: 10px 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #cb9f5a;">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                  
                  <!-- Pricing calculations -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #cb9f5a20; padding-top: 15px; font-size: 13px;">
                    ${
                      booking.discount > 0
                        ? `
                    <tr>
                      <td style="color: #fdfcf780; padding-bottom: 8px;">Discount Coupon Applied:</td>
                      <td align="right" style="color: #f77171; padding-bottom: 8px;">-₹${booking.discount}</td>
                    </tr>
                    `
                        : ""
                    }
                    <tr>
                      <td style="color: #fdfcf780; padding-bottom: 8px;">Total Service Value:</td>
                      <td align="right" style="color: #fdfcf7; font-weight: bold; padding-bottom: 8px;">₹${booking.total}</td>
                    </tr>
                    <tr>
                      <td style="color: #fdfcf780; padding-bottom: 8px;">Advance Deposit Paid:</td>
                      <td align="right" style="color: #10b981; font-weight: bold; padding-bottom: 8px;">₹${depositPaid}</td>
                    </tr>
                    <tr style="font-size: 15px; font-weight: bold;">
                      <td style="color: #cb9f5a; padding-top: 8px; border-top: 1px solid #cb9f5a15;">Balance to Collect (COD):</td>
                      <td align="right" style="color: #cb9f5a; padding-top: 8px; border-top: 1px solid #cb9f5a15;">₹${balanceDue}</td>
                    </tr>
                  </table>
                  
                  <!-- Customer Details -->
                  <h3 style="font-size: 14px; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px; margin-top: 40px; margin-bottom: 12px; border-bottom: 1px solid #cb9f5a15; padding-bottom: 6px;">Service Location Details</h3>
                  <p style="font-size: 13px; line-height: 1.5; color: #fdfcf7bb; margin: 0;">
                    <strong>Address:</strong> ${customer.address}<br>
                    ${customer.landmark ? `<strong>Landmark:</strong> ${customer.landmark}<br>` : ""}
                    <strong>City & Pincode:</strong> ${customer.city || "Bengaluru"} - ${customer.pincode}<br>
                    <strong>Contact Phone:</strong> +91 ${customer.phone}
                  </p>
                  
                  ${
                    booking.notes
                      ? `
                  <div style="margin-top: 20px; background-color: #cb9f5a10; border-left: 3px solid #cb9f5a; padding: 15px; border-radius: 8px; font-size: 12px; font-style: italic; color: #fdfcf7aa;">
                    <strong>Your Notes:</strong> "${booking.notes}"
                  </div>
                  `
                      : ""
                  }
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #001712; padding: 30px; text-align: center; border-top: 1px solid #cb9f5a15; font-size: 11px; color: #fdfcf760;">
                  <p style="margin: 0 0 10px 0;">This is an automated confirmation email. Please do not reply directly to this message.</p>
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

  // Admin Notification Email HTML
  const adminHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Booking Placed - TheDeep CleanerZ</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #001713; color: #fdfcf7; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #001713; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #00221c; border: 1px solid #cb9f5a30; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
              
              <!-- Header -->
              <tr>
                <td style="background-color: #002a22; padding: 30px; text-align: center; border-bottom: 1px solid #cb9f5a20;">
                  <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #fdfcf7; letter-spacing: 1px;">TheDeep CleanerZ</h1>
                  <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #cb9f5a; letter-spacing: 3px; margin-top: 6px;">New Order Alert</span>
                </td>
              </tr>
              
              <!-- Body Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin-top: 0; font-size: 20px; color: #cb9f5a; font-weight: 700;">New Appointment Placed</h2>
                  <p style="font-size: 14px; line-height: 1.6; color: #fdfcf7cd; margin-bottom: 30px;">
                    A new deep cleaning service appointment has been booked. Please log in to the administrator portal to assign a technician.
                  </p>
                  
                  <!-- Booking details block -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #001c17; border: 1px solid #cb9f5a15; border-radius: 16px; padding: 20px; margin-bottom: 30px;">
                    <tr>
                      <td width="50%" style="padding-bottom: 15px;">
                        <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Booking ID</span>
                        <strong style="font-size: 14px; color: #fdfcf7; font-family: monospace;">#${booking.id.toUpperCase()}</strong>
                      </td>
                      <td width="50%" style="padding-bottom: 15px;">
                        <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Total Value</span>
                        <strong style="font-size: 14px; color: #fdfcf7;">₹${booking.total}</strong>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Scheduled Date</span>
                        <strong style="font-size: 14px; color: #fdfcf7;">${schedule.date}</strong>
                      </td>
                      <td>
                        <span style="display: block; font-size: 9px; font-weight: bold; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px;">Scheduled Time</span>
                        <strong style="font-size: 14px; color: #fdfcf7;">${schedule.time}</strong>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Service Summary Table -->
                  <h3 style="font-size: 14px; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px; margin-bottom: 12px; border-bottom: 1px solid #cb9f5a15; padding-bottom: 6px;">Services Checklist</h3>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                    <thead>
                      <tr style="background-color: #001713;">
                        <th align="left" style="padding: 10px 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #cb9f5a;">Service</th>
                        <th align="center" style="padding: 10px 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #cb9f5a;">Qty</th>
                        <th align="right" style="padding: 10px 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; color: #cb9f5a;">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                  
                  <!-- Financial details -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-top: 1px solid #cb9f5a20; padding-top: 15px; font-size: 13px;">
                    <tr>
                      <td style="color: #fdfcf780; padding-bottom: 8px;">Advance Deposit Collected:</td>
                      <td align="right" style="color: #10b981; font-weight: bold; padding-bottom: 8px;">₹${depositPaid}</td>
                    </tr>
                    <tr style="font-size: 15px; font-weight: bold;">
                      <td style="color: #cb9f5a; padding-top: 8px; border-top: 1px solid #cb9f5a15;">COD Balance to Collect:</td>
                      <td align="right" style="color: #cb9f5a; padding-top: 8px; border-top: 1px solid #cb9f5a15;">₹${balanceDue}</td>
                    </tr>
                  </table>
                  
                  <!-- Customer Details -->
                  <h3 style="font-size: 14px; text-transform: uppercase; color: #cb9f5a; letter-spacing: 1px; margin-top: 40px; margin-bottom: 12px; border-bottom: 1px solid #cb9f5a15; padding-bottom: 6px;">Customer Information</h3>
                  <p style="font-size: 13px; line-height: 1.5; color: #fdfcf7bb; margin: 0;">
                    <strong>Name:</strong> ${customer.name}<br>
                    <strong>Email:</strong> ${customerEmail || "No Email Provided"}<br>
                    <strong>Phone:</strong> +91 ${customer.phone}<br>
                    <strong>Address:</strong> ${customer.address}<br>
                    ${customer.landmark ? `<strong>Landmark:</strong> ${customer.landmark}<br>` : ""}
                    <strong>City & Pincode:</strong> ${customer.city || "Bengaluru"} - ${customer.pincode}
                  </p>
                  
                  ${
                    booking.notes
                      ? `
                  <div style="margin-top: 20px; background-color: #cb9f5a10; border-left: 3px solid #cb9f5a; padding: 15px; border-radius: 8px; font-size: 12px; font-style: italic; color: #fdfcf7aa;">
                    <strong>Customer Notes:</strong> "${booking.notes}"
                  </div>
                  `
                      : ""
                  }
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #001712; padding: 30px; text-align: center; border-top: 1px solid #cb9f5a15; font-size: 11px; color: #cb9f5a;">
                  <a href="http://localhost:4000/admin" style="display: inline-block; background-color: #cb9f5a; color: #00221c; text-decoration: none; padding: 10px 24px; border-radius: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Access Admin Dashboard</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  // Send Email to Customer
  if (customerEmail) {
    try {
      await transporter.sendMail({
        from: `"TheDeep CleanerZ" <${transporter.options.auth.user}>`,
        to: customerEmail,
        subject: `Your Booking is Confirmed! #${booking.id.toUpperCase()}`,
        html: customerHtml,
      });
      console.log(
        `[Mailer] Booking confirmation email sent to customer: ${customerEmail}`,
      );
    } catch (err) {
      console.error(
        `[Mailer] Failed to send email to customer: ${err.message}`,
      );
    }
  }

  // Send Email to Admin
  try {
    await transporter.sendMail({
      from: `"TheDeep CleanerZ Alerts" <${transporter.options.auth.user}>`,
      to: adminEmail,
      subject: `[New Booking] #${booking.id.toUpperCase()} - ${customer.name}`,
      html: adminHtml,
    });
    console.log(`[Mailer] Admin booking alert email sent to: ${adminEmail}`);
  } catch (err) {
    console.error(
      `[Mailer] Failed to send alert email to admin: ${err.message}`,
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

  await transporter.sendMail({
    from: `"TheDeep CleanerZ Security" <${transporter.options.auth.user}>`,
    to: email,
    subject: `Verification Code: ${otp}`,
    html: otpHtml,
  });
  console.log(`[Mailer] OTP verification email sent successfully to admin: ${email}`);
}

module.exports = {
  sendBookingEmails,
  sendAdminOtpEmail,
};
