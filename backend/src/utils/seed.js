require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const DeliveryPartner = require('../models/DeliveryPartner');

const shouldReset =
  process.argv.includes('--reset') ||
  process.env.SEED_RESET === 'true';

const ensureUser = async userData => {
  const email = String(userData.email).trim().toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) return existing;
  return User.create({ ...userData, email });
};

const ensureDeliveryAccount = async vendorId => {
  const email = 'delivery@lobby.com';
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: 'Campus Rider',
      email,
      phone: '+919800000099',
      password: 'DeliveryPass123',
      role: 'delivery',
      isVerified: true
    });
  } else {
    user.name = 'Campus Rider';
    user.role = 'delivery';
    user.phone = '+919800000099';
    user.isVerified = true;
    user.isSuspended = false;
    user.password = 'DeliveryPass123';
    await user.save();
  }

  let partner = await DeliveryPartner.findOne({ user: user._id });
  if (!partner) {
    partner = await DeliveryPartner.create({
      vendor: vendorId,
      user: user._id,
      name: 'Campus Rider',
      phone: '+919800000099',
      isActive: true
    });
  } else {
    partner.vendor = vendorId;
    partner.name = 'Campus Rider';
    partner.phone = '+919800000099';
    partner.isActive = true;
    await partner.save();
  }

  return { user, partner };
};

const ensureCategory = async categoryData => {
  const existing = await Category.findOne({ title: categoryData.title });
  if (existing) return existing;
  return Category.create(categoryData);
};

const ensureShop = async (shopData, legacyNames = []) => {
  const existing = await Shop.findOne({
    vendor: shopData.vendor,
    name: { $in: [shopData.name, ...legacyNames] }
  });
  if (existing) {
    Object.assign(existing, shopData);
    await existing.save();
    return existing;
  }
  return Shop.create(shopData);
};

const ensureProduct = async productData => {
  const existing = await Product.findOne({ title: productData.title, shop: productData.shop });
  if (existing) {
    Object.assign(existing, productData);
    await existing.save();
    return existing;
  }
  return Product.create(productData);
};

