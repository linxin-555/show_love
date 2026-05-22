const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '..', 'data');

const stores = {};

function loadData() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const files = ['photos.json', 'users.json', 'messages.json'];
  files.forEach(file => {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '[]', 'utf-8');
    }
    stores[file] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  });

  if (stores['users.json'].length === 0) {
    const salt = bcrypt.genSaltSync(10);
    stores['users.json'] = [
      { username: 'he', password: bcrypt.hashSync('123456', salt), displayName: '他' },
      { username: 'she', password: bcrypt.hashSync('123456', salt), displayName: '她' }
    ];
    fs.writeFileSync(path.join(dataDir, 'users.json'), JSON.stringify(stores['users.json'], null, 2), 'utf-8');
    console.log('默认管理员账号已创建: he / 123456, she / 123456');
  }
}

function getData(name) {
  if (name === 'photos') return stores['photos.json'] || [];
  if (name === 'users') return stores['users.json'] || [];
  if (name === 'messages') return stores['messages.json'] || [];
  return [];
}

function addItem(name, item) {
  const key = name + '.json';
  const arr = stores[key] || [];
  arr.push(item);
  stores[key] = arr;
  fs.writeFileSync(path.join(dataDir, key), JSON.stringify(arr, null, 2), 'utf-8');
  return item;
}

function removeItem(name, id) {
  const key = name + '.json';
  const arr = stores[key] || [];
  const idx = arr.findIndex(i => i.id === id);
  if (idx === -1) return false;
  arr.splice(idx, 1);
  stores[key] = arr;
  fs.writeFileSync(path.join(dataDir, key), JSON.stringify(arr, null, 2), 'utf-8');
  return true;
}

function saveData(name, data) {
  const key = name + '.json';
  stores[key] = data;
  fs.writeFileSync(path.join(dataDir, key), JSON.stringify(data, null, 2), 'utf-8');
}

function updateItem(name, id, updates) {
  const key = name + '.json';
  const arr = stores[key] || [];
  const idx = arr.findIndex(i => i.id === id);
  if (idx === -1) return null;
  Object.assign(arr[idx], updates);
  stores[key] = arr;
  fs.writeFileSync(path.join(dataDir, key), JSON.stringify(arr, null, 2), 'utf-8');
  return arr[idx];
}

module.exports = { loadData, getData, addItem, removeItem, updateItem, saveData };
