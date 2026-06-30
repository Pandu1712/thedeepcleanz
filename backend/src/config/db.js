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

    // Seed default data if categories table is empty or has old demo seed records
    const cats = await query('SELECT COUNT(*) as count FROM categories');
    const hasOldSeed = cats[0].count > 0 && (await query("SELECT id FROM categories WHERE id = 'cat-1'")).length > 0;
    
    if (cats[0].count === 0 || hasOldSeed) {
      if (hasOldSeed) {
        console.log('Old demo seed detected. Clearing tables for new unified database catalog...');
        await query('SET FOREIGN_KEY_CHECKS = 0');
        await query('TRUNCATE TABLE services');
        await query('TRUNCATE TABLE categories');
        await query('SET FOREIGN_KEY_CHECKS = 1');
      }
      console.log('Seeding default database records into MySQL...');
      const defaultData = {
        categories: [
          { id: "full-house", title: "Full House Deep Cleaning", tagline: "Top-to-bottom premium clean for the entire home", emoji: "🏠" },
          { id: "customized", title: "Customized Cleaning Package", tagline: "Pick exactly what you need — room by room", emoji: "🛋️" },
          { id: "commercial", title: "Commercial Post Interior Cleaning", tagline: "Office, hotel & post-construction expertise", emoji: "🏢" }
        ],
        services: [
          {
            id: "house",
            categoryId: "full-house",
            title: "Full House Cleaning",
            price: 1999,
            description: "Complete top-to-bottom deep clean for every room.",
            includes: ["All rooms HEPA vacuuming", "Floor machine scrubbing", "Window glass polishing", "Kitchen sanitization", "Bathroom deep cleaning"]
          },
          {
            id: "kitchen",
            categoryId: "full-house",
            title: "Kitchen Deep Cleaning",
            price: 999,
            description: "Intense kitchen degreasing and tile scrubbing.",
            includes: ["Chimney baffle filters", "Cabinet cleaning inside-out", "Countertop degreasing", "Limescale & oil removal"]
          },
          {
            id: "bath",
            categoryId: "full-house",
            title: "Bathroom Cleaning",
            price: 599,
            description: "Scrubbing and sanitization of tiles and fixtures.",
            includes: ["Limescale removal", "WC & washbasin scrub", "Mirror polishing", "Floor deep scrub"]
          },
          {
            id: "sofa",
            categoryId: "customized",
            title: "Sofa Cleaning",
            price: 499,
            description: "Vacuuming and injection-extraction stain removal.",
            includes: ["Allergen extraction", "Stain spot removal", "Eco-shampoo scrub", "Fabric odor control"]
          },
          {
            id: "furniture",
            categoryId: "customized",
            title: "Furniture Cleaning",
            price: 699,
            description: "Polishing and vacuuming of wood & fabric furniture.",
            includes: ["Wood conditioning", "Fabric vacuuming", "Leather protection", "Glass desk clean"]
          },
          {
            id: "interior",
            categoryId: "full-house",
            title: "Interior Cleaning",
            price: 1499,
            description: "Scrubbing wall tiles, fans, light fixtures.",
            includes: ["Ceiling fan clean", "Cobweb removal", "Switchboard wipe", "Window frame dusting"]
          },
          {
            id: "balcony",
            categoryId: "customized",
            title: "Balcony Cleaning",
            price: 499,
            description: "High-pressure wash & tile scrubbing.",
            includes: ["Pressure wash floor", "Grill dusting & wipe", "Drain clearance", "Glass door cleaning"]
          },
          {
            id: "office",
            categoryId: "commercial",
            title: "Office Cleaning",
            price: 2499,
            description: "Sanitization of workspaces, carpets & pantries.",
            includes: ["Workstation sanitization", "Carpet HEPA vacuum", "Pantry deep clean", "Trash clearance"]
          },
          {
            id: "hotel",
            categoryId: "commercial",
            title: "Hotel Cleaning",
            price: 2999,
            description: "Premium sanitization for rooms & lobbies.",
            includes: ["Room sanitization", "Lobby marble polish", "Restroom deep scrub", "Upholstery care"]
          },
          {
            id: "fridge",
            categoryId: "customized",
            title: "Refrigerator Cleaning",
            price: 499,
            description: "Stain and odor removal, tray sanitization.",
            includes: ["Defrost & interior wipe", "Tray & rack scrub", "Gasket disinfection", "Deodorization"]
          },
          {
            id: "carpet",
            categoryId: "customized",
            title: "Carpet Cleaning",
            price: 599,
            description: "Deep extraction shampooing of carpets.",
            includes: ["Deep soil extraction", "Stain pre-treatment", "Shampoo wash", "Fiber restoration"]
          },
          {
            id: "mattress",
            categoryId: "customized",
            title: "Mattress Cleaning",
            price: 599,
            description: "Allergen extraction & stain treatment.",
            includes: ["Dust-mite removal", "UV sanitization", "Liquid spill treatment", "Odor neutralizer"]
          },
          {
            id: "glass",
            categoryId: "customized",
            title: "Glass Cleaning",
            price: 499,
            description: "Window, facade and mirror polishing.",
            includes: ["Squeegee streak-free", "Frame dust & wipe", "Tough stain scrape", "Sealant check"]
          },
          {
            id: "floor",
            categoryId: "full-house",
            title: "Floor Scrubbing",
            price: 799,
            description: "Machine scrubbing and polishing of floors.",
            includes: ["Single-disc scrubbing", "Grout cleaning", "Stone restoration", "Glossy finish polish"]
          },
          {
            id: "tank",
            categoryId: "full-house",
            title: "Water Tank Cleaning",
            price: 1499,
            description: "Drainage, scrubbing and UV sterilization.",
            includes: ["Sludge drainage", "Manual scrub walls", "High-pressure spray", "UV sanitization"]
          }
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
