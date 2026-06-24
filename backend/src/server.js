require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const db = require('./config/db');

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

// ===== Auth =====
app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin-dashboard');
  res.render('login');
});
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const ok = username === (process.env.ADMIN_USERNAME || 'admin') &&
    bcrypt.compareSync(password || '', process.env.ADMIN_PASSWORD_HASH || bcrypt.hashSync('admin123', 10));
  if (!ok) {
    req.flash('error', 'Invalid username or password.');
    return res.redirect('/login');
  }
  req.session.user = { username };
  req.flash('success', 'Welcome back!');
  res.redirect('/admin-dashboard');
});
app.post('/logout', (req, res) => req.session.destroy(() => res.redirect('/login')));

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
      emoji: req.body.emoji
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
app.post('/api/bookings', async (req, res) => {
  try {
    const booking = { id: nanoid(10), createdAt: new Date().toISOString(), ...req.body };
    await db.addBooking(booking);
    res.json({ ok: true, booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
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

app.delete('/api/bookings/:id', async (req, res) => {
  try {
    await db.deleteBooking(req.params.id);
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
      emoji: req.body.emoji
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
      includes
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
      includes
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

// Load the TanStack Start server handler
const frontendServerPath = path.join(__dirname, '../../frontend/dist/server/server.js');
let startHandler;
if (fs.existsSync(frontendServerPath)) {
  try {
    const handlerModule = require(frontendServerPath);
    startHandler = handlerModule.default || handlerModule;
  } catch (err) {
    console.error('Failed to load TanStack Start server handler:', err);
  }
}

// Fallback all non-API, non-admin routes to TanStack Start SSR
app.all('*', async (req, res, next) => {
  if (
    req.path.startsWith('/api') || 
    req.path.startsWith('/login') || 
    req.path.startsWith('/logout') || 
    req.path.startsWith('/categories') || 
    req.path.startsWith('/services') || 
    req.path.startsWith('/bookings') || 
    req.path.startsWith('/admin-dashboard')
  ) {
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

db.initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`\n  TheDeep CleanerZ Admin running → http://localhost:${PORT}\n  Login: ${process.env.ADMIN_USERNAME || 'admin'} / admin123 (default)\n`);
  });
});
