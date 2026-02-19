# 爱情回忆录网站升级实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将静态浪漫回忆网站升级为带管理后台的动态应用，支持通过 API 管理时间轴、照片、音乐和设置。

**Architecture:** Express.js RESTful API 后端 + SQLite 数据库 + 保持原 HTML/CSS/JS 前端，添加动态数据加载功能。

**Tech Stack:** Node.js, Express.js, SQLite3, Multer, CORS, HTML/CSS/JavaScript

---

## Task 1: 初始化项目结构和依赖

**Files:**
- Create: `romantic-memory-website/package.json`
- Create: `romantic-memory-website/server/server.js`
- Create: `romantic-memory-website/server/database.js`
- Create: `romantic-memory-website/.gitignore`

**Step 1: 创建 package.json**

```json
{
  "name": "love-memories",
  "version": "2.0.0",
  "description": "Romantic memory website with admin backend",
  "main": "server/server.js",
  "scripts": {
    "start": "node server/server.js",
    "dev": "nodemon server/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.6",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

**Step 2: 创建 .gitignore**

```
node_modules/
data/*.db
data/*.db-journal
.DS_Store
.env
```

**Step 3: 创建基础 Express 服务器**

```javascript
// server/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../public')));

// API 路由
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

**Step 4: 安装依赖**

```bash
cd romantic-memory-website
npm install
```

**Step 5: 测试服务器启动**

```bash
npm start
```

Expected output: `Server running on http://localhost:3001`

访问 http://localhost:3001/api/health

Expected: `{"success":true,"message":"Server is running"}`

**Step 6: 提交流程**

```bash
git add package.json server/.gitignore server/server.js
git commit -m "feat: initialize Express server with basic setup"
```

---

## Task 2: 配置 SQLite 数据库

**Files:**
- Modify: `server/database.js`
- Modify: `server/server.js`

**Step 1: 创建数据库模块**

```javascript
// server/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 确保数据目录存在
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'memories.db');

// 创建数据库连接
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initTables();
  }
});

// 初始化表结构
function initTables() {
  db.serialize(() => {
    // timelines 表
    db.run(`CREATE TABLE IF NOT EXISTS timelines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      title TEXT NOT NULL,
      icon TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // photos 表
    db.run(`CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      caption TEXT,
      category TEXT,
      date_taken DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // music 表
    db.run(`CREATE TABLE IF NOT EXISTS music (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT,
      filename TEXT NOT NULL,
      duration TEXT,
      is_active BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // settings 表
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`);

    // 插入默认设置
    const stmt = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    stmt.run('startDate', '2023-02-14');
    stmt.run('language', 'zh-CN');
    stmt.finalize();
  });
}

module.exports = db;
```

**Step 2: 在 server.js 中初始化数据库**

```javascript
// server/server.js 顶部添加
const db = require('./database');
```

**Step 3: 测试数据库创建**

```bash
npm start
```

Expected output:
```
Connected to SQLite database
Server running on http://localhost:3001
```

检查文件：
```bash
ls -la data/memories.db
```

**Step 4: 提交流程**

```bash
git add server/database.js server/server.js
git commit -m "feat: setup SQLite database with tables"
```

---

## Task 3: 实现设置 API

**Files:**
- Create: `server/routes/settings.js`
- Modify: `server/server.js`

**Step 1: 创建设置路由**

```javascript
// server/routes/settings.js
const express = require('express');
const router = express.Router();
const db = require('../database');

// 获取设置
router.get('/', (req, res) => {
  db.all('SELECT * FROM settings', (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }

    const settings = {};
    rows.forEach(row => {
      settings[row.key] = row.value;
    });

    res.json({ success: true, data: settings });
  });
});

// 更新设置
router.put('/', (req, res) => {
  const { startDate, language } = req.body;

  if (!startDate && !language) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'No fields to update' }
    });
  }

  db.serialize(() => {
    if (startDate) {
      db.run('UPDATE settings SET value = ? WHERE key = ?', [startDate, 'startDate']);
    }
    if (language) {
      db.run('UPDATE settings SET value = ? WHERE key = ?', [language, 'language']);
    }
  });

  res.json({ success: true, data: { startDate, language } });
});

module.exports = router;
```

**Step 2: 在 server.js 中挂载路由**

```javascript
// server/server.js 添加设置路由
const settingsRoutes = require('./routes/settings');
app.use('/api/settings', settingsRoutes);
```

**Step 3: 测试设置 API**

启动服务器：
```bash
npm start
```

测试 GET：
```bash
curl http://localhost:3001/api/settings
```

Expected:
```json
{"success":true,"data":{"startDate":"2023-02-14","language":"zh-CN"}}
```

测试 PUT：
```bash
curl -X PUT http://localhost:3001/api/settings \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2024-01-01"}'
```

**Step 4: 提交流程**

```bash
git add server/routes/settings.js server/server.js
git commit -m "feat: add settings API endpoints"
```

---

## Task 4: 实现时间轴 API

**Files:**
- Create: `server/routes/timelines.js`
- Modify: `server/server.js`

**Step 1: 创建时间轴路由**

```javascript
// server/routes/timelines.js
const express = require('express');
const router = express.Router();
const db = require('../database');

// 获取所有时间轴事件
router.get('/', (req, res) => {
  db.all('SELECT * FROM timelines ORDER BY date ASC', (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }
    res.json({ success: true, data: rows });
  });
});

// 添加新事件
router.post('/', (req, res) => {
  const { date, title, icon, description } = req.body;

  if (!date || !title) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'date and title are required' }
    });
  }

  const stmt = db.prepare('INSERT INTO timelines (date, title, icon, description) VALUES (?, ?, ?, ?)');
  stmt.run([date, title, icon || 'fa-heart', description || ''], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }

    db.get('SELECT * FROM timelines WHERE id = ?', [this.lastID], (err, row) => {
      res.json({ success: true, data: row });
    });
  });
  stmt.finalize();
});

// 更新事件
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { date, title, icon, description } = req.body;

  db.run(
    'UPDATE timelines SET date = ?, title = ?, icon = ?, description = ? WHERE id = ?',
    [date, title, icon, description, id],
    (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: { code: 'DATABASE_ERROR', message: err.message }
        });
      }

      db.get('SELECT * FROM timelines WHERE id = ?', [id], (err, row) => {
        if (!row) {
          return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Timeline not found' }
          });
        }
        res.json({ success: true, data: row });
      });
    }
  );
});

// 删除事件
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM timelines WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }
    res.json({ success: true });
  });
});

module.exports = router;
```

**Step 2: 在 server.js 中挂载路由**

```javascript
// server/server.js 添加时间轴路由
const timelinesRoutes = require('./routes/timelines');
app.use('/api/timelines', timelinesRoutes);
```

**Step 3: 测试时间轴 API**

测试 POST：
```bash
curl -X POST http://localhost:3001/api/timelines \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2023-02-14",
    "title": "第一次见面",
    "icon": "fa-heart",
    "description": "在咖啡馆的第一次见面"
  }'
```

测试 GET：
```bash
curl http://localhost:3001/api/timelines
```

**Step 4: 提交流程**

```bash
git add server/routes/timelines.js server/server.js
git commit -m "feat: add timeline CRUD API endpoints"
```

---

## Task 5: 实现照片上传 API

**Files:**
- Create: `server/routes/photos.js`
- Create: `server/uploads.js`
- Modify: `server/server.js`

**Step 1: 创建 Multer 配置**

```javascript
// server/uploads.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../public/uploads/photos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片文件 (jpeg, jpg, png, gif, webp)'));
    }
  }
});

module.exports = upload;
```

**Step 2: 创建照片路由**

```javascript
// server/routes/photos.js
const express = require('express');
const router = express.Router();
const db = require('../database');
const upload = require('../uploads');
const fs = require('fs');
const path = require('path');

// 获取所有照片
router.get('/', (req, res) => {
  db.all('SELECT * FROM photos ORDER BY date_taken DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }

    const photos = rows.map(photo => ({
      ...photo,
      url: `/uploads/photos/${photo.filename}`
    }));

    res.json({ success: true, data: photos });
  });
});

// 上传照片
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'No file uploaded' }
    });
  }

  const { caption, category, dateTaken } = req.body;

  db.run(
    'INSERT INTO photos (filename, caption, category, date_taken) VALUES (?, ?, ?, ?)',
    [req.file.filename, caption, category, dateTaken],
    function(err) {
      if (err) {
        return res.status(500).json({
          success: false,
          error: { code: 'DATABASE_ERROR', message: err.message }
        });
      }

      db.get('SELECT * FROM photos WHERE id = ?', [this.lastID], (err, row) => {
        res.json({
          success: true,
          data: { ...row, url: `/uploads/photos/${row.filename}` }
        });
      });
    }
  );
});

// 删除照片
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM photos WHERE id = ?', [id], (err, row) => {
    if (!row) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Photo not found' }
      });
    }

    const filePath = path.join(__dirname, '../public/uploads/photos', row.filename);
    fs.unlink(filePath, () => {
      db.run('DELETE FROM photos WHERE id = ?', [id], (err) => {
        res.json({ success: true });
      });
    });
  });
});

module.exports = router;
```

**Step 3: 在 server.js 中挂载路由**

```javascript
// server/server.js 添加照片路由
const photosRoutes = require('./routes/photos');
app.use('/api/photos', photosRoutes);
```

**Step 4: 测试照片上传**

```bash
curl -X POST http://localhost:3001/api/photos/upload \
  -F "file=@/path/to/image.jpg" \
  -F "caption=测试照片" \
  -F "category=生活"
```

**Step 5: 提交流程**

```bash
git add server/routes/photos.js server/uploads.js server/server.js
git commit -m "feat: add photo upload and management API"
```

---

## Task 6: 实现音乐上传 API

**Files:**
- Create: `server/routes/music.js`
- Create: `server/musicUploads.js`
- Modify: `server/server.js`

**Step 1: 创建音乐 Multer 配置**

```javascript
// server/musicUploads.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../public/uploads/music');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'music-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
  const allowedTypes = /mpeg|mp3|wav/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('只支持音频文件 (mp3, wav)'));
  }
  }
});

module.exports = upload;
```

**Step 2: 创建音乐路由**

```javascript
// server/routes/music.js
const express = require('express');
const router = express.Router();
const db = require('../database');
const upload = require('../musicUploads');
const fs = require('fs');
const path = require('path');

// 获取所有音乐
router.get('/', (req, res) => {
  db.all('SELECT * FROM music ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }

    const music = rows.map(track => ({
      ...track,
      url: `/uploads/music/${track.filename}`
    }));

    res.json({ success: true, data: music });
  });
});

// 上传音乐
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_INPUT', message: 'No file uploaded' }
    });
  }

  const { title, artist, duration } = req.body;

  db.run(
    'INSERT INTO music (title, artist, filename, duration) VALUES (?, ?, ?, ?)',
    [title, artist, req.file.filename, duration],
    function(err) {
      if (err) {
        return res.status(500).json({
          success: false,
          error: { code: 'DATABASE_ERROR', message: err.message }
        });
      }

      db.get('SELECT * FROM music WHERE id = ?', [this.lastID], (err, row) => {
        res.json({
          success: true,
          data: { ...row, url: `/uploads/music/${row.filename}` }
        });
      });
    }
  );
});

// 设置当前播放
router.put('/:id/active', (req, res) => {
  const { id } = req.params;

  db.run('UPDATE music SET is_active = CASE WHEN id = ? THEN 1 ELSE 0 END', [id], (err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'DATABASE_ERROR', message: err.message }
      });
    }
    res.json({ success: true });
  });
});

// 删除音乐
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM music WHERE id = ?', [id], (err, row) => {
    if (!row) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Music not found' }
      });
    }

    const filePath = path.join(__dirname, '../public/uploads/music', row.filename);
    fs.unlink(filePath, () => {
      db.run('DELETE FROM music WHERE id = ?', [id], (err) => {
        res.json({ success: true });
      });
    });
  });
});

module.exports = router;
```

**Step 3: 在 server.js 中挂载路由**

```javascript
// server/server.js 添加音乐路由
const musicRoutes = require('./routes/music');
app.use('/api/music', musicRoutes);
```

**Step 4: 提交流程**

```bash
git add server/routes/music.js server/musicUploads.js server/server.js
git commit -m "feat: add music upload and management API"
```

---

## Task 7: 修改前端加载 API 数据

**Files:**
- Modify: `public/script.js`

**Step 1: 添加 API 数据加载函数**

在 script.js 顶部添加：

```javascript
// API 基础配置
const API_BASE = '/api';

// 加载设置
async function loadSettings() {
  try {
    const response = await fetch(`${API_BASE}/settings`);
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  }
  return null;
}

// 加载时间轴
async function loadTimelines() {
  try {
    const response = await fetch(`${API_BASE}/timelines`);
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('加载时间轴失败:', error);
  }
  return [];
}

// 加载照片
async function loadPhotos() {
  try {
    const response = await fetch(`${API_BASE}/photos`);
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('加载照片失败:', error);
  }
  return [];
}

// 加载音乐
async function loadMusic() {
  try {
    const response = await fetch(`${API_BASE}/music`);
    const result = await response.json();
    if (result.success) {
      return result.data;
    }
  } catch (error) {
    console.error('加载音乐失败:', error);
  }
  return [];
}
```

**Step 2: 修改爱情计时器使用 API**

将：
```javascript
const startDate = new Date("2023-02-14T00:00:00").getTime();
```

修改为：
```javascript
let startDate = new Date("2023-02-14T00:00:00").getTime();

// 页面加载时从 API 获取
async function initApp() {
  const settings = await loadSettings();
  if (settings && settings.startDate) {
    startDate = new Date(settings.startDate).getTime();
  }
}

initApp();
```

**Step 3: 添加时间轴动态渲染**

在 script.js 中添加：
```javascript
// 渲染时间轴
function renderTimelines(timelines) {
  const container = document.querySelector('.timeline');
  if (!container) return;

  container.innerHTML = timelines.map((item, index) => {
    const side = index % 2 === 0 ? 'left' : 'right';
    const formattedDate = new Date(item.date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
      <div class="timeline-box ${side} reveal">
        <div class="date-badge">${formattedDate}</div>
        <div class="box-content">
          <h3><i class="fas ${item.icon || 'fa-heart'}"></i> ${item.title}</h3>
          <p>${item.description || ''}</p>
        </div>
      </div>
    `;
  }).join('');

  // 重新绑定滚动动画
  window.removeEventListener('scroll', reveal);
  window.addEventListener('scroll', reveal);
  reveal();
}
```

**Step 4: 添加照片画廊动态渲染**

```javascript
// 渲染照片
function renderPhotos(photos) {
  const container = document.querySelector('.gallery-container');
  if (!container) return;

  container.innerHTML = photos.map((photo, index) => {
    const rotation = index % 2 === 0 ? 'rotate-left' : 'rotate-right';
    return `
      <div class="polaroid ${rotation}">
        <img src="${photo.url}" alt="${photo.caption || ''}" />
        <div class="caption">${photo.caption || ''}</div>
      </div>
    `;
  }).join('');
}
```

**Step 5: 初始化加载数据**

在 enterWebsite() 函数最后添加：
```javascript
// 加载动态数据
async function loadContent() {
  const timelines = await loadTimelines();
  if (timelines.length > 0) {
    renderTimelines(timelines);
  }

  const photos = await loadPhotos();
  if (photos.length > 0) {
    renderPhotos(photos);
  }
}

// 在进入网站后加载
const originalEnterWebsite = enterWebsite;
enterWebsite = function() {
  originalEnterWebsite();
  setTimeout(loadContent, 1000);
};
```

**Step 6: 提交流程**

```bash
git add public/script.js
git commit -m "feat: load data from API instead of hardcoded"
```

---

## Task 8: 创建管理后台基础页面

**Files:**
- Create: `public/admin/index.html`
- Create: `public/admin/style.css`
- Create: `public/admin/script.js`

**Step 1: 创建管理后台 HTML**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>管理后台 - 爱情回忆录</title>
  <link
    rel="stylesheet"
    href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
  />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="admin-container">
    <header class="admin-header">
      <h1>💕 爱情回忆录管理</h1>
      <a href="../index.html" class="btn-back">返回网站</a>
    </header>

    <div class="admin-main">
      <aside class="admin-sidebar">
        <nav class="admin-nav">
          <button class="nav-item active" data-section="timelines">
            <i class="fas fa-stream"></i>
            <span>时间轴</span>
          </button>
          <button class="nav-item" data-section="photos">
            <i class="fas fa-images"></i>
            <span>照片</span>
          </button>
          <button class="nav-item" data-section="music">
            <i class="fas fa-music"></i>
            <span>音乐</span>
          </button>
          <button class="nav-item" data-section="settings">
            <i class="fas fa-cog"></i>
            <span>设置</span>
          </button>
        </nav>
      </aside>

      <main class="admin-content">
        <section id="section-timelines" class="content-section active">
          <div class="section-header">
            <h2>时间轴管理</h2>
            <button class="btn-primary" onclick="showTimelineForm()">
              <i class="fas fa-plus"></i> 添加事件
            </button>
          </div>
          <div id="timelines-list" class="data-list"></div>
        </section>

        <section id="section-photos" class="content-section">
          <div class="section-header">
            <h2>照片管理</h2>
            <button class="btn-primary" onclick="showPhotoUpload()">
              <i class="fas fa-upload"></i> 上传照片
            </button>
          </div>
          <div id="photos-list" class="photo-grid"></div>
        </section>

        <section id="section-music" class="content-section">
          <div class="section-header">
            <h2>音乐管理</h2>
            <button class="btn-primary" onclick="showMusicUpload()">
              <i class="fas fa-upload"></i> 上传音乐
            </button>
          </div>
          <div id="music-list" class="data-list"></div>
        </section>

        <section id="section-settings" class="content-section">
          <div class="section-header">
            <h2>网站设置</h2>
          </div>
          <div class="settings-form"></div>
        </section>
      </main>
    </div>
  </div>

  <div id="modal" class="modal hidden">
    <div class="modal-content">
      <div class="modal-header">
        <h3 id="modal-title">标题</h3>
        <button class="btn-close" onclick="closeModal()">&times;</button>
      </div>
      <div id="modal-body" class="modal-body"></div>
    </div>
  </div>

  <script src="script.js"></script>
</body>
</html>
```

**Step 2: 创建管理后台样式**

```css
/* public/admin/style.css */
:root {
  --primary-color: #f472b6;
  --primary-dark: #c9436d;
  --bg-dark: #0f0a1a;
  --bg-darker: #0a0510;
  --text-light: #f8fafc;
  --text-gray: #c7c9d1;
  --border-color: rgba(244, 114, 182, 0.2);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background-color: var(--bg-dark);
  color: var(--text-light);
}

