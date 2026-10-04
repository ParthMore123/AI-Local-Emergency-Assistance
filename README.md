# AILEA – AI Local Emergency Assistance

**Help When Every Second Matters.**

Web + mobile-responsive MVP for AI-assisted local emergency help: natural-language triage, SOS, nearby services, maps, contacts, request tracking, and history.

## Stack

- **Frontend:** React (Vite), React Router, Leaflet
- **Backend:** Node.js, Express
- **Database:** Local JSON store (Mongo-style entities; swap-in ready)
- **Auth:** JWT + bcrypt
- **AI:** Built-in emergency NLP classifier (optional OpenAI via `OPENAI_API_KEY`)

## Quick start

### 1. Install

```bash
cd server
npm install

cd ../client
npm install
```

### 2. Run

The API uses a **local JSON data store** (`server/data`) and auto-seeds demo services on first start — MongoDB is not required to run the MVP.

```bash
# terminal 1
cd server
npm run dev

# terminal 2
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

To reset demo data, delete the `server/data` folder and restart the API (or run `npm run seed`).

### Demo account

- Email: `demo@ailea.app`
- Password: `demo1234`

Seeded services are centered on Palghar district, Maharashtra. If browser geolocation is denied, the app falls back to that demo location.

## Environment

Copy `server/.env.example` to `server/.env`:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Mongo connection string |
| `JWT_SECRET` | JWT signing secret |
| `CLIENT_ORIGIN` | CORS origin (default Vite URL) |
| `OPENAI_API_KEY` | Optional LLM enrichment for AI routes |

## MVP features

- Register / login / forgot-password OTP (dev OTP returned in non-production)
- Home dashboard with SOS CTA and AI search entry
- AI emergency analysis + natural-language search
- SOS with confirmation, contact notification, status tracking
- Nearby services + map filters + service detail (call / directions / share / request help)
- Emergency contacts with SOS opt-in
- Emergency history with type/date filters
- Responsive desktop sidebar + mobile bottom nav

## API surface

- `POST /api/auth/register|login|verify-otp|forgot-password`
- `POST /api/ai/analyze-emergency` · `POST /api/ai/search`
- `POST /api/emergency/sos` · `GET /api/emergency/status/:id` · `PUT /api/emergency/cancel/:id` · `GET /api/emergency/history`
- `GET /api/services/nearby` · `GET /api/services/:id`
- `GET|POST /api/contacts` · `PUT|DELETE /api/contacts/:id`

## Safety note

AILEA is an assistance platform, not a replacement for professional emergency services. Always call local emergency numbers when in immediate danger.
