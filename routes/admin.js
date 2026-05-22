const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getData, addItem, removeItem, updateItem, saveData } = require('../utils/data');

let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('sharp 未加载（缩略图生成不可用，将使用原图）：', e.message.split('\n')[0]);
}

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'uploads');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, uuidv4() + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 jpg/jpeg/png/gif/webp 格式'));
    }
  }
});

router.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: '请选择照片' });

    const filename = req.file.filename;
    const originalPath = req.file.path;
    const ext = path.extname(filename);
    const thumbFilename = filename.replace(ext, '_thumb' + ext);
    const thumbPath = path.join(path.dirname(originalPath), thumbFilename);

    if (sharp) {
      const rotatedOriginal = await sharp(originalPath)
        .rotate()
        .toBuffer();
      fs.writeFileSync(originalPath, rotatedOriginal);

      await sharp(rotatedOriginal)
        .resize(500, 500, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(thumbPath);
    } else {
      fs.copyFileSync(originalPath, thumbPath);
    }

    const photo = addItem('photos', {
      id: uuidv4(),
      filename: thumbFilename,
      original: filename,
      uploadedBy: req.session.user.displayName,
      uploadedAt: new Date().toISOString(),
      description: ''
    });

    res.json({ ok: true, photo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '上传失败' });
  }
});

router.delete('/photos/:id', (req, res) => {
  const photos = getData('photos');
  const photo = photos.find(p => p.id === req.params.id);
  if (!photo) return res.status(404).json({ error: '照片不存在' });

  try {
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    const thumbPath = path.join(uploadsDir, photo.filename);
    const origPath = path.join(uploadsDir, photo.original);
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    if (fs.existsSync(origPath)) fs.unlinkSync(origPath);
  } catch (e) { /* ignore fs errors */ }

  removeItem('photos', req.params.id);
  res.json({ ok: true });
});

router.post('/photos/:id/rotate', async (req, res) => {
  if (!sharp) return res.status(500).json({ error: '旋转功能需要 sharp，当前 Node.js 版本不支持' });

  try {
    const photos = getData('photos');
    const photo = photos.find(p => p.id === req.params.id);
    if (!photo) return res.status(404).json({ error: '照片不存在' });

    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
    const thumbPath = path.join(uploadsDir, photo.filename);
    const origPath = path.join(uploadsDir, photo.original);

    for (const filePath of [origPath, thumbPath]) {
      if (!fs.existsSync(filePath)) continue;
      const rotated = await sharp(filePath).rotate(90).toBuffer();
      fs.writeFileSync(filePath, rotated);
    }

    photo.version = (photo.version || 0) + 1;
    saveData('photos', photos);

    res.json({ ok: true, version: photo.version });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '旋转失败' });
  }
});

router.put('/photos/:id/time', (req, res) => {
  const { uploadedAt } = req.body;
  if (!uploadedAt) return res.status(400).json({ error: '请提供时间' });
  const photo = updateItem('photos', req.params.id, { uploadedAt });
  if (!photo) return res.status(404).json({ error: '照片不存在' });
  res.json({ ok: true, photo });
});

router.put('/photos/:id/description', (req, res) => {
  const { description } = req.body;
  const photo = updateItem('photos', req.params.id, { description: description || '' });
  if (!photo) return res.status(404).json({ error: '照片不存在' });
  res.json({ ok: true, photo });
});

module.exports = router;