.admin-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.admin-header {
  background: linear-gradient(135deg, #2a145f 0%, #160a2d 100%);
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.admin-header h1 {
  font-size: 1.5rem;
  background: linear-gradient(90deg, #fff, var(--primary-color));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.btn-back {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.3s;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.2);
}

.admin-main {
  display: flex;
  flex: 1;
}

.admin-sidebar {
  width: 250px;
  background: var(--bg-darker);
  border-right: 1px solid var(--border-color);
  padding: 20px 0;
}

.admin-nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  background: transparent;
  border: none;
  color: var(--text-gray);
  cursor: pointer;
  transition: all 0.3s;
  text-align: left;
  font-size: 1rem;
  width: 100%;
}

.nav-item:hover {
  background: rgba(244, 114, 182, 0.1);
  color: white;
}

.nav-item.active {
  background: linear-gradient(90deg, rgba(244, 114, 182, 0.2), transparent);
  color: var(--primary-color);
  border-left: 3px solid var(--primary-color);
}

.admin-content {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
}

.content-section {
  display: none;
}

.content-section.active {
  display: block;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.section-header h2 {
  font-size: 2rem;
  color: white;
}

.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(244, 114, 182, 0.4);
}

.data-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.data-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s;
}

.data-item:hover {
  transform: translateX(5px);
  border-color: var(--primary-color);
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.photo-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.2s;
}

.photo-item:hover {
  transform: scale(1.05);
}

.photo-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.photo-item .photo-info {
  padding: 15px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal.hidden {
  display: none;
}

.modal-content {
  background: var(--bg-dark);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  color: white;
  font-size: 1.2rem;
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-gray);
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}
```

**Step 3: 提交流程**

```bash
git add public/admin/
git commit -m "feat: add admin panel basic layout"
```

---

## Task 9: 实现时间轴管理界面

**Files:**
- Modify: `public/admin/script.js`

**Step 1: 添加时间轴管理逻辑**

在 script.js 中添加：

```javascript
// API 配置
const API_BASE = '/api';

// 导航切换
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    const section = item.dataset.section;
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`section-${section}`).classList.add('active');

    // 加载对应数据
    if (section === 'timelines') loadTimelines();
    if (section === 'photos') loadPhotos();
    if (section === 'music') loadMusic();
    if (section === 'settings') loadSettings();
  });
});

