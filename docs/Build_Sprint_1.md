# Driftease Automotive LLC — Build Sprint 1

**Sprint Duration:** June 19 – July 4 2026
**Project Type:** Full-Stack Web Application
**Time Spent:** 2 hours and 50 minutes
**Stack:** React + TypeScript (Vite) · Node.js + Express 4 · Firebase · Stripe

---

## Overview

Build Sprint 1 establishes the complete foundation of the Driftease Automotive LLC web platform — a custom car rental booking site built to replace Turo as the primary booking channel for a single-vehicle rental business. The goal of this sprint was to get a fully functional end-to-end booking flow live, from user authentication through payment processing and booking confirmation.

Every feature built in this sprint represents a direct replacement for functionality that Turo would otherwise provide, but without the 15–35% platform fee and with full ownership of the customer relationship and data.

---

## What Was Achieved

By the end of Sprint 1, a user can:

1. Land on the Driftease homepage
2. Create an account or sign in with Google
3. Browse the vehicle listing page with specs, features, rules, and a live availability calendar
4. Select a date range and see a real-time price calculation
5. Choose a payment option (pay in full or a custom deposit percentage via slider)
6. Review their booking summary
7. Sign a rental agreement and confirm their driver's license
8. Complete payment via Stripe (card, Apple Pay, Affirm, Klarna, Cash App, Link)
9. Receive a booking confirmation with a unique booking ID
10. View all their bookings and profile info from a personal dashboard
11. Edit their profile including phone number with international formatting
12. View booking details and cancel their bookings in the dashboard

---

## Features Built

### Authentication
- Email and password sign up and login
- Google OAuth sign-in
- Firebase Auth persistent sessions — users stay logged in across browser sessions
- Smart redirects — logged-in users are bounced away from login/signup pages automatically
- Protected routes — unauthenticated users cannot access dashboard, booking, or checkout pages
- Auth context wrapping the entire app via React Context API

### Vehicle Info Page
- Photo gallery with thumbnail navigation
- Full vehicle specs grid (make, model, year, color, mileage, fuel type, transmission, seats)
- Features list rendered as styled tags
- Rental rules list
- Insurance summary
- Interactive availability calendar powered by `react-calendar`
- Real-time price calculation based on selected date range (daily and weekly rates)
- Booking panel with live price breakdown
- Unauthenticated users see the page but are redirected to login when attempting to book

### Booking Flow
- **Book page** — trip summary, renter info, and payment option selector
  - Pay in Full option
  - Custom deposit slider (10%–90% in 5% increments) with live breakdown of amount due now vs. at pickup
- **Checkout page** — powered by Stripe Elements
  - Driver's license acknowledgement checkbox
  - Rental agreement summary with digital signature checkbox
  - Stripe PaymentElement supporting cards, Apple Pay, Affirm, Klarna, Cash App Pay, Link, and Amazon Pay
  - Payment processed securely server-side via Express backend
  - On success, booking document written to Firestore
- **Confirmation page** — booking ID, trip summary, payment breakdown, and next steps

### Payments (Stripe)
- Stripe Payment Intent created server-side (Express backend) before the payment form loads
- Client secret passed to frontend — card details never touch the backend directly
- Stripe Elements UI handles all PCI compliance automatically
- 8 payment methods enabled: Cards, Apple Pay, Link, Affirm, Cash App, Amazon Pay, Klarna, Cartes Bancaires
- Apple Pay and Amazon Pay require domain verification post-deployment
- Test mode active — full payment simulation with Stripe's test card suite
- Deposit hold logic scaffolded for future implementation

### Custom ID System
All Firestore documents use human-readable custom IDs instead of random Firebase-generated strings.

| Collection | Format | Example |
|---|---|---|
| Bookings | `DRF-YYYYMMDD-XXXX` | `DRF-20260703-PFM5` |
| Users (field) | `DRF-userN-YYYYMMDD-XXXX` | `DRF-user1-20260703-UORO` |

- Booking IDs are the Firestore document ID itself
- User IDs are stored as a `customUserId` field; the document ID remains the Firebase UID for security rule compatibility
- A `counters/users` document in Firestore tracks the incrementing user number using a transaction to prevent race conditions

### Renter Dashboard
- Tabbed layout: **My Bookings** and **Profile** tabs
- Booking cards showing: booking ID, vehicle, pickup/return dates, duration, total, amount paid, remaining balance, and status
- Status badges: Pending, Approved, Active, Completed, Cancelled
- Upcoming/Active and Past Bookings sections
- Empty state with CTA when no bookings exist
- Booking count badge on the tab

### Booking Details Page
- Card layout to view booking information
- Displays all relevant information
- Users have the ability to cancel their appointments
- Cancelled appointments will be displayed under a separate tab on the same page titled "Past Appointments"

### Profile Page
- Displays read-only account info: User ID, email, member since date
- Editable fields: full name, phone number
- International phone input via `react-phone-number-input` with auto country detection and validation
- Unsaved changes banner with inline Save Now and Discard buttons
- Browser exit prompt if user attempts to leave with unsaved changes
- Save button disabled when no changes detected
- Changes synced to both Firestore and Firebase Auth display name

