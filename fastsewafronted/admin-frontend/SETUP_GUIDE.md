# FastSewa Admin - Complete Setup & Troubleshooting Guide

## 🚀 Quick Start

### Prerequisites

- Node.js and npm installed
- MongoDB running (local or Atlas connection)
- Python 3 (for local web server)
- Google Chrome or any modern browser

### Step 1: Start the Backend

```powershell
cd "C:\Users\harik\OneDrive\Documents\New folder (2)\New folder\admin-backend"
npm install
npm run dev
```

Expected output:

```
Admin backend running on port 4000
MongoDB connected
```

### Step 2: Start the Frontend Server

```powershell
cd "C:\Users\harik\OneDrive\Documents\New folder (2)\New folder\fastsewafrontedapp"
python -m http.server 8000
```

Expected output:

```
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```

### Step 3: Access the Admin Dashboard

Open in Chrome: `http://localhost:8000/admin-frontend/`

---

## 🔍 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Admin Frontend                       │
│  (HTML + CSS + JavaScript at localhost:8000)            │
│                                                         │
│  ├─ Login/Signup (auth.js)                             │
│  ├─ Dashboard (dashboard.js)                           │
│  ├─ Announcements (announcements.js)                   │
│  ├─ Bookings (bookings.js)                             │
│  ├─ Registrations (registrations.js)                   │
│  └─ Admin Management (admin-management.js)             │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP Requests to API
                       ▼
┌──────────────────────────────────────────────────────────┐
│              Backend API (Node.js)                       │
│     (Running on localhost:4000 with JWT auth)            │
│                                                          │
│  ├─ /api/auth/login                                    │
│  ├─ /api/auth/admin-signup                             │
│  ├─ /api/announcements (CRUD)                          │
│  ├─ /api/bookings (CRUD)                               │
│  ├─ /api/registrations (CRUD)                          │
│  └─ /api/auth/admins, /requests, /approve              │
└──────────────────────┬───────────────────────────────────┘
                       │ Queries & Updates
                       ▼
         ┌─────────────────────────┐
         │   MongoDB Database      │
         │   (Collections:         │
         │   - admins              │
         │   - users               │
         │   - announcements       │
         │   - bookings            │
         │   - registrations)      │
         └─────────────────────────┘
```

---

## 🔐 Authentication Flow

### Login Process

```
1. User enters email & password
   ↓
2. Frontend sends POST /api/auth/login
   ↓
3. Backend verifies credentials against Admin collection
   ↓
4. If valid → Generate JWT token, return to frontend
   ↓
5. Frontend stores token in localStorage
   ↓
6. Show admin dashboard with user info
```

### Admin Signup Process

```
1. User clicks "Request Access" & fills form
   ↓
2. Frontend sends POST /api/auth/admin-signup
   ↓
3. Backend creates "pending" admin record in database
   ↓
4. Existing admin approves/rejects the request
   ↓
5. When approved, user can login normally
```

---

## 🧪 Connection Testing

### Test the Connection

Open: `http://localhost:8000/admin-frontend/test-connection.html`

This page will:

- ✓ Check if backend is running
- ✓ Test API endpoints
- ✓ Show diagnostic information
- ✓ Display real-time logs

### Manual API Testing (Using Browser Console)

```javascript
// Test health check
fetch("http://localhost:4000/api/health")
  .then((r) => r.json())
  .then((d) => console.log("Health:", d))
  .catch((e) => console.error("Error:", e));

// Test login
fetch("http://localhost:4000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@test.com",
    password: "password123",
  }),
})
  .then((r) => r.json())
  .then((d) => console.log("Login:", d))
  .catch((e) => console.error("Error:", e));
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Cannot reach API" Error

**Symptoms:** Login fails, data doesn't load

**Solutions:**

1. Verify backend is running: `npm run dev` in admin-backend folder
2. Check port 4000 is not blocked: `netstat -ano | findstr :4000`
3. Check MongoDB connection in backend logs
4. Verify API_BASE in js/config.js is correct: `http://localhost:4000/api`

### Issue 2: Login Returns 401 "Invalid Credentials"

**Symptoms:** Login form shows error, credentials seem correct

**Solutions:**

1. Ensure admin account exists in MongoDB with status: "approved"
2. Check password is correct (case-sensitive)
3. Verify admin email is in Admin collection, not User collection
4. Check backend console for detailed error messages

### Issue 3: "Failed to Fetch" Error

**Symptoms:** All API calls fail with "Failed to Fetch"

**Solutions:**

1. Check CORS is enabled on backend (it should be by default)
2. Verify frontend and backend are on same machine
3. Check network tab in browser DevTools for actual error
4. Ensure Content-Type headers are correct (application/json)

