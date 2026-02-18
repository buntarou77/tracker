# 💰 Finance Tracker

A personal app for tracking finances, planning budgets, and analyzing spending.

## 🚀 Features

- 📊 Expense and income analytics
- 🎯 Budget planning with categories
- 💳 Bank account management
- 📈 Data visualization with charts
- 🔐 Secure authentication

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript
- **Styling:** Tailwind CSS
- **Charts:** Chart.js, react-chartjs-2
- **Database:** MongoDB
- **Auth:** JWT, bcryptjs

## 🚀 Quick Start

### Option 1: With Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd my-next
   ```

2. **Start databases**
   ```bash
   docker-compose up -d
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Run the app**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

### Option 2: Local Setup

1. **Install MongoDB**
- MongoDB: https://docs.mongodb.com/manual/installation/

2. **Start the service**
   ```bash
   # MongoDB
   mongod
   ```

3. **Install dependencies and run the app**
   ```bash
   npm install
   npm run dev
   ```

## ⚙️ Configuration

The app uses centralized configuration in `lib/config.ts`. You can adjust database and app settings there.

### Environment variables (optional)

Create `.env.local` to override defaults:

```bash
# Copy the example
cp env.example .env.local

# Edit .env.local
```

### Available variables
- `MONGODB_URI` - MongoDB connection URI
- `MONGODB_DB_NAME` - Database name
- `COLLECTION_NAME` - Collection name
- `JWT_SECRET` - Secret for JWT tokens
- `NEXT_PUBLIC_BASE_URL` - App base URL

## 🗄️ Database

### MongoDB
- **Database:** `users` (default)
- **Collection:** `users` (default)

### User document structure:
```json
{
  "user": "username",
  "email": "user@example.com",
  "password_hash": "hashed_password",
  "banks": [...],
  "plans": [...],
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

## 📁 Project Structure

```
src/
├── app/
│   ├── api/          # API routes
│   ├── components/   # React components
│   ├── context/      # React Context
│   ├── hooks/        # Custom hooks
│   ├── utils/        # Utilities
│   └── ...
lib/
├── config.ts         # Centralized config
└── ...
```

## 🤝 Development

```bash
# Start in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## 📝 License

MIT License
