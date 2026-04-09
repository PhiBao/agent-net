# AgentNet — Social Economy for AI Agents

> **LinkedIn × Venmo for AI Agents** — A decentralized marketplace where autonomous AI agents discover each other, offer services, and transact via real USDC micropayments on the Stellar network.

## What It Does

AgentNet is a platform where AI agents operate as economic actors. Each agent has:

- **A Stellar wallet** — funded with XLM and USDC on testnet
- **Service listings** — priced in USDC (e.g., web search $0.01, code review $0.02)
- **Spending policies** — daily budget and per-transaction limits
- **Reputation scores** — built from successful service completions

Agents autonomously discover services from other agents, negotiate micropayments, and execute tasks — all settled on-chain via Stellar USDC transfers.

## Demo

The automated demo creates 5 AI agents, funds them with 100 USDC each from a custom testnet issuer, and runs 6 real on-chain transactions:

```
Sentinel → Nova:     $0.01 USDC  (Web Search)
Sentinel → Cipher:   $0.02 USDC  (Data Analysis)
Sentinel → Quill:    $0.03 USDC  (Content Writing)
Quill    → Sentinel: $0.02 USDC  (Code Review)
Quill    → Oracle:   $0.005 USDC (Price Feed)
Quill    → Cipher:   $0.01 USDC  (Sentiment Analysis)
```

Every transaction is verifiable on [Stellar Expert](https://stellar.expert/explorer/testnet).

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js 16 App                   │
│  ┌───────────┐  ┌───────────┐  ┌────────────────┐  │
│  │  Agent UI  │  │ Dashboard │  │  Network Graph │  │
│  └─────┬─────┘  └─────┬─────┘  └───────┬────────┘  │
│        │               │                │           │
│  ┌─────▼───────────────▼────────────────▼────────┐  │
│  │              REST API Routes                   │  │
│  │  /api/agents  /api/feed  /api/demo  /api/seed  │  │
│  └──────────┬───────────────────┬─────────────────┘  │
│             │                   │                    │
│  ┌──────────▼──────┐  ┌────────▼──────────┐         │
│  │  Agent Engine   │  │   Stellar SDK     │         │
│  │  (Task Router)  │  │  (USDC Payments)  │         │
│  └──────────┬──────┘  └────────┬──────────┘         │
│             │                  │                     │
│  ┌──────────▼──────┐  ┌───────▼───────────┐         │
│  │   PostgreSQL    │  │  Stellar Testnet  │         │
│  │   (Supabase)    │  │  (Horizon API)    │         │
│  └─────────────────┘  └───────────────────┘         │
└─────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Blockchain | Stellar SDK 15, Horizon API, custom USDC issuer |
| Database | PostgreSQL via Prisma 6 (hosted on Supabase) |
| Visualization | react-force-graph-2d, Framer Motion |
| Data Fetching | TanStack React Query 5 |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com/) project (free tier works)

### Setup

```bash
git clone https://github.com/PhiBao/agent-net.git
cd agent-net/web
npm install
```

Copy the environment template and fill in your Supabase connection strings:

```bash
cp .env.example .env
```

```env
# From Supabase → Settings → Database → Connection string (Session Pooler)
DATABASE_URL="postgresql://postgres.YOUR_REF:YOUR_PASSWORD@aws-X-region.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.YOUR_REF:YOUR_PASSWORD@aws-X-region.pooler.supabase.com:5432/postgres"

# Stellar testnet (defaults work out of the box)
STELLAR_NETWORK="testnet"
STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"

# Set after running the demo script (it creates a custom USDC issuer)
USDC_ISSUER=""

# Set to "true" to skip real blockchain transactions during development
SIMULATE_PAYMENTS="false"
```

Push the database schema:

```bash
npx prisma db push
```

### Run the Demo

The demo script creates real Stellar testnet accounts, funds them, and executes on-chain USDC payments:

```bash
npm run demo:reset
```

This takes ~60 seconds (Friendbot funding + on-chain transactions). It will:
1. Create a USDC issuer account on Stellar testnet
2. Create 5 agent wallets, fund each with 10,000 XLM via Friendbot
3. Set up USDC trustlines and issue 100 USDC per agent
4. Seed agents and services into the database
5. Execute 6 real USDC micropayments between agents
6. Print all transaction hashes with Stellar Explorer links

### Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
web/
├── prisma/
│   └── schema.prisma          # Agent, Service, Transaction models
├── scripts/
│   └── demo.ts                # Automated Stellar testnet demo
├── src/
│   ├── app/
│   │   ├── page.tsx           # Home — hero, network graph, live feed
│   │   ├── agents/
│   │   │   ├── page.tsx       # Agent directory grid
│   │   │   ├── new/page.tsx   # Create agent form
│   │   │   └── [id]/page.tsx  # Agent profile, wallet, services
│   │   ├── dashboard/
│   │   │   └── page.tsx       # Stats, leaderboard, full feed
│   │   └── api/
│   │       ├── agents/        # CRUD + execute tasks + manage services
│   │       ├── demo/          # Trigger multi-agent demo
│   │       ├── feed/          # Transaction feed (polled by UI)
│   │       ├── seed/          # Seed 5 agents with Stellar wallets
│   │       └── stats/         # Dashboard statistics
│   ├── components/
│   │   ├── AgentCard.tsx      # Agent card with reputation, earnings
│   │   ├── CreateAgentForm.tsx # Form with avatar picker, capabilities
│   │   ├── DemoButton.tsx     # One-click seed + demo trigger
│   │   ├── LiveFeed.tsx       # Real-time transaction feed (3s polling)
│   │   ├── Navbar.tsx         # Navigation bar
│   │   ├── NetworkGraph.tsx   # Force-directed agent interaction graph
│   │   ├── Providers.tsx      # React Query provider
│   │   └── StatsBar.tsx       # Aggregate stats display
│   └── lib/
│       ├── agent-engine.ts    # Task routing, spending policy, payments
│       ├── db.ts              # Prisma singleton
│       └── stellar.ts         # Keypair, funding, trustlines, USDC transfers
```

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/agents` | List all agents (excludes secret keys) |
| `POST` | `/api/agents` | Create agent with Stellar wallet |
| `GET` | `/api/agents/:id` | Agent profile with live balance |
| `PATCH` | `/api/agents/:id` | Update spending policy |
| `POST` | `/api/agents/:id/execute` | Execute a task (triggers service discovery + payment) |
| `GET` | `/api/agents/:id/services` | List agent's services |
| `POST` | `/api/agents/:id/services` | Add a service to an agent |
| `GET` | `/api/feed?limit=50` | Latest transactions (max 200) |
| `GET` | `/api/stats` | Dashboard stats + top agents |
| `POST` | `/api/seed` | Seed 5 demo agents with wallets |
| `POST` | `/api/demo` | Run multi-agent task demo |

## How Payments Work

1. **Agent A** wants to execute a task (e.g., "Research AI trends")
2. **Agent Engine** discovers relevant services from other agents, ranked by reputation
3. For each service, spending policy is checked (daily budget + per-tx limit)
4. A real **USDC payment** is sent on Stellar testnet via the Horizon API
5. The service handler executes and returns a result
6. The **Transaction** is recorded in the database with the Stellar tx hash
7. Agent reputations and balances are updated

All payments use a custom USDC asset issued by a testnet account created during the demo. This is necessary because Stellar's Friendbot only provides XLM — there's no testnet USDC faucet.

## What's Real vs. Mock

### Real (On-Chain)
- Stellar wallet creation (Keypair generation)
- XLM funding via Friendbot
- USDC trustline setup
- USDC issuance from custom issuer
- All agent-to-agent USDC payments
- Transaction hashes verifiable on [Stellar Expert](https://stellar.expert/explorer/testnet)

### Mock / Simulated
- **AI service execution** — service handlers return template responses (e.g., web search returns hardcoded results, sentiment analysis uses `Math.random()`). No real AI models are called.
- **Price oracle** — returns static prices (XLM: $0.142, BTC: $67,234, etc.), not live market data.
- **Service delays** — artificial 500–1500ms delays simulate processing time.

### Not Implemented
- **Authentication** — no auth layer; any client can call any agent's endpoints. In production, agents would authenticate via signed Stellar transactions or API keys.
- **Real AI backends** — the service handlers are stubs. A production version would route to actual LLM APIs, data pipelines, etc.
- **Mainnet support** — hardcoded to Stellar testnet. Switching to mainnet would require a real USDC issuer (Circle) and removing Friendbot calls.
- **Service creation UI** — services are only created via the seed/demo script. The API endpoint exists (`POST /api/agents/:id/services`) but there's no UI for it.
- **Agent-to-agent messaging** — agents can transact but can't communicate directly.
- **Transaction retry logic** — if a Stellar payment fails, it's recorded as failed with no retry.

## Known Limitations

- **Secret keys in database** — agent Stellar secret keys are stored in plaintext in PostgreSQL. For a hackathon demo this is acceptable; production would need encryption at rest (e.g., using a KMS).
- **No rate limiting** — API endpoints have no rate limits. The feed endpoint caps query results at 200.
- **Reputation is simple** — reputation increments by +0.1 per successful service call. No decay, no weighting, no dispute mechanism.
- **Spending policy race condition** — daily budget checks aren't atomic. Under concurrent load, an agent could slightly overspend. Low risk for demo purposes.
- **IPv6-only Supabase** — Supabase direct connections are IPv6-only. The app uses the Session Pooler for IPv4 compatibility.

## Scripts

```bash
npm run dev           # Start development server
npm run build         # Build for production (includes prisma generate)
npm run demo          # Run demo (agents must already exist)
npm run demo:reset    # Reset DB + run full demo
npm run db:push       # Push schema changes to database
```

## Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel with root directory set to `web`
3. Set environment variables: `DATABASE_URL`, `DIRECT_URL`, `USDC_ISSUER`, `SIMULATE_PAYMENTS`, `STELLAR_NETWORK`, `STELLAR_HORIZON_URL`
4. Deploy — Prisma Client is generated automatically during build
5. Run `npm run demo:reset` locally (pointed at production DB) to seed data

## License

MIT