### Navigation
- Persistent navbar on all post-login pages
- Hidden on `/`, `/login`, and `/signup` (pre-auth pages)
- Auth-aware links:
  - Logged out: Log In, Sign Up
  - Logged in: View Car, Dashboard, Profile, Log Out
- Logo links to Dashboard when logged in
- Log Out clears session and redirects to homepage

---

## Architecture

### Project Structure
```
driftease-automotive/
├── client/                        # React + TypeScript (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Navbar.css
│   │   │   └── ProtectedRoute.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   └── useUserData.ts
│   │   ├── lib/
│   │   │   ├── firebase.ts
│   │   │   └── generateId.ts
│   │   └── pages/
│   │       ├── Book.css
│   │       ├── Book.tsx
│   │       ├── BookingDetail.css
│   │       ├── BookingDetail.tsx
│   │       ├── Checkout.css
│   │       ├── Checkout.tsx
│   │       ├── Confirmation.css
│   │       ├── Confirmation.tsx
│   │       ├── Dashboard.css
│   │       ├── Dashboard.tsx
│   │       ├── Home.tsx
│   │       ├── Login.css
│   │       ├── Login.tsx
│   │       ├── Profile.css
│   │       ├── Profile.tsx
│   │       ├── Signup.css
│   │       ├── Signup.tsx
│   │       ├── Vehicle.css
│   │       └── Vehicle.tsx
│   │   ├──App.css
│   │   ├──App.tsx
│   │   ├──index.css
│   └── └──main.tsx
├── docs/                          # Markdown file docs
│   └── Build_Sprint_1.md
└── server/                        # Node.js + Express 4
    └── src/
        ├── routes/
        │   └── payments.ts
        └── index.ts
```

### Firebase Collections
```
Firestore/
├── users/{firebaseUID}
│   ├── customUserId: "DRF-user1-20260703-UORO"
│   ├── fullName, email, phone, role, createdAt
├── bookings/{DRF-YYYYMMDD-XXXX}
│   ├── renterId, renterEmail, renterName
│   ├── vehicleId, startDate, endDate
│   ├── totalPrice, amountPaid, remainingAmount
│   ├── paymentOption, depositPercent
│   ├── paymentIntentId, status, createdAt
│   └── agreedToTerms, licenseUploaded
├── vehicles/car1
│   ├── make, model, year, color, mileage
│   ├── fuelType, transmission, seats
│   ├── dailyRate, weeklyRate, description
│   ├── features[], rules[], images[]
│   └── available, insurance
└── counters/users
    └── count: N
```

### Firestore Security Rules
- `users` — read/write only by the owning user (matched by Firebase UID)
- `bookings` — any authenticated user can create; renters can only read their own; admin reads all
- `vehicles` — public read and delete; admin write only
- `counters` — any authenticated user can read/write (needed for user ID generation)

---

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| Express 4 over Express 5 | Express 5 had response issues in the dev environment; Express 4 is stable and battle-tested |
| Firebase UID as Firestore document ID for users | Required for Firestore security rules to match `request.auth.uid == userId` |
| Custom DRF IDs as a field, not the document ID | Allows human-readable display IDs while preserving auth-based security |
| Stripe Payment Intent created server-side | PCI compliance — secret key never exposed to the frontend |
| `runTransaction` for user counter | Prevents race conditions if two users sign up simultaneously |
| `verbatimModuleSyntax: false` on server tsconfig | Resolves ESM/CommonJS conflict with `ts-node` in Node environment |
| Port 5001 for backend | Avoids conflict with macOS AirPlay Receiver on port 5000 |
| iCal sync over Turo API | Turo has no public API — iCal feed is the only reliable way to sync availability |

---

## Known Limitations & Deferred Work

| Item | Notes |
|---|---|
| Driver's license upload | UI placeholder exists in Checkout; Firebase Storage upload deferred to Sprint 2 |
| Apple Pay / Amazon Pay | Require domain verification — only available post-deployment to real domain |
| Turo iCal sync | Backend cron job not yet built; calendar uses hardcoded placeholder blocked dates |
| Admin dashboard | Not yet built — owner has no interface to approve bookings or view GPS |
| GPS (Bouncie) | Hardware confirmed; API integration deferred to Sprint 2 |
| Email notifications | Not yet wired; SendGrid/Gmail integration deferred to Sprint 2 |
| Damage tracking | Pre/post trip photo upload deferred to Sprint 2 |
| Deposit hold logic | Stripe auth hold scaffolded but not fully implemented |
| Custom domain | Driftease-related domain TBD; Cloudflare setup deferred to deployment phase |
| Commercial insurance | Owner's responsibility — must be in place before accepting real bookings |
| Legal agreement review | Rental agreement template must be reviewed by a licensed attorney before launch |

---

## Media

### Pictures

