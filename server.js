const express = require('express');
const compression = require('compression');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const { loadData, getData, addItem, removeItem, saveData } = require('./utils/data');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const messagesRoutes = require('./routes/messages');
const { requireAuth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'show-love-secret-' + (process.env.SESSION_SECRET || 'changeme'),
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

loadData();

app.use('/api/auth', authRoutes);
app.use('/api/admin', requireAuth, adminRoutes);
app.use('/api/messages', messagesRoutes);

app.get('/', (req, res) => {
  const photos = getData('photos');
  const sorted = [...photos].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  const groups = [];
  let currentKey = '';
  for (const p of sorted) {
    const d = new Date(p.uploadedAt);
    const key = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
    if (key !== currentKey) {
      currentKey = key;
      const dateStr = d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
      const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
      groups.push({ date: dateStr, weekday, photos: [] });
    }
    groups[groups.length - 1].photos.push(p);
  }
  res.render('index', { groups, active: 'home' });
});

app.get('/messages', (req, res) => {
  const msgs = getData('messages');
  res.render('messages', { messages: msgs, active: 'messages' });
});

app.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/admin');
  res.render('login', { active: '', error: null });
});

app.get('/admin', requireAuth, (req, res) => {
  const photos = getData('photos');
  const messages = getData('messages');
  res.render('admin', { photos, messages, active: 'admin' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
