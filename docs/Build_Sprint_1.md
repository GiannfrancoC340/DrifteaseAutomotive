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
