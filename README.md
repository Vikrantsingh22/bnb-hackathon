# ⚡ BNBBrawl – Real-Time VCT Betting Platform on BNB Chain

BNBBrawl is a **real-time esports wagering platform** built in just **16 hours** during a BNB Chain hackathon.
It lets users **predict outcomes of live Valorant Champions Tour (VCT) matches**, place on-chain bets using **BNB Testnet**, and receive **instant payouts** via smart contracts when matches conclude.

---

## 🚀 Features

* 📅 **Upcoming Matches** – Fetches complete schedules of upcoming VCT matches.
* 🎮 **Live Matches** – Displays ongoing matches with real-time odds and team scores.
* 💸 **On-Chain Betting** – Users connect their wallets via MetaMask and place bets securely using the **BNB Smart Chain Testnet**.
* ⚡ **Instant Payouts** – Winnings are auto-calculated and disbursed via smart contracts based on odds at the time of bet placement.
* 🔄 **Realtime Updates** – Odds, match data, and bet history sync live to the frontend via **Supabase Realtime + cron jobs**.

---

## 🛠 Tech Stack

**Frontend**

* React.js + Vite
* TailwindCSS
* MetaMask Integration

**Backend**

* Express.js
* TypeScript
* Cheerio (for scraping match data from internet)

**Database**

* Supabase (PostgreSQL, Realtime)

**Blockchain**

* BNB Smart Chain (Testnet)
* Solidity Smart Contract (Escrow for bets + payouts)
* Ethers.js for backend integration

**Infrastructure**

* Cron jobs for:

  * Fetching upcoming matches (every 15 min)
  * Fetching live matches & odds (every 15–30 sec)
  * Settling completed matches & payouts (every 1–2 min)

---

## 📈 How It Works

1. **Match Data Fetching**

   * Scraper pulls upcoming and live VCT matches.
   * Stored in Supabase for real-time access.

2. **Placing a Bet**

   * User connects MetaMask → selects a live match → chooses a team.
   * Odds snapshot is saved in Supabase.
   * Bet transaction is sent to BNB testnet smart contract.

3. **Match Settlement**

   * Cron detects when a match is completed.
   * Result is fetched → smart contract payout function triggered.
   * Winners receive `(bet_amount * odds)` instantly.

---

## 🔗 Smart Contract

A minimal escrow contract on **BNB Testnet** that:

* Stores bets against match IDs.
* Holds funds until match completion.
* Releases winnings automatically after admin triggers settlement.

---

## 📂 Project Structure

```
BNBBrawl/
├── backend/              # Express.js APIs
│   ├── routes/           # API endpoints (matches, bets, payouts)
│   ├── services/         # upcoming matches scraper, odds calculator
│   ├── cron/             # Job schedulers
│   └── db/               # Supabase queries
│
├── frontend/             # React.js (Vite) frontend
│   ├── src/
│   │   ├── components/   # UI components (MatchCard, BetForm)
│   │   ├── pages/        # Upcoming, Live Matches, Bet History
│   │   └── hooks/        # Wallet, API hooks
│
└── contracts/            # Solidity smart contracts
    ├── BetEscrow.sol
    └── scripts/          # Deployment scripts
```

---

## ⚙️ Setup & Installation

### Prerequisites

* Node.js (>=16)
* MetaMask (configured with BNB Testnet)
* Supabase project with Postgres DB
* Remix or Hardhat for contract deployment

### Backend Setup

```bash
cd backend
npm install
npm run dev
```

Configure `.env` file with:

```
SUPABASE_URL=...
SUPABASE_KEY=...
BNB_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545/
PRIVATE_KEY=your_wallet_private_key
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 🎥 Demo

▶️ [Watch Demo Video](https://youtu.be/jvT85thNhts)

---

## 👥 Team

* **Vikrant Singh** – Backend, Smart Contracts, Integration
* **Aryaman Raj** – Frontend (React.js)
* **Sweta Karar** – UI/UX
* **Tejasvi Kumar** – Data scraping + odds logic
* **Soumik Baksi** – Testing & coordination

---

## 🏆 Hackathon

Built during **BNB Chain Hackathon 2025** in **16 hours**.

---

## 📌 Roadmap

* [ ] Deploy production-ready contracts on BNB Mainnet
* [ ] Implement dynamic odds calculation (based on bets placed)
* [ ] Add leaderboard & user profiles
* [ ] Multi-game support (LoL, CS2, Dota2)
