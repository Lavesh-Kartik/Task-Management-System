# 🚀 TaskFlow — Full-Stack Task Management System

A production-ready task management system seamlessly blending elements of Trello and Notion, built with React, Node.js, PostgreSQL (via Supabase), Supabase Realtime, and JWT authentication.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react) ![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=flat&logo=node.js) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat&logo=tailwindcss) ![Supabase](https://img.shields.io/badge/Supabase-Realtime-3ECF8E?style=flat&logo=supabase)

---

## 🏗️ System Design

### High-Level Architecture
Our system follows a decoupled Client-Server architecture utilizing a modern stack. The React frontend communicates with the Node.js API backend via standard REST workflows, while leveraging Supabase for database integration and real-time WebSocket broadcasting.

```text
+-------------------+       REST API over HTTPS      +------------------------+
|                   |  --------------------------->  |                        |
|  React Frontend   |                                |  Node.js / Express     |
|  (Vercel)         |  <---------------------------  |  Backend API Server    |
|                   |           JSON Data            |  (Render)              |
+---------+---------+                                +-----------+------------+
          ^                                                      |
          | WebSockets                                           | DB Queries
          | (Real-time events)                                   | (supabase-js)
          v                                                      v
+-----------------------------------------------------------------------------+
|                                  SUPABASE                                   |
|  +--------------------+                               +------------------+  |
|  | Realtime Server    | <--- Triggers DB Events ----- | PostgreSQL DB    |  |
|  +--------------------+                               +------------------+  |
+-----------------------------------------------------------------------------+
```

### Database Schema (ER Diagram)
The relational flow inside our PostgreSQL database uses standard primary/foreign key relationships (UUIDs).

```text
       [ USERS ] 1 ------------------------- * [ TASKS ]
       - id (UUID) PK                            - id (UUID) PK
       - name (String)                           - title (String)
       - email (String)                          - status (String)
       - password_hash (String)                  - priority (String)
       - role (String)                           - creator_id (UUID) FK
                                                         |
                                                         | 1
             +-------------------------------------------+-----------------------------------------+
           * |                                                                                   | *
[ COMMENTS ]                                                                     [ ACTIVITY_LOGS ]
- id (UUID) PK                                                                   - id (UUID) PK
- task_id (UUID) FK                                                              - task_id (UUID) FK
- user_id (UUID) FK >--* [ USERS ]                                               - user_id (UUID) FK >--* [ USERS ]
- content (Text)                                                                 - action (String)
```

---

## 🧩 Architectural & Design Patterns Used

### 1. **Model-View-Controller (MVC) Pattern Adaptation (Backend)**
We structured the Express backend to cleanly separate concerns around a database-first model:
- **Database Client** (`/config`): Supabase initialization to interface with the PostgreSQL tables.
- **Controllers** (`/controllers`): Business logic handling request payloads, executing SQL queries via `supabase-js`, enforcing rules, and formatting returning JSON.
- **Routes (Views)** (`/routes`): API mapping connecting HTTP request methods to specific controller functions.

### 2. **Provider / Context Pattern (Frontend)**
We eliminated "prop drilling" and centralized state by utilizing React's Context API to wrap our application tree:
- `AuthContext`: Manages global user authentication state and JWT session persistence.
- `TaskContext`: Manages global task lists, kanban updates, filters, and stateful caching.
- `NotificationContext`: Subscribes to Supabase Realtime and globally distributes toast notifications and unread counts upon new events.

### 3. **Middleware Pattern (Backend & Frontend)**
- **Backend**: Express middleware (`auth.middleware.js`) acts as an interceptor. It evaluates requests to verify JWT tokens and checks `admin` privileges before allowing execution of protected controllers.
- **Frontend**: Protected Route components act as visual middleware, halting render trees and redirecting unauthenticated users to the login screen.

### 4. **Observer / Pub-Sub Pattern (Real-Time)**
Our real-time notification engine relies on a publish-subscribe (Pub/Sub) model supported by Supabase. When the backend application executes a mutation (e.g., assigning a user to a task), Supabase's Database Webhooks trigger WebSocket events that publish directly to all subscribed frontend clients.

### 5. **Custom Hook Pattern (Frontend)**
We extracted complex API REST fetching and internal state lifecycle logic into customized React hooks (e.g., `useTask`, `useAuth`). This ensures our React UI components remain clean, reusable, and focused strictly on the presentation layer.

---

## 📁 Project Structure

```
PROJECTS/
├── taskmanager-backend/          # Node.js + Express REST API
│   ├── src/
│   │   ├── config/db.js          # Supabase Client connection
│   │   ├── controllers/          # Route controllers (Supabase logic)
│   │   ├── middleware/           # JWT & Error handlers
│   │   ├── routes/               # API Router
│   │   └── utils/                # Auth & Activity log utilities
│   ├── .env                      # Local environment variables
│   └── server.js                 # Express entry point
│
└── taskmanager-frontend/         # React + Vite + Tailwind
    ├── src/
    │   ├── api/index.js          # Axios API service layer interceptors
    │   ├── components/           # Reusable UI/Layout components
    │   ├── context/              # React Context Providers
    │   ├── lib/                  # External clients (Supabase Realtime)
    │   ├── pages/                # Main Application Views
    │   └── App.jsx               # Root Component
    ├── .env                      # VITE public variables
    └── vite.config.js            # Build Settings
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- Active Supabase Project (PostgreSQL + Realtime module)

### 1. Backend Server
Ensure your backend `.env` has the necessary Supabase credentials before booting.

```bash
cd taskmanager-backend
npm install
npm run dev             # Server boots on http://localhost:5001
```

### 2. Frontend Client
Ensure your frontend `.env` is connected to your local backend and has the public Supabase Anon key.

```bash
cd taskmanager-frontend
npm install
npm run dev             # Client boots on http://localhost:5173
```

---

## 🔌 REST API Reference

### Authentication
| Method | Endpoint             | Description              | Auth |
|--------|---------------------|--------------------------|------|
| POST   | `/api/auth/register` | Register new user        | No   |
| POST   | `/api/auth/login`    | Login, gets JWT session  | No   |
| GET    | `/api/auth/me`       | Get current user block   | JWT  |
| PATCH  | `/api/auth/profile`  | Update account avatar    | JWT  |

### Tasks & Activities
| Method | Endpoint                          | Description             | Auth   |
|--------|----------------------------------|-------------------------|--------|
| GET    | `/api/tasks`                     | List tasks (filterable) | JWT    |
| POST   | `/api/tasks`                     | Create task             | JWT    |
| GET    | `/api/tasks/:id`                 | Get task detail         | JWT    |
| PATCH  | `/api/tasks/:id`                 | Update task             | JWT    |
| DELETE | `/api/tasks/:id`                 | Delete task             | JWT    |
| GET    | `/api/tasks/:id/comments`        | Get comments            | JWT    |
| POST   | `/api/tasks/:id/comments`        | Add comment             | JWT    |
| GET    | `/api/tasks/:id/activity`        | Get native activity logs| JWT    |

### Users (Admin Panel Only)
| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| GET    | `/api/users`          | List all users     |
| PATCH  | `/api/users/:id/role` | Update user role   |
| DELETE | `/api/users/:id`      | Remove user        |

### Notifications
| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | `/api/notifications`            | Get my web notifications |
| PATCH  | `/api/notifications/read-all`   | Mark all as read         |

---

## ✅ Features

### Core
- [x] JWT authentication with secure session handling
- [x] Role-based access mapping (Admin / Member access control)
- [x] Interactive Kanban board with drag-and-drop state persistence
- [x] Comprehensive Task metrics & analytics Dashboard
- [x] Seamless Task CRUD operations with rich metadata
- [x] Activity tracking & audit logging per task
- [x] Built-in Real-time Notification engine powered by Supabase WebSockets
- [x] Deep filtering & search across task status and priorities

### UI/UX
- [x] Modern, clean dark/light semantic UI (Trello/Notion inspired)
- [x] Stable, table-like layout rendering across active lists to prevent shift
- [x] Advanced micro-interactions (Status sliding reveals, hover states)
- [x] Native toast notifications & animated pop-over modal dialogs

---

## 🔑 Environment Variables Structure

### Backend (`taskmanager-backend/.env`)
```env
PORT=5001
SUPABASE_URL=https://<YOUR_PROJECT_ID>.supabase.co
SUPABASE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Frontend (`taskmanager-frontend/.env`)
```env
VITE_API_URL=http://localhost:5001/api
VITE_SUPABASE_URL=https://<YOUR_PROJECT_ID>.supabase.co
VITE_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
```

---

## 🌐 Deployment Guide (Production)

### 1. Database (Supabase)
Deploying the database requires setting up a free project on Supabase:
1. Head to [Supabase](https://supabase.com) and create a new project.
2. Under **Project Settings > API**, copy your `Project URL`, the `anon` public key, and the `service_role` secret key.
3. Use the Supabase SQL editor to run your table creation queries for Tasks, Users, Comments, etc.

### 2. Backend (Render.com)
The Node/Express API runs perfectly on Render:
1. Create a free **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository and point the root directory to `taskmanager-backend`.
3. Set the **Build Command** to `npm install`.
4. Set the **Start Command** to `node server.js` (or `npm start`).
5. In the **Environment Variables** section, add the required backend vars:
   - `PORT` = `5001` (or whatever Render assigns)
   - `SUPABASE_URL` = *(Your Supabase Project URL)*
   - `SUPABASE_KEY` = *(Your Supabase `service_role` key)*
   - `JWT_SECRET` = *(A strong secret string you create)*
   - `JWT_EXPIRE` = `7d`
   - `NODE_ENV` = `production`
   - `CLIENT_URL` = *(For now, put a dummy URL like `https://temp.com`. You will update this after deploying the frontend!)*

### 3. Frontend (Vercel.com)
Vite + React apps deploy seamlessly onto Vercel:
1. Import your GitHub repository to [Vercel](https://vercel.com) and select the `taskmanager-frontend` folder as the root.
2. Vercel will automatically detect the Vite preset. 
3. In **Environment Variables**, add:
   - `VITE_API_URL` = `https://<YOUR-RENDER-BACKEND-URL>.onrender.com/api`
   - `VITE_SUPABASE_URL` = *(Your Supabase Project URL)*
   - `VITE_SUPABASE_ANON_KEY` = *(Your Supabase `anon` key)*
4. Click **Deploy**.

### 4. Finalize Configuration
1. Go back to your **Render Backend configuration** and update the `CLIENT_URL` to equal your new Vercel production deployment URL (e.g., `https://my-taskflow.vercel.app`). This ensures the backend CORS policy accepts your frontend's REST API requests!
2. Congratulations, your app is fully live! 🎉
