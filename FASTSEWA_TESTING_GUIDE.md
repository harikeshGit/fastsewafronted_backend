# FastSewa Role-Based Authentication & Admin Dashboard - Testing Guide

## 🎯 System Overview

FastSewa is a service booking web application with **User** and **Admin** roles:

- **Users**: Regular customers/service providers who can book services
- **Admins**: Dashboard administrators who can manage all bookings and user data

---

## 📋 Project Structure

```
fastsewafrontedapp/
├── index.html (Main website home)
├── login.html (Unified login for users & admins)
├── signup.html (Signup with role selection)
├── admin-dashboard.html (Admin-only dashboard)
├── js/
│   ├── login.js (Login form handler)
│   ├── signup.js (Signup form handler)
│   └── admin-dashboard.js (Dashboard handler with auth checks)
└── css/
    └── auth.css (Auth pages styling)

admin-backend/
├── src/
│   ├── server.js (Express server)
│   ├── models/
│   │   ├── User.js (Regular user schema with role)
│   │   └── Admin.js (Admin schema with approval workflow)
│   ├── routes/
│   │   ├── auth.js (Login, signup, user list endpoints)
│   │   ├── bookings.js (Booking CRUD)
│   │   ├── registrations.js (Registration management)
│   │   └── exports.js (Excel/PDF exports)
│   └── middleware/
│       └── auth.js (JWT authentication & token generation)
├── .env (MongoDB URI, JWT secret, admin credentials)
└── seed.js (Initialize first admin account)
```

---

## 🔧 Setup Instructions

### 1. **Backend Setup**

```bash
cd admin-backend

# Install dependencies
npm install

# Configure MongoDB Atlas in .env
# MONGODB_URI=mongodb+srv://fastsewa:fastsewa%40123@cluster0.z1rcuwm.mongodb.net/?appName=Cluster0
# ADMIN_USERNAME=admin
# ADMIN_PASSWORD=admin@123
# JWT_SECRET=your-secret-key-change-in-production

# Seed first admin account
node seed.js

# Start backend server (port 4000)
npm run dev
```

### 2. **Frontend Setup**

```bash
# Start Python HTTP server for frontend (port 8080)
cd fastsewafrontedapp
python -m http.server 8080
```

---

## 🧪 Testing Scenarios

### **Test Case 1: Regular User Signup & Login**

#### Signup:

1. Open `http://localhost:8080/signup.html`
2. Fill form:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `testuser@gmail.com`
   - Password: `user123`
   - Confirm Password: `user123`
   - Role: `User (Service Seeker/Provider)` ✅ **(Select this)**
   - User Type: `Customer`
3. Click **Sign Up**
4. ✅ Expected: Auto-login and redirect to home page (`index.html`)
5. Verify `localStorage`:
   ```javascript
   localStorage.getItem("fastsewaUser"); // Should have role: 'user'
   localStorage.getItem("fastsewaToken"); // JWT token
   ```

#### Login:

1. Open `http://localhost:8080/login.html`
2. Enter:
   - Email: `testuser@gmail.com`
   - Password: `user123`
3. Click **Sign In**
4. ✅ Expected: Redirect to home page (`index.html`) with greeting message
5. Verify role in localStorage is `'user'`

---

### **Test Case 2: Admin Signup & Approval**

#### Signup Request:

1. Open `http://localhost:8080/signup.html`
2. Fill form:
   - First Name: `Jane`
   - Last Name: `Doe`
   - Email: `admin2@example.com`
   - Password: `admin123`
   - Confirm Password: `admin123`
   - Role: `Admin (Requires Approval)` ✅ **(Select this)**
3. Click **Sign Up**
4. ✅ Expected: Alert message "Admin signup request submitted. Awaiting approval."
5. Redirect to login page

#### Admin Approval (Using Existing Admin):

1. Admin1 logs in with credentials:
   - Email: `admin` (or use MongoDB to find admin email)
   - Password: `admin@123`
2. Navigate to admin panel
3. Go to **Admin Management** tab
4. Find pending admin2 request
5. Click **Approve**
6. ✅ Expected: Admin2 status changes to "Approved"

#### Admin Login:

1. Admin2 logs in with:
   - Email: `admin2@example.com`
   - Password: `admin123`
2. ✅ Expected: Redirect to `admin-dashboard.html`
3. Verify role in localStorage is `'admin'`

---

### **Test Case 3: Admin Dashboard Access Control**

#### Non-Admin Access Attempt:

