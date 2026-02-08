# Socially Backend API

A clean, scalable Node.js + Express backend foundation for the Socially campus platform.

## 📂 Project Structure

```
backend/
│── src/
│   ├── config/        # Environment & DB setup
│   ├── middlewares/   # Error handling, Auth, etc.
│   ├── controllers/   # Logic for handling requests
│   ├── routes/        # API route definitions
│   ├── app.js         # Express app config
│   └── server.js      # Server entry point
```

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update details:
```bash
cp .env.example .env
```
Update `DB_USER`, `DB_PASSWORD`, `DB_NAME` in `.env`.

### 3. Run Development Server
```bash
npm run dev
```
Server runs on http://localhost:5000 (default).

### 4. Verify Health
Check if the API is running:
[http://localhost:5000/api/health](http://localhost:5000/api/health)
