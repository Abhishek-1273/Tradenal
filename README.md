# Tradenal 📈

> **A Disciplined, Modern Trading Journal & Analytics Platform**

Tradenal is a professional-grade mobile trading journal application built with **React Native (Expo)** and **Node.js/Express (TypeScript) + MongoDB**. It empowers traders to record trades, track psychological discipline scores, analyze performance metrics, and build consistent habits.

---

## 🚀 Key Features

- **📊 Comprehensive Trade Journaling:** Log long/short positions, entry/exit prices, risk-reward ratios, stop loss, take profit, and session tags.
- **🧠 Discipline & Psychology Tracking:** Track discipline scores, emotional states, and adherence to trading rules.
- **📈 Advanced Analytics:** Win rate, profit factor, risk-to-reward analytics, and breakdown by strategy & session.
- **💼 Multi-Account Management:** Seamlessly switch between personal accounts, funded prop firm accounts, and demo challenges.
- **🔒 Enterprise-Grade Security:** JWT authentication, encrypted storage, and sanitized API endpoints.
- **🌙 Sleek Dark Theme:** Custom fintech aesthetic with high-contrast data visualization.

---

## 📁 Repository Structure

```
trading-journal-complete/
├── backend/                  # Express + TypeScript REST API
│   ├── src/
│   │   ├── controllers/      # Route controllers
│   │   ├── models/           # Mongoose schemas & models
│   │   ├── routes/           # API endpoints
│   │   ├── middleware/       # Auth, validation, rate limiting
│   │   └── utils/            # Calculation helpers & mailers
│   ├── .env.example          # Environment variables template
│   └── package.json
│
├── frontend/                 # React Native (Expo) Mobile App
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── screens/          # App screens (Dashboard, Analytics, Trades, Settings)
│   │   ├── navigation/       # React Navigation stack & tabs
│   │   ├── store/            # State management (Zustand)
│   │   └── theme/            # Design tokens & color system
│   ├── assets/               # App icons, splash screens, logos
│   ├── .env.example          # Frontend environment template
│   └── app.json              # Expo configuration
```

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (local instance or MongoDB Atlas)
- Expo Go app on mobile or Android/iOS emulator

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your MONGODB_URI and JWT secrets in .env
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your backend IP/host
npx expo start
```

---

## 🛡️ Security & Privacy
- Sensitive credentials (`.env`) are strictly excluded via `.gitignore`.
- Authentication uses secure HTTP tokens and hashed passwords.
- No production keys or secrets are stored in this repository.

---

## 📄 License
Private Repository. All rights reserved.
