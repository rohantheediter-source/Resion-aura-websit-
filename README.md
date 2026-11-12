# RESIN AURA — Premium Bespoke E-Commerce Platform

A production-ready e-commerce platform crafted for **RESIN AURA**, an artisanal luxury brand specializing in handcrafted geode wall clocks, preserved floral jewelry suites, and ceremonial platters.

---

## 💎 Brand Identity & Visual Aesthetic

- **Brand:** RESIN AURA
- **Visuals:** Modern luxury aesthetic inspired by natural crystals, mineral veins, and liquid-glass resin.
- **Palette:** Deep Emerald (`#07241e`, `#0b3b33`), Warm Champagne & 24K Gold (`#c5a059`, `#dfbe7e`), and Pearl Alabaster (`#FAF8F5`).
- **Typography:** Display serif (`Cinzel`), Editorial serif (`Cormorant Garamond`), and modern sans (`Plus Jakarta Sans`).

---

## 🚀 Key Features

### 1. Customer-Facing Storefront
- **Homepage:**
  - Hero banner with signature artwork showcases (Imperial Emerald & 24K Gold Clock, Milky Way Celestial Piece).
  - Curated disciplines (Wall Clocks, Preserved Jewelry, Platters, Pendants, Bangles).
  - Bestsellers and signature works showcase with interactive filter pills.
  - Deep brand storytelling: The alchemical romance of nature and liquid glass.
  - 4-Stage craftsmanship method (Botanical curation, polymer formulation, 72h curing, hand-beveling).
  - Verified collector testimonials.
  - Luxury newsletter subscription.
  - Comprehensive footer with zero admin entry points.
- **Shop & Discovery:**
  - Real-time search by title, description, and category.
  - Category filtering across all 5 disciplines.
  - Price range slider up to ₹10,000+.
  - In-stock availability toggle.
  - Sorting: Featured, Price (Low to High), Price (High to Low), Newest Arrivals, Highest Rated.
