const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

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

    // Alter table users to add role column if it doesn't exist
    const userColumns = await query("SHOW COLUMNS FROM users");
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

    // Automatic seeding of categories, services, and reviews is disabled as requested by the administrator
    if (false) {
      if (hasOldSeed) {
        console.log(
          "Old demo seed detected. Clearing tables for new unified database catalog...",
        );
        await query("SET FOREIGN_KEY_CHECKS = 0");
        await query("TRUNCATE TABLE services");
        await query("TRUNCATE TABLE categories");
        await query("SET FOREIGN_KEY_CHECKS = 1");
      }
      console.log("Seeding default database records into MySQL...");
      const defaultData = {
        categories: [
          {
            id: "full-house",
            title: "Full House Deep Cleaning",
            tagline: "Top-to-bottom premium clean for the entire home",
            emoji: "🏠",
            image:
              "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
          },
          {
            id: "customized",
            title: "Customized Cleaning Package",
            tagline: "Pick exactly what you need — room by room",
            emoji: "🛋️",
            image:
              "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80",
          },
          {
            id: "commercial",
            title: "Commercial Post Interior Cleaning",
            tagline: "Office, hotel & post-construction expertise",
            emoji: "🏢",
            image:
              "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
          },
        ],
        services: [
          {
            id: "house",
            categoryId: "full-house",
            title: "Full House Cleaning",
            price: 1999,
            description: "Complete top-to-bottom deep clean for every room.",
            includes: [
              "All rooms HEPA vacuuming",
              "Floor machine scrubbing",
              "Window glass polishing",
              "Kitchen sanitization",
              "Bathroom deep cleaning",
            ],
            image:
              "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
            disclaimer:
              "Please ensure all valuables are removed or securely stored before our professionals arrive.",
            plans: [
              {
                name: "Express",
                price: 1999,
                duration: "3-4 hours",
                description:
                  "Surface dusting, dry vacuuming, and basic mopping.",
                includes: [
                  "Dusting surface details",
                  "Floor wet wiping",
                  "Trash disposal",
                ],
                excludes: ["Deep kitchen scrubbing", "Wall washings"],
              },
              {
                name: "Elite",
                price: 2999,
                duration: "5-6 hours",
                description:
                  "Full deep clean including kitchen and bathroom machine scrubbing.",
                includes: [
                  "Bathroom deep scrub",
                  "Kitchen sanitization",
                  "Floor machine scrub",
                  "HEPA vacuuming",
                ],
                excludes: ["Heavy stain restoration"],
              },
              {
                name: "Exclusive",
                price: 4499,
                duration: "6-7 hours",
                description:
                  "Advanced sterilization, window polishing, and complete steam care.",
                includes: [
                  "Bathroom sanitization",
                  "Kitchen degreasing",
                  "Floor steam scrub",
                  "Window glass polishing",
                  "Switchboard cleaning",
                ],
                excludes: ["Heavy lifting or movement of materials"],
              },
            ],
          },
          {
            id: "kitchen",
            categoryId: "full-house",
            title: "Kitchen Deep Cleaning",
            price: 999,
            description: "Intense kitchen degreasing and tile scrubbing.",
            includes: [
              "Chimney baffle filters",
              "Cabinet cleaning inside-out",
              "Countertop degreasing",
              "Limescale & oil removal",
            ],
            image:
              "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
            disclaimer:
              "Admins advise kitchen utensils be placed in closed cabinets before service.",
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
            categoryId: "full-house",
            title: "Bathroom Cleaning",
            price: 599,
            description: "Scrubbing and sanitization of tiles and fixtures.",
            includes: [
              "Limescale removal",
              "WC & washbasin scrub",
              "Mirror polishing",
              "Floor deep scrub",
            ],
            image:
              "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
            disclaimer: "Admins advise clear floor path in washrooms.",
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
            categoryId: "customized",
            title: "Sofa Cleaning",
            price: 499,
            description: "Vacuuming and injection-extraction stain removal.",
            includes: [
              "Allergen extraction",
              "Stain spot removal",
              "Eco-shampoo scrub",
              "Fabric odor control",
            ],
            image:
              "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=800&q=80",
            disclaimer: "Drying takes 3-4 hours post extraction.",
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
          {
            id: "furniture",
            categoryId: "customized",
            title: "Furniture Cleaning",
            price: 699,
            description: "Polishing and vacuuming of wood & fabric furniture.",
            includes: [
              "Wood conditioning",
              "Fabric vacuuming",
              "Leather protection",
              "Glass desk clean",
            ],
          },
          {
            id: "interior",
            categoryId: "full-house",
            title: "Interior Cleaning",
            price: 1499,
            description: "Scrubbing wall tiles, fans, light fixtures.",
            includes: [
              "Ceiling fan clean",
              "Cobweb removal",
              "Switchboard wipe",
              "Window frame dusting",
            ],
          },
          {
            id: "balcony",
            categoryId: "customized",
            title: "Balcony Cleaning",
            price: 499,
            description: "High-pressure wash & tile scrubbing.",
            includes: [
              "Pressure wash floor",
              "Grill dusting & wipe",
              "Drain clearance",
              "Glass door cleaning",
            ],
          },
          {
            id: "office",
            categoryId: "commercial",
            title: "Office Cleaning",
            price: 2499,
            description: "Sanitization of workspaces, carpets & pantries.",
            includes: [
              "Workstation sanitization",
              "Carpet HEPA vacuum",
              "Pantry deep clean",
              "Trash clearance",
            ],
          },
          {
            id: "hotel",
            categoryId: "commercial",
            title: "Hotel Cleaning",
            price: 2999,
            description: "Premium sanitization for rooms & lobbies.",
            includes: [
              "Room sanitization",
              "Lobby marble polish",
              "Restroom deep scrub",
              "Upholstery care",
            ],
          },
          {
            id: "fridge",
            categoryId: "customized",
            title: "Refrigerator Cleaning",
            price: 499,
            description: "Stain and odor removal, tray sanitization.",
            includes: [
              "Defrost & interior wipe",
              "Tray & rack scrub",
              "Gasket disinfection",
              "Deodorization",
            ],
          },
          {
            id: "carpet",
            categoryId: "customized",
            title: "Carpet Cleaning",
            price: 599,
            description: "Deep extraction shampooing of carpets.",
            includes: [
              "Deep soil extraction",
              "Stain pre-treatment",
              "Shampoo wash",
              "Fiber restoration",
            ],
          },
          {
            id: "mattress",
            categoryId: "customized",
            title: "Mattress Cleaning",
            price: 599,
            description: "Allergen extraction & stain treatment.",
            includes: [
              "Dust-mite removal",
              "UV sanitization",
              "Liquid spill treatment",
              "Odor neutralizer",
            ],
          },
          {
            id: "glass",
            categoryId: "customized",
            title: "Glass Cleaning",
            price: 499,
            description: "Window, facade and mirror polishing.",
            includes: [
              "Squeegee streak-free",
              "Frame dust & wipe",
              "Tough stain scrape",
              "Sealant check",
            ],
          },
          {
            id: "floor",
            categoryId: "full-house",
            title: "Floor Scrubbing",
            price: 799,
            description: "Machine scrubbing and polishing of floors.",
            includes: [
              "Single-disc scrubbing",
              "Grout cleaning",
              "Stone restoration",
              "Glossy finish polish",
            ],
          },
          {
            id: "tank",
            categoryId: "full-house",
            title: "Water Tank Cleaning",
            price: 1499,
            description: "Drainage, scrubbing and UV sterilization.",
            includes: [
              "Sludge drainage",
              "Manual scrub walls",
              "High-pressure spray",
              "UV sanitization",
            ],
          },
        ],
      };

      for (const c of defaultData.categories) {
        await query(
          "INSERT INTO categories (id, title, tagline, emoji, image) VALUES (?, ?, ?, ?, ?)",
          [c.id, c.title, c.tagline, c.emoji, c.image],
        );
      }
      for (const s of defaultData.services) {
        const incString = JSON.stringify(s.includes || []);
        const plansString = JSON.stringify(s.plans || []);
        await query(
          "INSERT INTO services (id, categoryId, title, price, description, includes, image, plans, disclaimer) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            s.id,
            s.categoryId,
            s.title,
            s.price,
            s.description,
            incString,
            s.image || null,
            plansString,
            s.disclaimer || null,
          ],
        );
      }
      console.log("Seeding services completed successfully!");
    } else {
      // Automatic cleanup of user-created categories is disabled to allow dynamic admin-created catalog categories to persist.
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
      // Seed customized services if table is empty
      const custCount = await query(
        "SELECT COUNT(*) as count FROM customized_services",
      );
      if (custCount[0].count === 0) {
        console.log("Seeding default customized services...");
        const defaultCustomized = [
          {
            id: "mini-services",
            title: "Mini Services",
            price: 59,
            image:
              "https://images.unsplash.com/photo-1621905252507-b354bc25edac?auto=format&fit=crop&w=800&q=80",
            plans: [
              {
                name: "Express",
                price: 59,
                duration: "1 hour",
                description: "Basic AC filter cleaning & dusting.",
                includes: ["Filter washing", "Dry dusting of unit"],
                excludes: ["Coil deep chemical washing"],
              },
              {
                name: "Elite",
                price: 149,
                duration: "2 hours",
                description: "Premium AC deep chemical cleaning.",
                includes: [
                  "Chemical coil scrub",
                  "Drain pipe flush",
                  "Condenser cleaning",
                ],
                excludes: ["Gas refilling"],
              },
            ],
          },
          {
            id: "bedroom-cleaning",
            title: "Bedroom Deep Cleaning (Only For Flats)",
            price: 649,
            image:
              "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=800&q=80",
            plans: [
              {
                name: "Express",
                price: 649,
                duration: "1.5 hours",
                description: "Vacuuming and basic dusting.",
                includes: [
                  "Dry vacuuming of mattress & floor",
                  "Dusting surfaces",
                ],
                excludes: ["Wet extraction cleaning"],
              },
              {
                name: "Elite",
                price: 999,
                duration: "2.5 hours",
                description: "Deep sanitization and wardrobe clean.",
                includes: [
                  "HEPA vacuuming",
                  "Wardrobe cleaning inside-out",
                  "Window glass polish",
                ],
                excludes: ["Heavy carpet extraction"],
              },
            ],
          },
          {
            id: "terrace-cleaning",
            title: "Terrace Cleaning Service",
            price: 1999,
            image:
              "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
            plans: [
              {
                name: "Express",
                price: 1999,
                duration: "2 hours",
                description: "High pressure floor wash.",
                includes: ["Pressure wash floor tiles", "Grill dusting"],
                excludes: ["Stain removal scrub"],
              },
              {
                name: "Elite",
                price: 2999,
                duration: "3.5 hours",
                description: "Complete floor scrub, acid wash, wall scrub.",
                includes: [
                  "Single-disc scrub floor",
                  "Wall tile wash",
                  "Grill rust protection spray",
                ],
                excludes: ["Waterproofing treatment"],
              },
            ],
          },
          {
            id: "mattress-shampooing",
            title: "Mattress Shampooing Service",
            price: 349,
            image:
              "https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=800&q=80",
            plans: [
              {
                name: "Express",
                price: 349,
                duration: "1 hour",
                description: "Dry vacuuming and UV sanitization.",
                includes: ["Dry vacuum extraction", "UV disinfection scan"],
                excludes: ["Wet shampoo extraction"],
              },
              {
                name: "Elite",
                price: 599,
                duration: "2.5 hours",
                description: "Deep wet extraction & steam sanitization.",
                includes: [
                  "Eco shampoo scrubbing",
                  "Injection-extraction wet extraction",
                  "Steam sanitization",
                ],
                excludes: ["Heavy stain dye removal"],
              },
            ],
          },
        ];
        for (const c of defaultCustomized) {
          await query(
            "INSERT INTO customized_services (id, title, price, image, plans) VALUES (?, ?, ?, ?, ?)",
            [c.id, c.title, c.price, c.image, JSON.stringify(c.plans)],
          );
        }
        console.log("Seeded customized services successfully.");
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
  } catch (err) {
    console.error("MySQL database initialization failed:", err.message);
    console.warn(
      "PLEASE NOTE: Verify your local MySQL server is running and the database specified in DB_NAME exists.",
    );
  }
}

