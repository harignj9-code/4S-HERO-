# 4S HERO – 4 Stream Source Segregation Challenge
### Malkajgiri Municipal Corporation (MMC), Telangana

Official digital Information, Education & Communication (IEC) platform and gamified public participation system for **4-Stream Source Segregation** under the Swachh Bharat Mission (Urban), Government of Telangana.

> **“Four Streams. One Mission. A Cleaner Malkajgiri.”**  
> *"Which Bin? You Decide! Learn • Play • Segregate • Become a 4S HERO"*

---

## 🌟 Key Features

### 🏢 Public 4S HERO Platform
- **All Age Group Participation**: Zero age restriction! Open to children, students, youth, adults, senior citizens, municipal staff, SHG members, RWA members, and local businesses.
- **Dynamic Geographical Jurisdiction**: Cascading dependent dropdowns (`Select Circle → Select Ward → Select Area`) powered by real-time municipal database records.
- **Bilingual Interface**: Full toggle support between **English** and **తెలుగు (Telugu)** across all game screens, instructions, banners, and forms.
- **7 Progressive Gamified Missions**:
  1. **Level 1: Which Bin?** — Fast-paced waste object classification.
  2. **Level 2: Drag & Drop Waste** — Interactive waste bin sorting (Touch & Mouse support).
  3. **Level 3: Rapid Fire** — Timed speed sorting with bonus point multipliers.
  4. **Level 4: Spot the Mistake** — Inspection scenarios to identify misclassified or hazardous items.
  5. **Level 5: Waste Match Pairs** — Memory and logic pairing of items with target streams.
  6. **Level 6: Clean Malkajgiri** — Virtual street & park cleanup (Safilguda Mini Tank Bund, Anandbagh Circle).
  7. **Level 7: Ultimate 4S HERO Quiz** — Comprehensive municipal segregation protocol assessment.
- **Dynamic Certificate of Achievement**:
  - Automatically unlocked at the qualifying score threshold (default **80%**).
  - Contains official logos, 4S HERO Mascot, participant name, category/org, score, completion date, and official issuing authority:
    > **T. Vinay Krishna Reddy, I.A.S.**  
    > *Commissioner, Malkajgiri Municipal Corporation*
  - **Embedded QR Code Verification**: Direct online certificate verification at `/verify/:id`.
  - **Historical Certificate Integrity**: Preserves exact wording, issuing authority, score, date, and logos valid at the time of issuance without silent alterations if administrative settings change later.
- **Public Certificate Verification Page (`/verify/:id`)**: Privacy-conscious verification with redacted personal contact information.
- **Swachh Leaderboard**: Displays top-performing champions, circles, wards, and institutions.
- **Contact Us Page**: Clickable phone numbers (`tel:`), emails (`mailto:`), office address, Google Maps location, and social media links (Facebook, Instagram, X/Twitter, YouTube, LinkedIn).

---

### 🛡️ Secure MMC Administration Portal (`/admin`)
- **Secure Authentication**:
  - Encrypted password hashing (PBKDF2 SHA-512, 100,000 iterations).
  - Crypto-random session tokens in `HttpOnly` / `SameSite` cookies.
  - Rate-limiting & failed-attempt lockout protection.
- **Role-Based Access Control (RBAC)**:
  - `SUPER_ADMIN`: Complete system configuration, user management, and audit logs.
  - `ADMIN`: Operational content management & participant administration.
  - `CONTENT_MANAGER`: Waste database, game items, and quiz questions.
  - `REPORT_VIEWER`: Analytics dashboard & CSV data export.
- **Geographical Master Management**: Add, edit, activate/deactivate, reorder Circles, Wards, and Areas. Reassign Wards between Circles dynamically.
- **Logos & Brand-Asset Management**: Upload, replace, remove, preview, activate/deactivate official logos in PNG, JPG, SVG, and WebP formats. Supports multi-location placement with `object-contain` aspect ratio preservation.
- **Certificate Configuration**: Customize qualifying score %, issuing authority name & designation, signature asset upload, logo inclusions, certificate ID prefix, and footer text.
- **Contact & Social Media Settings**: Dynamic visibility (`Show/Hide`) toggles for telephone, email, address, maps link, and social media channels.
- **Analytics & Reports**: Real-time KPI summary, demographic metrics, circle/ward participation charts, score distributions, misclassified item insights, and CSV exports.
- **Security Audit Log**: Immutable record of administrator sign-ins, CRUD modifications, and system configuration updates.

---

## 🛠️ Technology Stack

- **Backend**: Node.js Native HTTP Server (Zero framework bloat).
- **Database**: Native SQLite (`node:sqlite` DatabaseSync) with WAL mode & foreign key constraints.
- **Frontend**: Responsive HTML5, Tailwind CSS, FontAwesome 6, Canvas API (Certificate rendering), QRCode generator.
- **Audio Engine**: Web Audio API Synthesizer for sound effects without external dependencies.
- **Testing**: End-to-End Automated Node.js Validation Suite (`test_e2e.js`).

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20.x or higher recommended)

### Installation & Setup

1. **Clone / Open Project Directory**:
   ```bash
   cd 4s-hero-mmc
   ```

2. **Seed Database**:
   Populates initial waste streams (Wet, Dry, Sanitary, Special Care), waste master items, quiz questions, sample geographical master data, default settings, and Super Admin user:
   ```bash
   npm run seed
   # or
   node src/seed.js
   ```

3. **Start Web Server**:
   ```bash
   npm start
   # or
   node src/server.js
   ```

4. **Access the Applications**:
   - **Public Platform**: [http://localhost:3000](http://localhost:3000)
   - **Admin Portal**: [http://localhost:3000/admin](http://localhost:3000/admin)

### Default Super Admin Credentials
- **Username**: `admin`
- **Password**: `MmcAdmin@2026!`

---

## 🧪 Running Validation Tests

Run the full end-to-end automated test suite covering static serving, API endpoints, registration, game flow, certificate generation, verification, admin authentication, RBAC, and CRUD operations:

```bash
node test_e2e.js
```

---

## 📜 Official Mission Statement

> **Four Streams. One Mission. A Cleaner Malkajgiri.**  
> *Green Bin (Wet Waste) • Blue Bin (Dry Waste) • Red Bin (Sanitary Waste) • Black Bin (Special-Care Waste)*

---

### 🏛️ Copyright & Authority
**Malkajgiri Municipal Corporation (MMC)**  
Government of Telangana • Swachh Bharat Mission (Urban)
