const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

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

app.get('/api/games/:id', (req, res) => {
  console.log('API call: GET /api/games/' + req.params.id);
  
  db.get(`SELECT g.*, COUNT(s.id) as current_players
          FROM games g
          LEFT JOIN signups s ON g.id = s.game_id
          WHERE g.id = ?`, [req.params.id], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    if (!row) {
      console.log('Game not found for ID:', req.params.id);
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    console.log('Returning game data:', row);
    res.json(row);
  });
});

app.get('/api/admin/games', (req, res) => {
  console.log('API call: GET /api/admin/games');
  
  db.all(`SELECT g.*, COUNT(s.id) as signups
          FROM games g
          LEFT JOIN signups s ON g.id = s.game_id
          GROUP BY g.id
          ORDER BY g.date, g.time`, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    console.log('Returning games:', rows ? rows.length : 0);
    res.json(rows || []);
  });
});

app.get('/api/admin/games/:id/signups', (req, res) => {
  console.log('API call: GET /api/admin/games/' + req.params.id + '/signups');
  
  db.all(`SELECT s.*,
          (s.speed + s.passing + s.shooting + s.defending) / 4.0 as avg_skill
          FROM signups s
          WHERE s.game_id = ?
          ORDER BY s.signup_time`, [req.params.id], (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    console.log('Returning signups:', rows ? rows.length : 0);
    res.json(rows || []);
  });
});

app.post('/api/signup/:gameId', (req, res) => {
  const gameId = req.params.gameId;
  console.log('API call: POST /api/signup/' + gameId);
  
  const { name, position, age, speed, passing, shooting, defending } = req.body;
  
  db.get(`SELECT g.max_players, COUNT(s.id) as current_players
          FROM games g
          LEFT JOIN signups s ON g.id = s.game_id
          WHERE g.id = ?`, [gameId], (err, game) => {
    
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: 'Database error' });
      return;
    }
    
    if (!game) {
      console.log('Game not found for signup:', gameId);
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    
    if (game.current_players >= game.max_players) {
      console.log('Game is full:', gameId);
      res.status(400).json({ error: 'Game is full' });
      return;
    }
    
    db.run(`INSERT INTO signups (game_id, name, position, age, speed, passing, shooting, defending)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
           [gameId, name, position, age, speed, passing, shooting, defending],
           function(err) {
      if (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Signup failed' });
        return;
      }
      console.log('Signup successful:', this.lastID);
      res.json({
        success: true,
        message: 'Successfully signed up!',
        signupId: this.lastID
      });
    });
  });
});

app.post('/api/admin/games', (req, res) => {
  console.log('API call: POST /api/admin/games');
  
  const { title, date, time, location, cost, max_players } = req.body;
  
  db.run(`INSERT INTO games (title, date, time, location, cost, max_players)
          VALUES (?, ?, ?, ?, ?, ?)`,
         [title, date, time, location, cost, max_players],
         function(err) {
    if (err) {
      console.error('Create game error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('Game created:', this.lastID);
    res.json({ id: this.lastID, signup_link: `/signup/${this.lastID}` });
  });
});

app.put('/api/admin/signups/:id/payment', (req, res) => {
  console.log('API call: PUT /api/admin/signups/' + req.params.id + '/payment');
  
  const { paid } = req.body;
  
  db.run(`UPDATE signups SET paid = ? WHERE id = ?`, [paid, req.params.id], (err) => {
    if (err) {
      console.error('Payment update error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('Payment updated:', req.params.id);
    res.json({ success: true });
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/signup/:gameId', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.url);
  
  if (req.url.startsWith('/api/')) {
    res.status(404).json({ error: 'API endpoint not found' });
    return;
  }
  
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>404 - Page Not Found</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          max-width: 600px; 
          margin: 100px auto; 
          text-align: center; 
          padding: 20px;
        }
        .error-container {
          background: #f8f9fa;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .back-link {
          display: inline-block;
          background: #28a745;
          color: white;
          padding: 10px 20px;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="error-container">
        <h1>⚽ 404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/admin" class="back-link">Go to Admin Panel</a>
      </div>
    </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Soccer Signup Platform running on port ${PORT}`);
  console.log(`📋 Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`🌐 Production URL will be provided by your hosting service`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
