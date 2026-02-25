# 908 - AI Investment Platform

> Next-gen AI quantitative trading on Hyperliquid

## 🚀 Features

- **AI-Driven Strategies**: Machine learning-powered quantitative trading
- **Multi-Asset Support**: Crypto, Gold, and Mixed portfolios
- **Self-Custody**: No-KYC, decentralized access
- **Real-Time Analytics**: Live performance tracking and risk metrics
- **Web3 Integration**: Connect with MetaMask or any EVM wallet

## 📦 Tech Stack

### Frontend
- **Next.js 14** (App Router + Turbopack)
- **TypeScript**
- **Tailwind CSS** (Dark theme)
- **wagmi + viem** (Web3 integration)
- **React Query** (Data fetching)
- **Framer Motion** (Animations)
- **Lucide React** (Icons)

### Backend
- **Fastify** (Web framework)
- **Prisma** (ORM)
- **PostgreSQL** (Database)
- **Redis** (Cache)
- **JWT** (Authentication)
- **viem** (Signature verification)

## 🛠️ Development

### Prerequisites
- Node.js 22+
- PostgreSQL 16+
- Redis 7+

### Quick Start with Docker

```bash
# Start all services
docker-compose up -d

# Setup database
cd backend
npm run db:push
npm run db:seed
```

### Manual Setup

#### Frontend
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit: http://localhost:3000

#### Backend
```bash
cd backend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your settings

# Setup database
npm run db:push
npm run db:seed

# Run development server
npm run dev
```

API: http://localhost:3001

## 📂 Project Structure

```
908/
├── src/
│   ├── app/                 # Next.js pages
│   │   ├── page.tsx         # Home
│   │   ├── strategies/      # Strategy pages
│   │   └── dashboard/       # User dashboard
│   ├── components/
│   │   ├── ui/              # Base components
│   │   └── layout/          # Layout components
│   └── lib/                 # Utilities
│       ├── api.ts           # API client
│       ├── wagmi.ts         # Web3 config
│       └── utils.ts         # Helpers
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   │   ├── auth.ts      # Authentication
│   │   │   ├── strategies.ts # Strategies
│   │   │   └── positions.ts  # User positions
│   │   └── index.ts         # Server entry
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Seed data
│   └── Dockerfile           # Docker config
├── docker-compose.yml       # Docker Compose
└── public/                  # Static assets
```

## 🔐 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (backend/.env)
```env
DATABASE_URL=postgresql://mirror908:password@localhost:5432/mirror908
JWT_SECRET=your-secret-key-change-in-production
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
PORT=3001
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/nonce` - Get nonce for wallet
- `POST /api/auth/verify` - Verify signature & get JWT

### Strategies
- `GET /api/strategies` - List strategies (with filters)
- `GET /api/strategies/:id` - Get strategy details

### Positions (Authenticated)
- `GET /api/positions` - Get user positions
- `POST /api/positions` - Invest in strategy
- `POST /api/positions/:id/withdraw` - Withdraw funds

## 🚢 Deployment

### Frontend (Vercel)
```bash
# Build
npm run build

# Deploy
vercel deploy --prod
```

### Backend (Docker)
```bash
cd backend
docker build -t 908-backend .
docker run -p 3001:3001 --env-file .env 908-backend
```

### Full Stack (Docker Compose)
```bash
docker-compose up -d
```

## 🧪 Testing

### Frontend
```bash
npm run test
npm run lint
```

### Backend
```bash
cd backend
npm run test
npm run lint
```

## 📝 Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Make changes and test**
   ```bash
   npm run dev
   ```

3. **Commit with conventional commits**
   ```bash
   git commit -m "feat: add new feature"
   ```

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature
   ```

## 🏗️ Architecture

```
┌─────────────┐
│   Browser   │
│  (wagmi +   │
│   viem)     │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
┌──────▼──────┐ ┌───▼────────┐
│  Next.js    │ │  Fastify   │
│  Frontend   │ │  Backend   │
│  (Vercel)   │ │  (Docker)  │
└──────┬──────┘ └───┬────────┘
       │            │
       │      ┌─────▼─────┐
       │      │ PostgreSQL│
       │      │  (Prisma) │
       │      └───────────┘
       │
       │      ┌───────────┐
       └──────►  Wallet   │
              │ (MetaMask)│
              └───────────┘
```

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📝 License

MIT © TAKI Organization

---

**Built by Mirror AI** 💩

*人人可用的 AI 投资平台*
