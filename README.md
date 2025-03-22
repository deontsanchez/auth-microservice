# Authentication Microservice (TypeScript)

A standalone authentication microservice built with TypeScript, Node.js, MongoDB, and RabbitMQ. This service provides all necessary authentication and user management functionality and can be integrated with other microservices.

## Features

- User registration and login
- JWT-based authentication with refresh tokens
- Role-based access control (user/admin)
- User management (CRUD operations)
- Event publishing with RabbitMQ (for inter-service communication)
- Full TypeScript implementation with strong typing

## Technologies

- TypeScript
- Node.js & Express
- MongoDB with Mongoose ODM
- RabbitMQ for messaging
- JWT for authentication
- Jest for testing

## Getting Started

### Prerequisites

- Node.js
- TypeScript
- MongoDB
- RabbitMQ

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
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
MONGODB_URI=mongodb://localhost:27017/auth-service
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1d
RABBITMQ_URL=amqp://localhost:5672
NODE_ENV=development
SESSION_SECRET=your_session_secret_key_here
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

## Example Usage in Code

### Middleware Usage Example

```typescript
// Authentication middleware
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

Using arrow function syntax:

```typescript
// Authentication middleware with arrow function
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
```

### Service Example

```typescript
// User service with arrow functions
const createUser = async userData => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const user = await User.create({
    ...userData,
    password: hashedPassword,
  });
  return user;
};

const findUserById = async id => {
  return await User.findById(id).select('-password');
};
```

## RabbitMQ Events

The service publishes the following events:

- `user.created` - When a new user is registered
- `user.updated` - When a user is updated
- `user.deleted` - When a user is deleted
- `user.login` - When a user logs in
- `user.logout` - When a user logs out

### Event Publisher Example

```typescript
// RabbitMQ publisher with arrow function
const publishEvent = async (exchange, routingKey, message) => {
  try {
    const connection = await amqplib.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(exchange, 'topic', { durable: true });
    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));

    await channel.close();
    await connection.close();
  } catch (error) {
    console.error('Error publishing event:', error);
  }
};
```

## License

MIT
