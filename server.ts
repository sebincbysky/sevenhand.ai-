import express from "express";
import { createServer as createViteServer } from "vite";
import sqlite3 from "sqlite3";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        settings TEXT
      )
    `);
  }
});

// API Routes
app.post("/api/auth/signup", (req, res) => {
  const { email, password } = req.body;
  const defaultSettings = JSON.stringify({
    dwellTime: 800,
    hoverColor: '#000000',
    trackingMode: 'hand'
  });

  db.run(
    "INSERT INTO users (email, password, settings) VALUES (?, ?, ?)",
    [email, password, defaultSettings],
    function(err) {
      if (err) {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.json({ id: this.lastID, email, settings: JSON.parse(defaultSettings) });
    }
  );
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, row: any) => {
      if (err || !row) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      res.json({ id: row.id, email: row.email, settings: JSON.parse(row.settings) });
    }
  );
});

app.post("/api/settings", (req, res) => {
  const { email, settings } = req.body;
  db.run(
    "UPDATE users SET settings = ? WHERE email = ?",
    [JSON.stringify(settings), email],
    function(err) {
      if (err) {
        return res.status(500).json({ error: "Failed to save settings" });
      }
      res.json({ success: true });
    }
  );
});

app.get("/api/settings", (req, res) => {
  const email = req.query.email;
  db.get(
    "SELECT settings FROM users WHERE email = ?",
    [email],
    (err, row: any) => {
      if (err || !row) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(JSON.parse(row.settings));
    }
  );
});

// OAuth Routes
const getRedirectUri = (req: any, provider: string) => {
  const host = req.get('host');
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  return `${protocol}://${host}/auth/${provider}/callback`;
};

app.get("/api/auth/google/url", (req, res) => {
  const redirectUri = getRedirectUri(req, 'google');
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || 'mock_google_client_id',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'email profile',
  });
  res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` });
});

app.get("/api/auth/facebook/url", (req, res) => {
  const redirectUri = getRedirectUri(req, 'facebook');
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_CLIENT_ID || 'mock_facebook_client_id',
    redirect_uri: redirectUri,
    scope: 'email,public_profile',
  });
  res.json({ url: `https://www.facebook.com/v12.0/dialog/oauth?${params}` });
});

app.get("/api/auth/apple/url", (req, res) => {
  const redirectUri = getRedirectUri(req, 'apple');
  const params = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID || 'mock_apple_client_id',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'name email',
    response_mode: 'form_post',
  });
  res.json({ url: `https://appleid.apple.com/auth/authorize?${params}` });
});

app.get(["/auth/:provider/callback", "/auth/:provider/callback/"], (req, res) => {
  const provider = req.params.provider;
  // In a real app, we would exchange the code for a token here.
  // Since we don't have the client secrets, we will simulate a successful login.
  const mockEmail = `user@${provider}.com`;
  
  res.send(`
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', email: '${mockEmail}' }, '*');
            window.close();
          } else {
            window.location.href = '/app';
          }
        </script>
        <p>Authentication successful. This window should close automatically.</p>
      </body>
    </html>
  `);
});

app.post(["/auth/:provider/callback", "/auth/:provider/callback/"], (req, res) => {
  // Apple OAuth uses POST for the callback
  const provider = req.params.provider;
  const mockEmail = `user@${provider}.com`;
  
  res.send(`
    <html>
      <body>
        <script>
          if (window.opener) {
            window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', email: '${mockEmail}' }, '*');
            window.close();
          } else {
            window.location.href = '/app';
          }
        </script>
        <p>Authentication successful. This window should close automatically.</p>
      </body>
    </html>
  `);
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
