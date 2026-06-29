# Overseas Management Backend

A secure, scalable RESTful API built with Node.js, Express, and TypeScript. This project features robust authentication using JWT stored in secure `HttpOnly` cookies, CSRF protection, request validation via Zod, and interactive API documentation with Swagger.

---

## File System Structure

Below is the layout of the project's source directory, detailing the responsibility of each newly added file:

```text
├── config/             # Global configurations
│   ├── db.ts           # Database connection pool setup and lifecycle management
│   └── swagger.ts      # Swagger UI and OpenAPI specifications setup
├── controllers/        # Request handlers (extracts data, calls services, sends responses)
│   ├── auth.controller.ts
│   └── user.controller.ts
├── middleware/         # Express intermediate functions
│   ├── authHandler.ts  # JWT verification and CSRF token validation
│   ├── roleHandler.ts  # Role-based access control (RBAC) authorization
│   └── validation.ts   # Generic Zod input validator
├── repository/         # Direct database queries and ORM interactions
│   └── user.repository.ts # Isolated SQL/ORM queries for the User model (e.g., findUserByEmailWithRole)
├── routes/             # API endpoint definitions and middleware chaining
│   ├── auth.routes.ts
│   └── user.routes.ts
├── schemas/            # Zod validation schemas and DTO type inferences
│   ├── auth.schema.ts
│   └── user.schema.ts
├── services/           # Core business logic
│   └── user.service.ts # Orchestrates data flows, password hashing, and token generation
├── types/              # Shared custom TypeScript interfaces and types
├── app.ts              # Express application setup and middleware pipeline
└── server.ts           # Application entry point (starts the HTTP server)
```

---

## Getting Started

1. Installation

 Open your terminal in the backend root folder, and install the required dependencies:

```bash
npm install
```

2. Environment Setup

Create a .env file in the backend root directory. This file stores your local credentials and secrets, so it is ignored by Git. Add the following variables:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/My_db
JWT_SECRET=your-secret-key-here
```

3. Running the Application

Development Mode (with Hot-Reload/Nodemon):

```bash
npm run dev
```
Production Build:

```bash
npm run build
npm start
```

---

## Security Architecture

This backend implements a modern, highly secure architecture designed to prevent common web vulnerabilities like XSS and CSRF:

- **XSS Protection (Session Security)**: Authentication tokens (JWT) are stored inside HttpOnly, Secure, SameSite=Lax cookies. Since they are marked as HttpOnly, they are completely invisible to client-side JavaScript, preventing hackers from stealing sessions via malicious scripts.
- **CSRF Protection (Double-Submit Cookie)**: To protect sensitive actions against Cross-Site Request Forgery, a random CSRF token is generated upon login. Unsafe HTTP methods (POST, PUT, DELETE) require the client to read this token from the browser cookies and send it back inside the X-XSRF-TOKEN HTTP request header. The server then validates if both values match.
- **CORS Policy**: Explicitly configured using the cors middleware with credentials: true. This setup strictly restricts API communication and cookie sharing to the authorized frontend origin (e.g., Angular on port 4200).


---

## Interactive API Documentation

Once the server is up and running, you can interactively explore and test all available endpoints using the embedded Swagger UI.

URL: http://localhost:3000/api-docs

