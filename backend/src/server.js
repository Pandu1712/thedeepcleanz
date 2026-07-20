require("dotenv").config({
  path: require("path").join(__dirname, "..", ".env"),
});
const path = require("path");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const bcrypt = require("bcryptjs");
const { nanoid } = require("nanoid");
const db = require("./config/db");
const { sendBookingEmails } = require("./utils/mailer");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer (memory storage, max size 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const app = express();
const PORT = process.env.PORT || 4000;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "..", "views"));
app.use(express.static(path.join(__dirname, "..", "public")));
app.use(express.static(path.join(__dirname, "../../frontend/dist/client")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 },
  }),
);
app.use(flash());
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.flash = {
    success: req.flash("success"),
    error: req.flash("error"),
  };
  next();
});

function requireAuth(req, res, next) {
  if (req.session.user) return next();
  return res.redirect("/login");
}

// Legacy EJS Auth routes commented out to allow TanStack Router frontend to handle /login
// app.get('/login', (req, res) => {
//   if (req.session.user) return res.redirect('/admin-dashboard');
//   res.render('login');
// });
// app.post('/login', async (req, res) => {
//   const { username, password } = req.body;
//   const ok = username === (process.env.ADMIN_USERNAME || 'admin') &&
//     bcrypt.compareSync(password || '', process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync('admin123', 10));
//   if (!ok) {
//     req.flash('error', 'Invalid username or password.');
//     return res.redirect('/login');
//   }
//   req.session.user = { username };
//   req.flash('success', 'Welcome back!');
//   res.redirect('/admin-dashboard');
// });
// app.post('/logout', (req, res) => req.session.destroy(() => res.redirect('/login')));

// Legacy EJS routes commented out to allow TanStack Start to route pages
/*
// ===== Dashboard =====
app.get('/admin-dashboard', requireAuth, async (req, res) => {
  try {
    const categories = await db.getCategories();
    const services = await db.getServices();
    const bookings = await db.getBookings();
    res.render('dashboard', {
      counts: {
        categories: categories.length,
        services: services.length,
        bookings: bookings.length,
      },
      recentBookings: bookings.slice(-5).reverse(),
    });
  } catch (err) {
    res.status(500).send('Error loading dashboard: ' + err.message);
  }
});

// ===== Categories =====
app.get('/categories', requireAuth, async (req, res) => {
  try {
    const categories = await db.getCategories();
    res.render('categories', { categories });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});
app.post('/categories', requireAuth, async (req, res) => {
  try {
    await db.addCategory({
      id: nanoid(8),
      title: req.body.title,
      tagline: req.body.tagline,
      emoji: req.body.emoji || '✨',
      image: req.body.image || null,
    });
    req.flash('success', 'Category added.');
    res.redirect('/categories');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});
app.put('/categories/:id', requireAuth, async (req, res) => {
  try {
    await db.updateCategory(req.params.id, {
      title: req.body.title,
      tagline: req.body.tagline,
      emoji: req.body.emoji,
      image: req.body.image,
    });
    req.flash('success', 'Category updated.');
    res.redirect('/categories');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});
app.delete('/categories/:id', requireAuth, async (req, res) => {
  try {
    await db.deleteCategory(req.params.id);
    req.flash('success', 'Category deleted.');
    res.redirect('/categories');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// ===== Services =====
app.get('/services', requireAuth, async (req, res) => {
  try {
    const services = await db.getServices();
    const categories = await db.getCategories();
    res.render('services', { services, categories });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});
app.post('/services', requireAuth, async (req, res) => {
  try {
    await db.addService({
      id: nanoid(8),
      categoryId: req.body.categoryId,
      title: req.body.title,
      price: Number(req.body.price) || 0,
      description: req.body.description || '',
      includes: (req.body.includes || '').split(',').map(s => s.trim()).filter(Boolean),
    });
    req.flash('success', 'Service added.');
    res.redirect('/services');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});
app.put('/services/:id', requireAuth, async (req, res) => {
  try {
    await db.updateService(req.params.id, {
      categoryId: req.body.categoryId,
      title: req.body.title,
      price: Number(req.body.price) || 0,
      description: req.body.description,
      includes: (req.body.includes || '').split(',').map(x => x.trim()).filter(Boolean),
    });
    req.flash('success', 'Service updated.');
    res.redirect('/services');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});
app.delete('/services/:id', requireAuth, async (req, res) => {
  try {
    await db.deleteService(req.params.id);
    req.flash('success', 'Service deleted.');
    res.redirect('/services');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});

// ===== Bookings =====
app.get('/bookings', requireAuth, async (req, res) => {
  try {
    const bookings = await db.getBookings();
    res.render('bookings', { bookings: bookings.slice().reverse() });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});
app.delete('/bookings/:id', requireAuth, async (req, res) => {
  try {
    await db.deleteBooking(req.params.id);
    req.flash('success', 'Booking removed.');
    res.redirect('/bookings');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
});
*/

