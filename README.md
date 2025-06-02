# Youtube Clone Backend

A scalable, production-ready backend for a Youtube-like application, built with **Node.js** and **Express.js**. This backend handles user authentication, video management, comments, likes, and more, using a modular, industry-standard project structure. It is designed for extensibility and maintainability.

---

## Features

- **User Authentication** (JWT-based, Access/Refresh Tokens)
- **Video Upload & Streaming** (with Cloudinary integration)
- **User Profiles**
- **Subscriptions**
- **Likes & Comments**
- **Role-based Access Control**
- **RESTful API structure**
- **CORS Support**
- **Environment-based configuration**
- **Production-ready folder structure**

---

## Project Structure

```
.
├── public/                 # Static files
├── src/
│   ├── app.js              # App configuration (Express, Middleware setup)
│   ├── constants.js        # Project-wide constants
│   ├── controllers/        # Business logic for each domain (user, video, etc.)
│   ├── db/                 # Database connection and initialization
│   ├── index.js            # Entry point (server startup)
│   ├── middleware/         # Custom middlewares (auth, error handling, etc.)
│   ├── models/             # Mongoose schemas/models
│   ├── routes/             # Route definitions for the API
│   └── utils/              # Utility/helper functions
├── .env                    # Environment variables (not committed)
├── package.json            # Project metadata, scripts, dependencies
└── README.md               # Project documentation
```

---

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/anmolp-03/Youtube-Clone.git
   cd Youtube-Clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**

   - Copy the `.env` example below and fill in your secrets:
     ```
     PORT=
     MONGODB_URL=
     CORS_ORIGIN=
     ACCESS_TOKEN_SECRET=
     ACCESS_TOKEN_EXPIRY=
     REFRESH_TOKEN_SECRET=
     REFRESH_TOKEN_EXPIRY=
     CLOUDINARY_CLOUD_NAME=
     CLOUDINARY_API_KEY=
     CLOUDINARY_API_SECRET=
     ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

---

## Environment Variables

| Variable                | Description                                      |
|-------------------------|--------------------------------------------------|
| `PORT`                  | Port number for the server                       |
| `MONGODB_URL`           | MongoDB connection string                        |
| `CORS_ORIGIN`           | Allowed CORS origins (comma-separated, if many)  |
| `ACCESS_TOKEN_SECRET`   | JWT secret for access tokens                     |
| `ACCESS_TOKEN_EXPIRY`   | Expiry for access tokens (e.g., 15m)             |
| `REFRESH_TOKEN_SECRET`  | JWT secret for refresh tokens                    |
| `REFRESH_TOKEN_EXPIRY`  | Expiry for refresh tokens (e.g., 7d)             |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name for video/image storage    |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                               |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                            |

---

## Scripts

| Command         | Description                             |
|-----------------|-----------------------------------------|
| `npm run dev`   | Start the server in development mode    |

---

## API Overview

All API endpoints are prefixed by `/api/v1/` (or as defined in your route configuration).

- **Auth**: Register, Login, Refresh, Logout
- **User**: Profile, Update, Subscriptions
- **Video**: Upload, List, Stream, Like/Dislike
- **Comments**: Add, List, Delete

> _For detailed endpoints, see the routes in [`src/routes/`](./src/routes) and controllers in [`src/controllers/`](./src/controllers)._

---

## Dependencies

Some of the main dependencies used in this project:

- **express**: Web framework for Node.js
- **mongoose**: MongoDB ORM
- **jsonwebtoken**: JWT authentication
- **cookie-parser**: Cookie support
- **cloudinary**: Image/video hosting
- **cors**: Cross-Origin Resource Sharing
- **dotenv**: Environment variable management
- **bcrypt**: Password hashing
- **multer**: File uploads

> _See [`package.json`](./package.json) for a complete list._

---

## Development and Production

- Use `npm run dev` for development (with nodemon and environment separation).
- All sensitive configuration is managed via `.env`.
- Folder structure separates concerns (controllers, models, routes, middleware, utils).
- Cloudinary integration for media storage.
- MongoDB for database operations.

