# FastSewa Admin Frontend

A modern, responsive admin dashboard for managing FastSewa services.

## 📋 Project Structure

```
admin-frontend/
├── index.html                 # Main HTML file
├── css/
│   └── styles.css            # Complete stylesheet with responsive design
├── js/
│   ├── config.js             # Configuration and API helpers
│   ├── auth.js               # Authentication module
│   ├── dashboard.js          # Dashboard statistics
│   ├── announcements.js      # Announcements management
│   ├── bookings.js           # Bookings management
│   ├── registrations.js      # User registrations
│   ├── admin-management.js   # Admin requests approval
│   └── app.js                # Main application controller
└── README.md                 # This file
```

## ✨ Features

### Authentication

- **Admin Login**: Email and password authentication
- **Admin Signup**: Request admin access (awaiting approval)
- **Session Management**: JWT token-based authentication
- **Auto-logout**: Automatic logout on token expiration

### Dashboard

- **Real-time Statistics**: Live count of announcements, bookings, registrations, and admin users
- **Quick Overview**: Visual cards displaying key metrics
- **Data Refresh**: Auto-refresh every 30 seconds

### Announcements

- **Create Announcements**: Post new service announcements
- **Manage Status**: Mark announcements as active or inactive
- **Delete Announcements**: Remove outdated announcements
- **Timestamps**: Track when announcements were created

### Bookings

- **View All Bookings**: Complete list of service bookings
- **Update Status**: Change booking status (pending, confirmed, completed, cancelled)
- **Delete Bookings**: Remove bookings from the system
- **Export Data**: Download bookings as Excel or PDF

### Registrations

- **View User Registrations**: See all user sign-ups
- **Delete Registrations**: Remove registration records
- **Export Data**: Download registration data as Excel or PDF
- **Filtering**: View registration details and service interests

### Admin Management

- **Admin Requests**: View pending admin access requests
- **Approve Admins**: Grant admin privileges to approved users
- **Reject Requests**: Decline admin access requests
- **Approved Admins**: View list of approved administrators

## 🎨 Design Features

- **Modern UI**: Clean, professional interface with gradient backgrounds
- **Responsive Design**: Fully responsive on desktop, tablet, and mobile
- **Dark-friendly**: Easy on the eyes with thoughtful color scheme
- **Intuitive Navigation**: Clear menu structure and navigation flow
- **Real-time Feedback**: Toast notifications for user actions

## 🔧 Technical Details

### Technologies Used

- **HTML5**: Semantic markup with proper structure
- **CSS3**: Modern styling with variables and animations
- **JavaScript (Vanilla)**: Pure JavaScript without external dependencies
- **Fetch API**: Modern async data fetching
- **LocalStorage**: Client-side session management

### API Endpoints

The frontend communicates with the backend API at `http://localhost:4000/api`:

- **Authentication**

  - `POST /auth/login` - Admin login
  - `POST /auth/signup` - Admin signup
  - `GET /auth/admins` - Get all admins

- **Announcements**

  - `GET /announcements` - Fetch all announcements
  - `POST /announcements` - Create announcement
  - `DELETE /announcements/:id` - Delete announcement

- **Bookings**

  - `GET /bookings` - Fetch all bookings
  - `PUT /bookings/:id` - Update booking status
  - `DELETE /bookings/:id` - Delete booking
  - `GET /export/bookings/excel` - Export as Excel
  - `GET /export/bookings/pdf` - Export as PDF

- **Registrations**

  - `GET /registrations` - Fetch all registrations
  - `DELETE /registrations/:id` - Delete registration
  - `GET /export/registrations/excel` - Export as Excel
  - `GET /export/registrations/pdf` - Export as PDF

- **Admin Approval**
  - `GET /auth/admin-requests` - Get pending requests
  - `POST /auth/approve/:id` - Approve admin request
  - `POST /auth/reject/:id` - Reject admin request

## 🚀 Getting Started

### Prerequisites

