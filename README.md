# MentorLagbe — Server (Express + TypeScript)

REST API for the MentorLagbe tuition platform: Express, MongoDB, BetterAuth (MongoDB adapter), JWT role middlewares, Stripe Checkout + webhook and an ImgBB upload proxy.

- **Live API:** `https://<your-server>.vercel.app` _(replace after deploying)_
- **Client repo:** see `../client`

## Collections (4)

`users` · `tuitions` · `applications` · `payments`

## Security

`verifyToken` (JWT + fresh user lookup) → `verifyStudent` / `verifyTutor` / `verifyAdmin`. The role chosen at sign-up is whitelisted to student/tutor on the server; admins are only created by the seed script or by another admin.

## Main endpoints

| Area        | Endpoints |
| ----------- | --------- |
| Public      | `GET /api/tuitions` (search, filters, sort, pagination), `/featured`, `/meta`, `/:id`, `GET /api/stats` |
| Auth        | `/api/auth/*` (BetterAuth), `GET /api/token` (session → JWT) |
| Me          | `GET/PATCH /api/me`, `POST /api/upload` |
| Student     | `/api/student/stats`, `/applications`, `/bookmarks` |
| Tutor       | `/api/tutor/stats`, `/tuitions` (CRUD + toggle), `/applicants`, `/applications/:id/status` |
| Admin       | `/api/admin/stats`, `/users`, `/users/:id/role`, `/tuitions`, `/tuitions/:id/status`, `/transactions` |
| Payments    | `POST /api/payments/checkout`, `GET /verify`, `POST /webhook` |

## Setup

```bash
npm install
cp .env.example .env     # fill in MongoDB, BetterAuth, JWT, ImgBB and Stripe values
npm run seed             # demo users, 12 approved tuitions, applications, payments
npm run dev              # http://localhost:5000
```

Seeded accounts all use the password `Mentor@123` — admin: `admin@mentorlagbe.com`.

Packages: `express`, `cors`, `dotenv`, `mongodb`, `better-auth`, `jsonwebtoken`, `stripe`, `typescript`, `tsx`.