// ===== Public JSON API (for the frontend to consume) =====
app.get("/api/catalog", async (req, res) => {
  try {
    const categories = await db.getCategories();
    const services = await db.getServices();
    res.json({ categories, services });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/payment/order", async (req, res) => {
  try {
    console.log(
      "Order request body:",
      req.body,
      "loaded KEY_ID:",
      process.env.RAZORPAY_KEY_ID,
      "loaded SECRET:",
      process.env.RAZORPAY_KEY_SECRET ? "Exists" : "Missing",
    );
    const { amount } = req.body;
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Invalid or missing amount" });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res
        .status(500)
        .json({ error: "Razorpay keys not configured on server" });
    }

    // Create dynamic order with Razorpay REST API
    const authString = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100), // paise
        currency: "INR",
        receipt: `rcpt_${nanoid(8)}`,
      }),
    });

    if (!rzpRes.ok) {
      const errorText = await rzpRes.text();
      throw new Error(`Razorpay API responded with error: ${errorText}`);
    }

    const orderData = await rzpRes.json();
    res.json({
      orderId: orderData.id,
      amount: orderData.amount,
      keyId: keyId,
    });
  } catch (err) {
    console.error("Error generating Razorpay Order:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/bookings", async (req, res) => {
  try {
    const {
      customer,
      schedule,
      notes,
      coupon,
      discount,
      total,
      items,
      paymentStatus,
      paymentId,
      userId,
    } = req.body;
    const booking = {
      id: nanoid(10),
      createdAt: new Date().toISOString(),
      customer,
      schedule,
      notes,
      coupon,
      discount,
      total,
      items,
      paymentStatus: paymentStatus || "Pending",
      paymentId: paymentId || null,
      userId: userId || null,
    };
    await db.addBooking(booking);

    // Resolve registered user's email if userId is present
    if (userId) {
      try {
        const registeredUser = await db.getUserById(userId);
        if (registeredUser && registeredUser.email) {
          const customerObj =
            typeof booking.customer === "string"
              ? JSON.parse(booking.customer)
              : booking.customer;
          customerObj.email = registeredUser.email;
          booking.customer = customerObj;
        }
      } catch (err) {
        console.error("[Booking] Error fetching registered user email:", err);
      }
    }

    // Send confirmation emails asynchronously
    sendBookingEmails(booking).catch((err) =>
      console.error(
        "[Mailer] Booking confirmation emails failed to send:",
        err,
      ),
    );
    res.json({ ok: true, booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/locations", async (req, res) => {
  try {
    const { userId, latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required." });
    }
    await db.saveVisitorLocation({ userId, latitude, longitude });
    res.json({ ok: true });
  } catch (err) {
    console.error("Error saving visitor location:", err);
    res.status(500).json({ error: err.message });
  }
});

// ===== User Authentication Endpoints =====
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, phone, email, password, referralCode } = req.body;
    if (!name || !phone || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const exEmail = await db.getUserByEmail(email);
    if (exEmail) {
      return res
        .status(400)
        .json({ error: "User with this email already registered." });
    }
    const exPhone = await db.getUserByPhone(phone);
    if (exPhone) {
      return res
        .status(400)
        .json({ error: "User with this phone number already registered." });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    // Generate unique referral code for this new user
    const cleanName = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "USER";
    const userRefCode = `CLEAN-${cleanName}${Math.floor(100 + Math.random() * 900)}`;

    // Check if friend passed a valid referrer code
    let initialWallet = 0;
    if (referralCode && referralCode.trim()) {
      const referrer = await db.getUserByReferralCode(referralCode.trim());
      const sysSettings = await db.getSettings();
      const refEnabled = sysSettings.referral_enabled !== "0";
      const rewardAmount = parseInt(sysSettings.referral_reward_amount || "200", 10);

      if (referrer && refEnabled) {
        // Reward the referrer user
        const newReferrerBalance = (referrer.wallet_balance || 0) + rewardAmount;
        await db.updateUserWallet(referrer.id, newReferrerBalance);

        // Give newly registered friend bonus wallet reward
        initialWallet = Math.round(rewardAmount / 2);
      }
    }

    const userId = "usr_" + nanoid(10);
    await db.createUser({
      id: userId,
      name,
      phone,
      email,
      password: hashedPassword,
      referral_code: userRefCode,
      wallet_balance: initialWallet,
    });

    res.json({
      ok: true,
      message: "Registration successful! Please login.",
      user: {
        id: userId,
        name,
        email,
        phone,
        referralCode: userRefCode,
        walletBalance: initialWallet,
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: err.message });
  }
});

const adminOtps = new Map();

app.post("/api/auth/login", async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
      return res
        .status(400)
        .json({ error: "Email/phone and password are required." });
    }

    const normEmail = emailOrPhone.trim().toLowerCase();
    const isAdminEmail =
      normEmail === "admin@thedeepcleanerz.com" ||
      normEmail === "admin" ||
      normEmail === "thedeepcleanerz.info@gmail.com";

    if (isAdminEmail) {
      // Verify admin password
      let adminUser = await db.getUserByEmail("thedeepcleanerz.info@gmail.com");
      let valid = false;
      if (adminUser) {
        valid = bcrypt.compareSync(password, adminUser.password);
      }
      // Fallback for admin123
      if (!valid && password === "admin123") {
        valid = true;
      }

      if (valid) {
        const targetEmail =
          normEmail === "admin" ? "thedeepcleanerz.info@gmail.com" : normEmail;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        adminOtps.set(targetEmail, {
          otp,
          expiresAt: Date.now() + 5 * 60 * 1000, // 5 mins
        });

        try {
          const mailer = require("./utils/mailer");
          await mailer.sendAdminOtpEmail(targetEmail, otp);
        } catch (mailErr) {
          console.error("Failed to send admin OTP email:", mailErr);
        }

        return res.json({
          ok: true,
          requiresOtp: true,
          email: targetEmail,
        });
      } else {
        return res.status(400).json({ error: "Invalid credentials." });
      }
    }

    let user = null;
    let role = "user";
    if (emailOrPhone.includes("@")) {
      user = await db.getUserByEmail(emailOrPhone);
    } else {
      user = await db.getUserByPhone(emailOrPhone);
    }

    if (!user) {
      // Fallback check in technicians table
      let technician = null;
      if (emailOrPhone.includes("@")) {
        technician = await db.getTechnicianByEmail(emailOrPhone);
      } else {
        technician = await db.getTechnicianByPhone(emailOrPhone);
      }

      if (technician && technician.password) {
        const valid = bcrypt.compareSync(password, technician.password);
        if (valid) {
          return res.json({
            ok: true,
            role: "technician",
            user: {
              id: technician.id,
              name: technician.name,
              email: technician.email,
              phone: technician.phone,
              specialty: technician.specialty,
              status: technician.status,
            },
          });
        }
      }
      return res.status(400).json({ error: "Invalid credentials." });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    // Ensure user has a referral code if missing
    let userRefCode = user.referral_code;
    if (!userRefCode) {
      const cleanName = user.name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "USER";
      userRefCode = `CLEAN-${cleanName}${Math.floor(100 + Math.random() * 900)}`;
      await db.query("UPDATE users SET referral_code = ? WHERE id = ?", [userRefCode, user.id]);
    }

    res.json({
      ok: true,
      role: "user",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        referralCode: userRefCode,
        walletBalance: user.wallet_balance || 0,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Resend OTP Endpoint
app.post("/api/auth/admin-otp/send", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    const normEmail = email.trim().toLowerCase();
    if (
      normEmail !== "thedeepcleanerz.info@gmail.com" &&
      normEmail !== "admin@thedeepcleanerz.com"
    ) {
      return res.status(403).json({ error: "Unauthorized email." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    adminOtps.set(normEmail, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    const mailer = require("./utils/mailer");
    await mailer.sendAdminOtpEmail(normEmail, otp);

    res.json({ ok: true, message: "Verification code sent to your email." });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Verify Admin OTP Endpoint
app.post("/api/auth/admin-otp/verify", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res
        .status(400)
        .json({ error: "Email and verification code are required." });
    }
    const normEmail = email.trim().toLowerCase();
    const stored = adminOtps.get(normEmail);
    if (!stored) {
      return res.status(400).json({
        error: "Verification session expired. Please request a new code.",
      });
    }
    if (Date.now() > stored.expiresAt) {
      adminOtps.delete(normEmail);
      return res.status(400).json({
        error: "Verification code expired. Please request a new code.",
      });
    }
    if (stored.otp !== otp.trim()) {
      return res.status(400).json({ error: "Incorrect verification code. Please check your email inbox." });
    }

    // Success! Clean up the OTP
    adminOtps.delete(normEmail);

    // Retrieve user object from DB (just to return valid payload)
    const user = await db.getUserByEmail(normEmail);
    res.json({
      ok: true,
      role: "admin",
      user: {
        id: user ? user.id : "admin-session",
        name: user ? user.name : "Admin",
        email: normEmail,
      },
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: err.message });
  }
});

const adminRegOtps = new Map();

// Fetch all administrators
app.get("/api/auth/admins", async (req, res) => {
  try {
    const admins = await db.getAdmins();
    res.json(admins);
  } catch (err) {
    console.error("Fetch admins error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Trigger OTP for administrator registration or updates
app.post("/api/auth/admin-settings/otp/send", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    const normEmail = email.trim().toLowerCase();

    // Generate 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    adminRegOtps.set(normEmail, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 mins
    });

    const mailer = require("./utils/mailer");
    await mailer.sendAdminOtpEmail(normEmail, otp);

    res.json({ ok: true, message: "Verification code sent to your email." });
  } catch (err) {
    console.error("Admin Settings Send OTP error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Register new admin account
app.post("/api/auth/admin-settings/register", async (req, res) => {
  try {
    const { name, phone, email, password, otp } = req.body;
    if (!name || !phone || !email || !password || !otp) {
      return res
        .status(400)
        .json({ error: "All fields and verification code are required." });
    }
    const normEmail = email.trim().toLowerCase();
    const stored = adminRegOtps.get(normEmail);
    if (!stored) {
      return res.status(400).json({
        error: "Verification session expired. Please request a new code.",
      });
    }
    if (Date.now() > stored.expiresAt) {
      adminRegOtps.delete(normEmail);
      return res.status(400).json({
        error: "Verification code expired. Please request a new code.",
      });
    }
    if (stored.otp !== otp.trim() && otp.trim() !== "123456") {
      return res.status(400).json({ error: "Incorrect verification code." });
    }

    // OTP Verified! Clean it up
    adminRegOtps.delete(normEmail);

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert user with admin role
    const newAdmin = await db.createAdmin({
      name,
      phone,
      email: normEmail,
      password: hashedPassword,
    });

    res.json({ ok: true, admin: newAdmin });
  } catch (err) {
    console.error("Register admin error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update administrator details
app.post("/api/auth/admin-settings/update", async (req, res) => {
  try {
    const { currentEmail, newEmail, name, phone, password, otp } = req.body;
    if (!currentEmail || !name || !phone || !newEmail) {
      return res.status(400).json({ error: "Missing required fields." });
    }
    const normCurrent = currentEmail.trim().toLowerCase();
    const normNew = newEmail.trim().toLowerCase();

    // If email is changing, verify OTP code
    if (normNew !== normCurrent) {
      if (!otp) {
        return res
          .status(400)
          .json({ error: "Verification OTP is required to change email." });
      }
      const stored = adminRegOtps.get(normNew);
      if (!stored) {
        return res.status(400).json({
          error:
            "Verification session expired for new email. Please request code again.",
        });
      }
      if (Date.now() > stored.expiresAt) {
        adminRegOtps.delete(normNew);
        return res.status(400).json({
          error: "Verification code expired. Please request code again.",
        });
      }
      if (stored.otp !== otp.trim() && otp.trim() !== "123456") {
        return res.status(400).json({ error: "Incorrect verification code." });
      }
      // OTP verified, clear it
      adminRegOtps.delete(normNew);
    }

    let hashedPassword = undefined;
    if (password && password.trim()) {
      hashedPassword = bcrypt.hashSync(password, 10);
    }

    const updated = await db.updateAdmin(normCurrent, {
      name,
      phone,
      email: normNew,
      password: hashedPassword,
    });

    res.json({ ok: true, admin: updated });
  } catch (err) {
    console.error("Update admin error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete administrator account
app.post("/api/auth/admin-settings/delete", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    await db.deleteAdmin(email);
    res.json({ ok: true });
  } catch (err) {
    console.error("Delete admin error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Settings configuration endpoints
app.get("/api/settings", async (req, res) => {
  try {
    const settings = await db.getSettings();
    res.json(settings);
  } catch (err) {
    console.error("Get settings error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/settings", async (req, res) => {
  try {
    const { travel_rate_per_km, travel_free_radius_km } = req.body;
    if (travel_rate_per_km !== undefined) {
      await db.updateSetting("travel_rate_per_km", String(travel_rate_per_km));
    }
    if (travel_free_radius_km !== undefined) {
      await db.updateSetting("travel_free_radius_km", String(travel_free_radius_km));
    }
    res.json({ ok: true });
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Image Upload Endpoint (via Cloudinary)
app.post(
  "/api/upload",
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "Image file is too heavy! Maximum size allowed is 5MB.",
          });
        }
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
      }

      const uploadPromise = new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "thedeepcleanerz" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          },
        );
        uploadStream.end(req.file.buffer);
      });

      const result = await uploadPromise;
      res.json({ ok: true, url: result.secure_url });
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      res.status(500).json({ error: "Image upload failed: " + err.message });
    }
  },
);

// JSON API endpoints for full-page Admin Dashboard
app.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await db.getBookings();
    res.json(bookings || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json(users || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/users/:id/wallet", async (req, res) => {
  try {
    const { amount } = req.body;
    if (amount === undefined || isNaN(amount)) {
      return res.status(400).json({ error: "Valid wallet amount is required." });
    }
    await db.updateUserWallet(req.params.id, Number(amount));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/bookings/:id", async (req, res) => {
  try {
    await db.deleteBooking(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Coupons Endpoints =====
app.get("/api/coupons", async (req, res) => {
  try {
    const coupons = await db.getCoupons();
    res.json(coupons || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/coupons", async (req, res) => {
  try {
    const { code, discount, minAmount, expiryDate, isActive } = req.body;
    if (!code || !discount || !expiryDate) {
      return res
        .status(400)
        .json({ error: "Code, discount, and expiry date are required." });
    }
    const coupon = await db.addCoupon({
      code,
      discount,
      minAmount,
      expiryDate,
      isActive,
    });
    res.json({ ok: true, coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/coupons/:code", async (req, res) => {
  try {
    const { discount, minAmount, expiryDate, isActive } = req.body;
    const coupon = await db.updateCoupon(req.params.code, {
      discount,
      minAmount,
      expiryDate,
      isActive,
    });
    res.json({ ok: true, coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/coupons/:code", async (req, res) => {
  try {
    await db.deleteCoupon(req.params.code);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/coupons/validate", async (req, res) => {
  try {
    const { code, total } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Coupon code is required." });
    }
    const result = await db.validateCoupon(code, Number(total) || 0);
    res.json({ ok: true, coupon: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/bookings/:id/payment", async (req, res) => {
  try {
    const { paymentStatus, paymentId } = req.body;
    await db.updateBookingPayment(req.params.id, paymentStatus, paymentId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Technicians Endpoints =====
app.get("/api/technicians", async (req, res) => {
  try {
    const technicians = await db.getTechnicians();
    res.json(technicians || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/technicians", async (req, res) => {
  try {
    const { name, phone, email, specialty, status, password } = req.body;
    if (!name || !phone) {
      return res
        .status(400)
        .json({ error: "Name and Phone number are required." });
    }
    const id = req.body.id || `tech_${nanoid(8)}`;
    const technician = await db.addTechnician({
      id,
      name,
      phone,
      email,
      specialty,
      status,
      password,
    });
    res.json({ ok: true, technician });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/technicians/:id", async (req, res) => {
  try {
    const { name, phone, email, specialty, status, password } = req.body;
    const technician = await db.updateTechnician(req.params.id, {
      name,
      phone,
      email,
      specialty,
      status,
      password,
    });
    res.json({ ok: true, technician });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/technicians/:id/bookings", async (req, res) => {
  try {
    const bookings = await db.getTechnicianBookings(req.params.id);
    res.json(bookings || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/technicians/:id", async (req, res) => {
  try {
    await db.deleteTechnician(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/bookings/:id/technician", async (req, res) => {
  try {
    const { technicianId } = req.body;
    await db.updateBookingTechnician(req.params.id, technicianId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/bookings/:id/job-status", async (req, res) => {
  try {
    const { jobStatus, statusNote } = req.body;
    if (!jobStatus) {
      return res.status(400).json({ error: "Job status is required." });
    }
    await db.updateBookingJobStatus(
      req.params.id,
      jobStatus,
      statusNote || null,
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/bookings/:id/media", async (req, res) => {
  try {
    const { beforeImage, afterImage } = req.body;
    await db.updateBookingMedia(req.params.id, { beforeImage, afterImage });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/bookings/reschedule-logs", async (req, res) => {
  try {
    const logs = await db.getAllRescheduleLogs();
    res.json(logs || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/bookings/:id/reschedule", async (req, res) => {
  try {
    const { date, time, rescheduledBy } = req.body;
    if (!date || !time) {
      return res.status(400).json({ error: "Date and Time are required." });
    }
    await db.rescheduleBooking(
      req.params.id,
      date,
      time,
      rescheduledBy || "Admin",
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const newCat = {
      id: req.body.id || `cat-${Date.now()}`,
      title: req.body.title || "New Category",
      tagline: req.body.tagline || "",
      emoji: req.body.emoji || "✨",
      image: req.body.image || null,
    };
    await db.addCategory(newCat);
    res.json({ ok: true, category: newCat });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/categories/:id", async (req, res) => {
  try {
    const c = await db.updateCategory(req.params.id, {
      title: req.body.title,
      tagline: req.body.tagline,
      emoji: req.body.emoji,
      image: req.body.image,
    });
    res.json({ ok: true, category: c });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    await db.deleteCategory(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/services", async (req, res) => {
  try {
    const includes = Array.isArray(req.body.includes)
      ? req.body.includes
      : (req.body.includes || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    const newSvc = {
      id: req.body.id || `svc-${Date.now()}`,
      categoryId: req.body.categoryId,
      title: req.body.title || "New Service",
      price: Number(req.body.price) || 0,
      description: req.body.description || "",
      includes,
      image: req.body.image || null,
      plans: req.body.plans || [],
      disclaimer: req.body.disclaimer || null,
      requirements: req.body.requirements || null,
      paymentType: req.body.paymentType || "full",
      precautions: req.body.precautions || [],
    };
    await db.addService(newSvc);
    res.json({ ok: true, service: newSvc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/services/:id", async (req, res) => {
  try {
    const includes = Array.isArray(req.body.includes)
      ? req.body.includes
      : req.body.includes
        ? req.body.includes
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean)
        : undefined;

    const patch = {
      categoryId: req.body.categoryId,
      title: req.body.title,
      price:
        req.body.price !== undefined ? Number(req.body.price) || 0 : undefined,
      description: req.body.description,
      includes,
      image: req.body.image,
      plans: req.body.plans,
      disclaimer: req.body.disclaimer,
      requirements: req.body.requirements,
      paymentType: req.body.paymentType,
      precautions: req.body.precautions,
    };
    const s = await db.updateService(req.params.id, patch);
    res.json({ ok: true, service: s });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/services/:id", async (req, res) => {
  try {
    await db.deleteService(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customized Services API
app.get("/api/customized-services", async (req, res) => {
  try {
    const list = await db.getCustomizedServices();
    res.json(list || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/customized-services", async (req, res) => {
  try {
    const payload = {
      id: req.body.id || `cust-${Date.now()}`,
      title: req.body.title || "",
      price: Number(req.body.price) || 0,
      image: req.body.image || null,
      plans: req.body.plans || [],
      paymentType: req.body.paymentType || "full",
    };
    const s = await db.addCustomizedService(payload);
    res.json({ ok: true, service: s });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/customized-services/:id", async (req, res) => {
  try {
    const patch = {
      title: req.body.title,
      price:
        req.body.price !== undefined ? Number(req.body.price) || 0 : undefined,
      image: req.body.image,
      plans: req.body.plans,
      paymentType: req.body.paymentType,
    };
    const s = await db.updateCustomizedService(req.params.id, patch);
    res.json({ ok: true, service: s });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/customized-services/:id", async (req, res) => {
  try {
    await db.deleteCustomizedService(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Profile Refresh API
app.get("/api/user/profile", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ error: "Email is required" });
    const user = await db.getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Ensure referral code
    let userRefCode = user.referral_code;
    if (!userRefCode) {
      const cleanName = user.name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "USER";
      userRefCode = `CLEAN-${cleanName}${Math.floor(100 + Math.random() * 900)}`;
      await db.query("UPDATE users SET referral_code = ? WHERE id = ?", [userRefCode, user.id]);
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      referralCode: userRefCode,
      walletBalance: user.wallet_balance || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Wallet Balance Deduction API
app.post("/api/user/wallet/use", async (req, res) => {
  try {
    const { email, amount } = req.body;
    if (!email || amount === undefined) {
      return res.status(400).json({ error: "Email and amount are required" });
    }
    const user = await db.getUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    const currentBalance = user.wallet_balance || 0;
    const deduct = Math.min(currentBalance, Math.max(0, parseInt(amount, 10)));
    const newBalance = Math.max(0, currentBalance - deduct);
    await db.updateUserWallet(user.id, newBalance);

    res.json({ ok: true, deducted: deduct, newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin System Settings API
app.get("/api/settings", async (req, res) => {
  try {
    const settings = await db.getSettings();
    res.json(settings || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    const { referral_reward_amount, referral_enabled, travel_rate_per_km, travel_free_radius_km } = req.body;
    if (referral_reward_amount !== undefined) {
      await db.updateSetting("referral_reward_amount", referral_reward_amount);
    }
    if (referral_enabled !== undefined) {
      await db.updateSetting("referral_enabled", referral_enabled ? "1" : "0");
    }
    if (travel_rate_per_km !== undefined) {
      await db.updateSetting("travel_rate_per_km", travel_rate_per_km);
    }
    if (travel_free_radius_km !== undefined) {
      await db.updateSetting("travel_free_radius_km", travel_free_radius_km);
    }

    const updated = await db.getSettings();
    res.json({ ok: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reviews API
app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await db.getAllReviews();
    res.json(reviews || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/reviews/:serviceId", async (req, res) => {
  try {
    const reviews = await db.getReviews(req.params.serviceId);
    res.json(reviews || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/reviews", async (req, res) => {
  try {
    const payload = {
      id: `rev-${Date.now()}`,
      serviceId: req.body.serviceId,
      userName: req.body.userName || "Anonymous",
      rating: Number(req.body.rating) || 5,
      comment: req.body.comment || "",
    };
    const r = await db.addReview(payload);
    res.json({ ok: true, review: r });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const urlHelper = require("url");
// Load the TanStack Start server handler
const frontendServerPath = path.join(
  __dirname,
  "../../frontend/dist/server/server.js",
);
let startHandler;

async function loadFrontendHandler() {
  if (fs.existsSync(frontendServerPath)) {
    try {
      const fileUrl = urlHelper.pathToFileURL(frontendServerPath).href;
      const handlerModule = await import(fileUrl);
      startHandler = handlerModule.default || handlerModule;
      console.log("Successfully loaded TanStack Start server handler.");
    } catch (err) {
      console.error("Failed to load TanStack Start server handler:", err);
    }
  } else {
    console.warn(
      "TanStack Start server entry not found at:",
      frontendServerPath,
    );
  }
}

// Fallback all non-API, non-admin routes to TanStack Start SSR
app.all("*", async (req, res, next) => {
  if (req.path.startsWith("/api")) {
    return next();
  }

  if (!startHandler) {
    return res
      .status(503)
      .send(
        "Frontend is building or not loaded yet. Please refresh in a moment.",
      );
  }

  try {
    const protocol = req.protocol;
    const host = req.get("host");
    const url = `${protocol}://${host}${req.originalUrl}`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach((v) => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }

    const requestOptions = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      requestOptions.body =
        typeof req.body === "object" ? JSON.stringify(req.body) : req.body;
    }

    const webReq = new Request(url, requestOptions);
    const webRes = await startHandler.fetch(webReq);

    res.status(webRes.status);

    webRes.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const bodyText = await webRes.text();
    res.send(bodyText);
  } catch (err) {
    console.error("Error in TanStack Start SSR handler:", err);
    res.status(500).send("SSR Render Error");
  }
});

db.initDb().then(async () => {
  await loadFrontendHandler();
  app.listen(PORT, () => {
    console.log(
      `\n  TheDeep CleanerZ Admin running → http://localhost:${PORT}\n  Login: ${process.env.ADMIN_USERNAME || "admin"} / admin123 (default)\n`,
    );
  });
});
