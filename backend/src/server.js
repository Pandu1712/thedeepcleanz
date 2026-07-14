require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const db = require('./config/db');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer (memory storage, max size 5MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const app = express();
const PORT = process.env.PORT || 4000;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '..', 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '../../frontend/dist/client')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 8 },
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.flash = { success: req.flash('success'), error: req.flash('error') };
  next();
});

function requireAuth(req, res, next) {
  if (req.session.user) return next();
  return res.redirect('/login');
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
app.get('/api/catalog', async (req, res) => {
  try {
    const categories = await db.getCategories();
    const services = await db.getServices();
    res.json({ categories, services });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/api/payment/order', async (req, res) => {
  try {
    console.log('Order request body:', req.body, 'loaded KEY_ID:', process.env.RAZORPAY_KEY_ID, 'loaded SECRET:', process.env.RAZORPAY_KEY_SECRET ? 'Exists' : 'Missing');
    const { amount } = req.body;
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid or missing amount' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Razorpay keys not configured on server' });
    }

    // Create dynamic order with Razorpay REST API
    const authString = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount) * 100), // paise
        currency: 'INR',
        receipt: `rcpt_${nanoid(8)}`
      })
    });

    if (!rzpRes.ok) {
      const errorText = await rzpRes.text();
      throw new Error(`Razorpay API responded with error: ${errorText}`);
    }

    const orderData = await rzpRes.json();
    res.json({
      orderId: orderData.id,
      amount: orderData.amount,
      keyId: keyId
    });
  } catch (err) {
    console.error('Error generating Razorpay Order:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/bookings', async (req, res) => {
  try {
    const { customer, schedule, notes, coupon, discount, total, items, paymentStatus, paymentId, userId } = req.body;
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
      paymentStatus: paymentStatus || 'Pending',
      paymentId: paymentId || null,
      userId: userId || null
    };
    await db.addBooking(booking);
    res.json({ ok: true, booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== User Authentication Endpoints =====
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;
    if (!name || !phone || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const exEmail = await db.getUserByEmail(email);
    if (exEmail) {
      return res.status(400).json({ error: 'User with this email already registered.' });
    }
    const exPhone = await db.getUserByPhone(phone);
    if (exPhone) {
      return res.status(400).json({ error: 'User with this phone number already registered.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const userId = 'usr_' + nanoid(10);
    await db.createUser({ id: userId, name, phone, email, password: hashedPassword });

    res.json({ ok: true, message: 'Registration successful! Please login.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: 'Email/phone and password are required.' });
    }

    let user = null;
    if (emailOrPhone.includes('@')) {
      user = await db.getUserByEmail(emailOrPhone);
    } else {
      user = await db.getUserByPhone(emailOrPhone);
    }

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    res.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Image Upload Endpoint (via Cloudinary)
app.post('/api/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Image file is too heavy! Maximum size allowed is 5MB.' });
      }
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'thedeepcleanerz' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    const result = await uploadPromise;
    res.json({ ok: true, url: result.secure_url });
  } catch (err) {
    console.error('Cloudinary upload failed:', err);
    res.status(500).json({ error: 'Image upload failed: ' + err.message });
  }
});

// JSON API endpoints for full-page Admin Dashboard
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await db.getBookings();
    res.json(bookings || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await db.getUsers();
    res.json(users || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    await db.deleteBooking(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== Coupons Endpoints =====
app.get('/api/coupons', async (req, res) => {
  try {
    const coupons = await db.getCoupons();
    res.json(coupons || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/coupons', async (req, res) => {
  try {
    const { code, discount, minAmount, expiryDate, isActive } = req.body;
    if (!code || !discount || !expiryDate) {
      return res.status(400).json({ error: 'Code, discount, and expiry date are required.' });
    }
    const coupon = await db.addCoupon({ code, discount, minAmount, expiryDate, isActive });
    res.json({ ok: true, coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/coupons/:code', async (req, res) => {
  try {
    const { discount, minAmount, expiryDate, isActive } = req.body;
    const coupon = await db.updateCoupon(req.params.code, { discount, minAmount, expiryDate, isActive });
    res.json({ ok: true, coupon });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/coupons/:code', async (req, res) => {
  try {
    await db.deleteCoupon(req.params.code);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/coupons/validate', async (req, res) => {
  try {
    const { code, total } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required.' });
    }
    const result = await db.validateCoupon(code, Number(total) || 0);
    res.json({ ok: true, coupon: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/bookings/:id/payment', async (req, res) => {
  try {
    const { paymentStatus, paymentId } = req.body;
    await db.updateBookingPayment(req.params.id, paymentStatus, paymentId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const newCat = {
      id: req.body.id || `cat-${Date.now()}`,
      title: req.body.title || 'New Category',
      tagline: req.body.tagline || '',
      emoji: req.body.emoji || '✨',
      image: req.body.image || null,
    };
    await db.addCategory(newCat);
    res.json({ ok: true, category: newCat });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const c = await db.updateCategory(req.params.id, {
      title: req.body.title,
      tagline: req.body.tagline,
      emoji: req.body.emoji,
      image: req.body.image
    });
    res.json({ ok: true, category: c });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await db.deleteCategory(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const includes = Array.isArray(req.body.includes)
      ? req.body.includes
      : (req.body.includes || '').split(',').map(s => s.trim()).filter(Boolean);
    const newSvc = {
      id: req.body.id || `svc-${Date.now()}`,
      categoryId: req.body.categoryId,
      title: req.body.title || 'New Service',
      price: Number(req.body.price) || 0,
      description: req.body.description || '',
      includes,
      image: req.body.image || null,
      plans: req.body.plans || [],
      disclaimer: req.body.disclaimer || null,
      requirements: req.body.requirements || null
    };
    await db.addService(newSvc);
    res.json({ ok: true, service: newSvc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const includes = Array.isArray(req.body.includes)
      ? req.body.includes
      : req.body.includes ? req.body.includes.split(',').map(x => x.trim()).filter(Boolean) : undefined;
    
    const patch = {
      categoryId: req.body.categoryId,
      title: req.body.title,
      price: req.body.price !== undefined ? Number(req.body.price) || 0 : undefined,
      description: req.body.description,
      includes,
      image: req.body.image,
      plans: req.body.plans,
      disclaimer: req.body.disclaimer,
      requirements: req.body.requirements
    };
    const s = await db.updateService(req.params.id, patch);
    res.json({ ok: true, service: s });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    await db.deleteService(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customized Services API
app.get('/api/customized-services', async (req, res) => {
  try {
    const list = await db.getCustomizedServices();
    res.json(list || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customized-services', async (req, res) => {
  try {
    const payload = {
      id: req.body.id || `cust-${Date.now()}`,
      title: req.body.title || '',
      price: Number(req.body.price) || 0,
      image: req.body.image || null,
      plans: req.body.plans || []
    };
    const s = await db.addCustomizedService(payload);
    res.json({ ok: true, service: s });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customized-services/:id', async (req, res) => {
  try {
    const patch = {
      title: req.body.title,
      price: req.body.price !== undefined ? Number(req.body.price) || 0 : undefined,
      image: req.body.image,
      plans: req.body.plans
    };
    const s = await db.updateCustomizedService(req.params.id, patch);
    res.json({ ok: true, service: s });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customized-services/:id', async (req, res) => {
  try {
    await db.deleteCustomizedService(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reviews API
app.get('/api/reviews/:serviceId', async (req, res) => {
  try {
    const reviews = await db.getReviews(req.params.serviceId);
    res.json(reviews || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const payload = {
      id: `rev-${Date.now()}`,
      serviceId: req.body.serviceId,
      userName: req.body.userName || 'Anonymous',
      rating: Number(req.body.rating) || 5,
      comment: req.body.comment || ''
    };
    const r = await db.addReview(payload);
    res.json({ ok: true, review: r });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const urlHelper = require('url');
// Load the TanStack Start server handler
const frontendServerPath = path.join(__dirname, '../../frontend/dist/server/server.js');
let startHandler;

async function loadFrontendHandler() {
  if (fs.existsSync(frontendServerPath)) {
    try {
      const fileUrl = urlHelper.pathToFileURL(frontendServerPath).href;
      const handlerModule = await import(fileUrl);
      startHandler = handlerModule.default || handlerModule;
      console.log('Successfully loaded TanStack Start server handler.');
    } catch (err) {
      console.error('Failed to load TanStack Start server handler:', err);
    }
  } else {
    console.warn('TanStack Start server entry not found at:', frontendServerPath);
  }
}

// Fallback all non-API, non-admin routes to TanStack Start SSR
app.all('*', async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  if (!startHandler) {
    return res.status(503).send('Frontend is building or not loaded yet. Please refresh in a moment.');
  }

  try {
    const protocol = req.protocol;
    const host = req.get('host');
    const url = `${protocol}://${host}${req.originalUrl}`;
    
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value) {
        if (Array.isArray(value)) {
          value.forEach(v => headers.append(key, v));
        } else {
          headers.set(key, value);
        }
      }
    }

    const requestOptions = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      requestOptions.body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
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
    console.error('Error in TanStack Start SSR handler:', err);
    res.status(500).send('SSR Render Error');
  }
});

db.initDb().then(async () => {
  await loadFrontendHandler();
  app.listen(PORT, () => {
    console.log(`\n  TheDeep CleanerZ Admin running → http://localhost:${PORT}\n  Login: ${process.env.ADMIN_USERNAME || 'admin'} / admin123 (default)\n`);
  });
});
