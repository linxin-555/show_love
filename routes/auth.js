const express = require('express');
const bcrypt = require('bcryptjs');
const { getData } = require('../utils/data');
const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }
  const users = getData('users');
  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  req.session.user = { username: user.username, displayName: user.displayName };
  res.json({ ok: true, redirect: '/admin' });
});

router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true, redirect: '/login' });
});

router.get('/me', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.json(null);
  }
});

module.exports = router;
