# DalMarketplace — Firestore Data Model

Firestore is schemaless, so these "schemas" are enforced in code via the factories and validators
in this folder (`userModel.js`, `listingModel.js`, `reviewModel.js`). Enums and limits live in
`constants.js` and are the single source of truth (mirrored on the client in `newPosting.jsx`).

Search is **prefix-based** (Firestore has no full-text search): listings carry a lowercased
`title_lower` field that is range-queried by prefix.

---

## Collection: `users`

| Field         | Type            | Notes                                              |
|---------------|-----------------|----------------------------------------------------|
| `email`       | string          | Lowercased, must end in `@dal.ca`                  |
| `name`        | string          | Display name                                       |
| `bannerId`    | string          | `B00xxxxxx`; used as the login identifier          |
| `password`    | string          | **bcrypt hash** — never the raw password           |
| `avatarUrl`   | string \| null  | Profile picture (Cloudinary)                       |
| `ratingAvg`   | number          | Denormalized average of received seller reviews    |
| `ratingCount` | number          | Number of reviews counted into `ratingAvg`         |
| `createdAt`   | string (ISO)    |                                                    |

Validation (`validateNewUser`): valid `@dal.ca` email, non-empty name, `B00xxxxxx` banner id,
password ≥ 6 chars.

## Collection: `listings`

| Field            | Type            | Notes                                           |
|------------------|-----------------|-------------------------------------------------|
| `title`          | string          | Required                                        |
| `title_lower`    | string          | Lowercased `title` — powers prefix search       |
| `description`    | string          | Optional                                        |
| `price`          | number          | ≥ 0                                             |
| `category`       | string          | One of `CATEGORIES`                             |
| `condition`      | string          | One of `CONDITIONS`                             |
| `region`         | string          | One of `REGIONS`                               |
| `images`         | string[]        | Cloudinary URLs, max `MAX_IMAGES` (5)           |
| `status`         | string          | One of `LISTING_STATUS`                         |
| `aiSummary`      | string \| null  | Gemini-generated listing summary             |
| `sellerId`       | string          | `users` doc id — set from the auth token        |
| `sellerName`     | string          | Denormalized for display                        |
| `sellerBannerId` | string          | Denormalized for display                        |
| `isDeleted`      | boolean         | Soft-delete flag; excluded from browse/detail   |
| `deletedAt`      | string \| null  | ISO timestamp set when soft-deleted             |
| `createdAt`      | string (ISO)    |                                                 |
| `updatedAt`      | string (ISO)    |                                                 |

**Status lifecycle:** `draft` → `available` → `reserved` → `sold`.
The current client sends `published`; `buildListing` normalizes that to `available`.

**Soft delete:** deletion sets `isDeleted: true` + `deletedAt` rather than removing the document;
records are queried with `isDeleted == false` to exclude them.

Validation (`validateListing`): required title, numeric `price ≥ 0`, `category`/`condition`/`region`
within their enums, `images` an array ≤ 5. Pass `{ partial: true }` for updates (only validates
fields present).

## Collection: `reviews`

| Field          | Type         | Notes                                              |
|----------------|--------------|----------------------------------------------------|
| `sellerId`     | string       | `users` doc id being reviewed                      |
| `reviewerId`   | string       | `users` doc id writing the review (from auth)      |
| `reviewerName` | string       | Denormalized for display                           |
| `listingId`    | string       | The sold listing the review is about               |
| `rating`       | number       | Integer `RATING_MIN`..`RATING_MAX` (1–5)           |
| `comment`      | string       | Optional                                           |
| `flagged`      | boolean      | Reported as abusive                                |
| `createdAt`    | string (ISO) |                                                    |

Validation (`validateReview`): `sellerId` + `listingId` required, integer `rating` 1–5.
When a review is created, the seller's `ratingAvg` / `ratingCount` must be updated (task 4).

---

## Enums (`constants.js`)

- `CATEGORIES`: Electronics, Furniture, Clothing, Books, Sports, Other
- `CONDITIONS`: New, Like New, Good, Fair, Poor
- `REGIONS`: Halifax, Dartmouth, Bedford, Sackville, Other
- `LISTING_STATUS`: draft, available, reserved, sold
- `MAX_IMAGES`: 5 · `RATING_MIN`: 1 · `RATING_MAX`: 5

## Suggested Firestore indexes (for Search, task 3)

Prefix search orders by `title_lower`; combining it with equality filters needs composite indexes,
e.g. `(category ==, title_lower range)`, `(region ==, title_lower range)`. Firestore will surface
the exact index it needs at query time — add them to `firestore.indexes.json` as they come up.

Defined in `firestore.indexes.json` (deploy with `firebase deploy --only firestore:indexes`):
- `listings`: `(isDeleted ==, status ==, createdAt desc)` — browse by newest.
- `listings`: `(sellerId ==, isDeleted ==, createdAt desc)` — a seller's own listings by newest.
- `listings`: `(isDeleted ==, status ==, title_lower asc)` — prefix search.
- `listings`: `(isDeleted ==, status ==, category ==, title_lower asc)` — prefix search + category filter.
- `listings`: `(isDeleted ==, status ==, region ==, title_lower asc)` — prefix search + region filter.
- `listings`: `(isDeleted ==, status ==, category ==, region ==, title_lower asc)` — prefix search + both filters.