- Backend server running on `http://localhost:4000`
- Modern web browser (Chrome, Firefox, Safari, Edge)
- No build tools required

### Setup

1. **Place files in web directory**: Ensure all files are in the `admin-frontend` folder
2. **Start backend server**: Run your Node.js backend
3. **Serve files**: Use a local web server:

   ```bash
   # Using Python 3
   python -m http.server 8000

   # Using Node.js (http-server)
   npx http-server
   ```

4. **Access admin panel**: Open `http://localhost:8000/admin-frontend/`

### Environment Configuration

Edit the API endpoint in `js/config.js` if your backend runs on a different address:

```javascript
const API_BASE = "http://your-api-url:port/api";
```

## 📱 Browser Support

- **Chrome/Edge**: Latest versions
- **Firefox**: Latest versions
- **Safari**: 14+
- **Mobile**: iOS Safari 12+, Chrome Android

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **CORS Headers**: Proper cross-origin resource sharing
- **XSS Prevention**: Template literals prevent injection
- **CSRF Protection**: Tokens included in request headers
- **Secure Storage**: Tokens stored in localStorage (consider sessionStorage for production)

## 📊 Data Export

### Excel Export

Click the "📊 Excel" button to download data in Excel format:

- Bookings export includes all booking details
- Registrations export includes user information

### PDF Export

Click the "📄 PDF" button to generate PDF reports:

- Professional formatting with headers and footers
- Print-ready output
- Suitable for archiving

## ⚙️ Configuration

### Auto-refresh Interval

Change the refresh rate in `js/app.js`:

```javascript
setInterval(() => loadSectionData(currentSection), 30000); // 30 seconds
```

### Color Customization

Modify colors in `css/styles.css`:

```css
:root {
  --primary-color: #3498db;
  --success-color: #27ae60;
  --danger-color: #e74c3c;
  /* ... more colors ... */
}
```

## 🐛 Troubleshooting

### Connection Issues

- **Error**: "Cannot reach API"
  - **Solution**: Ensure backend is running on `http://localhost:4000`
  - Check that CORS is enabled on the backend

### Authentication Issues

- **Error**: "Invalid credentials"

  - **Solution**: Verify email and password are correct
  - Check that admin account exists in the backend

- **Error**: "Token expired"
  - **Solution**: Login again to get a new token
  - Clear localStorage and refresh the page

### Data Not Loading

- **Solution**: Check browser console for API errors
- Verify all endpoint URLs match your backend
- Check network tab in DevTools for failed requests

## 📝 Logging

Enable detailed logging in `js/config.js`:

```javascript
log("Message here", "info");
```

Logging levels: 'info', 'warn', 'error', 'debug'

## 🎯 Development Tips

### Adding New Sections

1. Add HTML in `index.html`
2. Create new JS module in `js/`
3. Import in `js/app.js`
4. Add menu item and navigation handler

### Modifying Styles

- Use CSS variables for consistent theming
- Follow mobile-first responsive approach
- Test on multiple screen sizes

### API Integration

Use the `apiRequest()` function from `config.js`:

```javascript
const response = await apiRequest("/endpoint", {
  method: "POST",
  body: { data: "value" },
});
```

## 📚 Code Organization

- **config.js**: Centralized API and utility functions
- **auth.js**: Authentication logic
- **dashboard.js**: Statistics and metrics
- **announcements.js**: Announcement CRUD
- **bookings.js**: Booking management
- **registrations.js**: Registration management
- **admin-management.js**: Admin approval workflow
- **app.js**: Application orchestration and routing

## 🤝 Contributing

When modifying code:

1. Follow existing code style and patterns
2. Add comments for complex logic
3. Test on multiple browsers
4. Verify responsive design
5. Update documentation

## 📄 License

This project is part of the FastSewa platform.

## 🆘 Support

For issues or questions:

1. Check the troubleshooting section
2. Review browser console for errors
3. Check backend server status
4. Review API endpoint documentation

---

**Last Updated**: January 8, 2026
**Version**: 1.0.0
