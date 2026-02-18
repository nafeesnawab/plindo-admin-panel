# Plindo Backend API

Backend API for Plindo Admin Panel built with Node.js, Express, and MongoDB.

## Features

- RESTful API architecture
- JWT authentication
- MongoDB database with Mongoose ODM
- User management with role-based access control
- Security best practices (Helmet, CORS)
- Request logging with Morgan
- Environment-based configuration

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
   - Set your MongoDB URI
   - Set a secure JWT secret
   - Configure other environment variables as needed

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Health Check
- `GET /api/health` - Check API status

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── auth.controller.js   # Authentication logic
│   │   └── user.controller.js   # User management logic
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT verification & authorization
│   │   └── errorHandler.js      # Global error handler
│   ├── models/
│   │   └── User.model.js        # User schema
│   ├── routes/
│   │   ├── auth.routes.js       # Auth routes
│   │   └── user.routes.js       # User routes
│   └── server.js                # Express app setup
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment (development/production) | development |
| MONGODB_URI | MongoDB connection string | - |
| JWT_SECRET | Secret key for JWT | - |
| JWT_EXPIRE | JWT expiration time | 7d |
| CLIENT_URL | Frontend URL for CORS | http://localhost:5173 |

## Security

- Passwords are hashed using bcryptjs
- JWT tokens for authentication
- Helmet for security headers
- CORS configuration
- Input validation
- Role-based access control

## License

ISC
