const express = require('express');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const BOOKINGS_PATH = path.join(DATA_DIR, 'bookings.json');
const USERS_PATH = path.join(DATA_DIR, 'users.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const DEFAULT_USERS = [
  {
    id: 1,
    name: 'Mary Otieno',
    username: 'student@rongouniversity.ac.ke',
    password: 'student123',
    role: 'student'
  },
  {
    id: 2,
    name: 'Accommodation Office',
    username: 'admin@rongouniversity.ac.ke',
    password: 'admin123',
    role: 'admin'
  }
];

let mysqlPool = null;

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(BOOKINGS_PATH)) {
    fs.writeFileSync(BOOKINGS_PATH, JSON.stringify([], null, 2));
  }

  if (!fs.existsSync(USERS_PATH)) {
    fs.writeFileSync(USERS_PATH, JSON.stringify(DEFAULT_USERS, null, 2));
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    return [];
  }
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function getBookings() {
  return readJson(BOOKINGS_PATH);
}

function getUsers() {
  return readJson(USERS_PATH);
}

function getDatabaseConfig() {
  const hasAnyDbSetting = Boolean(
    process.env.DB_HOST ||
    process.env.DB_USER ||
    process.env.DB_PASSWORD ||
    process.env.DB_NAME
  );

  if (!hasAnyDbSetting) {
    return null;
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'hostel_db'
  };
}

async function initializeDatabase() {
  const config = getDatabaseConfig();

  if (!config) {
    console.log('MySQL not configured. Using local JSON storage for bookings and users.');
    return null;
  }

  try {
    const setupPool = mysql.createPool({
      ...config,
      database: undefined,
      connectionLimit: 5
    });

    await setupPool.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\`;`);
    await setupPool.end();

    mysqlPool = mysql.createPool({
      ...config,
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0
    });

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      )
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        studentName VARCHAR(255) NOT NULL,
        admissionNumber VARCHAR(100) NOT NULL,
        hostelName VARCHAR(255) NOT NULL,
        checkInDate DATE NOT NULL,
        stayLength VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const defaultUsers = DEFAULT_USERS;

    for (const user of defaultUsers) {
      await mysqlPool.query(
        `INSERT INTO users (name, username, password, role)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           password = VALUES(password),
           role = VALUES(role)`,
        [user.name, user.username, user.password, user.role]
      );
    }

    console.log(`MySQL connected successfully to database: ${config.database}`);
    return mysqlPool;
  } catch (error) {
    console.warn('MySQL connection failed. Falling back to JSON files.');
    console.warn(error.message);
    return null;
  }
}

async function getAllBookings() {
  if (mysqlPool) {
    const [rows] = await mysqlPool.query('SELECT * FROM bookings ORDER BY createdAt DESC');
    return rows;
  }

  return getBookings();
}

async function getAllUsers() {
  if (mysqlPool) {
    const [rows] = await mysqlPool.query('SELECT * FROM users ORDER BY id');
    return rows;
  }

  return getUsers();
}

async function getBookingSummary() {
  if (mysqlPool) {
    const [rows] = await mysqlPool.query(
      'SELECT status, COUNT(*) AS total FROM bookings GROUP BY status'
    );

    const summary = { total: 0, pending: 0, approved: 0 };

    for (const row of rows) {
      summary.total += Number(row.total);
      if (row.status === 'pending') summary.pending = Number(row.total);
      if (row.status === 'approved') summary.approved = Number(row.total);
    }

    return summary;
  }

  const bookings = getBookings();
  const total = bookings.length;
  const pending = bookings.filter((item) => item.status === 'pending').length;
  const approved = bookings.filter((item) => item.status === 'approved').length;

  return { total, pending, approved };
}

ensureDataFiles();

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/bookings', async (req, res) => {
  res.json(await getAllBookings());
});

app.get('/api/admin/summary', async (req, res) => {
  res.json(await getBookingSummary());
});

app.post('/api/bookings', async (req, res) => {
  const { studentName, admissionNumber, hostelName, checkInDate, stayLength } = req.body;

  if (!studentName || !admissionNumber || !hostelName || !checkInDate || !stayLength) {
    return res.status(400).json({ message: 'All booking fields are required.' });
  }

  if (mysqlPool) {
    const [result] = await mysqlPool.query(
      `INSERT INTO bookings (studentName, admissionNumber, hostelName, checkInDate, stayLength, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [studentName, admissionNumber, hostelName, checkInDate, stayLength]
    );

    const booking = {
      id: result.insertId,
      studentName,
      admissionNumber,
      hostelName,
      checkInDate,
      stayLength,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    return res.status(201).json({ message: 'Booking submitted successfully.', booking });
  }

  const bookings = getBookings();
  const booking = {
    id: Date.now(),
    studentName,
    admissionNumber,
    hostelName,
    checkInDate,
    stayLength,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  bookings.unshift(booking);
  writeJson(BOOKINGS_PATH, bookings);

  return res.status(201).json({ message: 'Booking submitted successfully.', booking });
});

app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;
  const users = await getAllUsers();

  const user = users.find(
    (entry) =>
      entry.username.toLowerCase() === String(username).toLowerCase() &&
      entry.password === String(password) &&
      entry.role === String(role)
  );

  if (!user) {
    return res.status(401).json({ message: 'Invalid username, password, or role.' });
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role
    }
  });
});

app.patch('/api/bookings/:id', async (req, res) => {
  const bookingId = req.params.id;

  if (mysqlPool) {
    const [result] = await mysqlPool.query(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [req.body.status || 'pending', bookingId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    const [rows] = await mysqlPool.query('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    const booking = rows[0];

    return res.json({ message: 'Booking updated successfully.', booking });
  }

  const bookings = getBookings();
  const booking = bookings.find((item) => String(item.id) === String(bookingId));

  if (!booking) {
    return res.status(404).json({ message: 'Booking not found.' });
  }

  booking.status = req.body.status || booking.status;
  writeJson(BOOKINGS_PATH, bookings);

  return res.json({ message: 'Booking updated successfully.', booking });
});

app.listen(PORT, async () => {
  await initializeDatabase();
  console.log(`Rongo University hostel site running on http://localhost:${PORT}`);
});
