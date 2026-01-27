# Socially - Project Documentation

## 1. Project Overview
**Socially** is a campus-centric social media platform designed to connect students across different campuses, batches, and branches. It features a rich user interface, secure authentication, and robust features like targeted posts, feed filtering, and interactive engagement (likes, comments).

---

## 2. Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL (using `mysql2` driver)
- **Authentication**: JWT (JSON Web Tokens)
- **File Uploads**: Multer (Local storage)

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (v6)
- **State Management**: React Context API
- **HTTP Client**: Axios & Fetch API
- **Icons**: Lucide React
- **Animations**: Framer Motion

---

## 3. Backend Architecture (`/backend`)

The backend is structured using the **MVC (Model-View-Controller)** pattern.

### 3.1 Configuration (`src/config`)
- **`db.js`**: Establishes a connection pool to the MySQL database. It creates a scalable connection handler that efficiently manages multiple concurrent requests.
- **`env.js`**: Centralized configuration file that loads environment variables (port, db credentials, jwt secret) from `.env` using `dotenv`.

### 3.2 Core Files (`src`)
- **`server.js`**: The entry point of the application. It starts the Express server and listens on the configured port.
- **`app.js`**: Configures the Express application. It sets up middlewares (CORS, JSON parsing), serves static files (uploads), and mounts all API routes.

### 3.3 Middlewares (`src/middlewares`)
- **`auth.middleware.js`**: Protects routes by verifying the JWT token sent in the `Authorization` header. It attaches the decoded user info to the `req` object.
- **`error.middleware.js`**: A global error handling middleware that captures errors from anywhere in the app and sends a standardized JSON error response.
- **`upload.middleware.js`**: Configures `multer` for handling file uploads. It defines storage paths for avatars and post images and validates file types (images only).

### 3.4 Features (Controllers & Routes)

#### Authentication (`auth`)
- **Controller (`auth.controller.js`)**:
  - `register`: Creates a new user with hashed password.
  - `login`: Authenticates user and returns a JWT token.
  - `getMe`: Fetches the currently logged-in user's details.
  - `updateMe`: Updates user profile (bio, campus, etc.) and handles avatar uploads.
- **Routes (`auth.routes.js`)**: Endpoints for `/register`, `/login`, `/me`.

#### Users (`user`)
- **Controller (`user.controller.js`)**:
  - `getUserProfile`: Fetches public profile details of any user by their ID.
- **Routes (`user.routes.js`)**: Endpoint for `/users/:id`.

#### Posts (`post`)
- **Controller (`post.controller.js`)**:
  - `createPost`: Creates a new post. Handles image uploads and "Target Audience" logic (visibility across specific batches, campuses, or branches).
  - `getFeed`: Fetches the news feed. Uses **cursor-based pagination** for performance. Implements complex filtering to show posts based on visibility settings (Public vs. Campus) and user matching (e.g., a student only sees posts targeted to their batch/campus).
  - `getUserPosts`: Fetches all posts belonging to a specific user.
- **Routes (`post.routes.js`)**: Endpoints for creating posts and fetching feeds.

#### Comments (`comment`)
- **Controller (`comment.controller.js`)**:
  - `addComment`: Adds a comment to a post.
  - `getComments`: Retrieves all comments for a specific post.
- **Routes (`comment.routes.js`)**: Endpoints for `/comments/:postId`.

#### Likes (`like`)
- **Controller (`like.controller.js`)**:
  - `toggleLike`: Handles liking and unliking a post. Uses database constraints to handle duplicates efficiently.
- **Routes (`like.routes.js`)**: Endpoint for `/likes/:postId`.

#### Reports (`report`)
- **Controller (`report.controller.js`)**: Allows users to report inappropriate posts.
- **Routes (`report.routes.js`)**: Endpoint for `/reports/:postId`.

### 3.5 Utilities (`scripts`)
- **`migrate_v3.js`**: Database migration scripts used to update the schema (e.g., modifying column types) without losing data.

---

## 4. Frontend Architecture (`/src`)

The frontend is a Single Page Application (SPA) built with React.

### 4.1 Core Setup
- **`main.jsx`**: The entry point that mounts the React app to the DOM.
- **`App.jsx`**: Sets up the application routes (`/login`, `/feed`, `/profile`) and wraps the app with Context Providers (`AuthProvider`, `PostProvider`).

### 4.2 State Management (`src/context`)
- **`AuthContext.jsx`**: Manages global authentication state.
  - Handles Login/Logout logic.
  - Automatically attaches the JWT token to every Axios request.
  - Persists user session using `localStorage`.
- **`PostContext.jsx`**: Manages the state of the Social Feed.
  - `fetchFeed`: Loads posts from the backend and formats them for display.
  - `createPost`: Handles sending new post data (including images) to the API.
  - `toggleLike` & `addComment`: Implements **Optimistic UI Updates** (updates the UI immediately before the server responds) for a snappy user experience.

### 4.3 Components (`src/components`)
- **`Navbar.jsx`**: The top navigation bar. Includes navigation tabs, search bar, notification icons, and the user profile dropdown.
- **`Sidebar.jsx`**: The left-hand side navigation menu. Provides quick links to Feed, Events, Saved items, etc.
- **`Rightbar.jsx`**: The right-hand side panel. Displays "Trending Hashtags" and upcoming "Campus Events".
- **`PostCard.jsx`**: A reusable component to display a single post.
  - Shows author info, content, and image.
  - Contains interactive buttons for Like, Comment, and Share.
  - Renders the comments section when expanded.
- **`CreatePostModal.jsx`**: A pop-up modal for creating content.
  - Supports text and image uploads.
  - **Advanced Visibility**: Allows users to target specific groups (e.g., "Only 2024 Batch" or "Only Bengaluru Campus").
- **`ProtectedRoute.jsx`**: A wrapper component that redirects unauthenticated users to the Login page.

### 4.4 Pages (`src/pages`)
- **`Login.jsx`**: A dual-purpose page for Login and Registration. Features a dynamic layout with animations.
- **`Feed.jsx`**: The main landing page after login. It assembles the `Navbar`, `Sidebar`, `Feed` (Post List), and `Rightbar` into a responsive 3-column layout.
- **`Profile.jsx`**: Displays user profiles.
  - Shows user details (Avatar, Bio, Batch, Campus).
  - Displays the user's post history.
  - If viewing your own profile, it switches to "Edit Mode" allowing you to update your details and avatar.

---

## 5. Database Schema (`schema.sql`)

- **`users`**: Stores user credentials, profile info, and role.
- **`posts`**: Stores content, image URLs, and visibility settings (JSON columns for target audiences).
- **`comments`**: Stores comments linked to posts and users.
- **`likes`**: Stores likes. Uses a composite primary key `(post_id, user_id)` to ensure a user can only like a post once.
- **`reports`**: Stores moderation reports against posts.