// Database methods
module.exports = {
  pool,
  query,
  initDb,

  // Categories
  async getCategories() {
    return await query("SELECT * FROM categories");
  },
  async addCategory({ id, title, tagline, emoji, image }) {
    await query(
      "INSERT INTO categories (id, title, tagline, emoji, image) VALUES (?, ?, ?, ?, ?)",
      [id, title, tagline, emoji, image || null],
    );
    return { id, title, tagline, emoji, image };
  },
  async updateCategory(id, { title, tagline, emoji, image }) {
    await query(
      "UPDATE categories SET title = ?, tagline = ?, emoji = ?, image = ? WHERE id = ?",
      [title, tagline, emoji, image, id],
    );
    return { id, title, tagline, emoji, image };
  },
  async deleteCategory(id) {
    await query("DELETE FROM categories WHERE id = ?", [id]);
    return true;
  },

  async getServices() {
    const rows = await query("SELECT * FROM services");
    return rows.map((r) => ({
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
    return await query(
      "SELECT * FROM reviews ORDER BY createdAt DESC LIMIT 20",
    );
  },
  async addReview({ id, serviceId, userName, rating, comment }) {
    const createdAt = new Date().toISOString();
    await query(
      "INSERT INTO reviews (id, serviceId, userName, rating, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      [id, serviceId, userName, Number(rating) || 5, comment || "", createdAt],
    );
    return { id, serviceId, userName, rating, comment, createdAt };
  },

  // Bookings
  async getBookings() {
    const rows = await query(`
      SELECT b.*, t.name as technicianName, t.phone as technicianPhone, t.specialty as technicianSpecialty, t.status as technicianStatus
      FROM bookings b
      LEFT JOIN technicians t ON b.technicianId = t.id
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
            specialty: r.technicianSpecialty,
            status: r.technicianStatus,
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
    const rows = await query("SELECT * FROM customized_services");
    return rows.map((r) => ({
      ...r,
      paymentType: r.payment_type || "full",
      plans: typeof r.plans === "string" ? JSON.parse(r.plans) : r.plans || [],
    }));
  },
  async addCustomizedService({ id, title, price, image, plans, paymentType }) {
    const plansString = JSON.stringify(plans || []);
    await query(
      "INSERT INTO customized_services (id, title, price, image, plans, payment_type) VALUES (?, ?, ?, ?, ?, ?)",
      [id, title, price, image || null, plansString, paymentType || "full"],
    );
    return { id, title, price, image, plans, paymentType: paymentType || "full" };
  },
  async updateCustomizedService(id, { title, price, image, plans, paymentType }) {
    const plansString = JSON.stringify(plans || []);
    await query(
      "UPDATE customized_services SET title = ?, price = ?, image = ?, plans = ?, payment_type = ? WHERE id = ?",
      [title, price, image || null, plansString, paymentType || "full", id],
    );
    return { id, title, price, image, plans, paymentType: paymentType || "full" };
  },
  async deleteCustomizedService(id) {
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
    return await query("SELECT * FROM coupons ORDER BY code ASC");
  },
  async addCoupon({ code, discount, minAmount, expiryDate, isActive }) {
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
    await query(
      "UPDATE coupons SET discount = ?, minAmount = ?, expiryDate = ?, isActive = ? WHERE code = ?",
      [Number(discount), Number(minAmount), expiryDate, isActive ? 1 : 0, code],
    );
    return { code, discount, minAmount, expiryDate, isActive };
  },
  async deleteCoupon(code) {
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