// 时间轴管理
async function loadTimelines() {
  const response = await fetch(`${API_BASE}/timelines`);
  const result = await response.json();

  const container = document.getElementById('timelines-list');
  container.innerHTML = result.data.map(item => `
    <div class="data-item">
      <div>
        <strong>${item.date}</strong>
        <h3>${item.title}</h3>
        <p>${item.description || ''}</p>
      </div>
      <div class="actions">
        <button class="btn-edit" onclick="editTimeline(${item.id})">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn-delete" onclick="deleteTimeline(${item.id})">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function showTimelineForm(id = null) {
  const modal = document.getElementById('modal');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');

  title.textContent = id ? '编辑事件' : '添加事件';
  body.innerHTML = `
    <form onsubmit="saveTimeline(event, ${id})">
      <div class="form-group">
        <label>日期</label>
        <input type="date" name="date" required />
      </div>
      <div class="form-group">
        <label>标题</label>
        <input type="text" name="title" required />
      </div>
      <div class="form-group">
        <label>图标</label>
        <select name="icon">
          <option value="fa-heart">❤️ 心形</option>
          <option value="fa-coffee">☕ 咖啡</option>
          <option value="fa-comments">💬 评论</option>
          <option value="fa-moon">🌙 月亮</option>
          <option value="fa-plane">✈️ 飞机</option>
          <option value="fa-gift">🎁 礼物</option>
        </select>
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea name="description" rows="4"></textarea>
      </div>
      <button type="submit" class="btn-primary">保存</button>
    </form>
  `;

  modal.classList.remove('hidden');

  // 如果是编辑，加载现有数据
  if (id) {
    // TODO: 加载时间轴数据
  }
}

async function saveTimeline(event, id) {
  event.preventDefault();
  const form = event.target;
  const data = {
    date: form.date.value,
    title: form.title.value,
    icon: form.icon.value,
    description: form.description.value
  };

  const url = id ? `${API_BASE}/timelines/${id}` : `${API_BASE}/timelines`;
  const method = id ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (response.ok) {
    closeModal();
    loadTimelines();
  }
}

async function deleteTimeline(id) {
  if (!confirm('确定要删除这个事件吗？')) return;

  const response = await fetch(`${API_BASE}/timelines/${id}`, {
    method: 'DELETE'
  });

  if (response.ok) {
    loadTimelines();
  }
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
}
```

**Step 2: 添加表单样式**

在 style.css 中添加：
```css
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text-gray);
  font-size: 0.9rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: white;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.actions {
  display: flex;
  gap: 10px;
}

.btn-edit,
.btn-delete {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-edit {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.btn-delete {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.btn-edit:hover,
.btn-delete:hover {
  opacity: 0.8;
}
```

**Step 3: 测试管理后台**

1. 启动服务器
2. 访问 http://localhost:3001/admin/
3. 测试添加时间轴事件

**Step 4: 提交流程**

```bash
git add public/admin/script.js public/admin/style.css
git commit -m "feat: implement timeline management UI"
```

---

## Task 10: 添加简单认证保护

**Files:**
- Create: `server/middleware/auth.js`
- Modify: `server/server.js`
- Create: `public/login.html`

**Step 1: 创建认证中间件**

```javascript
// server/middleware/auth.js
const session = require('express-session');
const crypto = require('crypto');

// 简单密码认证
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'love2024';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'love-memories-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24小时
    httpOnly: true
  }
});

function requireAuth(req, res, next) {
  if (req.session.authenticated) {
    return next();
  }
  res.redirect('/login.html');
}

function login(req, res) {
  const { password } = req.body;

  if (hashPassword(password) === hashPassword(ADMIN_PASSWORD)) {
    req.session.authenticated = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: '密码错误' });
  }
}

function logout(req, res) {
  req.session.destroy();
  res.json({ success: true });
}

module.exports = {
  sessionMiddleware,
  requireAuth,
  login,
  logout
};
```

**Step 2: 创建登录页面**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>登录 - 管理后台</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #2a145f 0%, #160a2d 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .login-box {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(244, 114, 182, 0.3);
      border-radius: 20px;
      padding: 40px;
      width: 90%;
      max-width: 400px;
      backdrop-filter: blur(10px);
    }

    h1 {
      color: white;
      text-align: center;
      margin-bottom: 30px;
      font-size: 1.8rem;
    }

    .form-group {
      margin-bottom: 20px;
    }

    label {
      display: block;
      color: #c7c9d1;
      margin-bottom: 8px;
      font-size: 0.9rem;
    }

    input {
      width: 100%;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(244, 114, 182, 0.3);
      border-radius: 8px;
      color: white;
      font-size: 1rem;
      box-sizing: border-box;
    }

    input:focus {
      outline: none;
      border-color: #f472b6;
    }

    button {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #f472b6, #c9436d);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }

    button:hover {
      transform: translateY(-2px);
    }

    .error {
      color: #ef4444;
      text-align: center;
      margin-bottom: 15px;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="login-box">
    <h1>💕 管理后台登录</h1>
    <div id="error" class="error" style="display: none;"></div>
    <form onsubmit="handleSubmit(event)">
      <div class="form-group">
        <label>密码</label>
        <input type="password" id="password" required />
      </div>
      <button type="submit">登录</button>
    </form>
  </div>

  <script>
    async function handleSubmit(event) {
      event.preventDefault();
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('error');

      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = '/admin/';
      } else {
        errorDiv.textContent = result.error || '登录失败';
        errorDiv.style.display = 'block';
      }
    }
  </script>
</body>
</html>
```

**Step 3: 在 server.js 中添加认证**

```javascript
// server/server.js 添加
const { sessionMiddleware, requireAuth, login, logout } = require('./middleware/auth');

// 应用 session 中间件
app.use(sessionMiddleware);

// 登录 API
app.post('/api/login', (req, res) => {
  login(req, res);
});

app.post('/api/logout', (req, res) => {
  logout(req, res);
});

// 保护管理后台
app.use('/admin', requireAuth);
```

**Step 4: 安装 session 依赖**

```bash
npm install express-session
```

**Step 5: 提交流程**

```bash
git add server/middleware/auth.js server/server.js public/login.html
git commit -m "feat: add authentication for admin panel"
```

---

## Task 11: 优化错误处理

**Files:**
- Modify: `server/server.js`

**Step 1: 添加全局错误处理**

在 server.js 中添加：
```javascript
// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'API endpoint not found'
    }
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  // Multer 文件错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: '文件大小超过限制'
      }
    });
  }

  if (err.message && err.message.includes('只支持')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: err.message
      }
    });
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误'
    }
  });
});
```

**Step 2: 提交流程**

```bash
git add server/server.js
git commit -m "feat: improve error handling"
```

---

## Task 12: 创建 README 文档

**Files:**
- Create: `README.md`

**Step 1: 创建项目文档**

```markdown
# 💕 爱情回忆录网站

