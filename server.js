const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// Database setup
const db = new sqlite3.Database('soccer.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    cost REAL NOT NULL,
    max_players INTEGER NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS signups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    game_id INTEGER,
    name TEXT NOT NULL,
    position TEXT NOT NULL,
    age INTEGER NOT NULL,
    speed INTEGER NOT NULL,
    passing INTEGER NOT NULL,
    shooting INTEGER NOT NULL,
    defending INTEGER NOT NULL,
    paid BOOLEAN DEFAULT FALSE,
    signup_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games (id)
  )`);
});

// Page Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/signup/:gameId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/signups/:gameId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signups.html'));
});

// API Routes
app.get('/api/games/:id', (req, res) => {
  db.get(`SELECT g.*, COUNT(s.id) as current_players
          FROM games g
          LEFT JOIN signups s ON g.id = s.game_id
          WHERE g.id = ?`, [req.params.id], (err, row) => {
    if (err || !row) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    res.json(row);
  });
});

app.post('/api/signup/:gameId', (req, res) => {
  const gameId = req.params.gameId;
  const { name, position, age, speed, passing, shooting, defending } = req.body;
  
  // Check if game exists and has space
  db.get(`SELECT g.max_players, COUNT(s.id) as current_players
          FROM games g
          LEFT JOIN signups s ON g.id = s.game_id
          WHERE g.id = ?`, [gameId], (err, game) => {
    
    if (err || !game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    
    if (game.current_players >= game.max_players) {
      res.status(400).json({ error: 'Game is full' });
      return;
    }
    
    // Add signup
    db.run(`INSERT INTO signups (game_id, name, position, age, speed, passing, shooting, defending)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
           [gameId, name, position, age, speed, passing, shooting, defending],
           function(err) {
      if (err) {
        res.status(500).json({ error: 'Signup failed' });
        return;
      }
      res.json({
        success: true,
        message: 'Successfully signed up!',
        signupId: this.lastID
      });
    });
  });
});

// Admin endpoints
app.get('/api/admin/games', (req, res) => {
  db.all(`SELECT g.*, COUNT(s.id) as signups
          FROM games g
          LEFT JOIN signups s ON g.id = s.game_id
          GROUP BY g.id
          ORDER BY g.date, g.time`, (err, rows) => {
    res.json(rows || []);
  });
});

app.get('/api/admin/games/:id/signups', (req, res) => {
  db.all(`SELECT s.*,
          (s.speed + s.passing + s.shooting + s.defending) / 4.0 as avg_skill
          FROM signups s
          WHERE s.game_id = ?
          ORDER BY s.signup_time`, [req.params.id], (err, rows) => {
    res.json(rows || []);
  });
});

app.post('/api/admin/games', (req, res) => {
  const { title, date, time, location, cost, max_players } = req.body;
  
  db.run(`INSERT INTO games (title, date, time, location, cost, max_players)
          VALUES (?, ?, ?, ?, ?, ?)`,
         [title, date, time, location, cost, max_players],
         function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, signup_link: `/signup/${this.lastID}` });
  });
});

app.put('/api/admin/signups/:id/payment', (req, res) => {
  const { paid } = req.body;
  
  db.run(`UPDATE signups SET paid = ? WHERE id = ?`, [paid, req.params.id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true });
  });
});

// Handle 404 for missing files (this should be LAST)
app.use((req, res) => {
  res.status(404).send(`
    <h1>404 - Page Not Found</h1>
    <p>Go to <a href="/admin">Admin Panel</a> to create games</p>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
