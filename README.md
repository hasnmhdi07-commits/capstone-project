# 🏠 House Rental Platform

A full-stack MERN house rental application where tenants can browse and wishlist properties, owners can manage listings and read tenant messages, and admins can moderate reported listings.

---

## 📁 Project Structure

```
house-rental/
├── backend/          # Express + MongoDB API
└── frontend/         # React + Tailwind CSS
```

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env     # Fill in your values
npm run dev              # Starts on http://localhost:5000
```

**Required `.env` values:**
- `MONGO_URI` — Your MongoDB connection string (MongoDB Atlas or local)
- `JWT_SECRET` — Any long random string
- `ALLOWED_ORIGIN` — `http://localhost:3000`

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env     # Fill in your values
npm start                # Starts on http://localhost:3000
```

**Required `.env` values:**
- `REACT_APP_API_URL` — `http://localhost:5000/api`
- `REACT_APP_BASE_URL` — `http://localhost:5000`

---

## 🌐 Deployment Guide

### Backend — Deploy to Railway / Render / Heroku

1. Push the `backend/` folder to a Git repo
2. Connect to Railway / Render
3. Set environment variables:
   ```
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=your_long_secret
   ALLOWED_ORIGIN=https://your-frontend.vercel.app
   NODE_ENV=production
   ```
4. Set start command: `npm start`

> ⚠️ **Note on file uploads:** Services like Railway/Render use ephemeral filesystems — uploaded images are lost on restart. For production, use **Cloudinary** or **AWS S3** instead of storing files locally.

### Frontend — Deploy to Vercel / Netlify

1. Push the `frontend/` folder to a Git repo
2. Connect to Vercel / Netlify
3. Set environment variables:
   ```
   REACT_APP_API_URL=https://your-backend.railway.app/api
   REACT_APP_BASE_URL=https://your-backend.railway.app
   ```
4. Build command: `npm run build`
5. Output directory: `build`

**For Vercel — add a `vercel.json` to the frontend root to handle React Router:**
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

**For Netlify — add a `_redirects` file in `public/`:**
```
/*  /index.html  200
```

---

## 👤 User Roles

| Role | Capabilities |
|------|-------------|
| **Tenant (user)** | Browse houses, filter, wishlist, contact owner, report listing |
| **Owner** | All of the above + create/edit/delete listings, toggle availability, read messages |
| **Admin** | View reported listings, delete reported houses |

> ⚠️ **Admin accounts cannot be self-registered.** Create admin accounts directly in MongoDB:
> ```js
> db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
> ```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Tailwind CSS, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken), bcryptjs |
| File Upload | Multer |

---

## 📦 Key Features

- 🔐 JWT authentication with auto-logout on token expiry
- 🔒 Role-based route protection (PrivateRoute component)
- 🏠 House listings with images, filtering by location/rent/rooms
- ⭐ Wishlist (favourites) with persistent state
- ✉️ Tenant → Owner messaging system
- 🚩 Report listings (tenant) → Admin review → Delete
- 📱 Fully responsive with mobile navbar
- 🚀 Production-ready with env variable support for all URLs