const seed = async () => {
  try {
    await connectDB();
    await Product.collection.dropIndexes().catch(() => {});
    await Product.syncIndexes();

    if (shouldReset) {
      await Promise.all([
        User.deleteMany(),
        Vendor.deleteMany(),
        Category.deleteMany(),
        Product.deleteMany(),
        Shop.deleteMany()
      ]);
      console.log('Reset mode enabled: existing data cleared.');
    }

    await ensureUser({ name: 'Kanishk Jain', email: 'kanishk.053344@tmu.ac.in', phone: '+919812345678', password: 'Password123' });
    await ensureUser({ name: 'Admin User', email: 'admin@lobby.com', phone: '+919800000001', password: 'AdminPass123', role: 'admin', isVerified: true });
    const vendorUser = await ensureUser({ name: 'Campus Mart', email: 'vendor@lobby.com', phone: '+919876543210', password: 'VendorPass123', role: 'vendor', isVerified: true });

    let vendor = await Vendor.findOne({ user: vendorUser._id });
    if (!vendor) {
      vendor = await Vendor.create({
        user: vendorUser._id,
        storeName: 'Campus Mart',
        contactNumber: '+919876543210',
        description: 'Daily essentials, snacks, and stationery for campus life',
        categories: ['Snacks', 'Stationery'],
        isApproved: true,
        rating: 4.8
      });
    }

    await ensureDeliveryAccount(vendor._id);
    console.log('Delivery demo account ready: delivery@lobby.com / DeliveryPass123');

    const shop = await ensureShop(
      {
        vendor: vendor._id,
        name: 'Essentials',
        description: 'Daily requirements at one place: groceries, hygiene, stationery, and quick essentials.',
        address: 'Main Campus Road',
        contactNumber: '+919876543210',
        campus: 'University Grounds',
        tags: ['essentials', 'daily-needs', 'groceries'],
        bannerImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
        rating: 4.8
      },
      ['Campus Mart Shop']
    );
    const shop2 = await ensureShop({ vendor: vendor._id, name: 'Print Hub', description: 'Quick prints, copies, and stationery essentials for study sessions', address: 'Library Annex', contactNumber: '+919876543210', campus: 'University Grounds', tags: ['printing', 'stationery', 'notes'], bannerImage: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=1200&q=80', rating: 4.6 });
    const shop3 = await ensureShop({ vendor: vendor._id, name: 'Snack Corner', description: 'Fresh snacks, drinks, and campus favorites delivered fast', address: 'Student Center', contactNumber: '+919876543210', campus: 'University Grounds', tags: ['snacks', 'drinks', 'quick-bites'], bannerImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80', rating: 4.7 });

    const foodCategory = await ensureCategory({ title: 'Food & Snacks', description: 'Campus favorites for quick bites', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80' });
    const stationeryCategory = await ensureCategory({ title: 'Printing & Stationery', description: 'Study essentials and print services', image: 'https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=1200&q=80' });
    const essentialsCategory = await ensureCategory({ title: 'Daily Essentials', description: 'Everyday needs for hostel and campus life', image: 'https://images.unsplash.com/photo-1584473457409-cebe5f9967de?auto=format&fit=crop&w=1200&q=80' });

    await Promise.all([
      ensureProduct({ title: 'Instant Noodles Cup', description: 'Hot and spicy instant noodles cup ready in minutes', category: foodCategory._id, price: 45, discount: 5, images: ['https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=1200&q=80'], stock: 120, tags: ['snacks', 'instant'], vendor: vendor._id, shop: shop3._id, rating: 4.5 }),
      ensureProduct({ title: 'A4 Printing Bundle', description: '40 pages black and white prints', category: stationeryCategory._id, price: 120, discount: 10, images: ['https://images.unsplash.com/photo-1588666309990-d68f08e3d4a6?auto=format&fit=crop&w=1200&q=80'], stock: 50, tags: ['print', 'stationery'], vendor: vendor._id, shop: shop2._id, rating: 4.7 }),
      ensureProduct({ title: 'Milk 1L Pack', description: 'Fresh toned milk pack for tea, coffee, and breakfast', category: essentialsCategory._id, price: 62, discount: 0, images: ['https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=1200&q=80'], stock: 70, tags: ['milk', 'daily-needs'], vendor: vendor._id, shop: shop._id, rating: 4.6 }),
      ensureProduct({ title: 'Whole Wheat Bread', description: 'Soft and fresh whole wheat bread loaf', category: essentialsCategory._id, price: 45, discount: 5, images: ['https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=1200&q=80'], stock: 80, tags: ['bread', 'grocery'], vendor: vendor._id, shop: shop._id, rating: 4.5 }),
      ensureProduct({ title: 'Toothpaste + Brush Combo', description: 'Daily oral care combo pack for students', category: essentialsCategory._id, price: 99, discount: 8, images: ['https://images.pexels.com/photos/3735657/pexels-photo-3735657.jpeg?auto=compress&cs=tinysrgb&w=1200'], stock: 60, tags: ['hygiene', 'daily-needs'], vendor: vendor._id, shop: shop._id, rating: 4.7 }),
      ensureProduct({ title: 'Bath Soap Pack (4 pcs)', description: 'Value pack for everyday personal care', category: essentialsCategory._id, price: 130, discount: 10, images: ['https://images.unsplash.com/photo-1584305574647-acf8069a3d1b?auto=format&fit=crop&w=1200&q=80'], stock: 55, tags: ['soap', 'hygiene'], vendor: vendor._id, shop: shop._id, rating: 4.6 }),
      ensureProduct({ title: 'Laundry Detergent 1kg', description: 'Effective detergent powder for hostel laundry needs', category: essentialsCategory._id, price: 185, discount: 7, images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80'], stock: 40, tags: ['laundry', 'daily-needs'], vendor: vendor._id, shop: shop._id, rating: 4.5 }),
      ensureProduct({ title: 'Notebook + Pen Kit', description: 'Quick study combo for classes and daily notes', category: essentialsCategory._id, price: 85, discount: 6, images: ['https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80'], stock: 75, tags: ['study', 'essentials'], vendor: vendor._id, shop: shop._id, rating: 4.7 }),
      ensureProduct({ title: 'Photo Prints', description: 'Fast photo printing in a variety of sizes', category: stationeryCategory._id, price: 80, discount: 0, images: ['https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?auto=format&fit=crop&w=1200&q=80'], stock: 70, tags: ['photo', 'printing'], vendor: vendor._id, shop: shop2._id, rating: 4.6 }),
      ensureProduct({ title: 'Spiral Notebook Pack', description: 'Set of 3 durable spiral notebooks for classes and notes', category: stationeryCategory._id, price: 150, discount: 12, images: ['https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=1200&q=80'], stock: 85, tags: ['notebook', 'stationery'], vendor: vendor._id, shop: shop2._id, rating: 4.8 }),
      ensureProduct({ title: 'Gel Pen Set', description: 'Smooth writing gel pens in black, blue, and red', category: stationeryCategory._id, price: 99, discount: 5, images: ['https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=1200&q=80'], stock: 120, tags: ['pens', 'stationery'], vendor: vendor._id, shop: shop2._id, rating: 4.7 }),
      ensureProduct({ title: 'Exam File Folder', description: 'Transparent folder for assignments and exam sheets', category: stationeryCategory._id, price: 45, discount: 0, images: ['https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80'], stock: 140, tags: ['files', 'stationery'], vendor: vendor._id, shop: shop2._id, rating: 4.5 }),
      ensureProduct({ title: 'Color Print Bundle', description: '20 pages premium color printing for presentations', category: stationeryCategory._id, price: 180, discount: 10, images: ['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=1200&q=80'], stock: 60, tags: ['printing', 'color-print'], vendor: vendor._id, shop: shop2._id, rating: 4.7 }),
      ensureProduct({ title: 'Cold Brew Coffee', description: 'Refreshing cold brew for late-night study sessions', category: foodCategory._id, price: 60, discount: 5, images: ['https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=1200&q=80'], stock: 90, tags: ['drink', 'coffee'], vendor: vendor._id, shop: shop3._id, rating: 4.7 }),
      ensureProduct({ title: 'Cheese Veg Sandwich', description: 'Toasted sandwich loaded with fresh veggies and cheese', category: foodCategory._id, price: 75, discount: 8, images: ['https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=1200&q=80'], stock: 65, tags: ['sandwich', 'snacks'], vendor: vendor._id, shop: shop3._id, rating: 4.8 }),
      ensureProduct({ title: 'Paneer Puff', description: 'Freshly baked puff with spicy paneer stuffing', category: foodCategory._id, price: 40, discount: 0, images: ['https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&w=1200&q=80'], stock: 100, tags: ['puff', 'bakery'], vendor: vendor._id, shop: shop3._id, rating: 4.6 }),
      ensureProduct({ title: 'Masala Fries', description: 'Crispy fries tossed with signature masala seasoning', category: foodCategory._id, price: 55, discount: 5, images: ['https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=1200&q=80'], stock: 80, tags: ['fries', 'quick-bites'], vendor: vendor._id, shop: shop3._id, rating: 4.7 }),
      ensureProduct({ title: 'Chocolate Muffin', description: 'Soft chocolate muffin perfect for a quick sweet break', category: foodCategory._id, price: 35, discount: 0, images: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80'], stock: 95, tags: ['muffin', 'dessert'], vendor: vendor._id, shop: shop3._id, rating: 4.5 })
    ]);

    console.log(shouldReset ? 'Seed data recreated successfully (reset).' : 'Seed data ensured successfully (existing users preserved).');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed', error);
    process.exit(1);
  }
};

seed();