一个浪漫的爱情回忆录网站，带管理后台，可以随时记录你们的美好瞬间。

## 功能特性

- ✅ 爱情计时器 - 精确到秒的时间计数
- ✅ 时间轴记录 - 记录重要时刻
- ✅ 照片画廊 - 拍立得风格展示
- ✅ 音乐播放器 - 浪漫背景音乐
- ✅ 管理后台 - 轻松管理内容
- ✅ 响应式设计 - 完美适配手机和电脑

## 技术栈

- 前端：HTML + CSS + JavaScript
- 后端：Node.js + Express.js
- 数据库：SQLite
- 部署：支持 VPS 和云平台

## 快速开始

### 1. 安装依赖

\`\`\`bash
npm install
\`\`\`

### 2. 启动服务器

\`\`\`bash
npm start
\`\`\`

访问 http://localhost:3001

### 3. 管理后台

访问 http://localhost:3001/admin/

默认密码：`love2024`

建议修改密码：设置环境变量 `ADMIN_PASSWORD`

## 部署

### VPS 部署（推荐）

1. 安装 Node.js 18+
2. 克隆项目到服务器
3. 运行 `npm install`
4. 使用 PM2 管理进程：

\`\`\`bash
npm install -g pm2
pm2 start server/server.js --name "love-memories"
pm2 save
pm2 startup
\`\`\`

5. 配置 Nginx 反向代理
6. 配置 HTTPS 证书

详细部署教程请查看 `docs/deployment.md`

## 配置说明

### 环境变量

创建 `.env` 文件：

\`\`\`
PORT=3001
ADMIN_PASSWORD=your-secure-password
SESSION_SECRET=your-session-secret
\`\`\`

### 数据库备份

数据库文件位于 `data/memories.db`

定期备份：

\`\`\`bash
cp data/memories.db backup/memories-$(date +%Y%m%d).db
\`\`\`

## 项目结构

\`\`\`
romantic-memory-website/
├── public/              # 前端文件
│   ├── index.html      # 主页面
│   ├── admin/          # 管理后台
│   └── uploads/       # 上传文件
├── server/             # 后端代码
│   ├── server.js       # Express 服务器
│   ├── database.js     # 数据库配置
│   ├── routes/         # API 路由
│   └── middleware/     # 中间件
├── data/               # SQLite 数据库
└── package.json
\`\`\`

## 开发

\`\`\`bash
# 使用 nodemon 自动重启
npm run dev
\`\`\`

## 许可证

MIT License - 为爱制作 ❤️

---

Made with 💕 for someone special.
```