<img width="718" height="260" alt="Screenshot 2026-07-04 at 3 28 51 PM" src="https://github.com/user-attachments/assets/72d598a2-1fd0-42d2-81a5-c7848d92a5fe" />
<img width="1378" height="843" alt="Screenshot 2026-07-05 at 11 25 22 AM" src="https://github.com/user-attachments/assets/27bc4a4e-9709-4370-bab9-956f45b0206d" />
<img width="1378" height="789" alt="Screenshot 2026-07-05 at 11 25 34 AM" src="https://github.com/user-attachments/assets/9d30ced0-3791-4245-a5e6-ac0f12148f64" />
<img width="1374" height="788" alt="Screenshot 2026-07-05 at 11 25 47 AM" src="https://github.com/user-attachments/assets/af80b174-b0de-4df2-b41f-7002f300a6e0" />
<img width="1378" height="792" alt="Screenshot 2026-07-05 at 11 26 02 AM" src="https://github.com/user-attachments/assets/2288a789-e809-41ac-bf94-aca150a1c66d" />
<img width="1375" height="790" alt="Screenshot 2026-07-05 at 11 26 30 AM" src="https://github.com/user-attachments/assets/dc07c55f-e34b-4a62-9b4e-8e0e7b279f9c" />
<img width="1372" height="790" alt="Screenshot 2026-07-05 at 11 27 07 AM" src="https://github.com/user-attachments/assets/45fc3628-1cd9-40f8-b3c3-5a26ecff79b0" />
<img width="1372" height="786" alt="Screenshot 2026-07-05 at 11 27 14 AM" src="https://github.com/user-attachments/assets/7d230962-0c7b-493f-9246-25e7014fa504" />
<img width="1378" height="787" alt="Screenshot 2026-07-05 at 11 27 28 AM" src="https://github.com/user-attachments/assets/8e842061-b3a3-4889-abc2-186bfd32561d" />
<img width="1376" height="786" alt="Screenshot 2026-07-05 at 11 27 48 AM" src="https://github.com/user-attachments/assets/618182ed-2807-4ee0-8260-7348e08dcf69" />
<img width="1375" height="787" alt="Screenshot 2026-07-05 at 11 27 57 AM" src="https://github.com/user-attachments/assets/479255e5-21ef-4463-8753-8a9dcbdc2a20" />
<img width="1371" height="783" alt="Screenshot 2026-07-05 at 11 29 19 AM" src="https://github.com/user-attachments/assets/9e0ba693-2a52-4f41-a906-2aa1444ad5a1" />
<img width="1366" height="784" alt="Screenshot 2026-07-05 at 11 30 38 AM" src="https://github.com/user-attachments/assets/f1eb09ac-2ef2-49ef-9672-f7fc67fc0fda" />
<img width="1375" height="788" alt="Screenshot 2026-07-05 at 11 30 48 AM" src="https://github.com/user-attachments/assets/f15345ab-ed10-4668-8644-18ecc52f2ffb" />
<img width="1373" height="785" alt="Screenshot 2026-07-05 at 11 30 56 AM" src="https://github.com/user-attachments/assets/0387ff0e-0c9a-4f0e-9e10-0854611eedf5" />
<img width="1373" height="787" alt="Screenshot 2026-07-05 at 11 31 05 AM" src="https://github.com/user-attachments/assets/7a2fc03e-a25e-444c-8c18-39ec24b15d03" />
<img width="1372" height="784" alt="Screenshot 2026-07-05 at 11 31 15 AM" src="https://github.com/user-attachments/assets/73521e8b-8b8b-4bbd-9230-a4bdf517f79e" />
<img width="1377" height="791" alt="Screenshot 2026-07-05 at 11 33 31 AM" src="https://github.com/user-attachments/assets/45968809-ae63-4e74-a97f-4a5073d0e90f" />
<img width="1374" height="786" alt="Screenshot 2026-07-05 at 11 33 54 AM" src="https://github.com/user-attachments/assets/2acdea19-d4be-400b-8d2f-d1add7355e55" />
<img width="1374" height="785" alt="Screenshot 2026-07-05 at 11 34 08 AM" src="https://github.com/user-attachments/assets/a4c2cbfd-96fd-41f1-892f-62e7bc414abe" />
<img width="1378" height="788" alt="Screenshot 2026-07-05 at 11 34 15 AM" src="https://github.com/user-attachments/assets/d9677db3-299f-4d2b-9ad6-7a28507cdd8e" />
<img width="1377" height="784" alt="Screenshot 2026-07-05 at 11 34 25 AM" src="https://github.com/user-attachments/assets/47f468ee-d68a-4b3b-923b-ea8583ffce02" />

### Videos

## Sprint 2 — Planned Features

1. Driver's license upload (Firebase Storage)
2. Admin dashboard (booking approvals, renter management, calendar, payments panel)
3. Bouncie GPS integration (live map, trip history)
4. Email notifications (SendGrid or Gmail API)
5. Damage tracking (pre/post trip photo/video uploads)
6. Turo iCal sync (backend cron job polling iCal feed)
7. Cloudflare setup and custom domain configuration
8. Production deployment (Vercel + Railway/Render)

---

*Driftease Automotive LLC — Build Sprint 1 · Confidential · Internal Use Only*
