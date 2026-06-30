# 🔢 Visitor Counter API

A lightweight Node.js/Express API to count how many users have visited your website.

---

## 🚀 Setup

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# For development (auto-restart on changes)
npm run dev
```

The API runs on **http://localhost:3000** by default.  
Change the port by setting the `PORT` environment variable.

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/track` | Record a page visit (call from your website) |
| `GET` | `/stats` | Get total visits & unique visitors |
| `GET` | `/stats/history?days=7` | Daily breakdown (up to 90 days) |
| `POST` | `/reset` | Reset all data (protect with `RESET_SECRET`) |

---

## 🌐 Add Tracking to Your Website

Paste this snippet before `</body>` in your HTML:

```html
<script>
  fetch('http://YOUR_SERVER_IP:3000/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page: window.location.pathname })
  });
</script>
```

---

## 📊 Example Responses

**GET /stats**
```json
{
  "totalVisits": 142,
  "uniqueVisitors": 89,
  "lastUpdated": "2026-06-29T10:22:01.000Z"
}
```

**GET /stats/history?days=3**
```json
{
  "days": 3,
  "breakdown": [
    { "date": "2026-06-27", "visits": 45, "newVisitors": 30 },
    { "date": "2026-06-28", "visits": 61, "newVisitors": 40 },
    { "date": "2026-06-29", "visits": 36, "newVisitors": 19 }
  ]
}
```

---

## 🔒 Security Tips

- Set a `RESET_SECRET` env variable to protect the `/reset` endpoint:
  ```bash
  RESET_SECRET=mysecret npm start
  ```
  Then send `x-reset-secret: mysecret` header to use `/reset`.

- In production, run behind **nginx** or a reverse proxy with HTTPS.
- Restrict CORS in `index.js` to your website's domain only:
  ```js
  res.setHeader('Access-Control-Allow-Origin', 'https://yoursite.com');
  ```

---

## 📁 Data Storage

Visitor data is stored in `data/visitors.json`. This file is auto-created.  
For high-traffic sites, consider replacing with a database like SQLite or Redis.
