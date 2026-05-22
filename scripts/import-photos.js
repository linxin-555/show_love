const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
const DATA_FILE = path.join(__dirname, '..', 'data', 'photos.json');

let sharp = null;
try {
  sharp = require('sharp');
  console.log('sharp 已加载，将生成缩略图');
} catch (e) {
  console.log('sharp 不可用，将使用原图');
}

function usage() {
  console.log('用法: node scripts/import-photos.js <照片目录>');
  console.log('示例: node scripts/import-photos.js ~/Desktop/my_photos');
  process.exit(1);
}

const srcDir = process.argv[2];
if (!srcDir) usage();
if (!fs.existsSync(srcDir)) {
  console.error('目录不存在: ' + srcDir);
  process.exit(1);
}

const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const photos = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

const files = fs.readdirSync(srcDir)
  .map(f => ({ name: f, full: path.join(srcDir, f) }))
  .filter(f => fs.statSync(f.full).isFile() && allowedExts.includes(path.extname(f.name).toLowerCase()));

if (files.length === 0) {
  console.log('目录中没有支持的图片文件 (jpg/jpeg/png/gif/webp)');
  process.exit(0);
}

console.log(`找到 ${files.length} 张照片，开始导入...`);
let imported = 0;

for (const file of files) {
  const ext = path.extname(file.name).toLowerCase();
  const baseName = uuidv4();
  const originalName = baseName + ext;
  const thumbName = baseName + '_thumb' + ext;
  const originalPath = path.join(UPLOADS_DIR, originalName);
  const thumbPath = path.join(UPLOADS_DIR, thumbName);

  try {
    fs.copyFileSync(file.full, originalPath);

    if (sharp) {
      const rotatedOriginal = await sharp(file.full)
        .rotate()
        .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      fs.writeFileSync(originalPath, rotatedOriginal);

      await sharp(rotatedOriginal)
        .resize(500, 500, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(thumbPath);
    } else {
      fs.copyFileSync(file.full, originalPath);
      fs.copyFileSync(file.full, thumbPath);
    }

    photos.push({
      id: uuidv4(),
      filename: thumbName,
      original: originalName,
      uploadedBy: '导入',
      uploadedAt: new Date().toISOString()
    });

    imported++;
    process.stdout.write('.');
  } catch (err) {
    console.error(`\n导入失败: ${file.name} - ${err.message}`);
  }
}

fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2), 'utf-8');
console.log(`\n完成！成功导入 ${imported}/${files.length} 张照片`);