**Step 2: 提交流程**

```bash
git add README.md
git commit -m "docs: add comprehensive README"
```

---

## Task 13: 最终测试和验证

**Step 1: 完整功能测试**

测试清单：

1. **前端显示**
   - [ ] 访问主页正常显示
   - [ ] 爱情计时器工作正常
   - [ ] 时间轴动态加载
   - [ ] 照片画廊显示
   - [ ] 音乐播放器工作

2. **管理后台**
   - [ ] 登录功能正常
   - [ ] 时间轴 CRUD 操作
   - [ ] 照片上传和删除
   - [ ] 音乐上传和删除
   - [ ] 设置保存

3. **API 测试**
   - [ ] 所有 GET 端点正常
   - [ ] 所有 POST/PUT 端点正常
   - [ ] DELETE 端点正常
   - [ ] 错误处理正确

4. **响应式**
   - [ ] 手机端显示正常
   - [ ] 管理后台移动端可用

**Step 2: 性能检查**

```bash
# 检查数据库
ls -lh data/memories.db

# 检查上传文件
ls -lh public/uploads/
```

**Step 3: 清理和最终提交**

```bash
git add .
git commit -m "feat: complete love memories website upgrade v2.0.0"

# 打标签
git tag v2.0.0
git push --tags
```

---