1. Login as regular user (from Test Case 1)
2. Manually navigate to: `http://localhost:8080/admin-dashboard.html`
3. ✅ Expected: Alert "🚫 Access Denied: Admin only area"
4. ✅ Redirect to home page (`index.html`)

#### Admin Access:

1. Login as admin (from Test Case 2)
2. You're automatically redirected to `admin-dashboard.html`
3. ✅ Dashboard loads with:
   - Admin name in header
   - 3 stat cards (Bookings, Users, Registrations)
   - Tab navigation (Bookings, Users, Registrations)

---

### **Test Case 4: View All Users**

1. Login as admin
2. Click **Users** tab
3. ✅ Expected: Table displays all registered users with:
   - Name (First + Last)
   - Email
   - User Type (customer/provider/vendor)
   - Status (Active/Inactive)
   - Join Date

#### Test Data:

- User1: testuser@gmail.com (Customer, Active)
- User2: Create more users for testing

---

### **Test Case 5: View All Bookings**

1. Login as admin
2. Click **Bookings** tab (default view)
3. ✅ Expected: Table shows all bookings with:
   - Service name
   - Customer name
   - Phone number
   - Booking date
   - Status badge (pending/completed/cancelled)

#### Note:

- If no bookings exist, show "No bookings yet" message
- Table is populated from MongoDB Booking collection

---

### **Test Case 6: View All Registrations**

1. Login as admin
2. Click **Registrations** tab
3. ✅ Expected: Table shows all service provider registrations with:
   - Provider name
   - Email
   - Phone
   - Service type
   - Registration date

---

### **Test Case 7: Export Bookings to Excel**

1. Login as admin
2. Go to **Bookings** tab
3. Click **Export Excel** button
4. ✅ Expected:
   - Download file: `fastsewa-bookings-[timestamp].xlsx`
   - File contains table with columns: Service, Customer, Phone, Date, Status
   - Alert: "✅ Bookings exported successfully!"

#### Verify Excel:

- Open file in Excel/Google Sheets
- Check data matches the dashboard table

---

### **Test Case 8: Export Bookings to PDF**

1. Login as admin
2. Go to **Bookings** tab
3. Click **Export PDF** button
4. ✅ Expected:
   - Download file: `fastsewa-bookings-[timestamp].pdf`
   - Alert: "✅ Bookings exported successfully!"

#### Verify PDF:

- Open PDF and verify table content matches dashboard

---

### **Test Case 9: Export Users to Excel**

1. Login as admin
2. Go to **Users** tab
3. Click **Export Excel** button
4. ✅ Expected:
   - Download file: `fastsewa-users-[timestamp].xlsx`
   - Columns: Name, Email, User Type, Status, Joined

---

### **Test Case 10: Export Users to PDF**

1. Login as admin
2. Go to **Users** tab
3. Click **Export PDF** button
4. ✅ Expected:
   - Download file: `fastsewa-users-[timestamp].pdf`

---

### **Test Case 11: JWT Token Expiration**

1. Login as user/admin
2. Check token in localStorage
3. Wait for 24 hours OR manually test by:
   ```javascript
   // In browser console
   localStorage.removeItem("fastsewaToken");
   // Refresh page or try to access admin dashboard
   ```
4. ✅ Expected: "⚠️ Please login first" → Redirect to login

---

### **Test Case 12: Invalid Credentials**

#### Wrong Password:

1. Open `http://localhost:8080/login.html`
2. Enter correct email but wrong password
3. ✅ Expected: Alert "❌ Invalid credentials"
4. ✅ Stay on login page

#### Non-existent Email:

1. Enter email that doesn't exist in database
2. ✅ Expected: Alert "❌ Invalid credentials or account not active"

---

### **Test Case 13: Password Mismatch on Signup**

1. Open signup.html
2. Enter different passwords in "Password" and "Confirm Password"
3. Click Sign Up
4. ✅ Expected: Alert "❌ Passwords do not match!"

---

### **Test Case 14: Logout Functionality**

1. Login as admin
2. Click **Logout** button (top-right)
3. ✅ Expected:
   - localStorage cleared
   - Redirect to login page
   - localStorage.getItem('fastsewaUser') returns null

---

## 🛠️ API Endpoints Reference

### **Authentication**

- **POST** `/api/auth/login`

  - Body: `{ email, password }`
  - Response: `{ token, user: { role, name, email, userType } }`

