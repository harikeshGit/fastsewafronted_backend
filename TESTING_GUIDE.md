# FastSewa Admin Panel - Testing Guide

## ✅ System Status

- **Backend**: Running on http://localhost:4000
- **Database**: MongoDB Atlas Connected ✓
- **Admin Panel**: Open in Chrome
- **Live Website**: Open in Chrome

---

## 🔐 Admin Login

**Default Credentials:**

- Username: `admin`
- Password: `admin@123`

**Login Screen:**

1. Open admin panel in Chrome
2. Enter username and password
3. Click **Login**

---

## 📢 Tab 1: Announcements

### Create Announcement

1. In admin panel, stay on "Announcements" tab
2. Fill in:
   - **Title**: e.g., "🎉 Welcome to FastSewa"
   - **Message**: e.g., "We're excited to serve you!"
   - **Active**: Check the checkbox (default is checked)
3. Click **Create**

### Check on Live Website

1. Go to live website tab
2. You should see a banner at the top with the announcement
3. Click the **×** button to dismiss it

---

## 📅 Tab 2: Bookings

### Test Booking Creation (Public)

Use this to simulate a client booking:

```bash
curl -X POST http://localhost:4000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "John Doe",
    "service": "Construction",
    "phone": "9876543210",
    "email": "john@example.com",
    "description": "Need renovation"
  }'
```

### In Admin Panel

1. Go to **Bookings** tab
2. You'll see the booking in the table
3. Click on **Status** dropdown to change from `pending` → `confirmed` → `completed`
4. Click **Delete** to remove booking

### Download Bookings

1. Click **📊 Download Excel** to get `.xlsx` file
2. Click **📄 Download PDF** to get `.pdf` file

---

## 👥 Tab 3: Registrations

### Test Registration Creation (Public)

```bash
curl -X POST http://localhost:4000/api/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "9876543211",
    "address": "123 Main St",
    "serviceInterest": "Security Services"
  }'
```

### In Admin Panel

1. Go to **Registrations** tab
2. View all registered users
3. Click **Delete** to remove registration

### Download Registrations

1. Click **📊 Download Excel** to get `.xlsx` file
2. Click **📄 Download PDF** to get `.pdf` file

---

## 🧪 Full Test Flow

### Step 1: Create Announcement

- Admin Panel → Announcements → Create announcement → Check it appears on live site

### Step 2: Create Booking

- Run the booking curl command above
- Admin Panel → Bookings → See the booking
- Change status to "confirmed"
- Download Excel/PDF

### Step 3: Create Registration

- Run the registration curl command above
- Admin Panel → Registrations → See the registration
- Download Excel/PDF

### Step 4: Logout & Login Again

- Admin Panel → Click **Logout**
- Login screen appears
- Enter credentials and login again

---

## 🔍 Expected Behavior

✅ **Admin Login**

- Invalid credentials → Error message
- Valid credentials → Dashboard loads

✅ **Announcements**

- Create announcement → Appears in list and on live site immediately
- Banner shows on live website

✅ **Bookings**

- Booking created → Appears in admin panel
- Status dropdown works
- Excel/PDF download works

✅ **Registrations**

- Registration created → Appears in admin panel
- Excel/PDF download works

✅ **JWT Token**

- Token is saved in browser localStorage as `adminToken`
- Without token, can't access secured endpoints

---

## 📁 Download Files

**Excel files** will be saved to your Downloads folder:

- `bookings.xlsx` - Contains all booking records
- `registrations.xlsx` - Contains all registration records

**PDF files** will be saved to your Downloads folder:

- `bookings.pdf` - Formatted PDF with booking details
- `registrations.pdf` - Formatted PDF with registration details

---

## 🐛 Troubleshooting

| Issue                           | Solution                                                 |
| ------------------------------- | -------------------------------------------------------- |
| Admin panel blank               | Clear browser cache, reload page, check DevTools console |
| Can't download files            | Check if browser blocks pop-ups, check Downloads folder  |
| Backend not responding          | Verify terminal shows "MongoDB connected"                |
| Banner not showing on live site | Open live site in new tab, refresh page                  |
| Login fails                     | Check credentials: admin / admin@123                     |

---

## 🚀 API Reference

All endpoints require `Authorization: Bearer {token}` header except noted:

| Method | Endpoint                        | Auth | Description                  |
| ------ | ------------------------------- | ---- | ---------------------------- |
| POST   | /api/auth/login                 | No   | Get JWT token                |
| GET    | /api/announcements              | No   | List announcements           |
| POST   | /api/announcements              | No   | Create announcement          |
| GET    | /api/bookings                   | Yes  | List bookings                |
| POST   | /api/bookings                   | No   | Create booking               |
| PUT    | /api/bookings/:id               | Yes  | Update booking status        |
| DELETE | /api/bookings/:id               | Yes  | Delete booking               |
| GET    | /api/registrations              | Yes  | List registrations           |
| POST   | /api/registrations              | No   | Create registration          |
| DELETE | /api/registrations/:id          | Yes  | Delete registration          |
| GET    | /api/export/bookings/excel      | Yes  | Download bookings Excel      |
| GET    | /api/export/bookings/pdf        | Yes  | Download bookings PDF        |
| GET    | /api/export/registrations/excel | Yes  | Download registrations Excel |
| GET    | /api/export/registrations/pdf   | Yes  | Download registrations PDF   |

---

## 📱 Browser Console Tips

In Chrome, press `F12` to open DevTools and check:

- **Console**: Any JavaScript errors
- **Network**: API requests and responses
- **Storage**: Check `adminToken` in localStorage
