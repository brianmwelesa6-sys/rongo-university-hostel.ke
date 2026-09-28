# Rongo University Student Hostels

A student accommodation website for Rongo University with:

- home page and hostel listing
- hostel booking form
- student login page
- admin dashboard for booking approvals
- contact and about pages

## Project structure

- `index.html` — landing page
- `styles.css` — styling
- `script.js` — homepage interaction logic
- `server.js` — Express server and API endpoints
- `public/` — static pages for about, contact, login, and admin views
- `data/` — JSON fallback storage for bookings and users
- `database/schema.sql` — MySQL schema for production-ready storage
- `.env.example` — sample MySQL connection settings

## Run locally

1. Install Node.js if it is not already available.
2. Install dependencies:

```bash
npm install
```

3. Create a MySQL database and update your environment values:

```bash
copy .env.example .env
```

Then fill in your local MySQL credentials in `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=hostel_db
PORT=3000
```

4. Start the server:

```bash
npm start
```

5. Open:

```text
http://localhost:3000
```

## Demo login credentials

Student:
- Email: student@rongouniversity.ac.ke
- Password: student123

Admin:
- Email: admin@rongouniversity.ac.ke
- Password: admin123

## Notes

The app now supports MySQL when database settings are provided. If the MySQL connection is unavailable or not configured, the app automatically falls back to JSON files in the `data/` folder so the website still works locally.
