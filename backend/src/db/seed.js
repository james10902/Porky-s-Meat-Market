/**
 * Database seed — inserts categories and all 14 products.
 * Run: node src/db/seed.js
 */
require('dotenv').config();
const { pool } = require('./pool');

const categories = [
  { name: 'Beef',      slug: 'beef',      description: 'Fresh beef cuts and mince', sort_order: 1 },
  { name: 'Pork',      slug: 'pork',      description: 'Pork chops and cuts',       sort_order: 2 },
  { name: 'Chicken',   slug: 'chicken',   description: 'Whole and portioned chicken', sort_order: 3 },
  { name: 'Processed', slug: 'processed', description: 'Polony, wors and dried meats', sort_order: 4 },
  { name: 'Game',      slug: 'game',      description: 'Namibian game meat',         sort_order: 5 },
  { name: 'Bulk',      slug: 'bulk',      description: 'Value bulk packs',           sort_order: 6 }
];

const products = [
  { name: 'Beef Mince & Wors',       slug: 'beef-mince-wors',         price: 119.99, unit: 'per kg',       category: 'beef',      image_url: '/assets/Images/Beef mince and Beef wors.jpg', description: 'Fresh beef mince and traditional boerewors — a braai essential.',                  is_featured: true,  stock: 100 },
  { name: 'Beef Stew',               slug: 'beef-stew',               price: 109.99, unit: 'per kg',       category: 'beef',      image_url: '/assets/Images/Beef Stew.jpg',                description: 'Tender beef stew cuts, perfect for slow-cooking.',                                is_featured: false, stock: 80  },
  { name: 'Big Polonies',            slug: 'big-polonies',            price: 54.99,  unit: 'per kg',       category: 'processed', image_url: '/assets/Images/Big polonies.jpg',             description: 'Classic large polony — a Namibian lunchbox staple.',                              is_featured: false, stock: 200 },
  { name: 'Mini Polony',             slug: 'mini-polony',             price: 49.99,  unit: 'per kg',       category: 'processed', image_url: '/assets/Images/Mini Polony.jpg',              description: 'Convenient mini polony portions for everyday use.',                               is_featured: false, stock: 200 },
  { name: 'Chicken Breast (Bone-in)',slug: 'chicken-breast-bone-in',  price: 74.99,  unit: 'per kg',       category: 'chicken',   image_url: '/assets/Images/Chicken Breast Bone.jpg',      description: 'Juicy bone-in chicken breast, great for grilling or roasting.',                   is_featured: false, stock: 150 },
  { name: 'Chicken Feet',            slug: 'chicken-feet',            price: 29.99,  unit: 'per kg',       category: 'chicken',   image_url: '/assets/Images/Chicken Feet.jpg',             description: 'Fresh chicken feet — popular for soups and stews.',                               is_featured: false, stock: 120 },
  { name: 'Chicken Leg Quarters',    slug: 'chicken-leg-quarters',    price: 64.99,  unit: 'per kg',       category: 'chicken',   image_url: '/assets/Images/Chicken Leg Quatres.jpg',      description: 'Meaty chicken leg quarters, ideal for braai or oven.',                            is_featured: false, stock: 150 },
  { name: 'Chicken Liver',           slug: 'chicken-liver',           price: 34.99,  unit: 'per kg',       category: 'chicken',   image_url: '/assets/Images/Chicken Liver.jpg',            description: 'Fresh chicken livers, rich in flavour and nutrients.',                            is_featured: false, stock: 100 },
  { name: 'Chicken Necks',           slug: 'chicken-necks',           price: 24.99,  unit: 'per kg',       category: 'chicken',   image_url: '/assets/Images/Chicken Necks.jpg',            description: 'Chicken necks — perfect for stocks, soups, and braai.',                           is_featured: false, stock: 100 },
  { name: 'Chicken Soup Pack',       slug: 'chicken-soup-pack',       price: 44.99,  unit: 'per pack',     category: 'chicken',   image_url: '/assets/Images/Chicken Soup Pack.jpg',        description: 'All-in-one chicken soup pack with mixed cuts.',                                   is_featured: false, stock: 80  },
  { name: 'Droewors',                slug: 'droewors',                price: 189.99, unit: 'per kg',       category: 'processed', image_url: '/assets/Images/Droewors.jpg',                 description: 'Traditional dried wors — a Namibian snack favourite.',                            is_featured: true,  stock: 60  },
  { name: 'Game Stew',               slug: 'game-stew',               price: 149.99, unit: 'per kg',       category: 'game',      image_url: '/assets/Images/Game stew.jpg',                description: 'Premium Namibian game stew cuts — wild and flavourful.',                          is_featured: true,  stock: 50  },
  { name: 'Pork Shoulder Chops',     slug: 'pork-shoulder-chops',     price: 89.99,  unit: 'per kg',       category: 'pork',      image_url: '/assets/Images/Pork Shoulder Chops.jpg',      description: 'Thick-cut pork shoulder chops, great for braai or pan-fry.',                      is_featured: true,  stock: 90  },
  { name: 'Bulk Meat Pack',          slug: 'bulk-meat-pack',          price: 549.99, unit: 'per 5 kg box', category: 'bulk',      image_url: '/assets/Images/product-bulk.jpg',             description: 'Value bulk pack — mixed cuts for households and hawkers.',                        is_featured: false, stock: 40  }
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Categories
    console.log('Seeding categories…');
    const catMap = {};
    for (const cat of categories) {
      const res = await client.query(
        `INSERT INTO categories (name, slug, description, sort_order)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET name=$1, description=$3, sort_order=$4
         RETURNING id`,
        [cat.name, cat.slug, cat.description, cat.sort_order]
      );
      catMap[cat.slug] = res.rows[0].id;
    }

    // Products
    console.log('Seeding products…');
    for (const p of products) {
      await client.query(
        `INSERT INTO products
           (name, slug, description, price, unit, category_id, image_url, stock, is_featured)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (slug) DO UPDATE
           SET name=$1, description=$3, price=$4, unit=$5,
               category_id=$6, image_url=$7, stock=$8, is_featured=$9`,
        [p.name, p.slug, p.description, p.price, p.unit,
         catMap[p.category], p.image_url, p.stock, p.is_featured]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Seed complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
