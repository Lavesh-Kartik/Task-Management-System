# 🚀 TaskFlow — Full-Stack Task Management System

A production-ready task management system inspired by Trello and Notion, built with React, Node.js, MongoDB, and JWT authentication.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react) ![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=flat&logo=node.js) ![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat&logo=mongodb) ![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat&logo=tailwindcss)

---

## 📁 Project Structure

```
PROJECTS/
├── taskmanager-backend/          # Node.js + Express REST API
│   ├── src/
│   │   ├── config/db.js          # MongoDB connection
│   │   ├── controllers/          # Route controllers
│   │   │   ├── auth.controller.js
│   │   │   ├── task.controller.js
│   │   │   ├── user.controller.js
│   │   │   └── notification.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # JWT verification
│   │   │   └── error.middleware.js  # Global error handler
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Task.js
│   │   │   ├── Comment.js
│   │   │   └── Notification.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── task.routes.js
│   │   │   ├── user.routes.js
│   │   │   └── notification.routes.js
│   │   └── utils/
│   │       ├── generateToken.js
│   │       └── notification.js
│   ├── seed.js                   # Sample data seeder
│   ├── server.js                 # Express entry point
│   ├── .env                      # Local environment variables
│   └── .env.example              # Template for deployment
│
└── taskmanager-frontend/         # React + Vite + Tailwind
    ├── src/
    │   ├── api/index.js          # Axios API service layer
    │   ├── components/
    │   │   ├── board/            # Kanban board components
    │   │   ├── layout/           # Navbar, Sidebar, AppLayout
    │   │   └── tasks/            # Task modals and cards
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── TaskContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx     # Stats + recent tasks
    │   │   ├── Board.jsx         # Kanban board with DnD
    │   │   ├── Tasks.jsx         # List view with filters
    │   │   ├── Admin.jsx         # User management (admin only)
    │   │   └── Profile.jsx       # User settings
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env                      # VITE_API_URL
    └── vite.config.js
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas URI)

### 1. Backend

```bash
cd taskmanager-backend
npm install
cp .env.example .env    # Edit MONGO_URI and JWT_SECRET
npm run dev             # http://localhost:5000
```

### 2. Seed Sample Data (Optional)

```bash
cd taskmanager-backend
npm run seed
```

**Test accounts created by seed:**
| Role   | Email                  | Password    |
|--------|------------------------|-------------|
| Admin  | alice@taskflow.com     | password123 |
| Member | bob@taskflow.com       | password123 |
| Member | carol@taskflow.com     | password123 |
| Member | dave@taskflow.com      | password123 |

### 3. Frontend

```bash
cd taskmanager-frontend
npm install
npm run dev             # http://localhost:5173
```

> The `vite.config.js` proxies `/api/*` requests to `localhost:5000` automatically.

---

## 🔌 REST API Reference

### Authentication
| Method | Endpoint             | Description              | Auth |
|--------|---------------------|--------------------------|------|
| POST   | `/api/auth/register` | Register new user        | No   |
| POST   | `/api/auth/login`    | Login, get JWT token     | No   |
| GET    | `/api/auth/me`       | Get current user         | JWT  |
| PATCH  | `/api/auth/profile`  | Update name/avatar       | JWT  |

### Tasks
| Method | Endpoint                          | Description           | Auth   |
|--------|----------------------------------|-----------------------|--------|
| GET    | `/api/tasks`                     | List tasks (filterable)| JWT   |
| POST   | `/api/tasks`                     | Create task           | JWT    |
| GET    | `/api/tasks/:id`                 | Get task detail       | JWT    |
| PATCH  | `/api/tasks/:id`                 | Update task           | JWT    |
| DELETE | `/api/tasks/:id`                 | Delete task           | JWT    |
| GET    | `/api/tasks/:id/comments`        | Get comments          | JWT    |
| POST   | `/api/tasks/:id/comments`        | Add comment           | JWT    |
| DELETE | `/api/tasks/:id/comments/:cmtId` | Delete comment        | JWT    |

**Query params for GET /api/tasks:**
- `status=todo|in_progress|done`
- `priority=low|medium|high`
- `search=keyword`
- `sort=createdAt|deadline|priority`

### Users (Admin only)
| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| GET    | `/api/users`          | List all users     |
| PATCH  | `/api/users/:id/role` | Update user role   |
| DELETE | `/api/users/:id`      | Remove user        |

### Notifications
| Method | Endpoint                        | Description              |
|--------|---------------------------------|--------------------------|
| GET    | `/api/notifications`            | Get my notifications     |
| PATCH  | `/api/notifications/read-all`   | Mark all as read         |
| PATCH  | `/api/notifications/:id/read`   | Mark one as read         |
| DELETE | `/api/notifications/:id`        | Delete notification      |

---

## 🌐 Deployment

### Backend → Render

1. Push `taskmanager-backend/` to a GitHub repo
2. Create a new **Web Service** on [Render](https://render.com)
3. Set **Start Command**: `npm start`
4. Set **Environment Variables**:
   ```
   MONGO_URI = mongodb+srv://user:pass@cluster.mongodb.net/taskmanager
   JWT_SECRET = your_super_secret_key_32_chars_min
   JWT_EXPIRE = 7d
   NODE_ENV = production
   CLIENT_URL = https://your-frontend.vercel.app
   ```

### Frontend → Vercel

1. Push `taskmanager-frontend/` to a GitHub repo
2. Import project on [Vercel](https://vercel.com)
3. Set **Environment Variable**:
   ```
   VITE_API_URL = https://your-backend.onrender.com/api
   ```
4. Deploy!

### Database → MongoDB Atlas

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Under **Database Access** → create user with password
3. Under **Network Access** → Allow access from anywhere (`0.0.0.0/0`)
4. Copy the **Connection String** and replace `MONGO_URI` in your backend env

---

## ✅ Features

### Core
- [x] JWT authentication with refresh on load
- [x] User signup / login / logout
- [x] Role-based access (admin / member)
- [x] Dashboard with stats and progress bar
- [x] Kanban board with drag-and-drop
- [x] Task CRUD with title, description, status, priority, deadline, labels, assignees
- [x] Task detail view with full metadata
- [x] Comments on tasks (add/delete)
- [x] Search and filter tasks (status, priority, sort)
- [x] Notifications (real-time poll every 30s)
- [x] Admin panel for user management

### UI/UX
- [x] Dark mode design (Trello/Notion inspired)
- [x] Responsive layout
- [x] Smooth animations and transitions
- [x] Toast notifications
- [x] Loading states
- [x] Overdue task highlighting

---

## 🔑 Environment Variables

### Backend (`.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5000/api
```
