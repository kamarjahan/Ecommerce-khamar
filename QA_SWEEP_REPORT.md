# Deep QA Sweep Report (Auth, Checkout, Admin CRUD, Payment Verification)

Date: 2026-02-10  
Scope reviewed: `main` app code paths (same issues likely apply to `my-pro-store` because files are mirrored).

## What I validated

- Build/install sanity (`npm ci`, `npm run build`).
- Static code-path review for:
  - auth flow
  - cart/checkout flow
  - payment verification
  - admin CRUD permissions and data mutation paths

## Prioritized bug list

### P0 — Server trusts client-provided cart totals and user identity during payment verification

**Where:** `POST /api/payment/verify` and client checkout payload.

- The API accepts `cartItems`, `userId`, and `discountAmount` directly from the browser request and uses them to calculate order totals and store the order. It only verifies Razorpay signature, not that the amount/order contents match trusted server-side product data.  
- The checkout page sends these values from client state (`cart`, `user?.uid`, `discount`) to the verify endpoint.

**Risk:** High. A malicious user can tamper with payload values (price, quantity, discount, userId) before submission and store forged/underpriced orders or attribute orders to another user.

**Evidence:**
- `main/src/app/api/payment/verify/route.ts` receives untrusted fields and persists them directly. (`cartItems`, `userId`, `discountAmount`)  
- `main/src/app/(store)/checkout/page.tsx` sends those same values from client state in the verification request body.

**Recommended fix:**
- Use a server-side order intent model keyed by Razorpay order ID.
- Recompute totals from trusted product DB values on the server.
- Bind the order to authenticated server identity (session/JWT), not client-provided `userId`.

---

### P0 — Critical admin access control is client-side only and includes hardcoded super-admin email in shipped frontend bundle

**Where:** `main/src/app/(admin)/layout.tsx`.

- Admin access logic is enforced in a client component (`"use client"`).
- There is a hardcoded super-admin email bypass (`SUPER_ADMIN_EMAIL = "ztenkammu@gmail.com"`) in frontend code.

**Risk:** High. Client checks are not authoritative security boundaries. Hardcoded privileged identifiers in shipped JS are discoverable. If Firestore rules are permissive or misconfigured, this is a direct escalation risk.

**Recommended fix:**
- Move authorization checks to server boundary (middleware/server components/API) and validate with server-issued auth token/session.
- Remove hardcoded super-admin identity from client code.

---

### P1 — Checkout order-creation API trusts client price data

**Where:** `POST /api/checkout`.

- The API calculates `totalAmount` from client-submitted `cartItems` prices and quantities.
- Coupon is looked up server-side, but base price input is still client-controlled.

**Risk:** High-to-medium depending on downstream controls. Users can reduce payable amount by sending modified item prices.

**Recommended fix:**
- Accept only product IDs/variants/quantities from client.
- Fetch canonical prices from Firestore/server DB and compute totals server-side.

---

### P1 — Date/type inconsistency for `createdAt` can break sorting and display for online orders

**Where:** `payment/verify` writes ISO string while order UIs expect Firestore Timestamp.

- `payment/verify` stores `createdAt` as ISO string.
- `orders` page sorts using `createdAt?.seconds`, which is undefined for string timestamps.
- Admin/profile views call `.toDate()` or use `seconds` access in multiple places.

**Risk:** Medium. Mixed COD/online orders can appear unsorted, default to incorrect dates, or render inconsistent order history.

**Recommended fix:**
- Standardize all order writes to `serverTimestamp()` and normalize reads defensively.

---

### P2 — API requests from checkout omit explicit `Content-Type: application/json`

**Where:** checkout page fetch calls to `/api/checkout` and `/api/payment/verify`.

- Calls send JSON string body without setting `Content-Type`.

**Risk:** Low-medium. Works in many setups, but can fail with strict middleware/proxies and reduces interoperability.

**Recommended fix:**
- Add `headers: { "Content-Type": "application/json" }` for both requests.

---

### P2 — Review submission can write `productId` incorrectly for some order item shapes

**Where:** orders page review write logic.

- Uses `selectedItem.id || selectedItem.productId`.
- Depending on cart schema, order items may not carry `id`/`productId` consistently.

**Risk:** Low-medium. Reviews may be orphaned and not linked to actual products.

**Recommended fix:**
- Enforce a required canonical `productId` in cart item schema and order write path.

## Validation commands run

- `npm ci` (in `main`) — success
- `npm run build` (in `main`) — success (with environment Firestore connectivity warnings previously observed)

## Notes

- I focused on the `main` app for deep QA and static-path verification. Most files are mirrored in `my-pro-store`, so findings likely apply there too.
- This report intentionally prioritizes security/integrity and revenue-impact issues first.