## 验收标准

完成所有任务后，确认：

✅ **功能完整性**
- [ ] 管理后台可以登录
- [ ] 时间轴可以增删改
- [ ] 照片可以上传和删除
- [ ] 音乐可以上传和播放
- [ ] 前端实时显示所有更新

✅ **代码质量**
- [ ] 所有 API 都有错误处理
- [ ] 数据库操作使用预编译语句
- [ ] 文件上传有类型和大小限制
- [ ] 代码有清晰注释

✅ **性能和安全**
- [ ] API 响应 < 200ms
- [ ] 管理后台有密码保护
- [ ] Session 有过期时间
- [ ] 数据库易于备份

---

## 预计完成时间

| 阶段 | 任务 | 时间 |
|------|------|------|
| 1 | 后端基础搭建 | 1-2小时 |
| 2 | API 实现 | 2-3小时 |
| 3 | 管理后台 | 3-4小时 |
| 4 | 前端集成 | 1-2小时 |
| 5 | 测试优化 | 1小时 |
| **总计** | | **8-12小时** |

---

## 下一步优化（可选）

- [ ] 添加图片自动压缩
- [ ] 添加数据导出功能
- [ ] 添加多语言支持
- [ ] 添加主题切换
- [ ] 添加评论功能

---

**实施计划完成！准备开始编码了 🚀**

记得：YAGNI、TDD、频繁提交、每步都测试。
