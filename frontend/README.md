# Trading Journal — Production Setup Guide

A full-stack mobile trading journal built with React Native (Expo) + Node.js/Express + MongoDB.

---

## Project Structure

```
trading-journal/
├── trading-journal-api/        # Node.js + Express backend
└── trading-journal-mobile/     # React Native (Expo) frontend
```

---

## Backend Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- (Optional) OpenAI API key for AI reviews
- (Optional) Cloudinary account for screenshot uploads

### Installation

```bash
cd trading-journal-api
npm install --legacy-peer-deps
cp .env.example .env
```

### Environment Variables (.env)

```env
NODE_ENV=development
PORT=5000

MONGODB_URI=mongodb://localhost:27017/trading_journal
# Or MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/trading_journal

JWT_ACCESS_SECRET=your_32_char_min_secret_here_abc123
JWT_REFRESH_SECRET=your_32_char_min_refresh_secret_xyz
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Optional — email for password reset
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@tradingjournal.app
FROM_NAME=Trading Journal

# Optional — Cloudinary for screenshots
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional — OpenAI for AI reviews
OPENAI_API_KEY=sk-...

CLIENT_URL=http://localhost:3000
```

### Run

```bash
npm run dev          # Development (ts-node-dev with hot reload)
npm run build        # Compile TypeScript
npm start            # Production (runs compiled JS)
```

API available at `http://localhost:5000`
Health check: `http://localhost:5000/health`

---

## Frontend Setup

### Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS/Android)

### Installation

```bash
cd trading-journal-mobile
npm install --legacy-peer-deps
```

### Configure API URL

Edit `src/api/client.ts` and update `BASE_URL`:

```typescript
const BASE_URL = __DEV__
  ? 'http://YOUR_LOCAL_IP:5000/api'    // e.g. http://192.168.1.100:5000/api
  : 'https://your-production-api.com/api';
```

> **Important**: Use your machine's local IP address (not `localhost`) so your phone can reach the backend over WiFi.
> Find it with `ipconfig` (Windows) or `ifconfig` (Mac/Linux).

### Run

```bash
npx expo start
```

Scan the QR code with Expo Go. The app will load on your phone.

---

## Features

### Authentication
- Email/password registration and login
- JWT access tokens (15min) + refresh tokens (7 days)
- Secure token storage (Expo SecureStore on device)
- Forgot/reset password via email
- Multi-device support (up to 5 concurrent sessions)

### Dashboard
- Period selector: Today / Week / Month / All-time
- Net R, Win Rate, Profit Factor, Avg RR, Streak
- Interactive equity curve chart
- Win/Loss/Breakeven donut chart
- Discipline score ring
- Pull-to-refresh

### Trade Journal
- Full trade logging: pair, direction, prices, lot size, risk %
- Live RR calculator while filling the form
- Session and setup classification
- 4-section tabbed form: Trade Info → Prices → Psychology → Notes
- Screenshot upload (Cloudinary)
- Tags, favorites, notes up to 5,000 chars

### Psychology Tracking
- Emotion before/after trade (6 pre-trade, 5 post-trade options)
- Discipline checklist: followed plan, revenge trade, overtraded, moved SL/TP
- Mistake multi-select (10 categories)
- Per-trade discipline score

### Calendar
- Monthly grid with green/red day coloring
- Net R and trade count per day
- Tap any day to see that day's trades

### Analytics (4 tabs)
- **Overview**: Monthly/weekly charts, session and setup breakdowns, key insights
- **Pairs**: Scatter plot (win rate vs net R), ranked pair table
- **Psychology**: Emotion win rate bars, mistake frequency, impact analysis
- **Discipline**: Score hero, category breakdown, 30-day history chart, scoring rubric

### Goals
- Monthly target setting: win rate, avg RR, discipline score, net R, trade count
- Progress bars per goal with achieved indicators
- Max daily trades and loss limits
- Goal history for last 6 months

### AI Review
- Weekly and monthly AI-generated reviews
- Powered by GPT-4o mini (falls back to rule-based if no API key)
- Pattern Detection tab: 8 behavioural patterns including revenge trading, overtrading, emotional trading underperformance, premature exits
- Full review sections: summary, mistakes, best setups, weaknesses, action items, psychology insights, risk management

### Settings
- Dark/light theme
- Default risk % and RR
- Notification preferences
- Account management

---

## Architecture

### Backend (Clean Architecture)
```
Routes → Controllers → Services → Repositories → Mongoose Models → MongoDB
```
- **Repository pattern**: swap database without touching business logic
- **Zod validation**: all inputs validated before hitting services
- **JWT rotation**: refresh tokens rotate on each use, reuse detection logs out all devices
- **Error middleware**: structured error responses with proper HTTP codes

### Frontend (Layered)
```
Screens → React Query Hooks → API Functions → Axios Client → Backend
         ↓
      Zustand Stores (auth, ui)
```
- **React Query**: server state, caching, background refetch
- **Zustand**: client state (auth session, filters, theme)
- **Offline queue**: trades saved to AsyncStorage when offline, synced on reconnect

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset password |
| GET | `/api/trades` | List trades (paginated + filtered) |
| POST | `/api/trades` | Create trade |
| GET | `/api/trades/:id` | Get trade |
| PUT | `/api/trades/:id` | Update trade |
| DELETE | `/api/trades/:id` | Delete trade |
| POST | `/api/trades/:id/screenshots` | Upload screenshots |
| GET | `/api/stats/dashboard` | Dashboard data |
| GET | `/api/stats/analytics` | Full analytics |
| GET | `/api/stats/calendar` | Calendar grid data |
| GET | `/api/stats/discipline` | Discipline score + history |
| GET | `/api/goals` | List goals |
| POST | `/api/goals` | Create/update goal |
| GET | `/api/ai/reviews` | List AI reviews |
| GET | `/api/ai/reviews/:type` | Latest review |
| GET | `/api/ai/patterns` | Detected behavioural patterns |
| POST | `/api/ai/generate/weekly` | Generate weekly review |
| POST | `/api/ai/generate/monthly` | Generate monthly review |
| GET | `/api/export/csv` | Export CSV |
| GET | `/api/export/json` | Export JSON |

---

## Production Deployment

### Backend (Railway / Render / Fly.io)

```bash
npm run build
# Deploy dist/ folder
# Set all environment variables in your platform's dashboard
```

### Frontend (EAS Build)

```bash
npm install -g eas-cli
eas login
eas build --platform all
```

Update `BASE_URL` in `src/api/client.ts` to your production API URL before building.

---

## Discipline Score Formula

| Category | Points | Condition |
|----------|--------|-----------|
| Followed Plan | 20 | `followedPlan === true` |
| No Revenge Trade | 20 | `revengeTrade === false` |
| No Overtrading | 15 | `overtraded === false` |
| RR Quality | 15 | `riskReward >= 2` (10pts if ≥1.5, 5pts if ≥1) |
| Risk Management | 15 | `riskPercent <= 1%` (10pts if ≤2%, 5pts if ≤3%) |
| Emotion Control | 10 | `emotionBefore` in `['calm', 'confident']` |
| SL Respected | 5 | `movedSL === false` |
| **Total** | **100** | |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native + Expo SDK 51 |
| State | Zustand + React Query (TanStack) |
| Forms | React Hook Form + Zod |
| Charts | Victory Native |
| Navigation | React Navigation v6 |
| UI | React Native Paper + custom components |
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh with rotation) |
| Storage | Expo SecureStore + AsyncStorage |
| Media | Cloudinary |
| AI | OpenAI GPT-4o mini |
| Email | Nodemailer |

---

## License

MIT
