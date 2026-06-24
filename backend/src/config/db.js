const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'thedeepcleanerz',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper to run query
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Check database connection and auto-create tables if they don't exist
async function initDb() {
  try {
    console.log('Verifying MySQL Database connection...');
    
    // Create database if not exists
    const tempConn = await mysql.createConnection({
      host: process.env.DB_HOST || '127.0.0.1',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: Number(process.env.DB_PORT) || 3306,
    });
    await tempConn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'thedeepcleanerz'}\``);
    await tempConn.end();

    // Create categories table
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        tagline VARCHAR(255),
        emoji VARCHAR(50)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create services table
    await query(`
      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(255) PRIMARY KEY,
        categoryId VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        price INT NOT NULL DEFAULT 0,
        description TEXT,
        includes JSON,
        FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create bookings table
    await query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(255) PRIMARY KEY,
        createdAt VARCHAR(255) NOT NULL,
        customer JSON NOT NULL,
        schedule JSON NOT NULL,
        notes TEXT,
        coupon VARCHAR(100),
        discount INT DEFAULT 0,
        total INT NOT NULL,
        items JSON NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default data if categories table is empty
    const cats = await query('SELECT COUNT(*) as count FROM categories');
    if (cats[0].count === 0) {
      console.log('Seeding default database records into MySQL...');
      const defaultData = {
        categories: [
          { id: "cat-1", title: "Deep House Cleaning", tagline: "Complete home sanitization and dust-mite treatment", emoji: "🏠" },
          { id: "cat-2", title: "Kitchen Premium Degreasing", tagline: "Intense sanitization of chimneys, cabinets, and appliances", emoji: "🍳" },
          { id: "cat-3", title: "Sofa & Upholstery Care", tagline: "Hot-water injection-extraction allergen removal", emoji: "🛋️" },
          { id: "cat-4", title: "Office & Commercial", tagline: "Clinical sanitization layouts for premium work zones", emoji: "🏢" }
        ],
        services: [
          { id: "svc-1", categoryId: "cat-1", title: "Home Deep Cleaning", price: 5999, description: "Hospital-grade deep cleaning of all rooms, bathrooms, balconies. Dusting, HEPA vacuuming, floor machine scrubbing, and sanitization of touchpoints.", includes: ["3 Cleaners", "Eco-friendly biological agents", "All rooms, kitchens & bathrooms included"] },
          { id: "svc-2", categoryId: "cat-2", title: "Kitchen Sanitization", price: 2999, description: "Intense kitchen degreasing. Deep cleaning of chimney vents, cabinets (inside-out), countertops, wall tiles, sinks, and external appliances.", includes: ["2 Cleaners", "Advanced eco-degreasers", "Chimney baffle filter deep clean"] },
          { id: "svc-3", categoryId: "cat-3", title: "Luxury Sofa Deep Clean", price: 1499, description: "Dry vacuuming followed by wet extraction shampooing. Removes allergens, stains, dust-mites, and odor from fabric or leather upholstery.", includes: ["1 Specialist", "Kärcher injection-extraction machine", "Fabric sanitization enzyme solution"] },
          { id: "svc-4", categoryId: "cat-3", title: "Royal Carpet Steam Clean", price: 1999, description: "Steam cleaning and hot water extraction for premium carpets. Restores pile texture, removes deep-seated sand, grit, and dust mites.", includes: ["1 Specialist", "Steam injection", "Eco-friendly shampoo"] },
          { id: "svc-5", categoryId: "cat-1", title: "Premium Bathroom Sanitization", price: 1299, description: "Acid-free scrub cleaning of wall tiles, floors, WC, shower area, mirrors. Full sanitization of fixtures and exhaust fans.", includes: ["1 Specialist", "Hospital-grade disinfectants", "Limescale removal"] }
        ]
      };

      for (const c of defaultData.categories) {
        await query('INSERT INTO categories (id, title, tagline, emoji) VALUES (?, ?, ?, ?)', [c.id, c.title, c.tagline, c.emoji]);
      }
      for (const s of defaultData.services) {
        await query('INSERT INTO services (id, categoryId, title, price, description, includes) VALUES (?, ?, ?, ?, ?, ?)', [s.id, s.categoryId, s.title, s.price, s.description, JSON.stringify(s.includes)]);
      }
      console.log('Seeding completed successfully!');
    } else {
      console.log('MySQL Database verified. Categories and tables exist.');
    }
  } catch (err) {
    console.error('MySQL database initialization failed:', err.message);
    console.warn('PLEASE NOTE: Verify your local MySQL server is running and the database specified in DB_NAME exists.');
  }
}

// Database methods
module.exports = {
  pool,
  query,
  initDb,
  
  // Categories
  async getCategories() {
    return await query('SELECT * FROM categories');
  },
  async addCategory({ id, title, tagline, emoji }) {
    await query('INSERT INTO categories (id, title, tagline, emoji) VALUES (?, ?, ?, ?)', [id, title, tagline, emoji]);
    return { id, title, tagline, emoji };
  },
  async updateCategory(id, { title, tagline, emoji }) {
    await query('UPDATE categories SET title = ?, tagline = ?, emoji = ? WHERE id = ?', [title, tagline, emoji, id]);
    return { id, title, tagline, emoji };
  },
  async deleteCategory(id) {
    await query('DELETE FROM categories WHERE id = ?', [id]);
    return true;
  },

  // Services
  async getServices() {
    const rows = await query('SELECT * FROM services');
    return rows.map(r => ({
      ...r,
      includes: typeof r.includes === 'string' ? JSON.parse(r.includes) : (r.includes || [])
    }));
  },
  async addService({ id, categoryId, title, price, description, includes }) {
    const incString = JSON.stringify(includes || []);
    await query('INSERT INTO services (id, categoryId, title, price, description, includes) VALUES (?, ?, ?, ?, ?, ?)', [id, categoryId, title, price, description, incString]);
    return { id, categoryId, title, price, description, includes };
  },
  async updateService(id, { categoryId, title, price, description, includes }) {
    const incString = JSON.stringify(includes || []);
    await query('UPDATE services SET categoryId = ?, title = ?, price = ?, description = ?, includes = ? WHERE id = ?', [categoryId, title, price, description, incString, id]);
    return { id, categoryId, title, price, description, includes };
  },
  async deleteService(id) {
    await query('DELETE FROM services WHERE id = ?', [id]);
    return true;
  },

  // Bookings
  async getBookings() {
    const rows = await query('SELECT * FROM bookings');
    return rows.map(r => ({
      ...r,
      customer: typeof r.customer === 'string' ? JSON.parse(r.customer) : (r.customer || {}),
      schedule: typeof r.schedule === 'string' ? JSON.parse(r.schedule) : (r.schedule || {}),
      items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items || []),
    }));
  },
  async addBooking({ id, createdAt, customer, schedule, notes, coupon, discount, total, items }) {
    await query('INSERT INTO bookings (id, createdAt, customer, schedule, notes, coupon, discount, total, items) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
      id,
      createdAt,
      JSON.stringify(customer || {}),
      JSON.stringify(schedule || {}),
      notes || '',
      coupon || null,
      Number(discount) || 0,
      Number(total) || 0,
      JSON.stringify(items || [])
    ]);
    return { id, createdAt, customer, schedule, notes, coupon, discount, total, items };
  },
  async deleteBooking(id) {
    await query('DELETE FROM bookings WHERE id = ?', [id]);
    return true;
  }
};
