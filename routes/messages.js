const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getData, addItem, removeItem } = require('../utils/data');
const router = express.Router();

router.get('/', (req, res) => {
  const messages = getData('messages');
  res.json(messages);
});

router.post('/', (req, res) => {
  const { nickname, content } = req.body;
  if (!nickname || !nickname.trim()) return res.status(400).json({ error: '请输入昵称' });
  if (!content || !content.trim()) return res.status(400).json({ error: '请输入留言内容' });

  const msg = addItem('messages', {
    id: uuidv4(),
    nickname: nickname.trim(),
    content: content.trim(),
    createdAt: new Date().toISOString()
  });
  res.json({ ok: true, message: msg });
});

router.delete('/:id', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: '请先登录' });
  const ok = removeItem('messages', req.params.id);
  if (!ok) return res.status(404).json({ error: '留言不存在' });
  res.json({ ok: true });
});

module.exports = router;
