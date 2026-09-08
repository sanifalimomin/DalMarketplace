# DalMarketplace

A student marketplace for Dalhousie University — buy and sell textbooks, furniture,
electronics, and more within the Dal community. Users authenticate with their
Dalhousie **Banner ID** and `@dal.ca` email, list items with photos and an
AI-generated summary, chat with buyers/sellers in real time, and leave reviews
after a completed sale.

Built as a monorepo with an independent React SPA and Express REST API, backed by
Firebase Firestore.

---

## Table of contents

- [About](#about)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [API overview](#api-overview)
- [Deployment](#deployment)
- [License](#license)

---

## About

DalMarketplace lets Dalhousie students post, browse, and buy/sell items without
leaving the Dal community. It was built as a course project
(`docs/Group07_ProjectProposal_V2.pdf`) and has since grown well past the original
proposal — real-time chat, seller reviews, saved listings, and AI listing summaries
were all added post-proposal.

## Features

- **Dal-only auth** — signup requires an `@dal.ca` email; login is by Banner ID
  (`B00...`) + password (bcrypt-hashed), with email verification before first login
  and a password-reset flow (both via `nodemailer`).
- **Listings** — create/edit/delete, draft vs. published status, image upload
  (direct-to-Cloudinary, up to 5 photos/listing), category/condition/region
  filters, keyword search, price sort, save/favorite listings.
- **AI listing summaries** — Google Gemini (`@google/generative-ai`) generates a
  short marketplace summary from the title/description/condition on listing
  create, and backfills it on read (`GET /api/listings/:id`) if missing.
- **Real-time chat** — buyer↔seller messaging per listing via Stream Chat, with
  server-issued chat tokens and per-listing channel creation.
- **Reviews & ratings** — buyers rate sellers after a purchase; seller profiles
  show an aggregate rating; reviews can be flagged.
- **My Listings / My Purchases** — a seller's own listings (all statuses) and a
  buyer's purchase history.
- **Responsive UI** — MUI-based component library, CSS Modules for page-specific
  styling.

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite, React Router 7, MUI 9, CSS Modules |
| Backend | Node.js, Express 5 |
| Database | Firebase Firestore (via `firebase-admin`) |
| Auth | Custom (Banner ID + bcrypt + JWT) — not Firebase Auth |
| Images | Cloudinary (unsigned client-side upload) |
| Chat | Stream Chat |
| AI | Google Generative AI (Gemini) |
| Email | Nodemailer |
| CI/CD | GitLab CI → Docker Hub → Render deploy hooks |

## Project structure

```
dalmarketplace/
├── client/                      React + Vite SPA
│   ├── src/
│   │   ├── pages/               Route-level pages (login, dashboard, itemScreen, chat, ...)
│   │   ├── components/          Reusable UI (ListingCard, AiSummaryCard, ReviewPanel, ...)
│   │   ├── contexts/            AuthContext — single source of truth for auth state
│   │   ├── services/            fetch wrappers per resource (listingService, chatService, ...)
│   │   ├── styles/               *.module.css, one per page/component
│   │   └── utils/                constants, Cloudinary URL helpers
│   ├── Dockerfile               Multi-stage: Vite build → nginx
│   └── nginx.conf.template
│
├── server/                      Express REST API
│   ├── server.js                Entry point (loads dotenv, starts the app)
│   └── src/
│       ├── app.js               Express app: cors, helmet, morgan, routes, error handler
│       ├── routes/              One router per resource, aggregated in routes/index.js
│       ├── controllers/         Request handlers (business logic)
│       ├── models/               Firestore document shape + validation per collection
│       ├── middleware/           authMiddleware (JWT), errorHandler
│       ├── services/             aiSummaryService (Gemini)
│       ├── utils/                ApiError, in-memory TTL cache, email service/templates
│       └── config/               firebase.js (Admin SDK), stream.js (Stream Chat client)
│   └── Dockerfile
│
├── ci/                          GitLab CI job definitions (see ci/README.md)
│   ├── common.gitlab-ci.yml     Shared bases: runner tag, main-only rule, Docker login
│   ├── build.gitlab-ci.yml      build:api / build:client → push to Docker Hub
│   └── deploy.gitlab-ci.yml     deploy:render → ping Render deploy hooks
│
├── docs/                        Original project proposal
├── layout/                      Static Figma-exported HTML mockups (reference only)
├── .gitlab-ci.yml               Pipeline entry point: stages, image names, includes ci/
└── DalMarketplace.postman_collection.json   API collection for manual testing
```

## Architecture

### Auth flow

Authentication is **custom**, not Firebase Auth — users log in with their Dalhousie
**Banner ID**, not email.

1. `POST /api/auth/signup` — validates the email ends in `@dal.ca`, checks for an
   existing user by email, bcrypt-hashes the password, stores the user in
   Firestore, and sends a verification email.
2. `POST /api/auth/login` — looks up the user **by `bannerId`**, verifies the
   password, and returns a JWT (1h expiry) plus `userId`, `bannerId`, `name`.
3. The client stores the token/user in `localStorage` via `AuthContext`
   (`client/src/contexts/AuthContext.jsx`); pages read it via `useAuth()`.
4. `<ProtectedRoute>` redirects unauthenticated users to `/signin`.
5. Protected API routes re-verify the JWT via `authMiddleware`, reading the
   `Authorization: Bearer <token>` header.

### Listings & images

Image uploads bypass the server entirely: the client uploads files directly to
Cloudinary (unsigned, via `VITE_CLOUDINARY_UPLOAD_PRESET`), then posts the listing
— including the returned image URLs and denormalized seller fields (`sellerId`,
`sellerName`, `sellerBannerId`) — to `POST /api/listings`. Listings carry a
`status` of `draft`, `available`, `reserved`, or `sold`.

### Server layering

`server/src/`: thin `routes/` → `controllers/` (logic, forward errors via
`next(err)`) → `models/` (Firestore doc shape + validation) → Firestore, via the
singleton `db` from `config/firebase.js`. `middleware/errorHandler` is the single
place that turns thrown `ApiError`s into `{ error }` responses.

## Getting started

Each package is run independently — there's no shared build.

### Prerequisites

- Node.js 20+
- A Firebase project with Firestore enabled, and a service account key
- Accounts/keys for: Cloudinary, Stream Chat, Google Generative AI (Gemini), and
  an email account for `nodemailer` (e.g. Gmail + app password)

### Server

```bash
cd server
npm install
# add server/.env (see below) and server/.firebase/serviceAccount.json
npm run dev      # nodemon, auto-reload — http://localhost:5000
```

### Client

```bash
cd client
npm install
# add client/.env (see below)
npm run dev       # Vite dev server with HMR — http://localhost:5173
```

Other useful commands:

| Command | Where | Does |
|---|---|---|
| `npm run build` | client | production build to `client/dist` |
| `npm run preview` | client | serve the production build locally |
| `npm run lint` | client, server | ESLint |
| `npm start` | server | run with plain `node` (no auto-reload) |

There is no test runner configured yet — `npm test` in `server/` is a stub.

## Environment variables

Both packages read from a local `.env` (git-ignored, not committed).

**`server/.env`:**

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Signs/verifies auth JWTs |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to the Firebase service account JSON (local dev) |
| `PORT` | Optional, defaults to `5000` |
| `ALLOWED_ORIGINS` | Comma-separated list of origins allowed by CORS |
| `GEMINI_API_KEY` | Google Generative AI key, used for listing summaries |
| `STREAM_API_KEY` / `STREAM_SECRET` | Stream Chat server-side credentials |
| `EMAIL_USER` / `EMAIL_PASS` | Account used by `nodemailer` for verification/reset emails |
| `FRONTEND_URL` | Client's public URL, used to build links inside emails |
| `FIREBASE_SERVICE_ACCOUNT` | Production alternative to the local service-account file — full JSON as a single-line string |

**`client/.env`** (must be prefixed `VITE_`):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Base URL for all `fetch` calls to the server |
| `VITE_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned upload preset |
| `VITE_STREAM_API_KEY` | Stream Chat API key (public, client-side) |

Firebase Admin credentials live at `server/.firebase/serviceAccount.json` (local
dev only — git-ignored).

## API overview

All routes are mounted under `/api`. Protected routes require
`Authorization: Bearer <jwt>`.

| Resource | Routes |
|---|---|
| Auth | `POST /auth/signup`, `POST /auth/login` |
| Email verification | `POST /verify/send`, `POST /verify/verify`, `POST /verify/check-status`, `POST /verify/getEmail` |
| Password reset | `POST /reset/send`, `POST /reset/reset-password` |
| Users | `GET /users`, `GET /users/me`, `PATCH /users/me`, `PATCH /users/me/password`, `GET /users/:id` |
| Listings | `GET /listings`, `GET /listings/search`, `GET /listings/mine`, `GET /listings/saved`, `GET /listings/:id`, `POST /listings`, `PUT /listings/:id`, `PATCH /listings/:id/status`, `POST/DELETE /listings/:id/save`, `DELETE /listings/:id` |
| Reviews | `POST /reviews`, `GET /reviews/seller/:id`, `POST /reviews/:id/flag` |
| Chat | `POST /chat/token`, `POST /chat/listing/:listingId/channel` |

A full request/response collection is in `DalMarketplace.postman_collection.json`.

## Deployment

Production is two Docker images: GitLab CI builds them on every push to `main`,
pushes them to Docker Hub, and pings Render, which pulls and restarts. The
university GitLab instance can't reach Render directly — Docker Hub is the
hand-off point between them.

```
git push (main) ──▶ GitLab CI ──▶ build Docker images ──▶ Docker Hub ──▶ Render deploy hooks ──▶ live
```

### Pipeline

Job definitions live in **`ci/`**; the root `.gitlab-ci.yml` only declares the
stages and image names and `include`s them. Full docs, including the CI/CD
variable table, are in [`ci/README.md`](./ci/README.md).

| Stage | Job | Does |
|---|---|---|
| build | `build:api` | builds `server/Dockerfile`, pushes `dalmarketplace-api` |
| build | `build:client` | builds `client/Dockerfile` with the `VITE_*` build args, pushes `dalmarketplace-client` |
| deploy | `deploy:render` | POSTs both Render deploy hooks |

Everything is gated on `main`, so feature branches and MRs never publish an image
or deploy. Each image is tagged twice — `$CI_COMMIT_SHORT_SHA` and `latest`.

### First-time setup

1. **Docker Hub** — create the repos `dalmarketplace-api` and
   `dalmarketplace-client`, then an access token with read/write scope.
2. **Render** — create two web services, both **Deploy an existing image from a
   registry**:

   | | dalmarketplace-api | dalmarketplace-client |
   |---|---|---|
   | Image | `<user>/dalmarketplace-api:latest` | `<user>/dalmarketplace-client:latest` |
   | Port | `5000` (Render injects `PORT`; `server.js` reads it) | `8080` (nginx substitutes `${PORT}` into `nginx.conf.template`) |
   | Env vars | all server secrets (below) | none — `VITE_*` are already baked into the bundle |

   Copy each service's **deploy hook** URL from Settings → Deploy Hook.
3. **GitLab** — add the CI/CD variables listed in
   [`ci/README.md`](./ci/README.md) (Settings → CI/CD → Variables), masking and
   protecting the secrets.

### Where each value goes

| Value | Set in |
|---|---|
| `VITE_*` (client) | GitLab CI variables — compiled into the bundle at build time, **not** read at runtime |
| `JWT_SECRET`, `GEMINI_API_KEY`, `STREAM_API_KEY` / `STREAM_SECRET`, `EMAIL_USER` / `EMAIL_PASS` | Render → dalmarketplace-api → Environment |
| `FIREBASE_SERVICE_ACCOUNT` | Render → dalmarketplace-api — the whole service-account JSON as one line (replaces the local `server/.firebase/serviceAccount.json`) |
| `ALLOWED_ORIGINS` | Render API service — must include the client's Render URL, or the browser gets CORS errors |
| `FRONTEND_URL` | Render API service — the client URL used to build verification/reset links in emails |
| `VITE_API_BASE_URL` | GitLab — must point at the API service's Render URL |

The last three are the usual cause of a deploy that builds fine but doesn't work:
they have to agree with the two Render URLs.

### Building the production images locally

Useful for reproducing a CI failure without pushing:

```bash
# API
docker build -t dalmarketplace-api ./server
docker run --rm -p 5000:5000 --env-file server/.env dalmarketplace-api

# Client (VITE_* must be passed at build time, not run time)
docker build ./client -t dalmarketplace-client \
  --build-arg VITE_API_BASE_URL=http://localhost:5000 \
  --build-arg VITE_CLOUDINARY_CLOUD_NAME=... \
  --build-arg VITE_CLOUDINARY_UPLOAD_PRESET=... \
  --build-arg VITE_STREAM_API_KEY=...
docker run --rm -p 8080:8080 dalmarketplace-client
```

### Redeploying and rolling back

- **Redeploy the same commit** — POST the service's deploy hook:
  `curl -X POST "$RENDER_DEPLOY_HOOK_API"`.
- **Roll back** — point the Render service's image tag at a known-good
  `:<short-sha>` instead of `:latest` and deploy manually. Rolling the client
  back also rolls back its baked-in `VITE_*` values.

## License

Licensed under the [MIT License](./LICENSE).
