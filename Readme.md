# YouTube Backend

Built from scratch using **Node.js** and **Express**. This project replicates the essential features of YouTube, including user authentication, channel management, subscriptions, video management, and watch history. Designed as a learning and demonstration project, it focuses on backend logic and RESTful API development.

---

## 🚀 Features

- **User Authentication**
  - Register and login using email or username
  - Password encryption and JWT-based authentication
  - Secure session management using access and refresh tokens

- **Profile & Channel Management**
  - User profile creation with avatar and cover image uploads
  - Edit profile details (name, email, avatar, cover image)
  - Each user can have a channel (with subscriber/follow system)

- **Subscription System**
  - Subscribe/Unsubscribe to channels
  - View subscriber count and channels a user is subscribed to
  - Aggregated channel profile: shows subscribers, subscriptions, and status

- **Watch History**
  - Automatically tracks and retrieves user's watch history
  - Aggregates video and owner information for history items

- **RESTful API Design**
  - Organized routes for user, authentication, and channel management
  - Middleware for authentication and file uploads (using Multer)
  - Error handling and standardized API responses

- **Security**
  - Passwords hashed with bcrypt
  - JWT validation middleware
  - Secure cookie handling for tokens

- **Cloudinary Integration**
  - User avatars and cover images are uploaded and stored on Cloudinary

---
## 📖 Model Reference

- [Project Model Diagram](https://app.eraser.io/workspace/d3qru93jJt78aikxdClC?origin=share)

---

## 📁 Project Structure

```
src/
├── app.js                 # App setup and middleware configuration
├── controllers/           # Route handler logic (User, Auth, etc.)
├── models/                # Mongoose models (User, Subscription, Video)
├── routes/                # Express routes for API endpoints
├── middleware/            # JWT auth, file upload, error handling
└── utils/                 # Utility functions (Cloudinary, Response, etc.)
```

---

## 🛠️ Tech Stack

- **Node.js** & **Express** (Backend)
- **MongoDB** & **Mongoose** (Database & ODM)
- **JWT** (Authentication)
- **Multer** (File uploads)
- **Cloudinary** (Image storage)
- **bcrypt** (Password hashing)
- **Postman** (API testing)

---

## 📝 API Endpoints Overview

- `POST /api/v1/users/register` - Register new user (with avatar/cover image)
- `POST /api/v1/users/login` - Login user
- `POST /api/v1/users/logout` - Logout (JWT token invalidation)
- `POST /api/v1/users/refresh-token` - Refresh access token
- `GET /api/v1/users/current-user` - Get current logged-in user
- `PATCH /api/v1/users/update-account` - Update profile details
- `PATCH /api/v1/users/avatar` - Update user avatar
- `PATCH /api/v1/users/coverImage` - Update channel cover image
- `GET /api/v1/users/c/:username` - Get channel profile by username
- `GET /api/v1/users/history` - Get user's watch history

---

## 📦 Getting Started

### Prerequisites

- Node.js (v14+)
- MongoDB
- Cloudinary account (for image uploads)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/anmolp-03/Youtube-Clone.git
   cd Youtube-Clone
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (`.env`):
   - MongoDB URI
   - JWT secrets
   - Cloudinary credentials
   - CORS origin

4. Start the server:
   ```bash
   npm start
   ```

---

## 🧑 Author

**Anmol Panjwani**

