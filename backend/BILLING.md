# Shubha Yatra — Billing & Payout System

## Overview

The platform uses a **delayed settlement model**: customer payments are held by the platform and released to bus operators on a weekly or monthly cycle, minus a commission fee.

```
Customer pays → Platform holds funds → Trip completes → Funds "held" → Payout batch → Operator paid
```

---

## Transaction Status Flow

```
pending   →  held   →  released  →  paid
                              ↘  refunded
```

| Status     | Meaning                                               |
|------------|-------------------------------------------------------|
| `pending`  | Booking confirmed; trip has not yet occurred          |
| `held`     | Trip date has passed; funds awaiting payout batch     |
| `released` | Included in a payout batch                            |
| `paid`     | Batch has been marked paid                            |
| `refunded` | Booking was cancelled; amount refunded to balance     |

---

## Payout Batch Status Flow

```
draft → pending_approval → approved → paid
                        ↘ rejected
```

| Status             | Meaning                                  |
|--------------------|------------------------------------------|
| `draft`            | Auto-generated, not yet submitted        |
| `pending_approval` | Awaiting admin review                    |
| `approved`         | Admin approved; ready for bank transfer  |
| `paid`             | Payment made; reference recorded         |
| `rejected`         | Rejected with reason                     |

---

## Scheduled Jobs (`src/jobs/payoutScheduler.js`)

| Cron          | Job             | Description                                              |
|---------------|-----------------|----------------------------------------------------------|
| `0 1 * * *`   | Nightly         | Moves `pending` transactions where `tripDate < today` → `held` |
| `0 6 * * *`   | Payout schedule | Auto-generates draft batches for eligible operators       |

---

## Per-Operator Settings (`OperatorBalance`)

Each operator has an `OperatorBalance` record with customizable settings:

| Field               | Default       | Description                                              |
|---------------------|---------------|----------------------------------------------------------|
| `settlementCycle`   | `weekly`      | `weekly` or `monthly`                                    |
| `commissionRate`    | 5%            | Platform fee deducted from gross amount                  |
| `minimumThreshold`  | NPR 1,000     | Minimum held balance required to generate a batch        |
| `payoutDay`         | 1             | Day of week (0=Sun) or day of month for payout           |
| `bankDetails`       | `{}`          | JSONB: bank name, account number, account name           |

---

## Global Settings (`BillingSetting`)

Stored as key-value pairs. Defaults set on first run:

| Key                 | Default   | Description                                     |
|---------------------|-----------|-------------------------------------------------|
| `commissionRate`    | `5`       | Default platform commission (%) for new operators |
| `settlementCycle`  | `weekly`  | Default cycle for new operators                 |
| `payoutDay`         | `1`       | Default payout day                              |
| `minimumThreshold`  | `1000`    | Minimum balance to generate a batch (NPR)       |
| `autoApprove`       | `false`   | Auto-approve batches without manual review      |

---

## Commission Calculation

```
grossAmount     = booking.totalAmount
commissionRate  = operator.commissionRate ?? global.commissionRate ?? 5%
commissionAmount = grossAmount * (commissionRate / 100)
netAmount       = grossAmount - commissionAmount
```

---

## API Endpoints

All endpoints require `Authorization: Bearer <admin-token>` and admin role.

Base path: `/api/admin/billing`

### Dashboard
- `GET  /dashboard` — KPI summary (totals by status, recent batches)
- `POST /sync` — Sync existing paid/confirmed bookings into billing transactions
- `POST /run-nightly` — Manually trigger the nightly pending→held job

### Operators
- `GET  /operators` — List all operators with balance summary
- `GET  /operators/:id` — Operator detail with transactions and balance
- `PUT  /operators/:id` — Update settlement settings and bank details
- `POST /operators/:id/generate-batch` — Generate a payout batch for one operator

### Transactions
- `GET  /transactions` — List with filters: `status`, `providerId`, `from`, `to`, `page`
- `PUT  /transactions/:id/status` — Manually override transaction status

### Batches
- `GET  /batches` — List with filters: `status`, `providerId`, `page`
- `POST /batches/generate` — Generate batches for all eligible operators
- `GET  /batches/:id` — Batch detail with transactions
- `PUT  /batches/:id/approve` — Approve a pending batch
- `PUT  /batches/:id/reject` — Reject with reason `{ reason }`
- `PUT  /batches/:id/paid` — Mark paid with `{ payoutReference, payoutMethod }`
- `GET  /batches/:id/export` — Download CSV of batch transactions

### Settings
- `GET  /settings` — Get all global settings
- `PUT  /settings` — Update settings `{ commissionRate, settlementCycle, payoutDay, minimumThreshold, autoApprove }`

---

## Adding a New Operator

1. Operator registers and is approved by admin.
2. An `OperatorBalance` record is auto-created on first transaction (`getOrCreateBalance`).
3. Admin can override commission rate and cycle under **Billing → Operators → Edit**.
4. Operator must provide bank details via the same form before batches can be paid.

---

## Deployment Notes

- The scheduler (`payoutScheduler.js`) starts automatically with the server via `startScheduler()` in `server.js`.
- Transactions are created **idempotently** — calling `createTransactionForBooking` multiple times for the same booking is safe (duplicate is skipped).
- `sequelize.sync({ alter: true })` will auto-create all billing tables on first boot.
- Uploads served from `/api/uploads/*` — ensure the `uploads/` directory exists on the server.
