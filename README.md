# Plindo Admin Panel

Full-stack admin panel application with React frontend and Node.js backend.

## Project Structure

```
plindo-admin-panel/
├── client/          # React + Vite frontend
├── backend/         # Node.js + Express + MongoDB backend
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or bun package manager

### Installation

1. Clone the repository
2. Set up the backend:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI and other configurations
   npm run dev
   ```

3. Set up the client:
   ```bash
   cd client
   bun install
   bun run dev
   ```

### Running the Application

**Backend** (runs on port 5000):
```bash
cd backend
npm run dev
```

**Frontend** (runs on port 5173):
```bash
cd client
bun run dev
```

## Features

### Backend
- RESTful API with Express.js
- MongoDB database with Mongoose
- JWT authentication
- Role-based access control
- Security middleware (Helmet, CORS)
- Request logging

### Frontend
- Modern React with TypeScript
- Vite for fast development
- TailwindCSS for styling
- Component library integration
- Responsive design

## API Documentation

See `backend/README.md` for detailed API documentation.

## License

ISC
