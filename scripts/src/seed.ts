import { db, categoriesTable, brandsTable, productsTable, couponsTable, bannersTable, flashSalesTable, flashSaleProductsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const categories = [
  { name: "Electronics", slug: "electronics", icon: "📱", isActive: true, sortOrder: 1 },
  { name: "Fashion", slug: "fashion", icon: "👗", isActive: true, sortOrder: 2 },
  { name: "Jerseys", slug: "jerseys", icon: "🎽", isActive: true, sortOrder: 3 },
  { name: "Home & Kitchen", slug: "home-kitchen", icon: "🏠", isActive: true, sortOrder: 3 },
  { name: "Beauty & Personal Care", slug: "beauty", icon: "💄", isActive: true, sortOrder: 4 },
  { name: "Sports & Fitness", slug: "sports", icon: "⚽", isActive: true, sortOrder: 5 },
  { name: "Books", slug: "books", icon: "📚", isActive: true, sortOrder: 6 },
  { name: "Toys & Games", slug: "toys", icon: "🧸", isActive: true, sortOrder: 7 },
  { name: "Grocery", slug: "grocery", icon: "🛒", isActive: true, sortOrder: 8 },
];

const brands = [
  { name: "Samsung", slug: "samsung", logo: "https://logo.clearbit.com/samsung.com", isActive: true, isFeatured: true },
  { name: "Apple", slug: "apple", logo: "https://logo.clearbit.com/apple.com", isActive: true, isFeatured: true },
  { name: "Nike", slug: "nike", logo: "https://logo.clearbit.com/nike.com", isActive: true, isFeatured: true },
  { name: "Adidas", slug: "adidas", logo: "https://logo.clearbit.com/adidas.com", isActive: true, isFeatured: true },
  { name: "OnePlus", slug: "oneplus", logo: "https://logo.clearbit.com/oneplus.com", isActive: true, isFeatured: false },
  { name: "Boat", slug: "boat", logo: "https://logo.clearbit.com/boat-lifestyle.com", isActive: true, isFeatured: true },
  { name: "Myntra", slug: "myntra", logo: "https://logo.clearbit.com/myntra.com", isActive: true, isFeatured: false },
  { name: "Puma", slug: "puma", logo: "https://logo.clearbit.com/puma.com", isActive: true, isFeatured: false },
];

const productData = [
  // Electronics
  { title: "Samsung Galaxy S24 Ultra 5G", basePrice: 134999, sellingPrice: 114999, category: "electronics", brand: "samsung", tags: ["smartphone", "5g", "samsung"], thumbnail: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: false, stock: 50, description: "The ultimate Samsung flagship with 200MP camera and S Pen." },
  { title: "Apple iPhone 15 Pro Max 256GB", basePrice: 159900, sellingPrice: 149900, category: "electronics", brand: "apple", tags: ["iphone", "apple", "5g"], thumbnail: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: false, stock: 30, description: "Apple's most powerful iPhone with titanium design and A17 Pro chip." },
  { title: "OnePlus Nord CE 4 5G 8GB RAM", basePrice: 29999, sellingPrice: 24999, category: "electronics", brand: "oneplus", tags: ["oneplus", "5g", "smartphone"], thumbnail: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: true, flashSalePrice: 22999, stock: 80, description: "Smooth 120Hz display and fast charging for everyday performance." },
  { title: "boAt Rockerz 550 Bluetooth Headphones", basePrice: 4999, sellingPrice: 1799, category: "electronics", brand: "boat", tags: ["headphones", "bluetooth", "boat"], thumbnail: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: true, flashSalePrice: 1499, stock: 200, description: "40-hour playtime with punchy bass and comfortable ear cushions." },
  { title: "Samsung 65-inch 4K QLED Smart TV", basePrice: 119999, sellingPrice: 79999, category: "electronics", brand: "samsung", tags: ["tv", "samsung", "4k", "qled"], thumbnail: "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: false, stock: 15, description: "Quantum Dot technology for brilliant colours and deep contrast." },
  { title: "Apple MacBook Air M2 256GB", basePrice: 114900, sellingPrice: 99900, category: "electronics", brand: "apple", tags: ["macbook", "laptop", "m2"], thumbnail: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: false, stock: 25, description: "Supercharged by the M2 chip. Remarkably thin and light." },
  { title: "boAt Airdopes 141 True Wireless Earbuds", basePrice: 3999, sellingPrice: 999, category: "electronics", brand: "boat", tags: ["earbuds", "wireless", "boat"], thumbnail: "https://images.unsplash.com/photo-1590658165737-15a047b7c44b?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: true, flashSalePrice: 899, stock: 500, description: "42-hour total playtime with BEAST Mode for gaming." },
  { title: "OnePlus Watch 2 Smartwatch", basePrice: 24999, sellingPrice: 19999, category: "electronics", brand: "oneplus", tags: ["smartwatch", "oneplus", "fitness"], thumbnail: "https://images.unsplash.com/photo-1544117519-31a4b719223d?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 60, description: "100+ workout modes with dual-chip architecture for 100-hour battery life." },
  { title: "Samsung Galaxy Tab S9 FE", basePrice: 54999, sellingPrice: 42999, category: "electronics", brand: "samsung", tags: ["tablet", "samsung", "android"], thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 40, description: "Large 10.9-inch display with IP68 water resistance and S Pen support." },
  { title: "Realme Buds Air 5 Pro", basePrice: 5999, sellingPrice: 2999, category: "electronics", brand: "boat", tags: ["earbuds", "anc", "realme"], thumbnail: "https://images.unsplash.com/photo-1649184541073-b84fc9be7d4c?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: true, flashSalePrice: 2499, stock: 150, description: "50dB ANC with 360° Spatial Audio for immersive sound." },

  // Jerseys
  { title: "FC Barcelona Home Jersey 2024-25", basePrice: 6999, sellingPrice: 4999, category: "jerseys", brand: "nike", tags: ["barcelona", "football", "jersey", "nike"], thumbnail: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: false, stock: 120, description: "Official FC Barcelona home jersey in Dri-FIT ADV fabric. Breathable and moisture-wicking for peak performance." },
  { title: "Real Madrid Away Jersey 2024-25", basePrice: 6999, sellingPrice: 5499, category: "jerseys", brand: "adidas", tags: ["real madrid", "football", "jersey", "adidas"], thumbnail: "https://images.unsplash.com/photo-1529516548873-9ce57c8f155e?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: false, stock: 90, description: "Adidas HEAT.RDY technology keeps you cool on and off the pitch. Official Real Madrid away kit." },
  { title: "India Cricket ODI Jersey Blue", basePrice: 3499, sellingPrice: 1999, category: "jerseys", brand: "nike", tags: ["india", "cricket", "jersey", "bcci"], thumbnail: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: true, flashSalePrice: 1699, stock: 300, description: "India's iconic blue ODI jersey with Dri-FIT technology. Perfect replica for fans and players alike." },
  { title: "Manchester City Home Jersey 2024-25", basePrice: 7499, sellingPrice: 5999, category: "jerseys", brand: "puma", tags: ["manchester city", "football", "jersey", "puma"], thumbnail: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 75, description: "Sky blue home jersey with dryCELL technology for comfort during the full 90 minutes." },
  { title: "Chicago Bulls NBA Jersey Red", basePrice: 4999, sellingPrice: 3499, category: "jerseys", brand: "nike", tags: ["chicago bulls", "basketball", "nba", "jersey"], thumbnail: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: true, flashSalePrice: 2999, stock: 100, description: "Classic red Bulls jersey with Dri-FIT Swingman technology for authentic on-court feel." },
  { title: "Brazil National Football Jersey Yellow", basePrice: 5999, sellingPrice: 4499, category: "jerseys", brand: "nike", tags: ["brazil", "football", "jersey", "world cup"], thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: false, stock: 150, description: "Brazil's iconic canary yellow with Dri-FIT technology. Show your Seleção spirit." },
  { title: "IPL Mumbai Indians Jersey 2024", basePrice: 2999, sellingPrice: 1799, category: "jerseys", brand: "adidas", tags: ["mumbai indians", "ipl", "cricket", "jersey"], thumbnail: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 250, description: "Official Mumbai Indians fan jersey with AEROREADY moisture-absorbing fabric for ultimate comfort." },
  { title: "Argentina World Cup Winner Jersey", basePrice: 6499, sellingPrice: 4999, category: "jerseys", brand: "adidas", tags: ["argentina", "football", "jersey", "messi", "world cup"], thumbnail: "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: true, flashSalePrice: 4299, stock: 200, description: "Replica of the iconic Albiceleste jersey worn during the 2022 World Cup. Lightweight AEROREADY fabric." },
  { title: "Los Angeles Lakers NBA Jersey Purple", basePrice: 4999, sellingPrice: 3799, category: "jerseys", brand: "nike", tags: ["lakers", "nba", "basketball", "jersey"], thumbnail: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 80, description: "Purple and gold Swingman jersey with classic Lakers branding. Authentic NBA-quality design." },
  { title: "CSK Chennai Super Kings Jersey Yellow", basePrice: 2499, sellingPrice: 1499, category: "jerseys", brand: "puma", tags: ["csk", "ipl", "cricket", "chennai", "jersey"], thumbnail: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 400, description: "Whistle Podu! Official CSK fan jersey in dryCELL fabric. Support the Super Kings in style." },

  // Fashion
  { title: "Men's Regular Fit Cotton Shirt", basePrice: 1299, sellingPrice: 699, category: "fashion", brand: "myntra", tags: ["shirt", "men", "cotton"], thumbnail: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 300, description: "Classic regular fit shirt in premium cotton for everyday wear." },
  { title: "Women's Embroidered Anarkali Kurti", basePrice: 2499, sellingPrice: 1199, category: "fashion", brand: "myntra", tags: ["kurti", "women", "ethnic"], thumbnail: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: false, stock: 150, description: "Elegant floral embroidery kurti for festive and casual occasions." },
  { title: "Nike Air Force 1 Low Men's Shoes", basePrice: 7999, sellingPrice: 6499, category: "fashion", brand: "nike", tags: ["shoes", "nike", "sneakers"], thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: false, stock: 100, description: "Timeless classic with premium leather upper and Nike Air cushioning." },
  { title: "Adidas Ultraboost 22 Running Shoes", basePrice: 15999, sellingPrice: 11999, category: "fashion", brand: "adidas", tags: ["shoes", "adidas", "running"], thumbnail: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: true, flashSalePrice: 9999, stock: 75, description: "Incredible energy return with Continental rubber outsole." },
  { title: "Women's Banarasi Silk Saree", basePrice: 8999, sellingPrice: 4999, category: "fashion", brand: "myntra", tags: ["saree", "women", "silk", "banarasi"], thumbnail: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: false, stock: 50, description: "Pure Banarasi silk saree with gold zari work for weddings and festivals." },
  { title: "Puma Men's Track Pants", basePrice: 2499, sellingPrice: 1499, category: "fashion", brand: "puma", tags: ["track pants", "puma", "sportswear"], thumbnail: "https://images.unsplash.com/photo-1556906781-9a412961a28c?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: true, flashSalePrice: 1199, stock: 200, description: "Lightweight and breathable track pants for sports and casual wear." },
  { title: "Nike Dri-FIT T-Shirt", basePrice: 2499, sellingPrice: 1799, category: "fashion", brand: "nike", tags: ["tshirt", "nike", "dryfit"], thumbnail: "https://images.unsplash.com/photo-1520975954732-35dd22299614?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 250, description: "Sweat-wicking fabric keeps you dry and comfortable during workouts." },
  { title: "Women's Palazzo Set with Dupatta", basePrice: 1999, sellingPrice: 999, category: "fashion", brand: "myntra", tags: ["palazzo", "ethnic", "women"], thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 120, description: "Comfortable and stylish palazzo set for everyday ethnic wear." },
  { title: "Men's Slim Fit Chinos", basePrice: 1799, sellingPrice: 899, category: "fashion", brand: "myntra", tags: ["chinos", "men", "casual"], thumbnail: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 180, description: "Slim fit chinos in stretch cotton for a modern casual look." },
  { title: "Adidas Classic Backpack", basePrice: 3999, sellingPrice: 2499, category: "fashion", brand: "adidas", tags: ["backpack", "adidas", "bag"], thumbnail: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 100, description: "Durable 21L backpack with laptop sleeve and multiple compartments." },

  // Home & Kitchen
  { title: "Instant Pot Duo 7-in-1 Electric Pressure Cooker", basePrice: 9999, sellingPrice: 6999, category: "home-kitchen", brand: "myntra", tags: ["pressure cooker", "kitchen", "instant pot"], thumbnail: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: false, stock: 60, description: "7-in-1 multi-use cooker: pressure cooker, slow cooker, rice cooker and more." },
  { title: "Philips Air Fryer HD9252", basePrice: 11995, sellingPrice: 7499, category: "home-kitchen", brand: "myntra", tags: ["air fryer", "philips", "kitchen"], thumbnail: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: true, flashSalePrice: 6499, stock: 45, description: "Rapid Air technology for healthy fried food with up to 90% less fat." },
  { title: "Prestige Induction Cooktop 2200W", basePrice: 3499, sellingPrice: 2199, category: "home-kitchen", brand: "myntra", tags: ["induction", "cooktop", "prestige"], thumbnail: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 80, description: "8 preset menus with smart temperature control and safety features." },
  { title: "Milton Thermosteel Flask 1L", basePrice: 999, sellingPrice: 599, category: "home-kitchen", brand: "myntra", tags: ["flask", "thermos", "milton"], thumbnail: "https://images.unsplash.com/photo-1612938900065-8d24d471e24e?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 300, description: "18 hours hot and 24 hours cold retention with leak-proof lid." },
  { title: "Bombay Dyeing 100% Cotton Bedsheet Set", basePrice: 2499, sellingPrice: 1299, category: "home-kitchen", brand: "myntra", tags: ["bedsheet", "cotton", "bombay dyeing"], thumbnail: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 150, description: "Double bedsheet with 2 pillow covers in premium 200TC cotton." },

  // Beauty
  { title: "Maybelline Fit Me Matte Foundation SPF 22", basePrice: 599, sellingPrice: 449, category: "beauty", brand: "myntra", tags: ["foundation", "makeup", "maybelline"], thumbnail: "https://images.unsplash.com/photo-1631214524020-3c69e43a6b2a?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 400, description: "Natural matte finish with oil control that lasts all day." },
  { title: "Biotique Bio Honey Gel Face Wash", basePrice: 299, sellingPrice: 199, category: "beauty", brand: "myntra", tags: ["face wash", "biotique", "skin care"], thumbnail: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 600, description: "Soap-free face wash with honey and walnut for deep cleansing." },
  { title: "The Ordinary Hyaluronic Acid 2% + B5", basePrice: 1499, sellingPrice: 1199, category: "beauty", brand: "myntra", tags: ["serum", "hyaluronic", "skin care"], thumbnail: "https://images.unsplash.com/photo-1617897903246-719242758050?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: false, stock: 200, description: "Multi-depth hydration support with surface smoothing for all skin types." },
  { title: "Lakme Absolute Matte Lipstick", basePrice: 450, sellingPrice: 320, category: "beauty", brand: "myntra", tags: ["lipstick", "lakme", "matte"], thumbnail: "https://images.unsplash.com/photo-1586495777744-4e6232bf2176?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: true, flashSalePrice: 249, stock: 500, description: "Intensely pigmented matte finish that lasts up to 16 hours." },

  // Sports
  { title: "Cosco Futsal Football Size 4", basePrice: 999, sellingPrice: 649, category: "sports", brand: "myntra", tags: ["football", "cosco", "sports"], thumbnail: "https://images.unsplash.com/photo-1614632537423-1e6c2e7e0aab?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 200, description: "PU material with machine-stitched construction for indoor and outdoor play." },
  { title: "Nike Yoga Mat 4mm Non-Slip", basePrice: 2499, sellingPrice: 1799, category: "sports", brand: "nike", tags: ["yoga mat", "nike", "fitness"], thumbnail: "https://images.unsplash.com/photo-1601925228429-8af6ff5d44e2?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 150, description: "Textured surface provides grip during your yoga and pilates sessions." },
  { title: "Adidas Gym Gloves Unisex", basePrice: 1299, sellingPrice: 799, category: "sports", brand: "adidas", tags: ["gym gloves", "adidas", "fitness"], thumbnail: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 250, description: "Padded palm for grip support during weightlifting and cross training." },
  { title: "Puma Running Jacket Windbreaker", basePrice: 4999, sellingPrice: 2999, category: "sports", brand: "puma", tags: ["jacket", "puma", "running"], thumbnail: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: true, flashSalePrice: 2499, stock: 80, description: "Lightweight windbreaker with mesh lining for outdoor running." },

  // Books
  { title: "Atomic Habits by James Clear", basePrice: 799, sellingPrice: 499, category: "books", brand: "myntra", tags: ["self-help", "habits", "james clear"], thumbnail: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop", isFeatured: true, isFlashSale: false, stock: 300, description: "Tiny Changes, Remarkable Results. A #1 New York Times bestseller." },
  { title: "Rich Dad Poor Dad by Robert Kiyosaki", basePrice: 499, sellingPrice: 299, category: "books", brand: "myntra", tags: ["finance", "money", "kiyosaki"], thumbnail: "https://images.unsplash.com/photo-1559163499-413811fb2344?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 400, description: "What the Rich Teach Their Kids About Money That the Poor Don't." },
  { title: "The Psychology of Money by Morgan Housel", basePrice: 599, sellingPrice: 399, category: "books", brand: "myntra", tags: ["finance", "money", "investing"], thumbnail: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 250, description: "Timeless lessons on wealth, greed, and happiness." },

  // Toys
  { title: "LEGO Classic Creative Brick Box 484pcs", basePrice: 3999, sellingPrice: 2999, category: "toys", brand: "myntra", tags: ["lego", "building blocks", "kids"], thumbnail: "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 100, description: "Inspire creativity with this classic set of colourful LEGO bricks." },
  { title: "Funskool Magnetic Drawing Board", basePrice: 699, sellingPrice: 449, category: "toys", brand: "myntra", tags: ["drawing board", "kids", "educational"], thumbnail: "https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 200, description: "Mess-free drawing with magnetic stylus, stamp, and shapes." },
  { title: "NeoStar Remote Control Car Stunt Car", basePrice: 2499, sellingPrice: 1299, category: "toys", brand: "myntra", tags: ["rc car", "remote control", "toys"], thumbnail: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: true, flashSalePrice: 999, stock: 80, description: "360° rotation stunts with LED lights and rechargeable battery." },

  // Grocery
  { title: "Tata Salt Iodized Rock Salt 1kg", basePrice: 29, sellingPrice: 24, category: "grocery", brand: "myntra", tags: ["salt", "tata", "grocery"], thumbnail: "https://images.unsplash.com/photo-1518843875459-f738682238a6?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 1000, description: "Pure iodized salt from Tata — India's trusted brand." },
  { title: "Kissan Mixed Fruit Jam 500g", basePrice: 199, sellingPrice: 149, category: "grocery", brand: "myntra", tags: ["jam", "kissan", "grocery"], thumbnail: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=400&fit=crop", isFeatured: false, isFlashSale: false, stock: 500, description: "Made from real fruit pieces with no artificial preservatives." },
];

const coupons = [
  { code: "KARTIGO10", description: "10% off on orders above ₹500", type: "PERCENTAGE" as const, value: "10", minOrderAmount: "500", maxDiscount: "500", usageLimit: 1000, validFrom: new Date("2024-01-01"), validTo: new Date("2025-12-31"), isActive: true },
  { code: "FLAT100", description: "Flat ₹100 off on orders above ₹999", type: "FIXED" as const, value: "100", minOrderAmount: "999", usageLimit: 500, validFrom: new Date("2024-01-01"), validTo: new Date("2025-12-31"), isActive: true },
  { code: "NEWUSER50", description: "50% off for new users (max ₹200)", type: "PERCENTAGE" as const, value: "50", minOrderAmount: "200", maxDiscount: "200", usageLimit: 1, validFrom: new Date("2024-01-01"), validTo: new Date("2025-12-31"), isActive: true },
  { code: "WELCOME", description: "₹50 off on first order", type: "FIXED" as const, value: "50", minOrderAmount: "199", usageLimit: null, validFrom: new Date("2024-01-01"), validTo: new Date("2025-12-31"), isActive: true },
];

const banners = [
  { title: "Season Sale", imageUrl: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop", linkUrl: "/products", position: 1, isActive: true },
  { title: "Flash Sale", imageUrl: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1200&h=400&fit=crop", linkUrl: "/products?flashSale=true", position: 2, isActive: true },
];

async function seed() {
  console.log("🌱 Starting database seed...");

  // Insert categories
  console.log("📦 Seeding categories...");
  const insertedCats = await db.insert(categoriesTable).values(categories).onConflictDoNothing().returning();
  console.log(`✅ Inserted ${insertedCats.length} categories`);

  // Insert brands
  console.log("🏷️  Seeding brands...");
  const insertedBrands = await db.insert(brandsTable).values(brands).onConflictDoNothing().returning();
  console.log(`✅ Inserted ${insertedBrands.length} brands`);

  // Build lookup maps
  const catMap = new Map(insertedCats.map((c) => [c.slug, c.id]));
  const brandMap = new Map(insertedBrands.map((b) => [b.slug, b.id]));

  // Also get all existing cats and brands
  const allCats = await db.select().from(categoriesTable);
  const allBrands = await db.select().from(brandsTable);
  allCats.forEach((c) => catMap.set(c.slug, c.id));
  allBrands.forEach((b) => brandMap.set(b.slug, b.id));

  // Insert products
  console.log("🛍️  Seeding products...");
  const flashSaleProductIds: number[] = [];

  for (const p of productData) {
    const categoryId = catMap.get(p.category);
    const brandId = p.brand !== "myntra" ? brandMap.get(p.brand) : undefined;
    if (!categoryId) { console.warn(`No category for ${p.category}`); continue; }

    const existing = await db.select().from(productsTable).where(eq(productsTable.slug, p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")));
    if (existing.length > 0) continue;

    const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const discount = Math.round(((p.basePrice - p.sellingPrice) / p.basePrice) * 100);
    const images = [p.thumbnail];

    const [inserted] = await db.insert(productsTable).values({
      title: p.title,
      slug,
      description: p.description,
      richDescription: p.description,
      basePrice: String(p.basePrice),
      sellingPrice: String(p.sellingPrice),
      discount,
      images,
      thumbnail: p.thumbnail,
      categoryId,
      brandId: brandId ?? null,
      stock: p.stock,
      tags: p.tags,
      specifications: {},
      isActive: true,
      isFeatured: p.isFeatured,
      isFlashSale: p.isFlashSale,
      flashSalePrice: (p as any).flashSalePrice ? String((p as any).flashSalePrice) : null,
      flashSaleEnd: p.isFlashSale ? new Date(Date.now() + 5 * 60 * 60 * 1000) : null,
      totalSold: Math.floor(Math.random() * 5000),
      averageRating: (3.5 + Math.random() * 1.5).toFixed(2),
      totalReviews: Math.floor(Math.random() * 2000),
    }).returning();

    if (p.isFlashSale && inserted) flashSaleProductIds.push(inserted.id);
  }
  console.log("✅ Products seeded");

  // Create flash sale
  if (flashSaleProductIds.length > 0) {
    console.log("⚡ Creating flash sale...");
    const [flashSale] = await db.insert(flashSalesTable).values({
      title: "Grand Flash Sale",
      startTime: new Date(),
      endTime: new Date(Date.now() + 5 * 60 * 60 * 1000),
      isActive: true,
    }).onConflictDoNothing().returning();

    if (flashSale) {
      await db.insert(flashSaleProductsTable).values(
        flashSaleProductIds.slice(0, 10).map((pid) => ({ flashSaleId: flashSale.id, productId: pid, discountPercentage: "10" })),
      ).onConflictDoNothing();
    }
  }

  // Coupons
  console.log("🎟️  Seeding coupons...");
  await db.insert(couponsTable).values(coupons).onConflictDoNothing();

  // Banners
  console.log("🖼️  Seeding banners...");
  await db.insert(bannersTable).values(banners).onConflictDoNothing();

  console.log("🎉 Seed complete!");
  process.exit(0);
}

seed().catch((err) => { console.error("Seed failed:", err); process.exit(1); });
