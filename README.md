# Authentication Microservice (TypeScript)

A standalone authentication microservice built with TypeScript, Node.js, MongoDB, and RabbitMQ. This service provides all necessary authentication and user management functionality and can be integrated with other microservices.

## Features

- User registration and login
- JWT-based authentication with refresh tokens
- Role-based access control (user/admin)
- User management (CRUD operations)
- Event publishing with RabbitMQ (for inter-service communication)
- Docker and docker-compose for easy deployment
- Full TypeScript implementation with strong typing

## Technologies

- TypeScript
- Node.js & Express
- MongoDB with Mongoose ODM
- RabbitMQ for messaging
- JWT for authentication
- Docker for containerization
- Jest for testing

## Getting Started

### Prerequisites

- Docker and docker-compose
- Node.js (for local development)
- TypeScript

### Installation

1. Clone the repository
2. Run with docker-compose:

```bash
docker-compose up -d
```

For development with hot reload:

```bash
docker-compose up auth-dev
```

For local development:

```bash
npm install
npm run dev     # Runs ts-node directly
# or
npm run watch   # Runs with nodemon for auto-reload
```

### Build

To compile TypeScript to JavaScript:

```bash
npm run build
```

## Environment Variables

Create a `.env` file with the following variables:

```
PORT=3000
MONGODB_URI=mongodb://mongo:27017/auth-service
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d
RABBITMQ_URL=amqp://rabbitmq:5672
NODE_ENV=development
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user

  - Request: `{ "name": "John Doe", "email": "john@example.com", "password": "password123" }`
  - Response: `{ "success": true, "accessToken": "...", "refreshToken": "...", "user": {...} }`

- `POST /api/auth/login` - Login

  - Request: `{ "email": "john@example.com", "password": "password123" }`
  - Response: `{ "success": true, "accessToken": "...", "refreshToken": "...", "user": {...} }`

- `POST /api/auth/refresh-token` - Refresh access token

  - Request: `{ "refreshToken": "..." }`
  - Response: `{ "success": true, "accessToken": "..." }`

- `POST /api/auth/logout` - Logout (invalidate refresh token)

  - Request: `{ "refreshToken": "..." }`
  - Response: `{ "success": true, "message": "Successfully logged out" }`

- `GET /api/auth/me` - Get current user profile
  - Headers: `Authorization: Bearer <access_token>`
  - Response: `{ "success": true, "user": {...} }`

### User Management (Admin only)

- `GET /api/users` - Get all users

  - Headers: `Authorization: Bearer <access_token>`
  - Response: `{ "success": true, "count": 10, "users": [...] }`

- `GET /api/users/:id` - Get user by ID

  - Headers: `Authorization: Bearer <access_token>`
  - Response: `{ "success": true, "user": {...} }`

- `PUT /api/users/:id` - Update user

  - Headers: `Authorization: Bearer <access_token>`
  - Request: `{ "name": "Updated Name", "role": "admin", "isActive": true }`
  - Response: `{ "success": true, "user": {...} }`

- `DELETE /api/users/:id` - Delete user
  - Headers: `Authorization: Bearer <access_token>`
  - Response: `{ "success": true, "message": "User deleted successfully" }`

## Testing

Run tests with:

```bash
npm test
```

## TypeScript Type Definitions

The project includes comprehensive type definitions for:

- User and Token models
- JWT payloads
- Request and response objects
- Controller return types
- RabbitMQ messages

## RabbitMQ Events

The service publishes the following events:

- `user.created` - When a new user is registered
- `user.updated` - When a user is updated
- `user.deleted` - When a user is deleted
- `user.login` - When a user logs in
- `user.logout` - When a user logs out

## License

MIT
