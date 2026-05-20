const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { getData, addItem, removeItem } = require('../utils/data');

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
      await sharp(originalPath)
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
      uploadedAt: new Date().toISOString()
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

module.exports = router;