### Issue 4: Token Expired Error

**Symptoms:** Works initially, then suddenly shows "401 Unauthorized"

**Solutions:**

1. Login again to get a fresh token
2. Clear localStorage and refresh the page
3. Check token expiration time in backend (jwt.sign options)

### Issue 5: Announcements/Bookings Not Loading

**Symptoms:** Dashboard shows 0 items, empty tables

**Solutions:**

1. Check if data exists in MongoDB database
2. Verify user has admin privileges
3. Check network requests in DevTools (F12 → Network tab)
4. Look for API error responses in console

---

## 🔧 Configuration

### Backend Configuration (.env)

Located: `admin-backend/.env`

```env
MONGODB_URI=mongodb://localhost:27017/fastsewa
PORT=4000
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### Frontend Configuration (js/config.js)

```javascript
const API_BASE = "http://localhost:4000/api";
```

If backend is on different server:

```javascript
const API_BASE = "http://192.168.1.100:4000/api";
```

---

## 📊 Database Setup

### Create Initial Admin Account

Run in MongoDB:

```javascript
db.admins.insertOne({
  username: "admin_user",
  email: "admin@test.com",
  password: "hashed_password_here",
  status: "approved",
  createdAt: new Date(),
});
```

Or use the seed script:

```powershell
cd admin-backend
node seed.js
```

---

## 🎯 API Endpoints Reference

### Authentication

- `POST /api/auth/login` - Login (returns JWT token)
- `POST /api/auth/admin-signup` - Request admin access
- `GET /api/auth/admins` - Get all approved admins (requires auth)
- `GET /api/auth/requests` - Get pending admin requests (requires auth)
- `POST /api/auth/approve/:id` - Approve admin request (requires auth)
- `POST /api/auth/reject/:id` - Reject admin request (requires auth)

### Announcements

- `GET /api/announcements` - Get all announcements
- `POST /api/announcements` - Create announcement
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

### Bookings

- `GET /api/bookings` - Get all bookings (requires auth)
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking status
- `DELETE /api/bookings/:id` - Delete booking (requires auth)

### Registrations

- `GET /api/registrations` - Get all registrations (requires auth)
- `POST /api/registrations` - Create registration
- `DELETE /api/registrations/:id` - Delete registration (requires auth)

### Data Export

- `GET /api/export/bookings/excel` - Export bookings as Excel
- `GET /api/export/bookings/pdf` - Export bookings as PDF
- `GET /api/export/registrations/excel` - Export registrations as Excel
- `GET /api/export/registrations/pdf` - Export registrations as PDF

---

## 🐛 Debugging Tips

### Enable Console Logging

Open DevTools: Press `F12` → Go to Console tab

You'll see:

- `[API] GET /api/announcements` - API calls being made
- `[API Error] Cannot reach API server` - Connection errors
- `[API Success]` - Successful responses

### Check Network Requests

1. Press `F12` → Go to Network tab
2. Reload page
3. Filter by XHR (XMLHttpRequest) to see API calls
4. Click on request to see headers, body, response

### Backend Debugging

Backend logs are printed to console:

```
Login attempt for: admin@test.com
User found: { id: 123..., email: admin@test.com, role: admin }
Password match result: true
```

---

## ✅ Testing Checklist

- [ ] Backend is running on port 4000
- [ ] MongoDB is connected
- [ ] Frontend server is running on port 8000
- [ ] Can access admin login page
- [ ] Connection test page shows all endpoints working
- [ ] Can login with valid admin credentials
- [ ] Dashboard loads and shows statistics
- [ ] Can view announcements
- [ ] Can create new announcement
- [ ] Can view bookings
- [ ] Can view registrations
- [ ] Can view admin requests
- [ ] Can approve/reject admin requests
- [ ] Export functionality works (Excel/PDF)

---

## 🚀 Production Deployment Notes

For production deployment:

1. Use environment variables for sensitive data
2. Enable HTTPS (use reverse proxy like nginx)
3. Set proper JWT expiration
4. Use secure cookie storage instead of localStorage
5. Enable rate limiting on API endpoints
6. Set up proper error logging and monitoring
7. Use database backups
8. Deploy backend and frontend on different servers
9. Use content delivery network (CDN) for static files
10. Implement proper access control and permissions

---

## 📞 Support Resources

- Check browser console (F12) for JavaScript errors
- Check backend terminal for server errors
- Review MongoDB logs for database issues
- Test endpoints using Postman or curl
- Check network requests in DevTools

---

**Last Updated:** January 8, 2026  
**Status:** ✓ Complete Setup Ready
