const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "thedeepcleanerz",
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Helper to run query
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Check database connection and auto-create tables if they don't exist
async function initDb() {
  try {
    console.log("Verifying MySQL Database connection...");

    let tempConn;
    try {
      // First attempt: Connect directly to the database (good for Hostinger where DB already exists)
      tempConn = await mysql.createConnection({
        host: process.env.DB_HOST || "127.0.0.1",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_NAME || "thedeepcleanerz",
        port: Number(process.env.DB_PORT) || 3306,
      });
      console.log("Connected to MySQL database directly.");
    } catch (dbErr) {
      // Second attempt: If connection failed because database doesn't exist, connect without database name and create it
      if (dbErr.code === "ER_BAD_DB_ERROR") {
        console.log(
          "Database does not exist. Attempting to create database...",
        );
        tempConn = await mysql.createConnection({
          host: process.env.DB_HOST || "127.0.0.1",
          user: process.env.DB_USER || "root",
          password: process.env.DB_PASSWORD || "",
          port: Number(process.env.DB_PORT) || 3306,
        });
        await tempConn.query(
          `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "thedeepcleanerz"}\``,
        );
      } else {
        throw dbErr;
      }
    }
    if (tempConn) {
      await tempConn.end();
    }

    // Create categories table
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        tagline VARCHAR(255),
        emoji VARCHAR(50),
        image VARCHAR(1000) DEFAULT NULL
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
        image VARCHAR(1000) DEFAULT NULL,
        plans JSON DEFAULT NULL,
        disclaimer TEXT DEFAULT NULL,
        requirements TEXT DEFAULT NULL,
        FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create reviews table
    await query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(255) PRIMARY KEY,
        serviceId VARCHAR(255) NOT NULL,
        userName VARCHAR(255) NOT NULL,
        rating INT NOT NULL,
        comment TEXT,
        createdAt VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Check if precautions column exists in services, if not, add it
    try {
      const cols = await query("SHOW COLUMNS FROM services LIKE 'precautions'");
      if (!cols || cols.length === 0) {
        await query("ALTER TABLE services ADD COLUMN precautions JSON DEFAULT NULL");
        console.log("Added column 'precautions' to services table.");
      }
    } catch (e) {
      console.warn("Could not add precautions column:", e.message);
    }

    // Drop foreign key constraint on reviews table if it exists (so we can review customized/mini services)
    try {
      const constraints = await query(`
        SELECT CONSTRAINT_NAME 
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'reviews' 
          AND COLUMN_NAME = 'serviceId' 
          AND REFERENCED_TABLE_NAME = 'services'
      `);
      if (constraints && constraints.length > 0) {
        const constraintName = constraints[0].CONSTRAINT_NAME;
        await query(`ALTER TABLE reviews DROP FOREIGN KEY ${constraintName}`);
        console.log(
          `Successfully dropped foreign key constraint '${constraintName}' from reviews table.`,
        );
      }
    } catch (e) {
      console.warn(
        "Could not drop foreign key constraint from reviews:",
        e.message,
      );
    }

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

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(15) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        createdAt VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Verify and add addresses JSON column to users if not existing
    let userColumns = await query("SHOW COLUMNS FROM users");
    const hasAddresses = userColumns.some((c) => c.Field === "addresses");
    if (!hasAddresses) {
      await query(`
        ALTER TABLE users 
        ADD COLUMN addresses JSON DEFAULT NULL
      `);
      console.log("Altered users table to add addresses JSON column.");
    }

    // Seed a sample default address for pandu1@gmail.com if they have no addresses saved
    const sampleAddresses = [
      {
        id: "addr-sample1",
        address: "Flat 402, Lotus Towers, Arundelpet",
        landmark: "Opposite Guntur Public School",
        city: "Guntur",
        pincode: "522002",
        type: "Home",
        isDefault: true
      }
    ];
    try {
      await query("UPDATE users SET addresses = ? WHERE email = ? AND (addresses IS NULL OR addresses = '[]' OR JSON_LENGTH(addresses) = 0)", [
        JSON.stringify(sampleAddresses),
        "pandu1@gmail.com"
      ]);
      console.log("Seeded sample addresses for user pandu1@gmail.com.");
    } catch (e) {
      console.error("Failed to seed sample address:", e);
    }

    // Create customized_services table
    await query(`
      CREATE TABLE IF NOT EXISTS customized_services (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        price INT NOT NULL DEFAULT 0,
        image VARCHAR(1000) DEFAULT NULL,
        plans JSON DEFAULT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create coupons table
    await query(`
      CREATE TABLE IF NOT EXISTS coupons (
        code VARCHAR(100) PRIMARY KEY,
        discount INT NOT NULL,
        minAmount INT NOT NULL DEFAULT 0,
        expiryDate VARCHAR(100) NOT NULL,
        isActive TINYINT(1) NOT NULL DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insert default coupons if table is empty
    try {
      const existingCoupons = await query(
        "SELECT COUNT(*) as count FROM coupons",
      );
      if (
        existingCoupons &&
        existingCoupons[0] &&
        existingCoupons[0].count === 0
      ) {
        await query(
          "INSERT INTO coupons (code, discount, minAmount, expiryDate, isActive) VALUES ('WELCOME500', 500, 1500, '2030-12-31', 1)",
        );
        await query(
          "INSERT INTO coupons (code, discount, minAmount, expiryDate, isActive) VALUES ('FESTIVE250', 250, 1000, '2030-12-31', 1)",
        );
        console.log("Inserted default coupons.");
      }
    } catch (e) {
      console.warn("Could not insert default coupons:", e.message);
    }

    // Alter table bookings to add paymentStatus and paymentId if they don't exist
    const columns = await query("SHOW COLUMNS FROM bookings");
    const hasPaymentStatus = columns.some((c) => c.Field === "paymentStatus");
    if (!hasPaymentStatus) {
      await query(`
        ALTER TABLE bookings 
        ADD COLUMN paymentStatus VARCHAR(100) DEFAULT 'Pending',
        ADD COLUMN paymentId VARCHAR(255) DEFAULT NULL
      `);
      console.log("Altered bookings table to add payment status columns.");
    }
    const hasUserId = columns.some((c) => c.Field === "userId");
    if (!hasUserId) {
      await query(`
        ALTER TABLE bookings 
        ADD COLUMN userId VARCHAR(255) DEFAULT NULL
      `);
      console.log("Altered bookings table to add userId column.");
    }

    // Alter table bookings to add technicianId column if it doesn't exist
    const hasTechnicianId = columns.some((c) => c.Field === "technicianId");
    if (!hasTechnicianId) {
      await query(`
        ALTER TABLE bookings 
        ADD COLUMN technicianId VARCHAR(255) DEFAULT NULL
      `);
      console.log("Altered bookings table to add technicianId column.");
    }

    // Alter table bookings to add jobStatus column if it doesn't exist
    const hasJobStatus = columns.some((c) => c.Field === "jobStatus");
    if (!hasJobStatus) {
      await query(`
        ALTER TABLE bookings 
        ADD COLUMN jobStatus VARCHAR(100) DEFAULT 'Pending'
      `);
      console.log("Altered bookings table to add jobStatus column.");
    }

    // Alter table bookings to add statusNote column if it doesn't exist
    const hasStatusNote = columns.some((c) => c.Field === "statusNote");
    if (!hasStatusNote) {
      await query(`
        ALTER TABLE bookings 
        ADD COLUMN statusNote VARCHAR(1000) DEFAULT NULL
      `);
      console.log("Altered bookings table to add statusNote column.");
    }

    // Alter table bookings to add before_image and after_image columns if they don't exist
    const hasBeforeImage = columns.some((c) => c.Field === "before_image");
    if (!hasBeforeImage) {
      await query(`
        ALTER TABLE bookings 
        ADD COLUMN before_image VARCHAR(1000) DEFAULT NULL,
        ADD COLUMN after_image VARCHAR(1000) DEFAULT NULL
      `);
      console.log("Altered bookings table to add before_image and after_image columns.");
    }

    // Create technicians table
    await query(`
      CREATE TABLE IF NOT EXISTS technicians (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(15) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE DEFAULT NULL,
        specialty VARCHAR(255) DEFAULT NULL,
        status VARCHAR(100) DEFAULT 'Active',
        createdAt VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("Technicians table verified/created.");

    // Verify and add lat, lng, lastPing columns to technicians if not existing
    try {
      const techCols = await query("SHOW COLUMNS FROM technicians");
      const hasLat = techCols.some((c) => c.Field === "lat");
      if (!hasLat) {
        await query(`
          ALTER TABLE technicians 
          ADD COLUMN lat DECIMAL(10, 8) DEFAULT NULL,
          ADD COLUMN lng DECIMAL(11, 8) DEFAULT NULL,
          ADD COLUMN lastPing VARCHAR(100) DEFAULT NULL
        `);
        console.log("Altered technicians table to add GPS location columns.");
      }
    } catch (e) {
      console.warn("Could not alter technicians table for GPS columns:", e.message);
    }

    // Create reschedule_logs table
    await query(`
      CREATE TABLE IF NOT EXISTS reschedule_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bookingId VARCHAR(255) NOT NULL,
        rescheduledBy VARCHAR(255) NOT NULL,
        previousDate VARCHAR(100) DEFAULT NULL,
        previousTime VARCHAR(100) DEFAULT NULL,
        newDate VARCHAR(100) NOT NULL,
        newTime VARCHAR(100) NOT NULL,
        createdAt VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("Reschedule logs table verified/created.");

    // Create visitor_locations table
    await query(`
      CREATE TABLE IF NOT EXISTS visitor_locations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId VARCHAR(255) NULL,
        latitude VARCHAR(100) NOT NULL,
        longitude VARCHAR(100) NOT NULL,
        timestamp VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("Visitor locations table verified/created.");

    // Create settings table
    await query(`
      CREATE TABLE IF NOT EXISTS settings (
        key_name VARCHAR(255) PRIMARY KEY,
        key_value VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("Settings table verified/created.");

    // Create recent_transformations table
    await query(`
      CREATE TABLE IF NOT EXISTS recent_transformations (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        beforeImage TEXT NOT NULL,
        afterImage TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log("Recent transformations table verified/created.");

    // Alter table users to add role column if it doesn't exist
    userColumns = await query("SHOW COLUMNS FROM users");
    const hasRole = userColumns.some((c) => c.Field === "role");
    if (!hasRole) {
      await query(`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(50) DEFAULT 'user'
      `);
      console.log("Altered users table to add role column.");
      // Set the seeded admin role to 'admin'
      await query("UPDATE users SET role = 'admin' WHERE email = ?", [
        "thedeepcleanerz.info@gmail.com",
      ]);
    }
    const hasReferralCode = userColumns.some((c) => c.Field === "referral_code");
    if (!hasReferralCode) {
      await query(`
        ALTER TABLE users 
        ADD COLUMN referral_code VARCHAR(100) DEFAULT NULL,
        ADD COLUMN wallet_balance INT DEFAULT 0
      `);
      console.log("Altered users table to add referral_code & wallet_balance columns.");
    }

    // Insert default referral settings
    await query(`
      INSERT IGNORE INTO settings (key_name, key_value) VALUES 
      ('referral_reward_amount', '200'),
      ('referral_enabled', '1')
    `);

    // Alter table technicians to add password column if it doesn't exist
    const techColumns = await query("SHOW COLUMNS FROM technicians");
    const hasPassword = techColumns.some((c) => c.Field === "password");
    if (!hasPassword) {
      await query(`
        ALTER TABLE technicians 
        ADD COLUMN password VARCHAR(255) DEFAULT NULL
      `);
      console.log("Altered technicians table to add password column.");
    }

    // Alter table categories to add image if it doesn't exist
    const catColumns = await query("SHOW COLUMNS FROM categories");
    const hasImage = catColumns.some((c) => c.Field === "image");
    if (!hasImage) {
      await query(`
        ALTER TABLE categories 
        ADD COLUMN image VARCHAR(1000) DEFAULT NULL
      `);
      console.log("Altered categories table to add image column.");
    }

    const hasParentId = catColumns.some((c) => c.Field === "parentId");
    if (!hasParentId) {
      await query(`
        ALTER TABLE categories 
        ADD COLUMN parentId VARCHAR(255) DEFAULT NULL
      `);
      console.log("Altered categories table to add parentId column.");
    }

    const hasIncludes = catColumns.some((c) => c.Field === "includes");
    if (!hasIncludes) {
      await query(`
        ALTER TABLE categories 
        ADD COLUMN includes JSON DEFAULT NULL
      `);
      console.log("Altered categories table to add includes column.");
    }

    // Alter table services to add columns if they don't exist
    const svcColumns = await query("SHOW COLUMNS FROM services");
    const hasSvcImage = svcColumns.some((c) => c.Field === "image");
    if (!hasSvcImage) {
      await query(
        "ALTER TABLE services ADD COLUMN image VARCHAR(1000) DEFAULT NULL",
      );
      console.log("Altered services table to add image column.");
    }
    const hasSvcPlans = svcColumns.some((c) => c.Field === "plans");
    if (!hasSvcPlans) {
      await query("ALTER TABLE services ADD COLUMN plans JSON DEFAULT NULL");
      console.log("Altered services table to add plans column.");
    }
    const hasSvcDisclaimer = svcColumns.some((c) => c.Field === "disclaimer");
    if (!hasSvcDisclaimer) {
      await query(
        "ALTER TABLE services ADD COLUMN disclaimer TEXT DEFAULT NULL",
      );
      console.log("Altered services table to add disclaimer column.");
    }
    const hasSvcReqs = svcColumns.some((c) => c.Field === "requirements");
    if (!hasSvcReqs) {
      await query(
        "ALTER TABLE services ADD COLUMN requirements TEXT DEFAULT NULL",
      );
      console.log("Altered services table to add requirements column.");
    }
    const hasSvcPaymentType = svcColumns.some((c) => c.Field === "payment_type");
    if (!hasSvcPaymentType) {
      await query(
        "ALTER TABLE services ADD COLUMN payment_type VARCHAR(50) DEFAULT 'full'",
      );
      console.log("Altered services table to add payment_type column.");
    }

    // Alter table customized_services to add payment_type if it doesn't exist
    const custColumns = await query("SHOW COLUMNS FROM customized_services");
    const hasCustPaymentType = custColumns.some((c) => c.Field === "payment_type");
    if (!hasCustPaymentType) {
      await query(
        "ALTER TABLE customized_services ADD COLUMN payment_type VARCHAR(50) DEFAULT 'full'",
      );
      console.log("Altered customized_services table to add payment_type column.");
    }

    // Seed default data if categories table is empty or has old demo seed records
    const cats = await query("SELECT COUNT(*) as count FROM categories");
    const hasOldSeed =
      cats[0].count > 0 &&
      (await query("SELECT id FROM categories WHERE id = 'cat-1'")).length > 0;

    if (hasOldSeed) {
      console.log(
        "Old demo seed detected. Clearing tables for new unified database catalog...",
      );
      await query("SET FOREIGN_KEY_CHECKS = 0");
      await query("TRUNCATE TABLE services");
      await query("TRUNCATE TABLE categories");
      await query("SET FOREIGN_KEY_CHECKS = 1");
    }

    // Dynamic Seeding from data/db.json has been removed to prevent database overrides and preserve admin modifications.

    // Ensure default categories exist in database (including Full House sub-categories)
    const defaultCategories = [
      {
        id: "full-house",
        title: "Full House Deep Cleaning",
        tagline: "Top-to-bottom premium clean for the entire home",
        emoji: "🏠",
        image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
        parentId: null,
        includes: ["Furnished", "Vacant", "Bungalow / Villa"]
      },
      {
        id: "furnished",
        title: "Furnished",
        tagline: "Deep cleaning for fully furnished apartments with furniture, wardrobes & appliances",
        emoji: "🛋️",
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
        parentId: "full-house",
        includes: ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK+"]
      },
      {
        id: "vacant",
        title: "Vacant",
        tagline: "Thorough deep cleaning for empty / unfurnished flats before shifting or post handover",
        emoji: "📦",
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        parentId: "full-house",
        includes: ["1 BHK Empty", "2 BHK Empty", "3 BHK Empty", "4 BHK Empty", "5 BHK Empty"]
      },
      {
        id: "bungalow-villa",
        title: "Bungalow / Villa",
        tagline: "Comprehensive multi-floor deep sanitation for duplexes, bungalows & independent villas",
        emoji: "🏡",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        parentId: "full-house",
        includes: ["Up to 2000 sq.ft", "2000 - 3500 sq.ft", "3500 - 5000+ sq.ft", "Duplex Villa"]
      },
      {
        id: "customized",
        title: "Customized Cleaning Package",
        tagline: "Pick exactly what you need — room by room",
        emoji: "🛋️",
        image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80",
        parentId: null,
        includes: ["Living Room", "Kitchen", "Bathroom", "Sofa", "Carpet"]
      },
      {
        id: "commercial",
        title: "Commercial Post Interior Cleaning",
        tagline: "Office, hotel & post-construction expertise",
        emoji: "🏢",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
        parentId: null,
        includes: ["Office Cleaning", "Hotel Cleaning", "Post-Construction"]
      }
    ];

    for (const cat of defaultCategories) {
      try {
        const existing = await query("SELECT id, parentId FROM categories WHERE id = ?", [cat.id]);
        if (existing.length === 0) {
          console.log(`Seeding default category: ${cat.title} (${cat.id})`);
          await query(
            "INSERT INTO categories (id, title, tagline, emoji, image, parentId, includes) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [
              cat.id,
              cat.title,
              cat.tagline,
              cat.emoji,
              cat.image,
              cat.parentId || null,
              JSON.stringify(cat.includes || [])
            ]
          );
        } else {
          // Keep parentId accurate
          if (cat.parentId && existing[0].parentId !== cat.parentId) {
            await query("UPDATE categories SET parentId = ? WHERE id = ?", [cat.parentId, cat.id]);
          }
        }
      } catch (e) {
        console.warn(`Failed to seed default category ${cat.id}:`, e.message);
      }
    }

    // Seed Full House Sub-Category Services
    const fullHouseServices = [
      // === FURNISHED APARTMENT SERVICES ===
      {
        id: "1bhk-furnished",
        categoryId: "furnished",
        title: "1 BHK Furnished Deep Cleaning",
        price: 1499,
        description: "Complete top-to-bottom deep sanitization and cleaning for a 1 BHK furnished apartment including bedroom, living hall, kitchen, bathroom, balcony, furniture dusting and exterior appliance wipedown.",
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
        includes: [
          "Full bedroom dusting, cobweb removal & dry vacuuming",
          "Living room sofa & furniture surface wipe down",
          "Kitchen countertop, sink, tiles & outer cabinet degreasing",
          "Bathroom descaling, sanitization & floor scrubbing",
          "Balcony wash & window glass wipe down"
        ],
        plans: [
          {
            name: "Express",
            price: 1499,
            duration: "2 - 3 hours",
            description: "Standard deep dusting, manual floor scrub, bathroom & kitchen sanitize for 1 BHK furnished home.",
            includes: ["Deep dusting of all rooms", "Floor scrubbing & wet mopping", "Bathroom deep cleaning (WC, tiles, basin)", "Kitchen slab, tiles, sink & stove wipe down"],
            excludes: ["Interior cabinet/wardrobe cleaning", "Appliance interior cleaning", "Sofa or carpet shampooing"]
          },
          {
            name: "Classic",
            price: 2199,
            duration: "3 - 4 hours",
            description: "Comprehensive deep clean with single-disc machine floor scrubbing, window channels & appliance exteriors.",
            includes: ["All Express features", "Single disc machine floor scrubbing", "Window tracks & grill cleaning", "Kitchen chimney exterior degreasing", "Balcony power wash"],
            excludes: ["Appliance interior cleaning", "Sofa shampooing"]
          },
          {
            name: "Premium",
            price: 2999,
            duration: "4 - 5 hours",
            description: "Elite clinical-grade deep clean with inside cabinet sanitization (if empty) and steam disinfections.",
            includes: ["All Classic features", "Steam disinfection of bathrooms & kitchen", "Inside empty wardrobe & cabinet wiping", "Furniture polish & surface protection"],
            excludes: ["Moving excessively heavy structural fixtures"]
          }
        ],
        disclaimer: "Please ensure all valuables are removed or securely stored before our professionals arrive.",
        requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for height reach."
      },
      {
        id: "2bhk-furnished",
        categoryId: "furnished",
        title: "2 BHK Furnished Deep Cleaning",
        price: 2199,
        description: "Comprehensive hotel-grade deep clean for a 2 BHK furnished flat covering 2 bedrooms, hall, kitchen, 2 bathrooms, balconies, furniture and fixtures.",
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        includes: [
          "Deep dusting of 2 bedrooms, living room & dining area",
          "Complete sanitization of up to 2 bathrooms",
          "Kitchen countertops, stove, tiles & sink scrub",
          "Floor scrubbing and mopping across all rooms",
          "Balconies, doors, windows & switchboards detailing"
        ],
        plans: [
          {
            name: "Express",
            price: 2199,
            duration: "3 - 4 hours",
            description: "Standard deep dusting, floor scrub, bathroom & kitchen sanitize for 2 BHK furnished flat.",
            includes: ["Deep dusting of 2 bedrooms & hall", "2 Bathrooms intensive sanitization", "Kitchen countertop & tiles degreasing", "Balcony & window cleaning"],
            excludes: ["Interior cabinet cleaning", "Sofa shampooing"]
          },
          {
            name: "Classic",
            price: 3199,
            duration: "4 - 5 hours",
            description: "Detailed 2 BHK deep clean with machine floor buffing, window tracks & appliances exterior.",
            includes: ["All Express features", "Single disc floor scrubbing", "Window channels & glass deep clean", "Kitchen chimney exterior & tile steam wipe"],
            excludes: ["Sofa shampooing"]
          },
          {
            name: "Premium",
            price: 4299,
            duration: "5 - 6 hours",
            description: "Ultra-luxury deep clean with complete steam sterilization, empty wardrobe interiors & finish polish.",
            includes: ["All Classic features", "Steam sanitization across all rooms", "Inside wardrobe & cabinet wipedown", "Furniture protection coat"],
            excludes: []
          }
        ],
        disclaimer: "Please ensure all valuables are removed or securely stored before our professionals arrive.",
        requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for height reach."
      },
      {
        id: "3bhk-furnished",
        categoryId: "furnished",
        title: "3 BHK Furnished Deep Cleaning",
        price: 2899,
        description: "All-inclusive deep cleaning and sanitization for 3 BHK furnished apartments including 3 bedrooms, large living hall, kitchen, up to 3 bathrooms & balconies.",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        includes: [
          "3 Bedrooms + Living room deep dusting & vacuuming",
          "Up to 3 Bathrooms intensive sanitization & descaling",
          "Kitchen slab, sink, tiles & cabinets outer degreasing",
          "Full floor scrubbing, balconies & window tracks detailing"
        ],
        plans: [
          {
            name: "Express",
            price: 2899,
            duration: "4 - 5 hours",
            description: "Deep cleaning of 3 bedrooms, hall, kitchen and up to 3 bathrooms.",
            includes: ["3 Bedrooms + Living room deep dusting", "Up to 3 Bathrooms intensive clean", "Kitchen slab, sink, tiles degreasing", "Floors scrubbing & mopping"],
            excludes: ["Interior cabinet cleaning"]
          },
          {
            name: "Classic",
            price: 4199,
            duration: "5 - 6 hours",
            description: "Intensive 3 BHK deep clean with machine floor scrubbing and detailed window tracks.",
            includes: ["All Express features", "Machine floor scrubbing", "Detailed window tracks & glass wipe", "Balcony deep washing"],
            excludes: ["Sofa shampooing"]
          },
          {
            name: "Premium",
            price: 5499,
            duration: "6 - 7 hours",
            description: "Hospitality-grade sterilization for entire 3 BHK with steam treatment & wardrobe wipedowns.",
            includes: ["All Classic features", "Steam treatment for kitchen & washrooms", "Empty wardrobe & kitchen cabinet interiors", "Eco-safe germicidal polish"],
            excludes: []
          }
        ],
        disclaimer: "Please ensure all valuables are removed or securely stored before our professionals arrive.",
        requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for height reach."
      },
      {
        id: "4bhk-furnished",
        categoryId: "furnished",
        title: "4 BHK / Duplex Furnished Deep Cleaning",
        price: 3799,
        description: "Large-scale deep cleaning tailored for expansive 4 BHK flats and duplex apartments with multi-bathroom sanitation and high-reach cleaning.",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
        includes: [
          "4 Bedrooms & grand hall complete dusting",
          "Up to 4 Bathrooms intensive clinical scrub",
          "Heavy kitchen degreasing & tile steam wash",
          "Floor machine scrubbing and multi-balcony cleaning"
        ],
        plans: [
          {
            name: "Express",
            price: 3799,
            duration: "5 - 6 hours",
            description: "Complete deep cleaning for 4 BHK flats & duplex living spaces.",
            includes: ["4 Bedrooms + spacious hall deep dusting", "Up to 4 Bathrooms deep sanitized", "Kitchen counters, tiles & sink scrub", "Floor cleaning & mopping"],
            excludes: ["Interior cabinet cleaning"]
          },
          {
            name: "Classic",
            price: 5399,
            duration: "6 - 7 hours",
            description: "High-power machine scrub and comprehensive 4 BHK detailing.",
            includes: ["All Express features", "Machine floor scrubbing", "All window rails & balcony washing", "Appliance exterior polish"],
            excludes: []
          },
          {
            name: "Premium",
            price: 6999,
            duration: "7 - 8 hours",
            description: "Full luxury overhaul with steam disinfection and modular cabinet detailing.",
            includes: ["All Classic features", "Steam disinfection throughout", "Inside empty wardrobe & cabinet clean", "Full surface sealant & protection"],
            excludes: []
          }
        ],
        disclaimer: "Please ensure all valuables are removed or securely stored before our professionals arrive.",
        requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for height reach."
      },
      {
        id: "5bhk-furnished",
        categoryId: "furnished",
        title: "5 BHK+ Luxury Furnished Deep Cleaning",
        price: 4899,
        description: "Comprehensive deep cleaning engineered for grand 5 BHK+ homes, penthouses and sprawling apartments with dedicated specialist crews.",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
        includes: [
          "5+ Bedrooms and sprawling hall detailing",
          "All bathrooms clinical sanitization & descaling",
          "Full modular kitchen deep degreasing",
          "Machine floor polishing & terrace/balcony power wash"
        ],
        plans: [
          {
            name: "Express",
            price: 4899,
            duration: "6 - 7 hours",
            description: "Deep cleaning across 5 bedrooms, living rooms and multiple bathrooms.",
            includes: ["5+ Bedrooms and living areas dusted", "All bathrooms deep sanitized", "Kitchen counters, sink and tiles scrubbed", "Floor mopping & balcony wash"],
            excludes: []
          },
          {
            name: "Classic",
            price: 6899,
            duration: "7 - 8 hours",
            description: "Heavy-duty machine scrub and complete architectural detailing.",
            includes: ["All Express features", "Single disc machine floor scrub", "All windows, sliders and balcony wash"],
            excludes: []
          },
          {
            name: "Premium",
            price: 8899,
            duration: "8 - 10 hours",
            description: "Ultimate penthouse & luxury flat overhaul with steam treatment and premium protective finishes.",
            includes: ["All Classic features", "Full steam disinfection", "Inside modular cabinet detailing", "High-reach fixtures & chandeliers dusting"],
            excludes: []
          }
        ],
        disclaimer: "Please ensure all valuables are removed or securely stored before our professionals arrive.",
        requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for height reach."
      },

      // === VACANT / MOVE-IN MOVE-OUT APARTMENT SERVICES ===
      {
        id: "1bhk-vacant",
        categoryId: "vacant",
        title: "1 BHK Vacant / Empty Flat Deep Cleaning",
        price: 1199,
        description: "Specialized deep cleaning for empty 1 BHK flats before shifting or post-tenant move-out. Includes inside-out wardrobe & cabinet cleaning, tile scrubbing and window track detailing.",
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
        includes: [
          "Inside & outside cleaning of all empty wardrobes & kitchen cabinets",
          "Intensive bathroom descaling & tile stain removal",
          "Kitchen platform, sink, chimney & exhaust deep clean",
          "Window tracks, glass & balcony deep wash",
          "Floor scrubbing to remove paint specks & stubborn grime"
        ],
        plans: [
          {
            name: "Express",
            price: 1199,
            duration: "2 - 3 hours",
            description: "Basic move-in wipe down, floor mopping and bathroom sanitization for empty 1 BHK flat.",
            includes: ["Dry & wet floor scrubbing", "1 Bathroom descaling & sanitation", "Kitchen platform & sink wash", "Inside empty wardrobe dust wipedown"],
            excludes: ["Heavy paint stain removal", "Steam sterilization"]
          },
          {
            name: "Classic",
            price: 1799,
            duration: "3 - 4 hours",
            description: "Complete move-in deep cleaning with machine floor scrub and inside-out cabinet detailing.",
            includes: ["Machine floor scrubbing", "All empty cabinets washed inside-out", "Window tracks & balcony power wash", "Bathroom deep descaling"],
            excludes: []
          },
          {
            name: "Premium",
            price: 2499,
            duration: "4 - 5 hours",
            description: "Sanitized handover deep clean with steam sterilization and germicidal treatment.",
            includes: ["All Classic features", "Steam disinfection in bathroom & kitchen", "Paint & cement speck removal", "Protective sealant application"],
            excludes: []
          }
        ],
        disclaimer: "Please ensure water and electricity connections are active in the vacant flat before service.",
        requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool."
      },
      {
        id: "2bhk-vacant",
        categoryId: "vacant",
        title: "2 BHK Vacant / Empty Flat Deep Cleaning",
        price: 1699,
        description: "Move-in / move-out deep clean for empty 2 BHK flats. Detailed cleaning of empty modular cabinets, wardrobes, kitchen, 2 bathrooms and windows.",
        image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
        includes: [
          "Inside-out wipedown of all empty wardrobes, lofts & kitchen cabinets",
          "2 Bathrooms intensive descaling & fixtures polish",
          "Window glass, tracks, grills & balconies power wash",
          "Floor machine scrub to eliminate dust, grime & minor paint marks"
        ],
        plans: [
          {
            name: "Express",
            price: 1699,
            duration: "3 - 4 hours",
            description: "Standard vacant flat cleaning for 2 BHK covering all empty rooms and 2 bathrooms.",
            includes: ["Dry & wet floor scrubbing", "2 Bathrooms descaling", "Kitchen counters & sink wash", "Inside wardrobe wipe"],
            excludes: ["Machine floor scrub"]
          },
          {
            name: "Classic",
            price: 2599,
            duration: "4 - 5 hours",
            description: "Thorough move-in preparation with machine floor scrub and cabinet inside-out wash.",
            includes: ["Machine floor scrub across all rooms", "Inside-out empty cabinet washing", "Window channels & balcony deep clean"],
            excludes: []
          },
          {
            name: "Premium",
            price: 3499,
            duration: "5 - 6 hours",
            description: "Hospitality-grade sanitized handover with full steam disinfection.",
            includes: ["All Classic features", "Steam disinfection in kitchen & washrooms", "Cement/paint mark removal", "High-gloss surface finish"],
            excludes: []
          }
        ],
        disclaimer: "Please ensure water and electricity connections are active in the vacant flat before service.",
        requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool."
      },
      {
        id: "3bhk-vacant",
        categoryId: "vacant",
        title: "3 BHK Vacant / Empty Flat Deep Cleaning",
        price: 2299,
        description: "Complete move-in / move-out deep cleaning for unfurnished 3 BHK flats. Full sanitation of 3 bedrooms, hall, kitchen, up to 3 bathrooms & balconies.",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        includes: [
          "All empty bedroom wardrobes, lofts & cabinets cleaned inside & out",
          "Up to 3 Bathrooms deep descaling, wall tiles & fixtures scrubbing",
          "Kitchen modular units, sink, tiles & exhaust deep clean",
          "Machine floor scrub & balcony wash across entire 3 BHK"
        ],
        plans: [
          {
            name: "Express",
            price: 2299,
            duration: "4 - 5 hours",
            description: "Move-in clean for empty 3 BHK including all rooms, cabinets and up to 3 bathrooms.",
            includes: ["Manual floor scrub & mopping", "Up to 3 Bathrooms descaling", "Kitchen tiles & sink wash", "Empty wardrobe dust wipe"],
            excludes: ["Machine scrub"]
          },
          {
            name: "Classic",
            price: 3399,
            duration: "5 - 6 hours",
            description: "Intensive vacant 3 BHK deep clean with machine floor scrub and complete cabinet wash.",
            includes: ["Single disc machine floor scrub", "All empty cabinets washed inside-out", "Detailed window rails & balconies power wash"],
            excludes: []
          },
          {
            name: "Premium",
            price: 4599,
            duration: "6 - 7 hours",
            description: "Elite move-in sanitation package with steam sterilization throughout.",
            includes: ["All Classic features", "Steam disinfection in all bathrooms & kitchen", "Paint & glue residue removal", "Germicidal air and surface treatment"],
            excludes: []
          }
        ],
        disclaimer: "Please ensure water and electricity connections are active in the vacant flat before service.",
        requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool."
      },
      {
        id: "4bhk-vacant",
        categoryId: "vacant",
        title: "4 BHK Vacant / Empty Flat Deep Cleaning",
        price: 2999,
        description: "Heavy-duty move-in / move-out deep cleaning for spacious 4 BHK empty flats and duplexes.",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
        includes: [
          "Inside-out sanitization of all empty wardrobes, modular drawers & cabinets",
          "Up to 4 Bathrooms clinical descaling & tile grout brightening",
          "High-power machine floor scrubbing across all rooms",
          "Balconies, sliding glass windows & high fixtures detailing"
        ],
        plans: [
          {
            name: "Express",
            price: 2999,
            duration: "5 - 6 hours",
            description: "Standard vacant cleaning for large 4 BHK flats & duplexes.",
            includes: ["Floor scrubbing & mopping", "Up to 4 Bathrooms descaling", "Kitchen modular units wiped", "Empty wardrobes dusted"],
            excludes: ["Machine scrub"]
          },
          {
            name: "Classic",
            price: 4399,
            duration: "6 - 7 hours",
            description: "Intensive machine scrub and complete inside-out empty modular detailing.",
            includes: ["Machine floor scrub", "Inside-out washing of all cabinets & wardrobes", "Window frames & balconies power wash"],
            excludes: []
          },
          {
            name: "Premium",
            price: 5799,
            duration: "7 - 8 hours",
            description: "Ultimate move-in handover with full steam treatment and deep sanitization.",
            includes: ["All Classic features", "Full steam disinfection", "Paint & cement speck cleanup", "Protective tile & glass sealant"],
            excludes: []
          }
        ],
        disclaimer: "Please ensure water and electricity connections are active in the vacant flat before service.",
        requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool."
      },
      {
        id: "5bhk-vacant",
        categoryId: "vacant",
        title: "5 BHK Vacant / Empty Flat Deep Cleaning",
        price: 3799,
        description: "Large-scale empty penthouse and 5 BHK+ apartment deep cleaning with dedicated specialist crew.",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
        includes: [
          "Complete inside-out wash of all 5+ room wardrobes, lofts & cabinets",
          "Clinical sanitization of all washrooms & kitchen spaces",
          "Machine floor buffing, terrace, utility & balcony power wash"
        ],
        plans: [
          {
            name: "Express",
            price: 3799,
            duration: "6 - 7 hours",
            description: "Standard vacant clean for 5 BHK+ expansive homes.",
            includes: ["Floor scrub & mopping", "All bathrooms descaling", "Kitchen wash & wardrobe dusting"],
            excludes: ["Machine scrub"]
          },
          {
            name: "Classic",
            price: 5499,
            duration: "7 - 8 hours",
            description: "Heavy-duty machine scrub and complete architectural detailing.",
            includes: ["Machine floor scrub", "All empty units washed inside-out", "Sliders, windows & balconies wash"],
            excludes: []
          },
          {
            name: "Premium",
            price: 7299,
            duration: "8 - 10 hours",
            description: "Full steam sterilization and luxury handover overhaul.",
            includes: ["All Classic features", "Full steam sterilization", "Paint/cement stain elimination", "Complete germicidal seal"],
            excludes: []
          }
        ],
        disclaimer: "Please ensure water and electricity connections are active in the vacant flat before service.",
        requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool."
      },

      // === BUNGALOW / VILLA SERVICES ===
      {
        id: "villa-small",
        categoryId: "bungalow-villa",
        title: "Villa / Row House Deep Cleaning (Up to 2000 sq ft)",
        price: 4499,
        description: "Comprehensive multi-floor deep cleaning for independent houses, row houses, and small villas up to 2,000 sq.ft. Includes staircase, portico, balconies, kitchen, bathrooms & living areas.",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        includes: [
          "Complete multi-floor deep dusting & floor scrubbing",
          "All bathrooms clinical descaling & sanitization",
          "Modular kitchen deep degreasing & tile scrub",
          "Internal staircase, railings, portico & terrace sweep",
          "Windows, glass sliders & balconies power washing"
        ],
        plans: [
          {
            name: "Express",
            price: 4499,
            duration: "5 - 6 hours",
            description: "Essential deep cleaning for independent villa/row house up to 2000 sq ft.",
            includes: ["All rooms deep dusted & mopped", "Bathrooms sanitized", "Kitchen counters & sink cleaned", "Staircase and portico sweep"],
            excludes: ["Machine floor scrub", "Terrace wash"]
          },
          {
            name: "Classic",
            price: 6499,
            duration: "6 - 8 hours",
            description: "Intensive villa clean with single-disc machine floor scrub, terrace wash and window detailing.",
            includes: ["Machine floor scrub across all floors", "Terrace & portico power wash", "Window channels & sliders clean", "Kitchen & bathroom deep descaling"],
            excludes: []
          },
          {
            name: "Premium",
            price: 8499,
            duration: "8 - 10 hours",
            description: "Luxury villa overhaul with full steam sterilization, facade glass wipedown and protective polish.",
            includes: ["All Classic features", "Steam sterilization across all bathrooms & kitchen", "Inside empty wardrobe detailing", "High-reach facade and railing polish"],
            excludes: []
          }
        ],
        disclaimer: "Please ensure adequate water supply and access to electrical points on each floor.",
        requirements: "Customers are requested to provide buckets with water, power points, and a ladder or stool for height reach."
      },
      {
        id: "villa-medium",
        categoryId: "bungalow-villa",
        title: "Medium Villa / Independent House (2000 - 3500 sq ft)",
        price: 6499,
        description: "Full-scale deep cleaning engineered for large independent villas and bungalows between 2,000 to 3,500 sq.ft with dedicated team and professional machinery.",
        image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
        includes: [
          "Multi-floor deep cleaning across 3-4 bedrooms, living halls & dining",
          "All washrooms descaled, sanitized and polished",
          "Full modular kitchen degreased and steam scrubbed",
          "Staircases, multiple balconies, terrace & garage/portico wash",
          "Facade glass, windows and high ceilings dusting"
        ],
        plans: [
          {
            name: "Express",
            price: 6499,
            duration: "6 - 8 hours",
            description: "Standard multi-floor deep clean for 2000-3500 sq ft villas.",
            includes: ["Deep dusting & mopping on all floors", "All bathrooms sanitized", "Kitchen deep cleaned", "Balconies & staircase swept"],
            excludes: ["Machine scrub"]
          },
          {
            name: "Classic",
            price: 9499,
            duration: "8 - 10 hours",
            description: "Heavy-duty machine floor scrub, terrace washing and high-reach detailing for medium villas.",
            includes: ["Machine floor scrubbing across all levels", "Terrace, portico & driveway wash", "Window tracks, sliders & grills power cleaned"],
            excludes: []
          },
          {
            name: "Premium",
            price: 12499,
            duration: "10 - 12 hours",
            description: "Hospitality-grade sterilization with steam treatments and architectural detailing.",
            includes: ["All Classic features", "Steam disinfection throughout", "Inside empty wardrobe & cabinet detailing", "Full surface sealant & chandelier dusting"],
            excludes: []
          }
        ],
        disclaimer: "Please ensure adequate water supply and access to electrical points on each floor.",
        requirements: "Customers are requested to provide buckets with water, power points, and a ladder or stool for height reach."
      },
      {
        id: "villa-large",
        categoryId: "bungalow-villa",
        title: "Large Luxury Villa / Bungalow (3500 - 5000+ sq ft)",
        price: 9499,
        description: "Ultra-luxury deep sanitization and cleaning for expansive bungalows, sprawling estates and grand luxury villas (3,500 to 5,000+ sq.ft) with specialist supervisor & crew.",
        image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
        includes: [
          "Complete estate deep cleaning across all floors and annexes",
          "Clinical-grade sanitization for 5+ washrooms",
          "Heavy kitchen & pantry degreasing",
          "Terrace, external balconies, portico, driveway & boundary wash",
          "Chandelier, glass railings & high-reach architectural detailing"
        ],
        plans: [
          {
            name: "Express",
            price: 9499,
            duration: "8 - 10 hours",
            description: "Standard large estate deep cleaning covering all primary living spaces.",
            includes: ["All rooms dusted & mopped", "All bathrooms descaled & sanitized", "Kitchen counters & sink scrubbed", "Staircases & balconies washed"],
            excludes: ["Machine floor scrub"]
          },
          {
            name: "Classic",
            price: 13999,
            duration: "10 - 12 hours",
            description: "Industrial machine floor scrubbing, terrace power wash and complete architectural cleaning.",
            includes: ["Machine floor scrubbing on all floors", "Terrace, driveway & portico power washing", "High glass facades & window tracks cleaned"],
            excludes: []
          },
          {
            name: "Premium",
            price: 18999,
            duration: "12 - 14 hours (or 2-day pass)",
            description: "Ultimate luxury estate overhaul with complete steam sterilization, germicidal treatment & surface sealants.",
            includes: ["All Classic features", "Steam sanitization across all bathrooms, kitchens & bedrooms", "Modular cabinet inside-out detailing", "Protective polish on all premium stones & fixtures"],
            excludes: []
          }
        ],
        disclaimer: "Please ensure adequate water supply and access to electrical points on each floor.",
        requirements: "Customers are requested to provide buckets with water, power points, and a ladder or stool for height reach."
      },
      {
        id: "villa-duplex",
        categoryId: "bungalow-villa",
        title: "Duplex / Multi-Floor Villa Deep Cleaning",
        price: 7999,
        description: "Specialized deep cleaning for duplex and triplex villas focusing on staircases, double-height ceilings, multiple washrooms, balconies and living areas.",
        image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
        includes: [
          "Double-height living area & ceiling fixture dusting",
          "Multi-floor staircase, glass railings & landing areas scrub",
          "All bathrooms clinical descaling & modular kitchen degreasing",
          "Machine floor polishing across lower and upper levels"
        ],
        plans: [
          {
            name: "Express",
            price: 7999,
            duration: "6 - 8 hours",
            description: "Standard duplex deep cleaning covering both floors, staircase and bathrooms.",
            includes: ["Both floors dusted and mopped", "All bathrooms sanitized", "Kitchen deep cleaned", "Staircases wiped"],
            excludes: ["Machine scrub"]
          },
          {
            name: "Classic",
            price: 11499,
            duration: "8 - 10 hours",
            description: "Machine floor scrubbing, terrace & balcony power wash for duplexes.",
            includes: ["Machine floor scrub across both levels", "Terrace & balcony power wash", "Double-height window & chandelier dusting"],
            excludes: []
          },
          {
            name: "Premium",
            price: 15499,
            duration: "10 - 12 hours",
            description: "Elite duplex overhaul with full steam sterilization and protective finishing.",
            includes: ["All Classic features", "Steam disinfection throughout", "Inside empty wardrobe detailing", "High-gloss stone sealant"],
            excludes: []
          }
        ],
        disclaimer: "Please ensure adequate water supply and access to electrical points on each floor.",
        requirements: "Customers are requested to provide buckets with water, power points, and a ladder or stool for height reach."
      }
    ];

    for (const s of fullHouseServices) {
      try {
        const rows = await query("SELECT id FROM services WHERE id = ?", [s.id]);
        if (rows.length === 0) {
          console.log(`Seeding missing Full House service: ${s.title} (${s.id})`);
          await query(
            "INSERT INTO services (id, categoryId, title, price, description, includes, image, plans, disclaimer, requirements, precautions, payment_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
              s.id,
              s.categoryId,
              s.title,
              s.price,
              s.description,
              JSON.stringify(s.includes),
              s.image,
              JSON.stringify(s.plans),
              s.disclaimer,
              s.requirements,
              JSON.stringify(s.precautions || null),
              "full"
            ]
          );
        }
      } catch (e) {
        console.warn(`Failed to seed Full House service ${s.id}:`, e.message);
      }
    }

    console.log("MySQL Database verified. Categories and tables exist.");
      // Migrate existing services if they have empty plans, disclaimer or cover images
      const defaultServicesPlans = [
        {
          id: "house",
          disclaimer:
            "Please ensure all valuables are removed or securely stored before our professionals arrive.",
          image:
            "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
          requirements:
            "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for smooth height reach cleaning.",
          plans: [
            {
              name: "Single Living Room Express",
              price: 699,
              duration: "1 hour",
              description:
                "Refresh your Living Room with our professional basic cleaning service, including window cleaning, wall & ceiling dusting.",
              includes: [
                "Dry dusting of TV unit and exterior cleaning of furniture surfaces only",
                "Manual floor scrubbing & mopping",
              ],
              excludes: [
                "Cleaning of kitchen & bathroom windows is not included",
                "Exterior glass beyond safe reach (upper floors without balcony) is not included",
              ],
            },
            {
              name: "Single Living Room Elite",
              price: 1099,
              duration: "2 hours",
              description:
                "Refresh your Living Room with our professional advanced cleaning service, including window cleaning, wall & ceiling sanitization.",
              includes: [
                "Dry dusting of TV unit and exterior cleaning of furniture surfaces only",
                "Manual floor scrubbing & mopping",
              ],
              excludes: [
                "Cleaning of kitchen & bathroom windows is not included",
                "Exterior glass beyond safe reach (upper floors without balcony) is not included",
              ],
            },
          ],
        },
        {
          id: "kitchen",
          disclaimer:
            "Admins advise kitchen utensils be placed in closed cabinets before service.",
          image:
            "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
          requirements:
            "Customer is requested to keep kitchen counters empty before service visits.",
          plans: [
            {
              name: "Express",
              price: 999,
              duration: "2 hours",
              description:
                "Quick wipe down, cabinet outer wiping and counter cleaning.",
              includes: [
                "Countertop wipe",
                "Outer cabinet wipe",
                "Sink polish",
              ],
              excludes: ["Chimney filter scrubbing"],
            },
            {
              name: "Elite",
              price: 1599,
              duration: "3 hours",
              description:
                "Complete kitchen degreasing, chimney filter scrubbing, and tile steam wipe.",
              includes: [
                "Countertop degreasing",
                "Chimney baffle scrub",
                "Wall tiles scrub",
                "Cabinet inside-out clean",
              ],
              excludes: ["Exhaust fan repair"],
            },
          ],
        },
        {
          id: "bath",
          disclaimer: "Admins advise clear floor path in washrooms.",
          image:
            "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
          requirements: "Provision of running hot water is highly appreciated.",
          plans: [
            {
              name: "Express",
              price: 599,
              duration: "1.5 hours",
              description: "Basic sanitization of sink and toilet bowl.",
              includes: ["Sink wash", "WC sanitization", "Mirror wipe"],
              excludes: ["Wall tile descaling"],
            },
            {
              name: "Elite",
              price: 999,
              duration: "2.5 hours",
              description:
                "Complete descaling and floor scrubbing of bathroom.",
              includes: [
                "WC descaling",
                "Limescale removal from fixtures",
                "Floor deep scrub",
                "Wall tiles scrub",
              ],
              excludes: ["Exhaust fan repair"],
            },
          ],
        },
        {
          id: "sofa",
          disclaimer: "Drying takes 3-4 hours post extraction.",
          image:
            "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80",
          requirements:
            "Customers are requested to keep fans running post upholstery wash to aid drying.",
          plans: [
            {
              name: "Express",
              price: 499,
              duration: "1 hour",
              description: "Dry vacuuming and fabric sanitization.",
              includes: ["Fabric dry vacuum", "Odor removal spray"],
              excludes: ["Wet extraction cleaning"],
            },
            {
              name: "Elite",
              price: 899,
              duration: "2 hours",
              description:
                "Wet injection-extraction shampoo scrub for stain removal.",
              includes: [
                "Eco-shampoo scrubbing",
                "Wet spot extraction",
                "Dry vacuuming",
              ],
              excludes: ["Leather polishing"],
            },
          ],
        },
      ];

      for (const s of defaultServicesPlans) {
        try {
          const rows = await query(
            "SELECT plans, disclaimer, image, requirements FROM services WHERE id = ?",
            [s.id],
          );
          if (rows.length > 0) {
            const row = rows[0];
            const hasNoPlans =
              !row.plans || row.plans === "null" || row.plans === "[]";
            const hasNoDisclaimer = !row.disclaimer;
            const hasNoImage = !row.image;
            const hasNoReqs = !row.requirements;
            if (hasNoPlans || hasNoDisclaimer || hasNoImage || hasNoReqs) {
              const plansString = JSON.stringify(s.plans || []);
              await query(
                "UPDATE services SET plans = ?, disclaimer = ?, image = ?, requirements = ? WHERE id = ?",
                [
                  plansString,
                  s.disclaimer || null,
                  s.image || null,
                  s.requirements || null,
                  s.id,
                ],
              );
              console.log(`Updated plans & meta for existing service: ${s.id}`);
            }
          }
        } catch (e) {
          console.warn(`Failed to update seed service ${s.id}:`, e.message);
        }
      }
      // Seed customized services
      console.log("Verifying customized services catalog...");
      const defaultCustomized = [
        {
          id: "living-room-cleaning",
          title: "Living room Deep Cleaning (Only For Flats)",
          price: 699,
          image: "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80",
          plans: [
            {
              name: "Single Living Room Express (only for flat)",
              price: 699,
              duration: "40 - 50 min",
              description: "Refresh your Living Room with our professional basic cleaning service, including window cleaning, wall & ceiling dry dusting, manual floor scrubbing, appliance cleaning, and exterior furniture dusting.",
              includes: [
                "Dry dusting of TV unit and exterior cleaning of furniture surfaces only",
                "Window cleaning & glass surface wiping"
              ],
              excludes: [
                "Cleaning of kitchen & bathroom windows is not included",
                "Collapsible mosquito nets and Curtains wet cleaning are not included"
              ]
            },
            {
              name: "Single Living Room Exclusive (only for flat)",
              price: 1099,
              duration: "1 hour",
              description: "Refresh your Living Room with our professional advance cleaning service, including window cleaning, wall & ceiling dry dusting, manual floor scrubbing, appliance cleaning, and exterior furniture dusting.",
              includes: [
                "Window cleaning & glass surface wiping",
                "Wall & ceiling dry dusting"
              ],
              excludes: [
                "Collapsible mosquito nets are not included",
                "Decorative or etched glass requiring special polishing is not included"
              ]
            }
          ]
        },
        {
          id: "kitchen-deep-cleaning",
          title: "Kitchen Deep Cleaning Service",
          price: 1049,
          image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
          plans: [
            {
              name: "Full Occupied Kitchen Deep Cleaning With Chimney",
              price: 2346,
              duration: "4 hours",
              description: "Our professional kitchen deep cleaning service includes detailed cleaning of chimney cabinets, trolleys, kitchen platforms, gas stoves, and appliance exteriors to remove oil, grease, and food stains.",
              includes: [
                "Service delivered by trained and professional cleaning experts",
                "Careful removal and placement of utensils during the cleaning process"
              ],
              excludes: [
                "Internal deep cleaning and filter removal of automatic chimneys",
                "Cleaning services for commercial kitchens"
              ]
            },
            {
              name: "Full Occupied Kitchen Deep Cleaning without chimney",
              price: 1947,
              duration: "3 hours",
              description: "Our professional kitchen deep cleaning service includes detailed cleaning of cabinets, trolleys, kitchen platforms, gas stoves, and appliance exteriors to remove oil, grease, and food stains.",
              includes: [
                "Removal of oil, grease & food stains from cabinet and kitchen surfaces",
                "Complete cleaning of kitchen cabinets & trolleys (inside and outside)"
              ],
              excludes: [
                "Internal deep cleaning and filter removal of automatic chimneys",
                "Cleaning services for commercial kitchens"
              ]
            },
            {
              name: "Empty Kitchen Cleaning (Only for flats)",
              price: 1049,
              duration: "2 hours",
              description: "Our Empty Kitchen Cleaning service is specially designed for vacant or unfurnished flats where no utensils are present. This service focuses on cleaning cabinets, platforms, tiles, and basic appliances.",
              includes: [
                "Complete cleaning of empty kitchen cabinets & trolleys (inside and outside)",
                "Deep cleaning of kitchen slab / platform and sink area"
              ],
              excludes: [
                "Wet wiping/cleaning of walls, ceiling, or false ceiling",
                "Cleaning of utility area / dry balcony attached to the kitchen"
              ]
            },
            {
              name: "Only trolley & cabinets cleaning",
              price: 1249,
              duration: "1 hour",
              description: "Our Kitchen Trolley Cleaning Service includes deep cleaning of kitchen cabinets and trolleys to remove oil, grease, stains, and dirt from both interior and exterior surfaces.",
              includes: [
                "Utensils removal and placing back after cleaning",
                "Removal of oil, grease, sticky marks & food stains"
              ],
              excludes: [
                "Cleaning of utility area / dry balcony attached to the kitchen",
                "Wet wiping/cleaning of walls, ceiling, or false ceiling"
              ]
            }
          ]
        },
        {
          id: "bathroom-deep-cleaning",
          title: "Bathroom Deep Cleaning Service",
          price: 349,
          image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
          plans: [
            {
              name: "Chemical wash (Manual cleaning )",
              price: 349,
              duration: "30 - 40 min",
              description: "Ideal for routinely used bathrooms. Involves a thorough manual deep clean with professional-grade chemicals to eliminate dirt, stains, and germs.",
              includes: [
                "Manual hand scrubbing of bathroom floor & wall tiles",
                "Deep cleaning of toilet, wash basin & bathroom fittings"
              ],
              excludes: [
                "Tough hard-water stain removal is not included",
                "Deep grout cleaning is not included"
              ]
            },
            {
              name: "Scrubbing Machine-Based Cleaning",
              price: 399,
              duration: "40 - 50 min",
              description: "Best for deep stains & superior hygiene. Advanced bathroom deep cleaning using scrubbing machines and professional chemicals.",
              includes: [
                "Machine-based floor & wall scrubbing",
                "Enhanced sanitization & odor control"
              ],
              excludes: [
                "Wet cleaning/wiping of walls, ceiling, or false ceiling",
                "Any repair, electrical, or maintenance work"
              ]
            }
          ]
        },
        {
          id: "bedroom-cleaning",
          title: "Bedroom Deep Cleaning (Only For Flats)",
          price: 649,
          image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
          plans: [
            {
              name: "Single Bedroom Express (Only for flats)",
              price: 649,
              duration: "40 - 50 min",
              description: "Refresh your bedroom with our professional basic cleaning service, including window cleaning, wall & ceiling dry dusting, manual floor scrubbing, appliance cleaning, and exterior furniture dusting.",
              includes: [
                "Window cleaning & glass surface wiping",
                "Wall & ceiling dry dusting"
              ],
              excludes: [
                "Unsafe or inaccessible window areas will not be covered under the service",
                "Bathroom cleaning is not included"
              ]
            },
            {
              name: "Single Bedroom Exclusive (Only for Flats)",
              price: 1199,
              duration: "1 hour",
              description: "A detailed deep cleaning service including mattress shampooing, floor scrubbing, window & grill cleaning, appliance cleaning, and exterior furniture wiping.",
              includes: [
                "Wall and ceiling dry dusting",
                "Mattress & headrest shampooing"
              ],
              excludes: [
                "Unsafe or inaccessible window areas will not be covered",
                "Bathroom cleaning and duct area"
              ]
            }
          ]
        },
        {
          id: "balcony-cleaning",
          title: "Balcony Cleaning Service",
          price: 389,
          image: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",
          plans: [
            {
              name: "Small Balcony – Up to 25 Sq Ft",
              price: 389,
              duration: "30 - 40 min",
              description: "Ideal for compact balconies. Deep cleaning to remove dust, stains, and pollution buildup, making your balcony clean and hygienic.",
              includes: [
                "✔ Floor deep cleaning (wet scrubbing)",
                "✔ Railing & grill cleaning"
              ],
              excludes: [
                "✖ Ceiling cleaning",
                "✖ Garbage disposal outside premises"
              ]
            },
            {
              name: "Medium Balcony (Up to 50 Sq Ft)",
              price: 539,
              duration: "40 - 50 min",
              description: "Recommended use: Spacious balconies, plant areas, seating zones, higher dirt buildup.",
              includes: [
                "✔ Floor deep cleaning (wet scrubbing)",
                "✔ Railing & grill cleaning"
              ],
              excludes: [
                "✖ Ceiling cleaning",
                "✖ Garbage disposal outside premises"
              ]
            },
            {
              name: "Large Balcony (up to 150 sq feet )",
              price: 799,
              duration: "2 hours",
              description: "Recommended use: Spacious balconies, plant areas, seating zones, higher dirt buildup.",
              includes: [
                "✔ Floor deep cleaning (wet scrubbing)",
                "✔ Railing & grill cleaning"
              ],
              excludes: [
                "✖ Ceiling cleaning",
                "✖ Garbage disposal outside premises"
              ]
            }
          ]
        },
        {
          id: "terrace-cleaning",
          title: "Terrace Cleaning Service",
          price: 1999,
          image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
          plans: [
            {
              name: "Small Terrace (Up to 200 sq ft)",
              price: 1999,
              duration: "1 hour",
              description: "Deep cleaning of open terrace areas to remove dust, algae, mud, bird droppings, and weather stains.",
              includes: [
                "✔ Floor deep cleaning (wet scrubbing)",
                "✔ Removal of mud, dust & algae buildup"
              ],
              excludes: [
                "✖ Gardening / plant maintenance",
                "✖ Garbage disposal outside premises"
              ]
            },
            {
              name: "Medium Terrace (up to 500 sq ft)",
              price: 3499,
              duration: "2 hours",
              description: "Deep cleaning of open terrace areas to remove dust, algae, mud, bird droppings, and weather stains.",
              includes: [
                "✔ Floor deep cleaning (wet scrubbing)",
                "✔ Removal of mud, dust & algae buildup"
              ],
              excludes: [
                "✖ Gardening / plant maintenance",
                "✖ Garbage disposal outside premises"
              ]
            },
            {
              name: "Large Terrace (up to 1000 sq ft)",
              price: 5499,
              duration: "4 hours",
              description: "Deep cleaning of open terrace areas to remove dust, algae, mud, bird droppings, and weather stains.",
              includes: [
                "✔ Floor deep cleaning (wet scrubbing)",
                "✔ Removal of mud, dust & algae buildup"
              ],
              excludes: [
                "✖ Gardening / plant maintenance",
                "✖ Garbage disposal outside premises"
              ]
            }
          ]
        },
        {
          id: "sofa-shampooing",
          title: "Sofa Shampooing & Upholstery Cleaning",
          price: 469,
          image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80",
          plans: [
            { name: "Sofa Shampoo Wash (up to 3 seater)", price: 469, duration: "40 - 50 min", description: "Your sofa collects dust, stains, food spills, and allergens over time. Upholstery Shampooing Service restores freshness, hygiene, and comfort.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (4 seater)", price: 599, duration: "40 - 50 min", description: "Your sofa collects dust, stains, food spills, and allergens over time. Upholstery Shampooing Service restores freshness, hygiene, and comfort.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (5 seater)", price: 749, duration: "50 - 60 min", description: "Your sofa collects dust, stains, food spills, and allergens over time. Upholstery Shampooing Service restores freshness, hygiene, and comfort.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (6 seater)", price: 799, duration: "1 hour", description: "Your sofa collects dust, stains, food spills, and allergens over time. Upholstery Shampooing Service restores freshness, hygiene, and comfort.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (7 seater)", price: 899, duration: "1 hour", description: "Your sofa collects dust, stains, food spills, and allergens over time. Upholstery Shampooing Service restores freshness, hygiene, and comfort.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (8 seater)", price: 1049, duration: "1 hour", description: "Your sofa collects dust, stains, food spills, and allergens over time. Upholstery Shampooing Service restores freshness, hygiene, and comfort.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (9 seater)", price: 1149, duration: "1 hour", description: "Your sofa collects dust, stains, food spills, and allergens over time. Upholstery Shampooing Service restores freshness, hygiene, and comfort.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (10 seater)", price: 1249, duration: "1 hour", description: "Your sofa collects dust, stains, food spills, and allergens over time. Upholstery Shampooing Service restores freshness, hygiene, and comfort.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (11 seater)", price: 1499, duration: "1 hour", description: "Your sofa collects dust, stains, food spills, and allergens over time. Upholstery Shampooing Service restores freshness, hygiene, and comfort.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (12 seater)", price: 1599, duration: "1 hour", description: "Your sofa collects dust, stains, food spills, and allergens over time. Upholstery Shampooing Service restores freshness, hygiene, and comfort.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] }
          ]
        },
        {
          id: "carpet-cleaning",
          title: "Carpet Cleaning Service",
          price: 499,
          image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80",
          plans: [
            { name: "Small Carpet (Up to 50 Sq Ft)", price: 499, duration: "30 - 40 min", description: "Ideal for bedside rugs, prayer mats, small area carpets.", includes: ["Dust & stains removal (vacuuming)", "Shampoo-based wash", "Stain & spot treatment (basic)", "Fabric-safe cleaning chemicals"], excludes: ["Paint / cement / permanent stain removal", "Color restoration guarantee"] },
            { name: "Medium Carpet (50–100 Sq Ft)", price: 649, duration: "40 - 50 min", description: "Living room carpets, medium-sized rugs.", includes: ["Dust & stains removal (vacuuming)", "Shampoo-based wash", "Stain & spot treatment (basic)", "Fabric-safe cleaning chemicals"], excludes: ["Drying via heaters or blowers", "Paint / cement / permanent stain removal"] },
            { name: "Large Carpet (100–150 Sq Ft)", price: 799, duration: "1 hour", description: "Living room carpets, medium-sized rugs.", includes: ["Dust & stains removal (vacuuming)", "Shampoo-based wash", "Stain & spot treatment (basic)", "Fabric-safe cleaning chemicals"], excludes: ["Drying via heaters or blowers", "Paint / cement / permanent stain removal"] },
            { name: "Extra Large Carpet (150–200 Sq Ft)", price: 949, duration: "1 - 2 hours", description: "Ideal for bedside rugs, prayer mats, large area carpets.", includes: ["Dust & stains removal (vacuuming)", "Shampoo-based wash", "Stain & spot treatment (basic)", "Fabric-safe cleaning chemicals"], excludes: ["Drying via heaters or blowers", "Paint / cement / permanent stain removal"] }
          ]
        },
        {
          id: "chimney-cleaning",
          title: "Chimney Cleaning Service",
          price: 350,
          image: "https://images.unsplash.com/photo-1521905252507-b354bc25edac?auto=format&fit=crop&w=800&q=80",
          plans: [
            {
              name: "Standard Chimney",
              price: 350,
              duration: "40 - 50 min",
              description: "Professional kitchen chimney cleaning to remove oil, grease, smoke residue.",
              includes: [
                "Re-fixing of filters after cleaning",
                "Smoke, grease & odor removal"
              ],
              excludes: [
                "Motor repair or servicing",
                "Duct pipe / external pipe cleaning"
              ]
            }
          ]
        },
        {
          id: "fridge-cleaning",
          title: "Fridge Cleaning Service",
          price: 349,
          image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
          plans: [
            { name: "Single Door", price: 349, duration: "40 - 50 min", description: "Inside out deep cleaning of single door fridge.", includes: ["Complete inside cleaning of fridge", "Shelves, trays & drawers removal and washing", "Removal of food stains & sticky residue", "Odour removal & sanitization", "Exterior body cleaning", "Handle & rubber lining cleaning"], excludes: ["Appliance repair or servicing", "Electrical or wiring work"] },
            { name: "Double Door", price: 499, duration: "40 - 50 min", description: "Inside out deep cleaning of double door fridge.", includes: ["Complete inside cleaning of fridge", "Shelves, trays & drawers removal and washing", "Removal of food stains & sticky residue", "Odour removal & sanitization", "Exterior body cleaning", "Handle & rubber lining cleaning"], excludes: ["Appliance repair or servicing", "Electrical or wiring work"] },
            { name: "Side by side/ Triple Door", price: 749, duration: "1 hour", description: "Inside out deep cleaning of triple/side by side door fridge.", includes: ["Complete inside cleaning of fridge", "Shelves, trays & drawers removal and washing", "Removal of food stains & sticky residue", "Odour removal & sanitization", "Exterior body cleaning", "Handle & rubber lining cleaning"], excludes: ["Appliance repair or servicing", "Electrical or wiring work"] }
          ]
        },
        {
          id: "exhaust-fan-cleaning",
          title: "Exhaust Fan Cleaning Service",
          price: 89,
          image: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=800&q=80",
          plans: [
            {
              name: "Express",
              price: 89,
              duration: "20 - 30 min",
              description: "Best for: Bathroom exhaust light dust & regular maintenance.",
              includes: ["Dust & light grease removal", "Re-fixing after cleaning"],
              excludes: ["Duct / pipe cleaning", "Motor or electrical servicing"]
            },
            {
              name: "Elite",
              price: 149,
              duration: "30 - 40 min",
              description: "Best for: Kitchen exhaust fans with oil buildup.",
              includes: ["Exterior body cleaning", "Proper re-fixing"],
              excludes: ["Motor opening or repair", "External duct / chimney pipe cleaning"]
            },
            {
              name: "Exclusive",
              price: 299,
              duration: "40 - 50 min",
              description: "Best for: Heavy oil, long-time uncleaned exhaust fans.",
              includes: ["Deep degreasing of fan blades & grill", "Inner housing surface cleaning (accessible areas)"],
              excludes: ["Replacement of damaged parts", "Duct pipe removal"]
            }
          ]
        },
        {
          id: "mini-services",
          title: "Mini Services",
          price: 59,
          image: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=800&q=80",
          plans: [
            { name: "Living/bedroom Ceiling fan cleaning", price: 59, duration: "30 - 40 min", description: "Ceiling fan cleaning including dry dusting & wet wiping.", includes: ["Dry dusting to remove dust, dirt & debris from fan surfaces", "Stain and spot removal using suitable cleaning solutions"], excludes: ["Heavy grease or hard stain removal is not included", "High-rise or unsafe area cleaning is not included"] },
            { name: "Kitchen Ceiling fan cleaning", price: 89, duration: "30 - 40 min", description: "Kitchen fan cleaning with oil grease removal.", includes: ["Dry dusting to remove dust, dirt & debris from fan surfaces", "Stain and spot removal using suitable cleaning solutions"], excludes: ["Heavy grease or hard stain removal is not included", "High-rise or unsafe area cleaning is not included"] },
            { name: "Bathroom Exhaust Fan", price: 59, duration: "30 - 40 min", description: "Sanitization and cleaning of bathroom exhaust fan.", includes: ["Dust & light grease removal", "Re-fixing of parts after cleaning"], excludes: ["Window, duct or pipe cleaning is not included", "Motor repair, electrical work, or servicing is not included"] },
            { name: "Kitchen Exhaust Fan", price: 89, duration: "30 - 40 min", description: "Degreasing and cleaning of kitchen exhaust fan.", includes: ["Exhaust fan grill & blade deep cleaning", "Oil & grease removal using suitable degreasers"], excludes: ["Motor opening, repair, or servicing is not included", "commercial exhaust fan not included"] },
            { name: "Kitchen Appliance Cleaning with single door fridge", price: 999, duration: "2 hours", description: "Professional appliance combo deep cleaning (Fridge + Chimney + Exhaust + Fan).", includes: ["Final hygiene & quality check after service completion", "Deep chimney degreasing including filters & body cleaning"], excludes: ["Internal deep cleaning and filter removal of automatic chimneys", "Cleaning services for commercial kitchens"] },
            { name: "Kitchen Appliance Cleaning with Double door fridge", price: 1199, duration: "2 hours", description: "Professional appliance combo deep cleaning (Double Door Fridge + Chimney + Exhaust + Fan).", includes: ["Final hygiene & quality check after service completion", "Deep chimney degreasing including filters & body cleaning"], excludes: ["Internal deep cleaning and filter removal of automatic chimneys", "Cleaning services for commercial kitchens"] },
            { name: "Kitchen Appliance Cleaning with Side by side door fridge", price: 1399, duration: "3 hours", description: "Professional appliance combo deep cleaning (Side by Side Fridge + Chimney + Exhaust + Fan).", includes: ["Final hygiene & quality check after service completion", "Deep chimney degreasing including filters & body cleaning"], excludes: ["Internal deep cleaning and filter removal of automatic chimneys", "Cleaning services for commercial kitchens"] }
          ]
        },
        {
          id: "mattress-shampooing",
          title: "Mattress Shampooing Service",
          price: 349,
          image: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=800&q=80",
          plans: [
            {
              name: "Mattress Shampooing wash (Single Bed)",
              price: 349,
              duration: "30 - 40 min",
              description: "Deep cleaning to remove dust mites, sweat, stains, allergens, and bad odour.",
              includes: ["High-power vacuuming to remove dust & hair", "Shampoo / foam-based deep cleaning"],
              excludes: ["Mattress repair, stitching or replacement", "Permanent stains or chemical burns"]
            },
            {
              name: "Mattress Shampooing wash (Double Bed)",
              price: 599,
              duration: "1 hour",
              description: "Deep cleaning to remove dust mites, sweat, stains, allergens, and bad odour.",
              includes: ["High-power vacuuming to remove dust & hair", "Shampoo / foam-based deep cleaning"],
              excludes: ["Bed frame or cot cleaning", "Mold removal due to water seepage"]
            }
          ]
        },
        {
          id: "dining-cleaning",
          title: "Dining Table & Chairs Cleaning",
          price: 249,
          image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
          plans: [
            { name: "4 Seater", price: 249, duration: "20 - 30 min", description: "Detailed cleaning of 4 seater dining table & chairs.", includes: ["Dining table surface cleaning", "Chair seat & backrest cleaning", "Fabric chair shampooing", "Food stain & spill removal", "Safe & eco-friendly chemicals"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "5 Seater", price: 299, duration: "20 - 30 min", description: "Detailed cleaning of 5 seater dining table & chairs.", includes: ["Dining table surface cleaning", "Chair seat & backrest cleaning", "Fabric chair shampooing", "Food stain & spill removal", "Safe & eco-friendly chemicals"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "6 Seater", price: 349, duration: "30 - 40 min", description: "Detailed cleaning of 6 seater dining table & chairs.", includes: ["Dining table surface cleaning", "Chair seat & backrest cleaning", "Fabric chair shampooing", "Food stain & spill removal", "Safe & eco-friendly chemicals"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "7 Seater", price: 374, duration: "30 - 40 min", description: "Detailed cleaning of 7 seater dining table & chairs.", includes: ["Dining table surface cleaning", "Chair seat & backrest cleaning", "Fabric chair shampooing", "Food stain & spill removal", "Safe & eco-friendly chemicals"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "8 Seater", price: 424, duration: "30 - 40 min", description: "Detailed cleaning of 8 seater dining table & chairs.", includes: ["Dining table surface cleaning", "Chair seat & backrest cleaning", "Fabric chair shampooing", "Food stain & spill removal", "Safe & eco-friendly chemicals"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "9 Seater", price: 474, duration: "40 - 50 min", description: "Detailed cleaning of 9 seater dining table & chairs.", includes: ["Dining table surface cleaning", "Chair seat & backrest cleaning", "Fabric chair shampooing", "Food stain & spill removal", "Safe & eco-friendly chemicals"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "10 Seater", price: 524, duration: "40 - 50 min", description: "Detailed cleaning of 10 seater dining table & chairs.", includes: ["Dining table surface cleaning", "Chair seat & backrest cleaning", "Fabric chair shampooing", "Food stain & spill removal", "Safe & eco-friendly chemicals"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "Dining Table + Sofa (3 Seater)", price: 899, duration: "1 - 2 hours", description: "Combo cleaning of dining table, chairs, and 3-seater sofa.", includes: ["Dining table surface dry dusting", "Wet wiping with specialised chemicals"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "Dining Table + Sofa (5 Seater)", price: 1099, duration: "1 - 2 hours", description: "Combo cleaning of dining table, chairs, and 5-seater sofa.", includes: ["Food stains, spills & dust removal", "Full dining table & chair cleaning"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "Dining Table + Sofa + Mattress (Best Seller)", price: 1399, duration: "2 hours", description: "Comprehensive combo cleaning of dining table, chairs, sofa, and mattress.", includes: ["Odour & allergen removal", "Dining table & chairs cleaning"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] }
          ]
        }
      ];

      for (const c of defaultCustomized) {
        try {
          const rows = await query(
            "SELECT id FROM customized_services WHERE id = ?",
            [c.id],
          );
          if (rows.length === 0) {
            console.log(`Seeding missing customized service: ${c.title} (${c.id})...`);
            await query(
              "INSERT INTO customized_services (id, title, price, image, plans) VALUES (?, ?, ?, ?, ?)",
              [c.id, c.title, c.price, c.image, JSON.stringify(c.plans)],
            );
          } else {
            console.log(`Customized service ${c.title} (${c.id}) already exists. Skipping seed update to preserve admin modifications.`);
          }
        } catch (e) {
          console.warn(`Failed to seed/update customized service ${c.id}:`, e.message);
        }
      }

      // Seed customized services into regular services table
      console.log("Verifying customized services in regular catalog...");
      const regularCustomizedServices = [
        {
          id: "living-room-cleaning",
          categoryId: "customized",
          title: "Living room Deep Cleaning (Only For Flats)",
          price: 699,
          description: "Refresh your Living Room with our professional basic cleaning service, including window cleaning, wall & ceiling dry dusting, manual floor scrubbing, appliance cleaning, and exterior furniture dusting.",
          image: "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Dry dusting of TV unit and exterior cleaning of furniture surfaces only",
            "Window cleaning & glass surface wiping",
            "Wall & ceiling dry dusting",
            "Manual floor scrubbing"
          ],
          plans: [
            {
              name: "Single Living Room Express (only for flat)",
              price: 699,
              duration: "40 - 50 min",
              description: "Refresh your Living Room with our professional basic cleaning service.",
              includes: [
                "Dry dusting of TV unit and exterior cleaning of furniture surfaces only",
                "Window cleaning & glass surface wiping"
              ],
              excludes: [
                "Cleaning of kitchen & bathroom windows is not included",
                "Collapsible mosquito nets and Curtains wet cleaning are not included"
              ]
            },
            {
              name: "Single Living Room Exclusive (only for flat)",
              price: 1099,
              duration: "1 hour",
              description: "Refresh your Living Room with our professional advance cleaning service.",
              includes: [
                "Window cleaning & glass surface wiping",
                "Wall & ceiling dry dusting"
              ],
              excludes: [
                "Collapsible mosquito nets are not included",
                "Decorative or etched glass requiring special polishing is not included"
              ]
            }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for smooth and effective service completion."
        },
        {
          id: "kitchen-deep-cleaning",
          categoryId: "customized",
          title: "Kitchen Deep Cleaning Service",
          price: 1049,
          description: "Professional kitchen cleaning to remove grease, stains, and dirt from all essential surfaces. Ideal for regular maintenance or as part of a customized cleaning package.",
          image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Countertop & slab cleaning",
            "Sink, tap & tiles area cleaning",
            "Gas stove & appliance exterior cleaning",
            "Cabinet exterior cleaning",
            "Floor cleaning (sweeping & mopping)"
          ],
          plans: [
            {
              name: "Full Occupied Kitchen Deep Cleaning With Chimney",
              price: 2346,
              duration: "4 hours",
              description: "Our professional kitchen deep cleaning service includes detailed cleaning of chimney cabinets, trolleys, kitchen platforms, gas stoves, and appliance exteriors.",
              includes: [
                "Service delivered by trained and professional cleaning experts",
                "Careful removal and placement of utensils during the cleaning process"
              ],
              excludes: [
                "Internal deep cleaning and filter removal of automatic chimneys",
                "Cleaning services for commercial kitchens"
              ]
            },
            {
              name: "Full Occupied Kitchen Deep Cleaning without chimney",
              price: 1947,
              duration: "3 hours",
              description: "Our professional kitchen deep cleaning service includes detailed cleaning of cabinets, trolleys, kitchen platforms, gas stoves, and appliance exteriors.",
              includes: [
                "Removal of oil, grease & food stains from cabinet and kitchen surfaces",
                "Complete cleaning of kitchen cabinets & trolleys (inside and outside)"
              ],
              excludes: [
                "Internal deep cleaning and filter removal of automatic chimneys",
                "Cleaning services for commercial kitchens"
              ]
            },
            {
              name: "Empty Kitchen Cleaning (Only for flats)",
              price: 1049,
              duration: "2 hours",
              description: "Our Empty Kitchen Cleaning service is specially designed for vacant or unfurnished flats where no utensils are present.",
              includes: [
                "Complete cleaning of empty kitchen cabinets & trolleys (inside and outside)",
                "Deep cleaning of kitchen slab / platform and sink area"
              ],
              excludes: [
                "Wet wiping/cleaning of walls, ceiling, or false ceiling",
                "Cleaning of utility area / dry balcony attached to the kitchen"
              ]
            },
            {
              name: "Only trolley & cabinets cleaning",
              price: 1249,
              duration: "1 hour",
              description: "Our Kitchen Trolley Cleaning Service includes deep cleaning of kitchen cabinets and trolleys to remove oil, grease, stains, and dirt.",
              includes: [
                "Utensils removal and placing back after cleaning",
                "Removal of oil, grease, sticky marks & food stains"
              ],
              excludes: [
                "Cleaning of utility area / dry balcony attached to the kitchen",
                "Wet wiping/cleaning of walls, ceiling, or false ceiling"
              ]
            }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for smooth and effective service completion."
        },
        {
          id: "bathroom-deep-cleaning",
          categoryId: "customized",
          title: "Bathroom Deep Cleaning Service",
          price: 349,
          description: "Professional bathroom cleaning to remove stains, germs, and odor buildup. Choose between manual deep cleaning or machine-based scrubbing.",
          image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Floor & wall tile scrubbing (manual)",
            "Toilet, wash basin & fittings cleaning",
            "Tap, shower & drain area cleaning"
          ],
          plans: [
            {
              name: "Chemical wash (Manual cleaning )",
              price: 349,
              duration: "30 - 40 min",
              description: "Ideal for routinely used bathrooms. Involves a thorough manual deep clean with professional-grade chemicals.",
              includes: [
                "Manual hand scrubbing of bathroom floor & wall tiles",
                "Deep cleaning of toilet, wash basin & bathroom fittings"
              ],
              excludes: [
                "Tough hard-water stain removal is not included",
                "Deep grout cleaning is not included"
              ]
            },
            {
              name: "Scrubbing Machine-Based Cleaning",
              price: 399,
              duration: "40 - 50 min",
              description: "Best for deep stains & superior hygiene. Advanced bathroom deep cleaning using scrubbing machines and professional chemicals.",
              includes: [
                "Machine-based floor & wall scrubbing",
                "Enhanced sanitization & odor control"
              ],
              excludes: [
                "Wet cleaning/wiping of walls, ceiling, or false ceiling",
                "Any repair, electrical, or maintenance work"
              ]
            }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for smooth and effective service completion."
        },
        {
          id: "bedroom-cleaning",
          categoryId: "customized",
          title: "Bedroom Deep Cleaning (Only For Flats)",
          price: 649,
          description: "Professional bedroom cleaning to make your space fresh, dust-free, and comfortable. Ideal for regular upkeep or deep hygiene refresh of bedrooms.",
          image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Floor cleaning (sweeping & mopping)",
            "Dusting of furniture (outside only)",
            "Bed frame & side table dusting",
            "Window, glass & grill dust removal",
            "Switchboards, door handles & surfaces wiping",
            "Cobweb removal (if accessible)"
          ],
          plans: [
            {
              name: "Single Bedroom Express (Only for flats)",
              price: 649,
              duration: "40 - 50 min",
              description: "Refresh your bedroom with our professional basic cleaning service.",
              includes: [
                "Window cleaning & glass surface wiping",
                "Wall & ceiling dry dusting"
              ],
              excludes: [
                "Unsafe or inaccessible window areas will not be covered under the service",
                "Bathroom cleaning is not included"
              ]
            },
            {
              name: "Single Bedroom Exclusive (Only for Flats)",
              price: 1199,
              duration: "1 hour",
              description: "A detailed deep cleaning service including mattress shampooing, floor scrubbing, window & grill cleaning.",
              includes: [
                "Wall and ceiling dry dusting",
                "Mattress & headrest shampooing"
              ],
              excludes: [
                "Unsafe or inaccessible window areas will not be covered",
                "Bathroom cleaning and duct area"
              ]
            }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for smooth and effective service completion."
        },
        {
          id: "balcony-cleaning",
          categoryId: "customized",
          title: "Balcony Cleaning Service",
          price: 389,
          description: "Deep balcony cleaning to remove dust, stains, algae, and pollution build-up. Ideal for maintaining a clean, hygienic, and safe outdoor space.",
          image: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Floor deep cleaning (wet scrubbing & stain removal)",
            "Railing & grill cleaning",
            "Wall surface dry dusting",
            "Balcony corners & edges cleaning",
            "Removal of dust, mud & bird droppings"
          ],
          plans: [
            {
              name: "Small Balcony – Up to 25 Sq Ft",
              price: 389,
              duration: "30 - 40 min",
              description: "Ideal for compact balconies. Deep cleaning to remove dust, stains, and pollution buildup.",
              includes: [
                "Floor deep cleaning (wet scrubbing)",
                "Railing & grill cleaning"
              ],
              excludes: [
                "Ceiling cleaning",
                "Garbage disposal outside premises"
              ]
            },
            {
              name: "Medium Balcony (Up to 50 Sq Ft)",
              price: 539,
              duration: "40 - 50 min",
              description: "Recommended use: Spacious balconies, plant areas, seating zones, higher dirt buildup.",
              includes: [
                "Floor deep cleaning (wet scrubbing)",
                "Railing & grill cleaning"
              ],
              excludes: [
                "Ceiling cleaning",
                "Garbage disposal outside premises"
              ]
            },
            {
              name: "Large Balcony (up to 150 sq feet )",
              price: 799,
              duration: "2 hours",
              description: "Recommended use: Spacious balconies, plant areas, seating zones, higher dirt buildup.",
              includes: [
                "Floor deep cleaning (wet scrubbing)",
                "Railing & grill cleaning"
              ],
              excludes: [
                "Ceiling cleaning",
                "Garbage disposal outside premises"
              ]
            }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for smooth and effective service completion."
        },
        {
          id: "terrace-cleaning",
          categoryId: "customized",
          title: "Terrace Cleaning Service",
          price: 1999,
          description: "Deep cleaning of open terrace areas to remove dust, algae, mud, bird droppings, and weather stains, making your terrace safe, clean, and usable.",
          image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Floor deep cleaning (wet scrubbing & stain removal)",
            "Railing & grill cleaning",
            "Removal of mud, dust, algae & bird droppings",
            "Terrace edges & corners cleaning"
          ],
          plans: [
            {
              name: "Small Terrace (Up to 200 sq ft)",
              price: 1999,
              duration: "1 hour",
              description: "Deep cleaning of open terrace areas to remove dust, algae, mud, bird droppings.",
              includes: [
                "Floor deep cleaning (wet scrubbing)",
                "Removal of mud, dust & algae buildup"
              ],
              excludes: [
                "Gardening / plant maintenance",
                "Garbage disposal outside premises"
              ]
            },
            {
              name: "Medium Terrace (up to 500 sq ft)",
              price: 3499,
              duration: "2 hours",
              description: "Deep cleaning of open terrace areas to remove dust, algae, mud, bird droppings.",
              includes: [
                "Floor deep cleaning (wet scrubbing)",
                "Removal of mud, dust & algae buildup"
              ],
              excludes: [
                "Gardening / plant maintenance",
                "Garbage disposal outside premises"
              ]
            },
            {
              name: "Large Terrace (up to 1000 sq ft)",
              price: 5499,
              duration: "4 hours",
              description: "Deep cleaning of open terrace areas to remove dust, algae, mud, bird droppings.",
              includes: [
                "Floor deep cleaning (wet scrubbing)",
                "Removal of mud, dust & algae buildup"
              ],
              excludes: [
                "Gardening / plant maintenance",
                "Garbage disposal outside premises"
              ]
            }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for smooth and effective service completion."
        },
        {
          id: "sofa-shampooing",
          categoryId: "customized",
          title: "Sofa Shampooing & Upholstery Cleaning",
          price: 469,
          description: "Your sofa collects dust, stains, food spills, and allergens over time. The Deep CleanerZ Sofa Shampooing Service uses professional injection-extraction shampooing machines and safe eco-friendly chemicals to restore freshness, hygiene, and comfort.",
          image: "/images/service-sofa.jpg",
          includes: [
            "Pre-vacuuming to remove loose dust",
            "Shampoo & foam application",
            "Machine-based deep scrubbing",
            "Stain & spot treatment",
            "Cushion cleaning (front & back)",
            "Moisture extraction & final wipe"
          ],
          plans: [
            { name: "Sofa Shampoo Wash (up to 3 seater)", price: 469, duration: "40 - 50 min", description: "Your sofa collects dust, stains, food spills, and allergens over time.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (4 seater)", price: 599, duration: "40 - 50 min", description: "Your sofa collects dust, stains, food spills, and allergens over time.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (5 seater)", price: 749, duration: "50 - 60 min", description: "Your sofa collects dust, stains, food spills, and allergens over time.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (6 seater)", price: 799, duration: "1 hour", description: "Your sofa collects dust, stains, food spills, and allergens over time.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (7 seater)", price: 899, duration: "1 hour", description: "Your sofa collects dust, stains, food spills, and allergens over time.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (8 seater)", price: 1049, duration: "1 hour", description: "Your sofa collects dust, stains, food spills, and allergens over time.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (9 seater)", price: 1149, duration: "1 hour", description: "Your sofa collects dust, stains, food spills, and allergens over time.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (10 seater)", price: 1249, duration: "1 hour", description: "Your sofa collects dust, stains, food spills, and allergens over time.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (11 seater)", price: 1499, duration: "1 hour", description: "Your sofa collects dust, stains, food spills, and allergens over time.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] },
            { name: "Sofa Shampoo Wash (12 seater)", price: 1599, duration: "1 hour", description: "Your sofa collects dust, stains, food spills, and allergens over time.", includes: ["Pre-vacuuming to remove loose dust", "Shampoo & foam application", "Machine-based deep scrubbing", "Stain & spot treatment", "Cushion cleaning (front & back)", "Moisture extraction & final wipe"], excludes: ["Fabric repair or foam fixing", "Colour restoration or dyeing"] }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for smooth and effective service completion."
        },
        {
          id: "carpet-cleaning",
          categoryId: "customized",
          title: "Carpet Cleaning Service",
          price: 499,
          description: "Professional carpet cleaning to remove dust, stains, allergens, and odours. Ideal for homes with kids, pets, and high foot traffic.",
          image: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Dust & stains removal (vacuuming)",
            "Shampoo-based wash",
            "Stain & spot treatment (basic)",
            "Fabric-safe cleaning chemicals"
          ],
          plans: [
            { name: "Small Carpet (Up to 50 Sq Ft)", price: 499, duration: "30 - 40 min", description: "Ideal for bedside rugs, prayer mats, small area carpets.", includes: ["Dust & stains removal (vacuuming)", "Shampoo-based wash", "Stain & spot treatment (basic)", "Fabric-safe cleaning chemicals"], excludes: ["Paint / cement / permanent stain removal", "Color restoration guarantee"] },
            { name: "Medium Carpet (50–100 Sq Ft)", price: 649, duration: "40 - 50 min", description: "Living room carpets, medium-sized rugs.", includes: ["Dust & stains removal (vacuuming)", "Shampoo-based wash", "Stain & spot treatment (basic)", "Fabric-safe cleaning chemicals"], excludes: ["Drying via heaters or blowers", "Paint / cement / permanent stain removal"] },
            { name: "Large Carpet (100–150 Sq Ft)", price: 799, duration: "1 hour", description: "Living room carpets, medium-sized rugs.", includes: ["Dust & stains removal (vacuuming)", "Shampoo-based wash", "Stain & spot treatment (basic)", "Fabric-safe cleaning chemicals"], excludes: ["Drying via heaters or blowers", "Paint / cement / permanent stain removal"] },
            { name: "Extra Large Carpet (150–200 Sq Ft)", price: 949, duration: "1 - 2 hours", description: "Ideal for bedside rugs, prayer mats, large area carpets.", includes: ["Dust & stains removal (vacuuming)", "Shampoo-based wash", "Stain & spot treatment (basic)", "Fabric-safe cleaning chemicals"], excludes: ["Drying via heaters or blowers", "Paint / cement / permanent stain removal"] }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for smooth and effective service completion."
        },
        {
          id: "chimney-cleaning",
          categoryId: "customized",
          title: "Chimney Cleaning Service",
          price: 350,
          description: "Professional kitchen chimney cleaning to remove oil, grease, smoke residue, and odor using safe degreasers and manual deep-cleaning methods.",
          image: "https://images.unsplash.com/photo-1521905252507-b354bc25edac?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Re-fixing of filters after cleaning",
            "Smoke, grease & odor removal"
          ],
          plans: [
            {
              name: "Standard Chimney",
              price: 350,
              duration: "40 - 50 min",
              description: "Professional kitchen chimney cleaning to remove oil, grease, smoke residue.",
              includes: [
                "Re-fixing of filters after cleaning",
                "Smoke, grease & odor removal"
              ],
              excludes: [
                "Motor repair or servicing",
                "Duct pipe / external pipe cleaning"
              ]
            }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for smooth and effective service completion."
        },
        {
          id: "fridge-cleaning",
          categoryId: "customized",
          title: "Fridge Cleaning Service",
          price: 349,
          description: "Fridge Cleaning Service by The Deep CleanerZ ensures your refrigerator is thoroughly deep cleaned, food-grade sanitized, and odour-free.",
          image: "/images/service-fridge.jpg",
          includes: [
            "Complete inside cleaning of fridge",
            "Shelves, trays & drawers removal and washing",
            "Removal of food stains & sticky residue",
            "Odour removal & sanitization",
            "Exterior body cleaning",
            "Handle & rubber lining cleaning"
          ],
          plans: [
            { name: "Single Door", price: 349, duration: "40 - 50 min", description: "Inside out deep cleaning of single door fridge.", includes: ["Complete inside cleaning of fridge", "Shelves, trays & drawers removal and washing", "Removal of food stains & sticky residue", "Odour removal & sanitization", "Exterior body cleaning", "Handle & rubber lining cleaning"], excludes: ["Appliance repair or servicing", "Electrical or wiring work"] },
            { name: "Double Door", price: 499, duration: "40 - 50 min", description: "Inside out deep cleaning of double door fridge.", includes: ["Complete inside cleaning of fridge", "Shelves, trays & drawers removal and washing", "Removal of food stains & sticky residue", "Odour removal & sanitization", "Exterior body cleaning", "Handle & rubber lining cleaning"], excludes: ["Appliance repair or servicing", "Electrical or wiring work"] },
            { name: "Side by side/ Triple Door", price: 749, duration: "1 hour", description: "Inside out deep cleaning of triple/side by side door fridge.", includes: ["Complete inside cleaning of fridge", "Shelves, trays & drawers removal and washing", "Removal of food stains & sticky residue", "Odour removal & sanitization", "Exterior body cleaning", "Handle & rubber lining cleaning"], excludes: ["Appliance repair or servicing", "Electrical or wiring work"] }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for smooth and effective service completion."
        },
        {
          id: "exhaust-fan-cleaning",
          categoryId: "customized",
          title: "Exhaust Fan Cleaning Service",
          price: 89,
          description: "Professional exhaust fan cleaning to remove oil, grease, dust, and odor buildup, ensuring better airflow, hygiene, and longer fan life.",
          image: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Deep degreasing of fan blades & grill",
            "Inner housing surface cleaning (accessible areas)",
            "Exterior body cleaning & re-fixing"
          ],
          plans: [
            {
              name: "Express",
              price: 89,
              duration: "20 - 30 min",
              description: "Best for: Bathroom exhaust light dust & regular maintenance.",
              includes: ["Dust & light grease removal", "Re-fixing after cleaning"],
              excludes: ["Duct / pipe cleaning", "Motor or electrical servicing"]
            },
            {
              name: "Elite",
              price: 149,
              duration: "30 - 40 min",
              description: "Best for: Kitchen exhaust fans with oil buildup.",
              includes: ["Exterior body cleaning", "Proper re-fixing"],
              excludes: ["Motor opening or repair", "External duct / chimney pipe cleaning"]
            },
            {
              name: "Exclusive",
              price: 299,
              duration: "40 - 50 min",
              description: "Best for: Heavy oil, long-time uncleaned exhaust fans.",
              includes: ["Deep degreasing of fan blades & grill", "Inner housing surface cleaning (accessible areas)"],
              excludes: ["Replacement of damaged parts", "Duct pipe removal"]
            }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for smooth and effective service completion."
        },
        {
          id: "mini-services",
          categoryId: "customized",
          title: "Mini Services",
          price: 59,
          description: "Complete appliance cleaning combo covering chimney, fridge, exhaust fan, ceiling fan, microwave/oven, switchboards & lights.",
          image: "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Chimney cleaning",
            "Fridge cleaning (interior & exterior)",
            "Exhaust fan cleaning",
            "Ceiling fan cleaning",
            "Microwave / oven cleaning",
            "Switchboards & light fixtures wiping"
          ],
          plans: [
            { name: "Living/bedroom Ceiling fan cleaning", price: 59, duration: "30 - 40 min", description: "Ceiling fan cleaning including dry dusting & wet wiping.", includes: ["Dry dusting to remove dust, dirt & debris from fan surfaces", "Stain and spot removal using suitable cleaning solutions"], excludes: ["Heavy grease or hard stain removal is not included", "High-rise or unsafe area cleaning is not included"] },
            { name: "Kitchen Ceiling fan cleaning", price: 89, duration: "30 - 40 min", description: "Kitchen fan cleaning with oil grease removal.", includes: ["Dry dusting to remove dust, dirt & debris from fan surfaces", "Stain and spot removal using suitable cleaning solutions"], excludes: ["Heavy grease or hard stain removal is not included", "High-rise or unsafe area cleaning is not included"] },
            { name: "Bathroom Exhaust Fan", price: 59, duration: "30 - 40 min", description: "Sanitization and cleaning of bathroom exhaust fan.", includes: ["Dust & light grease removal", "Re-fixing of parts after cleaning"], excludes: ["Window, duct or pipe cleaning is not included", "Motor repair, electrical work, or servicing is not included"] },
            { name: "Kitchen Exhaust Fan", price: 89, duration: "30 - 40 min", description: "Degreasing and cleaning of kitchen exhaust fan.", includes: ["Exhaust fan grill & blade deep cleaning", "Oil & grease removal using suitable degreasers"], excludes: ["Motor opening, repair, or servicing is not included", "commercial exhaust fan not included"] },
            { name: "Kitchen Appliance Cleaning with single door fridge", price: 999, duration: "2 hours", description: "Professional appliance combo deep cleaning (Fridge + Chimney + Exhaust + Fan).", includes: ["Final hygiene & quality check after service completion", "Deep chimney degreasing including filters & body cleaning"], excludes: ["Internal deep cleaning and filter removal of automatic chimneys", "Cleaning services for commercial kitchens"] },
            { name: "Kitchen Appliance Cleaning with Double door fridge", price: 1199, duration: "2 hours", description: "Professional appliance combo deep cleaning (Double Door Fridge + Chimney + Exhaust + Fan).", includes: ["Final hygiene & quality check after service completion", "Deep chimney degreasing including filters & body cleaning"], excludes: ["Internal deep cleaning and filter removal of automatic chimneys", "Cleaning services for commercial kitchens"] },
            { name: "Kitchen Appliance Cleaning with Side by side door fridge", price: 1399, duration: "3 hours", description: "Professional appliance combo deep cleaning (Side by Side Fridge + Chimney + Exhaust + Fan).", includes: ["Final hygiene & quality check after service completion", "Deep chimney degreasing including filters & body cleaning"], excludes: ["Internal deep cleaning and filter removal of automatic chimneys", "Cleaning services for commercial kitchens"] }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for smooth and effective service completion."
        },
        {
          id: "mattress-shampooing",
          categoryId: "customized",
          title: "Mattress Shampooing Service",
          price: 349,
          description: "Professional mattress shampooing to remove dust mites, sweat stains, odour & allergens trapped deep inside the mattress. Ideal for healthy sleep & hygiene.",
          image: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=800&q=80",
          includes: [
            "High-power vacuuming to remove dust & hair",
            "Foam / shampoo-based deep cleaning",
            "Manual or machine scrubbing (as per package)",
            "Sweat, dirt & light stain removal",
            "Odour neutralisation"
          ],
          plans: [
            {
              name: "Mattress Shampooing wash (Single Bed)",
              price: 349,
              duration: "30 - 40 min",
              description: "Deep cleaning to remove dust mites, sweat, stains, allergens, and bad odour.",
              includes: ["High-power vacuuming to remove dust & hair", "Shampoo / foam-based deep cleaning"],
              excludes: ["Mattress repair, stitching or replacement", "Permanent stains or chemical burns"]
            },
            {
              name: "Mattress Shampooing wash (Double Bed)",
              price: 599,
              duration: "1 hour",
              description: "Deep cleaning to remove dust mites, sweat, stains, allergens, and bad odour.",
              includes: ["High-power vacuuming to remove dust & hair", "Shampoo / foam-based deep cleaning"],
              excludes: ["Bed frame or cot cleaning", "Mold removal due to water seepage"]
            }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for smooth and effective service completion."
        },
        {
          id: "dining-cleaning",
          categoryId: "customized",
          title: "Dining Table & Chairs Cleaning",
          price: 249,
          description: "Professional dining table & chair cleaning to remove dust, food stains, grease & spills using safe, specialised chemicals.",
          image: "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Dining table surface cleaning",
            "Chair seat & backrest cleaning",
            "Fabric chair shampooing",
            "Food stain & spill removal",
            "Safe & eco-friendly chemicals"
          ],
          plans: [
            { name: "4 Seater", price: 249, duration: "20 - 30 min", description: "Detailed cleaning of 4 seater dining table & chairs.", includes: ["Dining table surface cleaning", "Chair seat & backrest cleaning", "Fabric chair shampooing", "Food stain & spill removal", "Safe & eco-friendly chemicals"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "5 Seater", price: 299, duration: "20 - 30 min", description: "Detailed cleaning of 5 seater dining table & chairs.", includes: ["Dining table surface cleaning", "Chair seat & backrest cleaning", "Fabric chair shampooing", "Food stain & spill removal", "Safe & eco-friendly chemicals"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "6 Seater", price: 349, duration: "30 - 40 min", description: "Detailed cleaning of 6 seater dining table & chairs.", includes: ["Dining table surface cleaning", "Chair seat & backrest cleaning", "Fabric chair shampooing", "Food stain & spill removal", "Safe & eco-friendly chemicals"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "7 Seater", price: 374, duration: "30 - 40 min", description: "Detailed cleaning of 7 seater dining table & chairs.", includes: ["Dining table surface cleaning", "Chair seat & backrest cleaning", "Fabric chair shampooing", "Food stain & spill removal", "Safe & eco-friendly chemicals"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "8 Seater", price: 424, duration: "30 - 40 min", description: "Detailed cleaning of 8 seater dining table & chairs.", includes: ["Dining table surface cleaning", "Chair seat & backrest cleaning", "Fabric chair shampooing", "Food stain & spill removal", "Safe & eco-friendly chemicals"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "9 Seater", price: 474, duration: "40 - 50 min", description: "Detailed cleaning of 9 seater dining table & chairs.", includes: ["Dining table surface cleaning", "Chair seat & backrest cleaning", "Fabric chair shampooing", "Food stain & spill removal", "Safe & eco-friendly chemicals"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "10 Seater", price: 524, duration: "40 - 50 min", description: "Detailed cleaning of 10 seater dining table & chairs.", includes: ["Dining table surface cleaning", "Chair seat & backrest cleaning", "Fabric chair shampooing", "Food stain & spill removal", "Safe & eco-friendly chemicals"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "Dining Table + Sofa (3 Seater)", price: 899, duration: "1 - 2 hours", description: "Combo cleaning of dining table, chairs, and 3-seater sofa.", includes: ["Dining table surface dry dusting", "Wet wiping with specialised chemicals"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "Dining Table + Sofa (5 Seater)", price: 1099, duration: "1 - 2 hours", description: "Combo cleaning of dining table, chairs, and 5-seater sofa.", includes: ["Food stains, spills & dust removal", "Full dining table & chair cleaning"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] },
            { name: "Dining Table + Sofa + Mattress (Best Seller)", price: 1399, duration: "2 hours", description: "Comprehensive combo cleaning of dining table, chairs, sofa, and mattress.", includes: ["Odour & allergen removal", "Dining table & chairs cleaning"], excludes: ["Polish or scratch repair", "Chair structural repair", "Glass replacement", "Antique or fragile furniture restoration"] }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Customers are requested to provide a bucket with water, a power point connection, and a ladder or stool for smooth and effective service completion."
        }
      ];

      for (const s of regularCustomizedServices) {
        try {
          const rows = await query("SELECT id FROM services WHERE id = ?", [s.id]);
          if (rows.length === 0) {
            console.log(`Seeding missing regular service under customized category: ${s.title}`);
            await query(
              "INSERT INTO services (id, categoryId, title, price, description, includes, image, plans, disclaimer, requirements, precautions, payment_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [
                s.id,
                s.categoryId,
                s.title,
                s.price,
                s.description,
                JSON.stringify(s.includes),
                s.image,
                JSON.stringify(s.plans),
                s.disclaimer,
                s.requirements,
                JSON.stringify(s.precautions || null),
                s.payment_type || "full"
              ]
            );
          } else {
            console.log(`Regular customized service ${s.title} (${s.id}) already exists. Skipping seed update to preserve admin modifications.`);
          }
        } catch (e) {
          console.warn(`Failed to seed/update regular service ${s.id} under customized category:`, e.message);
        }
      }

      // Seed commercial services into regular services table under 'commercial' category
      console.log("Verifying commercial services in regular catalog...");
      const commercialServices = [
        {
          id: "commercial-hotel-cleaning",
          categoryId: "commercial",
          title: "Hotel Cleaning",
          price: 0,
          description: "Deep cleaning for hotel rooms, lobbies, kitchens, and common areas ensuring hygiene and guest-ready standards.",
          image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Basic stain removal",
            "Supervision",
            "Eco-friendly cleaning agents"
          ],
          plans: [
            {
              name: "Express Estimate",
              price: 0,
              duration: "Custom",
              description: "Deep cleaning for hotel rooms, lobbies, kitchens, and common areas.",
              includes: ["Basic stain removal", "Supervision"],
              excludes: ["Major repair work", "Paint removal (heavy cases)"]
            }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Tell us your requirement, choose if you need a site visit, and our team will provide a customized quotation tailored to your business needs."
        },
        {
          id: "commercial-office-cleaning",
          categoryId: "commercial",
          title: "Office Cleaning",
          price: 0,
          description: "Workstation, floors, glass, washroom cleaning for a healthy and productive workspace.",
          image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Basic stain removal",
            "Supervision",
            "Eco-friendly cleaning agents"
          ],
          plans: [
            {
              name: "Express Estimate",
              price: 0,
              duration: "Custom",
              description: "Workstation, floors, glass, washroom cleaning for a healthy workspace.",
              includes: ["Basic stain removal", "Supervision"],
              excludes: ["Major repair work", "Paint removal (heavy cases)"]
            }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Tell us your requirement, choose if you need a site visit, and our team will provide a customized quotation tailored to your business needs."
        },
        {
          id: "commercial-post-construction",
          categoryId: "commercial",
          title: "Post-Construction / Interior Cleaning",
          price: 0,
          description: "Heavy-duty cleaning after renovation including debris removal, paint marks, dust extraction.",
          image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Basic stain removal",
            "Supervision",
            "Eco-friendly cleaning agents"
          ],
          plans: [
            {
              name: "Express Estimate",
              price: 0,
              duration: "Custom",
              description: "Heavy-duty cleaning after renovation including debris removal.",
              includes: ["Basic stain removal", "Supervision"],
              excludes: ["Major repair work", "Paint removal (heavy cases)"]
            }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Tell us your requirement, choose if you need a site visit, and our team will provide a customized quotation tailored to your business needs."
        },
        {
          id: "commercial-restaurant-cleaning",
          categoryId: "commercial",
          title: "Restaurant Cleaning",
          price: 0,
          description: "Complete kitchen degreasing, exhaust cleaning, dining area sanitization for FSSAI-level hygiene.",
          image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Basic stain removal",
            "Supervision",
            "Eco-friendly cleaning agents"
          ],
          plans: [
            {
              name: "Express Estimate",
              price: 0,
              duration: "Custom",
              description: "Complete kitchen degreasing, exhaust cleaning, dining area sanitization.",
              includes: ["Basic stain removal", "Supervision"],
              excludes: ["Major repair work", "Paint removal (heavy cases)"]
            }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Tell us your requirement, choose if you need a site visit, and our team will provide a customized quotation tailored to your business needs."
        },
        {
          id: "commercial-shop-showroom",
          categoryId: "commercial",
          title: "Shop / Showroom Cleaning",
          price: 0,
          description: "Floor polishing, glass cleaning, dust removal to enhance customer experience.",
          image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Basic stain removal",
            "Supervision",
            "Eco-friendly cleaning agents"
          ],
          plans: [
            {
              name: "Express Estimate",
              price: 0,
              duration: "Custom",
              description: "Floor polishing, glass cleaning, dust removal.",
              includes: ["Basic stain removal", "Supervision"],
              excludes: ["Major repair work", "Paint removal (heavy cases)"]
            }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Tell us your requirement, choose if you need a site visit, and our team will provide a customized quotation tailored to your business needs."
        },
        {
          id: "commercial-warehouse-industrial",
          categoryId: "commercial",
          title: "Warehouse / Industrial Cleaning",
          price: 0,
          description: "Large-area cleaning with machines, ideal for storage units and factories.",
          image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
          includes: [
            "Basic stain removal",
            "Supervision",
            "Eco-friendly cleaning agents"
          ],
          plans: [
            {
              name: "Express Estimate",
              price: 0,
              duration: "Custom",
              description: "Large-area cleaning with machines for storage units.",
              includes: ["Basic stain removal", "Supervision"],
              excludes: ["Major repair work", "Paint removal (heavy cases)"]
            }
          ],
          disclaimer: "Please ensure that all valuables are removed or securely stored. The company will not be responsible for any items left unsecured in the absence of the customer.",
          requirements: "Tell us your requirement, choose if you need a site visit, and our team will provide a customized quotation tailored to your business needs."
        }
      ];

      for (const s of commercialServices) {
        try {
          const rows = await query("SELECT id FROM services WHERE id = ?", [s.id]);
          if (rows.length === 0) {
            console.log(`Seeding missing commercial service: ${s.title}`);
            await query(
              "INSERT INTO services (id, categoryId, title, price, description, includes, image, plans, disclaimer, requirements, precautions, payment_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [
                s.id,
                s.categoryId,
                s.title,
                s.price,
                s.description,
                JSON.stringify(s.includes),
                s.image,
                JSON.stringify(s.plans),
                s.disclaimer,
                s.requirements,
                JSON.stringify(s.precautions || null),
                "free_advance"
              ]
            );
          } else {
            console.log(`Commercial service ${s.title} (${s.id}) already exists. Skipping seed update to preserve admin modifications.`);
          }
        } catch (e) {
          console.warn(`Failed to seed/update commercial service ${s.id}:`, e.message);
        }
      }

    // Seed reviews for all default services if they have 0 reviews
    const servicesForReviews = [
      "house",
      "kitchen",
      "bath",
      "sofa",
      "furniture",
      "interior",
      "balcony",
      "office",
      "hotel",
      "fridge",
      "carpet",
      "mattress",
      "glass",
      "floor",
      "tank",
    ];

    const seedReviewsMap = {
      house: [
        {
          userName: "Sundar Bhobar",
          rating: 5,
          comment: "Excellent work, very thorough!",
        },
        {
          userName: "Geetanjali Vikas Jagtap",
          rating: 5,
          comment: "Nice work, clean and tidy.",
        },
        {
          userName: "Rahul Pawar",
          rating: 4,
          comment: "Good service and polite staff.",
        },
      ],
      kitchen: [
        {
          userName: "Amit Sharma",
          rating: 5,
          comment:
            "All oil stains and chimney grease removed successfully. Highly recommended!",
        },
        {
          userName: "Priya Patel",
          rating: 5,
          comment: "Amazing kitchen degreasing work.",
        },
      ],
      bath: [
        {
          userName: "Rohan Deshmukh",
          rating: 5,
          comment: "Descaling is done perfectly, taps are shining now.",
        },
        {
          userName: "Sneha Patil",
          rating: 4,
          comment: "Very good cleaning and sanitization.",
        },
      ],
      balcony: [
        {
          userName: "Nikhil Joshi",
          rating: 5,
          comment: "High pressure floor wash made the balcony look brand new!",
        },
        {
          userName: "Anjali Gupta",
          rating: 5,
          comment: "Excellent job cleaning the balcony tiles and glass doors.",
        },
      ],
      sofa: [
        {
          userName: "Vikram Singh",
          rating: 5,
          comment:
            "Removed all tough stains from my fabric sofa. Great extraction equipment.",
        },
      ],
      fridge: [
        {
          userName: "Meera Nair",
          rating: 5,
          comment:
            "Disinfected inside trays and removed bad odor. Excellent fridge clean.",
        },
      ],
      carpet: [
        {
          userName: "Rajesh Kumar",
          rating: 5,
          comment:
            "Carpet shampooing restored the fabric brightness. Good scent.",
        },
      ],
      mattress: [
        {
          userName: "Karan Johar",
          rating: 4,
          comment: "Good UV sanitization and allergen dust extraction.",
        },
      ],
      glass: [
        {
          userName: "Deepa Mehta",
          rating: 5,
          comment:
            "Spotless glass windows. Squeegee finish is absolutely streak-free.",
        },
      ],
    };

    for (const serviceId of servicesForReviews) {
      const check = await query(
        "SELECT COUNT(*) as count FROM reviews WHERE serviceId = ?",
        [serviceId],
      );
      if (check[0].count === 0) {
        const seeds = seedReviewsMap[serviceId] || [
          {
            userName: "Happy Customer",
            rating: 5,
            comment: "Great service and professional cleaning team.",
          },
          {
            userName: "Anonymous",
            rating: 5,
            comment: "Very satisfied with the quality of clean.",
          },
        ];
        for (let i = 0; i < seeds.length; i++) {
          const seed = seeds[i];
          await query(
            "INSERT INTO reviews (id, serviceId, userName, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
            [
              `seed-rev-${serviceId}-${i}`,
              serviceId,
              seed.userName,
              seed.rating,
              seed.comment,
              new Date(Date.now() - (i + 1) * 24 * 3600 * 1000).toISOString(),
            ],
          );
        }
        console.log(`Seeded default reviews for service: ${serviceId}`);
      }
    }

    // Seed default admin in database users table
    try {
      const existingAdmin = await query("SELECT * FROM users WHERE email = ? OR phone = ?", [
        "thedeepcleanerz.info@gmail.com",
        "9990001122",
      ]);
      if (!existingAdmin || existingAdmin.length === 0) {
        const adminPasswordHash = bcrypt.hashSync("admin123", 10);
        await query(
          "INSERT INTO users (id, name, phone, email, password, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
          [
            "admin-seeded",
            "TheDeep CleanerZ Admin",
            "9990001122",
            "thedeepcleanerz.info@gmail.com",
            adminPasswordHash,
            new Date().toISOString(),
          ],
        );
        console.log("Default admin account seeded into database users table.");
      }
    } catch (e) {
      console.warn("Could not seed default admin user:", e.message);
    }

    // Seed default settings in settings table
    try {
      const existingSettings = await query("SELECT COUNT(*) as count FROM settings");
      if (existingSettings && existingSettings[0] && existingSettings[0].count === 0) {
        await query("INSERT INTO settings (key_name, key_value) VALUES (?, ?)", [
          "travel_rate_per_km",
          "10",
        ]);
        await query("INSERT INTO settings (key_name, key_value) VALUES (?, ?)", [
          "travel_free_radius_km",
          "5",
        ]);
        console.log("Default travel rate settings seeded.");
      }
    } catch (e) {
      console.warn("Could not seed default settings:", e.message);
    }

    // Seed default transformations
    try {
      const countRes = await query("SELECT COUNT(*) as count FROM recent_transformations");
      if (countRes && countRes[0] && countRes[0].count === 0) {
        const defaults = [
          {
            id: "trans-1",
            title: "Villa Deep Cleaning",
            location: "Bandra, Mumbai",
            beforeImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=600",
            afterImage: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=600"
          },
          {
            id: "trans-2",
            title: "Apartment Cleaning",
            location: "HSR Layout, Bengaluru",
            beforeImage: "https://images.unsplash.com/photo-1560185007-cde436f6a4d0?q=80&w=600",
            afterImage: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600"
          },
          {
            id: "trans-3",
            title: "Corporate Office",
            location: "Gurugram, DLF",
            beforeImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600",
            afterImage: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=600"
          },
          {
            id: "trans-4",
            title: "Hotel Room Cleaning",
            location: "Goa Resort",
            beforeImage: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=600",
            afterImage: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=600"
          },
          {
            id: "trans-5",
            title: "Kitchen Restoration",
            location: "Powai, Mumbai",
            beforeImage: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=600",
            afterImage: "https://images.unsplash.com/photo-1556911220-b1a4a407300c?q=80&w=600"
          },
          {
            id: "trans-6",
            title: "Balcony Transformation",
            location: "Whitefield, Bengaluru",
            beforeImage: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=600",
            afterImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600"
          }
        ];
        for (const item of defaults) {
          await query(
            "INSERT INTO recent_transformations (id, title, location, beforeImage, afterImage) VALUES (?, ?, ?, ?, ?)",
            [item.id, item.title, item.location, item.beforeImage, item.afterImage]
          );
        }
        console.log("Seeded default recent transformations.");
      }
    } catch (e) {
      console.warn("Could not seed default recent transformations:", e.message);
    }
  } catch (err) {
    console.error("MySQL database initialization failed:", err.message);
    console.warn(
      "PLEASE NOTE: Verify your local MySQL server is running and the database specified in DB_NAME exists.",
    );
  }
}

// High-speed In-Memory Cache for ultra-fast API response times (< 1ms)
const memCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minute fresh cache

function getCached(key) {
  const item = memCache.get(key);
  if (item && Date.now() - item.time < CACHE_TTL_MS) {
    return item.data;
  }
  return null;
}

function setCache(key, data) {
  memCache.set(key, { data, time: Date.now() });
}

function invalidateCache(...keys) {
  if (keys.length === 0) {
    memCache.clear();
  } else {
    keys.forEach((k) => memCache.delete(k));
  }
}

// Database methods
module.exports = {
  pool,
  query,
  initDb,
  invalidateCache,

  // Recent Transformations
  async getRecentTransformations() {
    const cached = getCached("recent_transformations");
    if (cached) return cached;
    const rows = await query("SELECT * FROM recent_transformations ORDER BY createdAt DESC");
    setCache("recent_transformations", rows);
    return rows;
  },
  async addRecentTransformation({ id, title, location, beforeImage, afterImage }) {
    invalidateCache("recent_transformations");
    await query(
      "INSERT INTO recent_transformations (id, title, location, beforeImage, afterImage) VALUES (?, ?, ?, ?, ?)",
      [id, title, location, beforeImage, afterImage]
    );
    return { id, title, location, beforeImage, afterImage };
  },
  async updateRecentTransformation(id, { title, location, beforeImage, afterImage }) {
    invalidateCache("recent_transformations");
    await query(
      "UPDATE recent_transformations SET title = ?, location = ?, beforeImage = ?, afterImage = ? WHERE id = ?",
      [title, location, beforeImage, afterImage, id]
    );
    return { id, title, location, beforeImage, afterImage };
  },
  async deleteRecentTransformation(id) {
    invalidateCache("recent_transformations");
    await query("DELETE FROM recent_transformations WHERE id = ?", [id]);
    return { id };
  },

  // Categories
  async getCategories() {
    const cached = getCached("categories");
    if (cached) return cached;
    const rows = await query("SELECT * FROM categories");
    const result = rows.map((r) => ({
      ...r,
      includes: typeof r.includes === "string" ? JSON.parse(r.includes) : r.includes || [],
    }));
    setCache("categories", result);
    return result;
  },
  async addCategory({ id, title, tagline, emoji, image, parentId, includes }) {
    invalidateCache("categories", "catalog");
    await query(
      "INSERT INTO categories (id, title, tagline, emoji, image, parentId, includes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, title, tagline, emoji, image || null, parentId || null, JSON.stringify(includes || [])],
    );
    return { id, title, tagline, emoji, image, parentId, includes };
  },
  async updateCategory(id, { title, tagline, emoji, image, parentId, includes }) {
    invalidateCache("categories", "catalog");
    await query(
      "UPDATE categories SET title = ?, tagline = ?, emoji = ?, image = ?, parentId = ?, includes = ? WHERE id = ?",
      [title, tagline, emoji, image, parentId || null, JSON.stringify(includes || []), id],
    );
    return { id, title, tagline, emoji, image, parentId, includes };
  },
  async deleteCategory(id) {
    invalidateCache("categories", "catalog");
    await query("DELETE FROM categories WHERE id = ?", [id]);
    return true;
  },

  async getServices() {
    const cached = getCached("services");
    if (cached) return cached;
    const rows = await query("SELECT * FROM services");
    const result = rows.map((r) => ({
      ...r,
      paymentType: r.payment_type || "full",
      includes:
        typeof r.includes === "string"
          ? JSON.parse(r.includes)
          : r.includes || [],
      plans: typeof r.plans === "string" ? JSON.parse(r.plans) : r.plans || [],
      precautions:
        typeof r.precautions === "string"
          ? JSON.parse(r.precautions)
          : r.precautions || [],
    }));
    setCache("services", result);
    return result;
  },
  async addService({
    id,
    categoryId,
    title,
    price,
    description,
    includes,
    image,
    plans,
    disclaimer,
    requirements,
    paymentType,
    precautions,
  }) {
    invalidateCache("services", "catalog");
    const incString = JSON.stringify(includes || []);
    const plansString = JSON.stringify(plans || []);
    const precautionsString = JSON.stringify(precautions || []);
    await query(
      "INSERT INTO services (id, categoryId, title, price, description, includes, image, plans, disclaimer, requirements, payment_type, precautions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        categoryId,
        title,
        price,
        description,
        incString,
        image || null,
        plansString,
        disclaimer || null,
        requirements || null,
        paymentType || "full",
        precautionsString,
      ],
    );
    return {
      id,
      categoryId,
      title,
      price,
      description,
      includes,
      image,
      plans,
      disclaimer,
      requirements,
      paymentType: paymentType || "full",
      precautions,
    };
  },
  async updateService(
    id,
    {
      categoryId,
      title,
      price,
      description,
      includes,
      image,
      plans,
      disclaimer,
      requirements,
      paymentType,
      precautions,
    },
  ) {
    invalidateCache("services", "catalog");
    const incString = JSON.stringify(includes || []);
    const plansString = JSON.stringify(plans || []);
    const precautionsString = JSON.stringify(precautions || []);
    await query(
      "UPDATE services SET categoryId = ?, title = ?, price = ?, description = ?, includes = ?, image = ?, plans = ?, disclaimer = ?, requirements = ?, payment_type = ?, precautions = ? WHERE id = ?",
      [
        categoryId,
        title,
        price,
        description,
        incString,
        image || null,
        plansString,
        disclaimer || null,
        requirements || null,
        paymentType || "full",
        precautionsString,
        id,
      ],
    );
    return {
      id,
      categoryId,
      title,
      price,
      description,
      includes,
      image,
      plans,
      disclaimer,
      requirements,
      paymentType: paymentType || "full",
      precautions,
    };
  },
  async deleteService(id) {
    invalidateCache("services", "catalog");
    await query("DELETE FROM services WHERE id = ?", [id]);
    return true;
  },

  // Reviews
  async getReviews(serviceId) {
    return await query(
      "SELECT * FROM reviews WHERE serviceId = ? ORDER BY createdAt DESC",
      [serviceId],
    );
  },
  async getAllReviews() {
    return await query("SELECT * FROM reviews ORDER BY createdAt DESC");
  },
  async addReview({ id, serviceId, userName, rating, comment, createdAt }) {
    const createdDate = createdAt || new Date().toISOString();
    await query(
      "INSERT INTO reviews (id, serviceId, userName, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      [id, serviceId, userName, Number(rating), comment, createdDate],
    );
    return { id, serviceId, userName, rating, comment, createdAt: createdDate };
  },
  async deleteReview(id) {
    await query("DELETE FROM reviews WHERE id = ?", [id]);
    return true;
  },

  // Bookings
  async getBookings() {
    const rows = await query(`
      SELECT b.*, t.name as technicianName, t.phone as technicianPhone, t.email as technicianEmail, t.specialty as technicianSpecialty, t.status as technicianStatus, t.lat as technicianLat, t.lng as technicianLng, t.lastPing as technicianLastPing
      FROM bookings b
      LEFT JOIN technicians t ON b.technicianId = t.id
      ORDER BY b.id DESC
    `);

    // Get all reschedule logs
    const logs = await query("SELECT * FROM reschedule_logs ORDER BY id ASC");
    const logsByBooking = {};
    logs.forEach((log) => {
      if (!logsByBooking[log.bookingId]) {
        logsByBooking[log.bookingId] = [];
      }
      logsByBooking[log.bookingId].push(log);
    });

    return rows.map((r) => ({
      ...r,
      customer:
        typeof r.customer === "string"
          ? JSON.parse(r.customer)
          : r.customer || {},
      schedule:
        typeof r.schedule === "string"
          ? JSON.parse(r.schedule)
          : r.schedule || {},
      items: typeof r.items === "string" ? JSON.parse(r.items) : r.items || [],
      jobStatus: r.jobStatus || "Pending",
      statusNote: r.statusNote || null,
      beforeImage: r.before_image || null,
      afterImage: r.after_image || null,
      rescheduleLogs: logsByBooking[r.id] || [],
      technician: r.technicianId
        ? {
            id: r.technicianId,
            name: r.technicianName,
            phone: r.technicianPhone,
            email: r.technicianEmail,
            specialty: r.technicianSpecialty,
            status: r.technicianStatus,
            lat: r.technicianLat ? Number(r.technicianLat) : null,
            lng: r.technicianLng ? Number(r.technicianLng) : null,
            lastPing: r.technicianLastPing || null,
          }
        : null,
    }));
  },
  async updateBookingMedia(id, { beforeImage, afterImage }) {
    if (beforeImage !== undefined) {
      await query("UPDATE bookings SET before_image = ? WHERE id = ?", [beforeImage || null, id]);
    }
    if (afterImage !== undefined) {
      await query("UPDATE bookings SET after_image = ? WHERE id = ?", [afterImage || null, id]);
    }
    return true;
  },
  async addBooking({
    id,
    createdAt,
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
  }) {
    await query(
      "INSERT INTO bookings (id, createdAt, customer, schedule, notes, coupon, discount, total, items, paymentStatus, paymentId, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        createdAt,
        JSON.stringify(customer || {}),
        JSON.stringify(schedule || {}),
        notes || "",
        coupon || null,
        Number(discount) || 0,
        Number(total) || 0,
        JSON.stringify(items || []),
        paymentStatus || "Pending",
        paymentId || null,
        userId || null,
      ],
    );
    return {
      id,
      createdAt,
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
    };
  },
  async deleteBooking(id) {
    await query("DELETE FROM bookings WHERE id = ?", [id]);
    return true;
  },
  async updateBookingPayment(id, paymentStatus, paymentId) {
    await query(
      "UPDATE bookings SET paymentStatus = ?, paymentId = ? WHERE id = ?",
      [paymentStatus, paymentId, id],
    );
    return true;
  },

  // Users Authentication helper methods
  async getUserByEmail(email) {
    const rows = await query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0] || null;
  },
  async getUserByPhone(phone) {
    const rows = await query("SELECT * FROM users WHERE phone = ?", [phone]);
    return rows[0] || null;
  },
  async getUserById(id) {
    const rows = await query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0] || null;
  },
  async getUsers() {
    const rows = await query("SELECT id, name, phone, email, referral_code, wallet_balance, created_at FROM users ORDER BY created_at DESC");
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      email: r.email,
      referralCode: r.referral_code,
      walletBalance: Number(r.wallet_balance) || 0,
      createdAt: r.created_at,
    }));
  },
  async saveVisitorLocation({ userId, latitude, longitude }) {
    await query(
      "INSERT INTO visitor_locations (userId, latitude, longitude, timestamp) VALUES (?, ?, ?, ?)",
      [
        userId || null,
        String(latitude),
        String(longitude),
        new Date().toISOString(),
      ],
    );
    return true;
  },
  // Customized Services
  async getCustomizedServices() {
    const cached = getCached("customized_services");
    if (cached) return cached;
    const rows = await query("SELECT * FROM customized_services");
    const result = rows.map((r) => ({
      ...r,
      paymentType: r.payment_type || "full",
      plans: typeof r.plans === "string" ? JSON.parse(r.plans) : r.plans || [],
    }));
    setCache("customized_services", result);
    return result;
  },
  async addCustomizedService({ id, title, price, image, plans, paymentType }) {
    invalidateCache("customized_services");
    const plansString = JSON.stringify(plans || []);
    await query(
      "INSERT INTO customized_services (id, title, price, image, plans, payment_type) VALUES (?, ?, ?, ?, ?, ?)",
      [id, title, price, image || null, plansString, paymentType || "full"],
    );
    return { id, title, price, image, plans, paymentType: paymentType || "full" };
  },
  async updateCustomizedService(id, { title, price, image, plans, paymentType }) {
    invalidateCache("customized_services");
    const plansString = JSON.stringify(plans || []);
    await query(
      "UPDATE customized_services SET title = ?, price = ?, image = ?, plans = ?, payment_type = ? WHERE id = ?",
      [title, price, image || null, plansString, paymentType || "full", id],
    );
    return { id, title, price, image, plans, paymentType: paymentType || "full" };
  },
  async deleteCustomizedService(id) {
    invalidateCache("customized_services");
    await query("DELETE FROM customized_services WHERE id = ?", [id]);
    return true;
  },

  async getUserByReferralCode(code) {
    if (!code) return null;
    const rows = await query("SELECT * FROM users WHERE UPPER(referral_code) = ?", [code.trim().toUpperCase()]);
    return rows[0] || null;
  },
  async updateUserWallet(userId, newBalance) {
    await query("UPDATE users SET wallet_balance = ? WHERE id = ?", [newBalance, userId]);
    return true;
  },
  async updateUserAddresses(userId, addresses) {
    await query("UPDATE users SET addresses = ? WHERE id = ?", [JSON.stringify(addresses), userId]);
    return true;
  },

  async createUser({ id, name, phone, email, password, referral_code, wallet_balance }) {
    const createdAt = new Date().toISOString();
    await query(
      "INSERT INTO users (id, name, phone, email, password, createdAt, referral_code, wallet_balance) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, phone, email, password, createdAt, referral_code || null, wallet_balance || 0],
    );
    return { id, name, phone, email, password, createdAt, referral_code, wallet_balance: wallet_balance || 0 };
  },

  async getUsers() {
    const users = await query(
      "SELECT id, name, email, phone, createdAt FROM users ORDER BY createdAt DESC",
    );
    return users;
  },
  async getAdmins() {
    const admins = await query(
      "SELECT id, name, email, phone, role, createdAt FROM users WHERE role = 'admin' ORDER BY createdAt DESC"
    );
    return admins;
  },
  async createAdmin({ name, phone, email, password }) {
    const id = "admin-" + Math.random().toString(36).substr(2, 9);
    const createdAt = new Date().toISOString();
    await query(
      "INSERT INTO users (id, name, phone, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, 'admin', ?)",
      [id, name, phone, email, password, createdAt]
    );
    return { id, name, phone, email, createdAt };
  },
  async updateAdmin(currentEmail, { name, phone, email, password }) {
    if (password) {
      await query(
        "UPDATE users SET name = ?, phone = ?, email = ?, password = ? WHERE email = ?",
        [name, phone, email, password, currentEmail]
      );
    } else {
      await query(
        "UPDATE users SET name = ?, phone = ? WHERE email = ?",
        [name, phone, currentEmail]
      );
      if (email !== currentEmail) {
        await query(
          "UPDATE users SET email = ? WHERE email = ?",
          [email, currentEmail]
        );
      }
    }
    return { name, phone, email };
  },
  async deleteAdmin(email) {
    await query("DELETE FROM users WHERE email = ? AND role = 'admin'", [email]);
    return true;
  },
  async getCoupons() {
    const cached = getCached("coupons");
    if (cached) return cached;
    const rows = await query("SELECT * FROM coupons ORDER BY code ASC");
    setCache("coupons", rows);
    return rows;
  },
  async addCoupon({ code, discount, minAmount, expiryDate, isActive }) {
    invalidateCache("coupons");
    await query(
      "INSERT INTO coupons (code, discount, minAmount, expiryDate, isActive) VALUES (?, ?, ?, ?, ?)",
      [
        code.toUpperCase().trim(),
        Number(discount),
        Number(minAmount),
        expiryDate,
        isActive ? 1 : 0,
      ],
    );
    return {
      code: code.toUpperCase().trim(),
      discount,
      minAmount,
      expiryDate,
      isActive,
    };
  },
  async updateCoupon(code, { discount, minAmount, expiryDate, isActive }) {
    invalidateCache("coupons");
    await query(
      "UPDATE coupons SET discount = ?, minAmount = ?, expiryDate = ?, isActive = ? WHERE code = ?",
      [Number(discount), Number(minAmount), expiryDate, isActive ? 1 : 0, code],
    );
    return { code, discount, minAmount, expiryDate, isActive };
  },
  async deleteCoupon(code) {
    invalidateCache("coupons");
    await query("DELETE FROM coupons WHERE code = ?", [code]);
    return true;
  },
  async validateCoupon(code, total) {
    const coupons = await query("SELECT * FROM coupons WHERE code = ?", [
      code.toUpperCase().trim(),
    ]);
    if (!coupons || coupons.length === 0) {
      throw new Error("Coupon code is invalid.");
    }
    const c = coupons[0];
    if (!c.isActive) {
      throw new Error("Coupon code is not active.");
    }
    const today = new Date().toISOString().split("T")[0];
    if (c.expiryDate < today) {
      throw new Error("Coupon has expired.");
    }
    if (total < c.minAmount) {
      throw new Error(
        `Minimum order amount of ₹${c.minAmount} is required to apply this coupon.`,
      );
    }
    return { code: c.code, discount: c.discount };
  },

  // Technicians methods
  async getTechnicians() {
    return await query("SELECT * FROM technicians ORDER BY name ASC");
  },
  async getTechnicianByEmail(email) {
    const res = await query(
      "SELECT * FROM technicians WHERE email = ? LIMIT 1",
      [email.trim().toLowerCase()],
    );
    return res && res.length > 0 ? res[0] : null;
  },
  async getTechnicianByPhone(phone) {
    const res = await query(
      "SELECT * FROM technicians WHERE phone = ? LIMIT 1",
      [phone.trim()],
    );
    return res && res.length > 0 ? res[0] : null;
  },
  async getTechnicianBookings(technicianId) {
    const rows = await query(
      "SELECT * FROM bookings WHERE technicianId = ? ORDER BY id DESC",
      [technicianId],
    );
    const logs = await query("SELECT * FROM reschedule_logs ORDER BY id ASC");
    const logsByBooking = {};
    logs.forEach((log) => {
      if (!logsByBooking[log.bookingId]) {
        logsByBooking[log.bookingId] = [];
      }
      logsByBooking[log.bookingId].push(log);
    });

    return rows.map((r) => ({
      ...r,
      customer:
        typeof r.customer === "string"
          ? JSON.parse(r.customer)
          : r.customer || {},
      schedule:
        typeof r.schedule === "string"
          ? JSON.parse(r.schedule)
          : r.schedule || {},
      items: typeof r.items === "string" ? JSON.parse(r.items) : r.items || [],
      jobStatus: r.jobStatus || "Pending",
      statusNote: r.statusNote || null,
      rescheduleLogs: logsByBooking[r.id] || [],
    }));
  },
  async addTechnician({ id, name, phone, email, specialty, status, password }) {
    const createdAt = new Date().toISOString();
    let hashedPassword = null;
    if (password) {
      const salt = bcrypt.genSaltSync(10);
      hashedPassword = bcrypt.hashSync(password, salt);
    }
    await query(
      "INSERT INTO technicians (id, name, phone, email, specialty, status, password, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        name,
        phone,
        email || null,
        specialty || null,
        status || "Active",
        hashedPassword,
        createdAt,
      ],
    );
    return { id, name, phone, email, specialty, status, createdAt };
  },
  async updateTechnician(
    id,
    { name, phone, email, specialty, status, password },
  ) {
    if (password) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);
      await query(
        "UPDATE technicians SET name = ?, phone = ?, email = ?, specialty = ?, status = ?, password = ? WHERE id = ?",
        [
          name,
          phone,
          email || null,
          specialty || null,
          status || "Active",
          hashedPassword,
          id,
        ],
      );
    } else {
      await query(
        "UPDATE technicians SET name = ?, phone = ?, email = ?, specialty = ?, status = ? WHERE id = ?",
        [name, phone, email || null, specialty || null, status || "Active", id],
      );
    }
    return { id, name, phone, email, specialty, status };
  },
  async deleteTechnician(id) {
    await query("DELETE FROM technicians WHERE id = ?", [id]);
    return true;
  },
  async updateBookingTechnician(id, technicianId) {
    await query("UPDATE bookings SET technicianId = ? WHERE id = ?", [
      technicianId || null,
      id,
    ]);
    return true;
  },
  async updateTechnicianLocation(id, lat, lng) {
    const lastPing = new Date().toISOString();
    await query("UPDATE technicians SET lat = ?, lng = ?, lastPing = ? WHERE id = ?", [
      lat !== null ? Number(lat) : null,
      lng !== null ? Number(lng) : null,
      lastPing,
      id,
    ]);
    return true;
  },
  async updateBookingJobStatus(id, jobStatus, statusNote = null) {
    await query(
      "UPDATE bookings SET jobStatus = ?, statusNote = ? WHERE id = ?",
      [jobStatus, statusNote, id],
    );
    return true;
  },
  async rescheduleBooking(id, date, time, rescheduledBy = "Admin") {
    // 1. Get old schedule details
    const bookingRes = await query(
      "SELECT schedule FROM bookings WHERE id = ? LIMIT 1",
      [id],
    );
    let prevDate = null;
    let prevTime = null;
    if (bookingRes && bookingRes.length > 0 && bookingRes[0].schedule) {
      try {
        const parsed =
          typeof bookingRes[0].schedule === "string"
            ? JSON.parse(bookingRes[0].schedule)
            : bookingRes[0].schedule;
        prevDate = parsed?.date || null;
        prevTime = parsed?.time || null;
      } catch (e) {
        console.error("Failed to parse previous schedule:", e);
      }
    }

    // 2. Update schedule in bookings
    const scheduleObj = { date, time };
    await query("UPDATE bookings SET schedule = ? WHERE id = ?", [
      JSON.stringify(scheduleObj),
      id,
    ]);

    // 3. Insert reschedule log record
    const createdAt = new Date().toISOString();
    await query(
      `
      INSERT INTO reschedule_logs (bookingId, rescheduledBy, previousDate, previousTime, newDate, newTime, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [id, rescheduledBy, prevDate, prevTime, date, time, createdAt],
    );

    return true;
  },
  async getAllRescheduleLogs() {
    const rows = await query(`
      SELECT rl.*, b.customer as bookingCustomer
      FROM reschedule_logs rl
      LEFT JOIN bookings b ON rl.bookingId = b.id
      ORDER BY rl.id DESC
    `);
    return rows.map((r) => ({
      ...r,
      bookingCustomer:
        typeof r.bookingCustomer === "string"
          ? JSON.parse(r.bookingCustomer)
          : r.bookingCustomer || {},
    }));
  },
  async getSettings() {
    const rows = await query("SELECT * FROM settings");
    const settingsObj = {};
    rows.forEach((r) => {
      settingsObj[r.key_name] = r.key_value;
    });
    return settingsObj;
  },
  async updateSetting(key, value) {
    await query(
      "INSERT INTO settings (key_name, key_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE key_value = VALUES(key_value)",
      [key, String(value)],
    );
    return true;
  },
  async getSetting(key) {
    const rows = await query("SELECT key_value FROM settings WHERE key_name = ?", [key]);
    if (rows && rows.length > 0) {
      return rows[0].key_value;
    }
    return null;
  },
};