- **Product Details:**
  - Multi-image zoom and thumbnail gallery.
  - Dimension and finish variant selectors (e.g., 14" vs 16" vs 18" clock sizes; Gold vs Silver findings).
  - Stock indicator with "Only X remaining" alerts.
  - Tabbed specs: Artisanal Story, Technical Specs, Care & Longevity Guide.
  - Coordinated related creations from the same discipline.
- **Shopping Bag & Checkout:**
  - Persistent cart state in `localStorage` + sync with Supabase cart.
  - Complimentary wooden crate shipping progress bar (Free shipping threshold: ₹1,999).
  - Complete checkout form: Contact information, Delivery destination address with PIN code validation, Special inscription / gift notes.
  - Multiple payment selections: Cash on Delivery (COD), Direct Studio UPI, NEFT / IMPS Bank Transfer, and configurable Online Cards Gateway.
- **Order Confirmation & Tracking:**
  - Celebratory luxury confetti animation.
  - Unique docket number generation (e.g. `RA-8492-4102`).
  - Printable consignment invoice.
  - Live 5-stage dispatch tracker (`/track-order`).
- **Customer Authentication & Account:**
  - Supabase Auth: Sign In, Register, Forgot Password with reset instructions.
  - Personal profile management and contact details editor.
  - Order history with live status badges and direct invoice lookup.
- **Artisan Guidance & Policies:**
  - Atelier story page (`/about`).
  - Bespoke commission consultation page (`/contact`).
  - Interactive accordion FAQ (`/faq`).
  - Business Policies (`/policies/shipping`, `/policies/returns`, `/policies/terms`, `/policies/privacy`).

### 2. Bespoke Custom Product & WhatsApp Ordering
- **Option A (Customize Existing Product):**
  - "Customize This Product" button on product detail pages.
  - Dynamically adapts to product category (Clocks: silent sweep gold/silver hands, Roman dials; Jewelry: 24K gold settings, preserved florals; Platters: gilded rims, vintage brass handles).
  - Palette selections, custom names/monograms, dimensions, reference image upload, and quantity.
- **Option B (Request a Completely Custom Design):**
  - Dedicated `/custom-design` bespoke commission section.
  - Forms for luxury categories (wall clocks, geode tables, ocean platters, varmala preservation, mandir murti backdrops).
  - Detailed design descriptions, reference photos, custom inscriptions, and dimensions.
- **WhatsApp Integration:**
  - Automated structured message formatting connected to configured atelier number (`+91 83379 83439`).
  - Official click-to-chat format: `https://wa.me/918337983439?text=...`.
  - Clear customer guidance on review and image attachments.
- **Business Owner Final Price Control:**
  - Customers cannot set prices or self-calculate custom quotes.
  - Mandatory pricing disclosure banner on both flows.
  - Atelier manually sets final pricing, crafting duration, and approval in admin.


---

## 🔒 Dedicated Admin Portal — Strict Separation

As mandated, the **Admin Dashboard is strictly isolated** and never linked anywhere on customer-facing pages:
- **Direct Access URL:** `http://localhost:5173/admin`
- **Admin Login:** `http://localhost:5173/admin/login`
- **Role-Based Access Control (RBAC):** Checks Supabase `user_roles` table for `role = 'admin'`. Non-admin customers are denied access at both the route and database levels.
- **Dashboard Overview:** Gross bookings, total consignments, active works, low-stock alerts, and recent dockets.
- **Product Management:** Search, category filter, active/hidden toggles, featured toggles, stock counts, inline editing, and deletion.
- **Artwork Editor (`/admin/products/new` & `/admin/products/:id/edit`):**
  - Supabase Storage image uploader with file validation (< 5MB, JPG/PNG/WebP).
  - Title, slug, discipline, selling price, compare-at price, stock, SKU.
  - Dimensions, materials, curing cycle hours, care guidelines.
- **Category Taxonomy (`/admin/categories`):** View counts, add new disciplines.
- **Consignment Orders (`/admin/orders`):** Filter by status, update stages (`placed` → `confirmed` → `crafting` → `dispatched` → `delivered`), add tracking waybill numbers and carrier names.
- **Patron Registry (`/admin/customers`):** Directory of collectors, lifetime spend, order count.

---

## 🛠️ Technology Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, PostCSS, Autoprefixer, Custom Luxury Glassmorphism
- **Routing:** React Router v6
- **Database & Auth:** Supabase (`@supabase/supabase-js`)
- **Icons:** Lucide React
- **Celebration Effects:** Canvas Confetti

---

## 📁 Project Directory Structure

```
resion-aura/
├── index.html                   # Entry HTML with luxury Google Fonts
├── package.json                 # Project dependencies and scripts
├── vite.config.ts               # Vite bundler configuration & code splitting
├── tailwind.config.js           # Luxury brand color palette & typography
├── tsconfig.json                # TypeScript compiler configuration
├── .env                         # Live Supabase environment variables
├── .env.example                 # Environment template
│
├── public/
│   ├── logo.svg                 # Resin Aura vector monogram logo
│   └── images/
│       └── products/            # 86 authentic product images copied from source
│
├── project/
│   └── resion/                  # Original user assets (Preserved 100% untouched)
│       └── rohantheediter_resin-clocks.csv
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql  # Complete DB schema, RLS policies & triggers
│       └── seed.sql                # Curated seed data for all 56 products & categories
│
└── src/
    ├── main.tsx                 # App mount
    ├── App.tsx                  # Application routing & providers
    ├── index.css                # Base luxury styling & custom utilities
    ├── types/                   # TypeScript interfaces
    ├── services/                # Supabase, Products, Orders, Storage services
    ├── contexts/                # Auth, Cart, Wishlist, Toast state providers
    ├── data/                    # Structured initial products & categories
    ├── utils/                   # Currency formatters, date formatters, validators
    ├── components/
    │   ├── common/              # Navbar, Footer, ProductCard, RatingStars, Spinners
    │   ├── home/                # HeroBanner, Collections, Bestsellers, Story, Process
    │   └── shop/                # Filters, Sorting, Search
    ├── pages/                   # Customer storefront pages
    └── admin/                   # Dedicated Admin suite & route protection
        ├── AdminLayout.tsx
        ├── AdminProtectedRoute.tsx
        └── pages/               # Admin Overview, Products, Form, Orders, Customers
```

---

## 💻 Local Setup & Execution

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm (v9+)

### 2. Run the Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Build for Production
```bash
npm run build
npm run preview
```

---

## 🗄️ Supabase Configuration & Migration Instructions

Your Supabase project is already configured in `.env`:
```env
VITE_SUPABASE_URL=https://ybnkfhiqtsnzaauzuxve.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Jgzo4SOtbVWPA6eVXoTSng_f9O5QE6P
```

### To apply the database schema:
1. Open the [Supabase Dashboard](https://supabase.com/dashboard) and navigate to your project (`ybnkfhiqtsnzaauzuxve`).
2. Go to the **SQL Editor** tab on the left menu.
3. Open `supabase/migrations/001_initial_schema.sql` from this codebase, copy the entire content, paste it into the SQL Editor, and click **Run**.
4. Next, open `supabase/migrations/seed.sql`, paste its content, and click **Run**. This populates all 5 categories and 56 initial curated products based on your uploaded assets.
5. In **Storage**, create a new public bucket named `product-images` with public read access.

### To configure Administrator Access (Google OAuth):
1. In the Supabase Dashboard, open **Authentication** > **Providers** and ensure **Google** is enabled.
2. In the **SQL Editor**, run the migration in `supabase/migrations/004_admin_google_oauth_auth.sql`.
3. Whitelist your administrator Google account email:
   ```sql
   INSERT INTO public.authorized_admin_emails (email, role, notes)
   VALUES ('YOUR_GOOGLE_ACCOUNT@gmail.com', 'admin', 'Store Administrator')
   ON CONFLICT (email) DO NOTHING;
   ```
4. Navigate to `http://localhost:5173/admin/login` and click **"Continue with Google"**.
5. Once authenticated with your whitelisted Google account, the server validates your clearance and grants access to the Administrative Suite. Any non-whitelisted account will receive an access-denied screen.

---

## 📦 Preserved Uploaded Assets

All 86 images and the original CSV file in `project/resion/` remain 100% intact and untouched. The web application serves copies directly from `public/images/products/`, ensuring lightning-fast load times and zero broken image links.

