# StockFlow

A small inventory and point-of-sale app for independent shops. Add products
(or bulk import them from a CSV), ring up sales at a till that decrements stock
in real time, and watch revenue, profit and low-stock alerts on a dashboard.
Access is role based — owners and managers run the whole shop, cashiers only see
the checkout.

Built with **Next.js (App Router)**, **Firebase** (Authentication + Firestore)
and **Tailwind CSS**. Deploys to Vercel for free, and Firebase's free tier never
sleeps, so the demo link stays live.

## Features

- Email/password authentication with three roles: owner, manager, cashier
- Product catalogue with search, inline editing and CSV import
- Point-of-sale screen with barcode/SKU lookup and a receipt summary
- Stock is decremented inside a single Firestore transaction, so the till can
  never oversell a product even with two people checking out at once
- Dashboard with daily/weekly/monthly revenue, profit, best sellers and
  low-stock alerts
- Firestore security rules enforce the roles on the server, not just in the UI

## Getting started

### 1. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com) and add a
   project (you can turn Google Analytics off).
2. **Build → Authentication → Get started**, then enable the
   **Email/Password** sign-in provider.
3. **Build → Firestore Database → Create database**. Start in production mode and
   pick a region near you.

### 2. Add the security rules

In **Firestore Database → Rules**, replace the contents with
[`firestore.rules`](firestore.rules) from this repo and click **Publish**.

### 3. Register a web app and copy the config

1. In **Project settings (gear icon) → General → Your apps**, click the web
   icon (`</>`) and register an app.
2. Copy the `firebaseConfig` values.

Copy `.env.example` to `.env.local` and paste them in:

```bash
cp .env.example .env.local
```

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abc123
```

### 4. Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000, create an account (the first one becomes the shop
owner), then add a few products and make a sale.

### Trying the other roles

Every new account is an owner. To see the manager or cashier experience, open
the Firebase console → **Firestore → users** collection, find your user document
and change its `role` field to `manager` or `cashier`, then refresh the app.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add the six `NEXT_PUBLIC_FIREBASE_*` environment variables.
4. Deploy. In the Firebase console under **Authentication → Settings →
   Authorized domains**, add your Vercel domain so sign-in works in production.
