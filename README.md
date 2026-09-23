# Mushora — Luxury Fashion Affiliate Marketing Platform

Mushora is a production-ready, high-performance affiliate fashion and clothing platform built exclusively with **HTML5, CSS3, Vanilla JavaScript, and Firebase**. Normal visitors can seamlessly browse fashion pieces, filter by category, explore high-resolution multi-angle galleries, and click affiliate redirect CTAs to purchase on external merchant websites with zero login required. Administrative functions (product CRUD, dynamic category management, metrics, and credential updates) are protected within a secure admin portal.

---

## Key Features

- **No Public User Authentication**: Visitors browse the catalog, view garment details, and click merchant deals without signing up or logging in.
- **Dynamic Categories**: Controlled entirely from the Admin Panel. Changes instantly update the header dropdown, mobile menu, footer, and filter tabs.
- **Multi-Angle Photography**: Supports 1 required high-res image + up to 3 optional angle/detail images with an interactive thumbnail gallery.
- **External Affiliate CTAs**: Safe outbound redirect links with `rel="noopener noreferrer sponsored"` and target `_blank`.
- **Protected Admin Panel**: Secure login with salted SHA-256 password hashing and Firebase Auth support.
- **Category Guard System**: Confirms category deletion with a warning if products are assigned to that category.
- **Zero-Pill Luxury Editorial Design**: Tailored serif/sans typography, warm ivory palette, champagne gold accents, subtle transitions, and accessible contrast.
- **Interactive FAQ Section**: Smooth animated accordion answering all key consumer questions.
- **Multi-Device Responsive**: Desktop (4 columns), tablet (2–3 columns), mobile (1–2 columns), with smooth mobile drawer navigation.

---

## Project File Structure

```
├── index.html               # Main public homepage (hero, dynamic categories, product grid, search, FAQ, footer)
├── product.html             # Dedicated product details page (multi-image gallery, specs, affiliate CTA, related pieces)
├── admin-login.html         # Administrator login portal (credentials validation & security)
├── admin.html               # Administrative dashboard (metrics, product CRUD, category CRUD, credential management)
├── css/
│   └── style.css            # Bespoke fashion design system (typography, zero-pill layout, modals, toasts, animations)
├── js/
│   ├── firebase.js          # Firebase configuration, Firestore & Auth initialization, and local persistence engine
│   ├── main.js              # Home page controller (category navigation, search, filters, sorting, FAQ accordion)
│   ├── product.js           # Product detail page controller (gallery switcher, breadcrumbs, affiliate link, related items)
│   ├── admin-login.js       # Admin authentication handler and session management
│   └── admin.js             # Admin dashboard controller (product & category CRUD, warning modals, settings)
├── firestore.rules          # Production Firestore security rules enforcing public read and admin-only write
├── firebase-blueprint.json  # Intermediate Representation (IR) schema for categories, products, and admin settings
├── metadata.json            # AI Studio applet metadata & capabilities
├── vite.config.ts           # Multi-page Vite configuration for HTML5 apps
└── README.md                # Comprehensive documentation & setup instructions
```

---

## Setup Instructions

### 1. Firebase Project Creation
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**, name it (e.g. `mushora-fashion`), and proceed through setup.
3. In your project dashboard, click the **Web icon** (`</>`) to register a new Web App.
4. Copy the `firebaseConfig` object provided by Firebase.

### 2. Firestore Database Setup
1. In the left sidebar, navigate to **Build > Firestore Database**.
2. Click **Create database**.
3. Choose your nearest Cloud Region and select **Start in production mode**.

### 3. Authentication Setup for Administrator
1. In the left sidebar, navigate to **Build > Authentication**.
2. Click **Get Started**, select **Email/Password**, and enable it.
3. (Optional) In the **Users** tab, click **Add user**, enter `admin@mushora.internal` (or your email) and set an initial secure password.

### 4. Firebase Configuration in Mushora
Open `js/firebase.js` in your editor and replace the placeholder credentials in `firebaseConfig`:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

> **Note**: While you are setting up your Firebase credentials, Mushora automatically runs in **Demo / Setup Mode** using persistent browser storage, allowing you to preview the entire website, test admin functions, and click through products immediately.

### 5. Deploy Firestore Security Rules
Copy the rules from `firestore.rules` into your Firebase Console:
1. Go to **Firestore Database > Rules**.
2. Paste the contents of `firestore.rules`:
   - Public read access for `/categories/*` and `/products/*`.
   - Write/delete access restricted to authenticated administrator (`request.auth != null`).
   - Private `/adminSettings/*` restricted to administrator.
3. Click **Publish**.

### 6. Initial Administrator Access
- Initial temporary setup credentials:
  - **Username**: `admin`
  - **Password**: `admin123`
- Open `/admin-login.html` and sign in.
- **Important**: Immediately navigate to the **Admin Settings** tab and change your username and password to your private credentials.
- In the **Admin Settings** tab, you can also click **✦ Seed Starter Fashion Catalogue to Firestore** to populate all 6 starter categories and 8 curated designer garments into your new live Firestore database with one click.

### 7. Running the Website Locally
Run the development server:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 8. Deploying the Website
Build the optimized static bundle:
```bash
npm run build
```
The output in `dist/` can be hosted on Firebase Hosting, Cloud Run, Vercel, Netlify, or any static web server:
```bash
# Example deployment to Firebase Hosting
firebase deploy --only hosting
```

---

## Affiliate Disclosure Compliance

Mushora features a prominent FTC/advertising standards-compliant affiliate disclosure in the site footer:
> *"Mushora may earn an affiliate commission when you purchase products through certain links on this website. This does not affect the price you pay in any way, nor does it influence our editorial integrity."*

All external affiliate links automatically include `rel="noopener noreferrer sponsored"` and `target="_blank"` for security, search engine compliance, and seamless shopping experience.