- **POST** `/api/auth/signup`

  - Body: `{ firstName, lastName, email, password, confirmPassword, role, userType }`
  - Response: `{ token, user: {...}, message }`

- **GET** `/api/auth/users` (Admin only)
  - Headers: `Authorization: Bearer {token}`
  - Response: Array of all users

---

### **Bookings (Admin only)**

- **GET** `/api/bookings`
  - Headers: `Authorization: Bearer {token}`
  - Response: Array of all bookings

---

### **Registrations (Admin only)**

- **GET** `/api/registrations`
  - Headers: `Authorization: Bearer {token}`
  - Response: Array of all service provider registrations

---

### **Exports (Admin only)**

- **GET** `/api/export/bookings/excel`

  - Headers: `Authorization: Bearer {token}`
  - Response: Excel file (.xlsx)

- **GET** `/api/export/bookings/pdf`

  - Headers: `Authorization: Bearer {token}`
  - Response: PDF file (.pdf)

- **GET** `/api/export/registrations/excel`

  - Headers: `Authorization: Bearer {token}`
  - Response: Excel file (.xlsx)

- **GET** `/api/export/registrations/pdf`
  - Headers: `Authorization: Bearer {token}`
  - Response: PDF file (.pdf)

---

## 🔐 Security Features Implemented

✅ **JWT Authentication**

- Tokens expire in 24 hours
- Tokens stored in localStorage on client
- Sent as `Authorization: Bearer {token}` header

✅ **Password Hashing**

- bcrypt with 10 rounds salt
- Passwords never stored in plain text

✅ **Role-Based Access Control**

- Admin-only endpoints check `role` field
- Frontend redirects non-admin users
- Backend rejects unauthorized requests (403)

✅ **Frontend Route Guards**

- `admin-dashboard.html` checks localStorage role
- Non-admin access → redirect to login or home

✅ **Admin Approval Workflow**

- New admin signups marked as `pending`
- Existing admin must approve before login
- Status field: `pending`, `approved`, `rejected`

---

## 📊 Database Schemas

### **User Collection**

```javascript
{
  _id: ObjectId,
  firstName: String,
  lastName: String,
  email: String (unique),
  password: String (hashed),
  role: 'user' | 'admin',
  userType: 'customer' | 'provider' | 'vendor',
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### **Admin Collection**

```javascript
{
  _id: ObjectId,
  username: String,
  email: String (unique),
  password: String (hashed),
  status: 'pending' | 'approved' | 'rejected',
  approvedBy: ObjectId (admin who approved),
  approvedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### **Booking Collection**

```javascript
{
  _id: ObjectId,
  serviceName: String,
  customerName: String,
  phone: String,
  status: String,
  createdAt: Date,
  updatedAt: Date
}
```

### **Registration Collection**

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  serviceType: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🐛 Common Issues & Solutions

### **Issue**: "MongoDB connected" but login fails

**Solution**: Check `.env` file has correct `MONGODB_URI` with encoded password (`%40` for `@`)

### **Issue**: CORS error on login

**Solution**: Backend should have `cors: { origin: '*' }` configured

### **Issue**: Token not being sent to backend

**Solution**: Check `js/admin-dashboard.js` line: `Authorization: Bearer ${authToken}`

### **Issue**: Admin dashboard shows "Loading..." forever

**Solution**:

- Check browser console for errors (F12 → Console)
- Verify JWT token is valid: `localStorage.getItem('fastsewaToken')`
- Check backend logs for 401/403 errors

### **Issue**: Export buttons do nothing

**Solution**: Verify backend has `exceljs` and `pdfkit` installed:

```bash
npm install exceljs pdfkit
```

---

## ✅ Completion Checklist

- [ ] Backend running on port 4000
- [ ] Frontend running on port 8080
- [ ] MongoDB Atlas connection working
- [ ] First admin account seeded
- [ ] User signup and auto-login working
- [ ] Admin signup with approval workflow working
- [ ] Admin dashboard accessible only to admins
- [ ] All three tabs (Bookings, Users, Registrations) loading data
- [ ] Excel exports downloading
- [ ] PDF exports downloading
- [ ] Logout clearing localStorage and redirecting
- [ ] JWT token validation working
- [ ] Non-admin users blocked from admin pages

---

## 📧 Support

If issues persist:

1. Check backend logs: `npm run dev`
2. Check frontend console: F12 → Console tab
3. Verify MongoDB connection: Check `.env` file
4. Test API directly: Use Postman or curl
5. Review error messages carefully - they indicate the exact issue
