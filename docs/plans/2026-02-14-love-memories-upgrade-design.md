# 爱情回忆录网站升级设计文档

**日期：** 2026-02-14
**项目名称：** Romantic Memory Website 升级版
**目标：** 长期记录与女朋友的恋爱点滴
**部署方式：** 自己的域名

---

## 项目概述

将现有的纯静态浪漫回忆网站升级为带管理后台的动态 Web 应用，支持通过后台界面随时添加新的时间轴事件、上传照片、管理音乐，打造一个长期维护的爱情回忆录。

---

## 核心设计元素

### 技术栈选择

**前端（保持原样）：**
- HTML5 + CSS3 + 原生 JavaScript
- Font Awesome 图标库
- Google Fonts (Playfair Display + Lato)

**后端：**
- Node.js 18+
- Express.js 4.x
- SQLite3 (数据库)
- Multer (文件上传)
- CORS (跨域支持)

**为什么选择方案 A（轻量级 Node.js API）：**
✅ 保持前端精美设计不变
✅ 后端轻量级，易于维护
✅ SQLite 无需额外数据库服务
✅ 适合个人项目，性能足够
✅ 部署到自己的域名很方便

---

## 项目结构

```
romantic-memory-website/
├── public/                 # 静态资源
│   ├── index.html          # 前端主页面
│   ├── style.css           # 样式文件
│   ├── script.js           # 前端逻辑
│   ├── uploads/            # 上传的文件（照片、音乐）
│   │   ├── photos/
│   │   └── music/
│   └── admin/              # 管理后台
│       ├── index.html
│       ├── style.css
│       └── script.js
├── server/                # 后端代码
│   ├── server.js          # Express 服务器
│   ├── database.js        # SQLite 数据库操作
│   ├── routes/            # API 路由
│   │   ├── timeline.js
│   │   ├── photos.js
│   │   └── music.js
│   └── uploads.js         # 文件上传处理
├── data/                  # 数据存储
│   └── memories.db        # SQLite 数据库
└── package.json
```

---

## 数据库设计

### 1. timelines 表 - 时间轴事件
```sql
CREATE TABLE timelines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  icon TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 2. photos 表 - 照片信息
```sql
CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  caption TEXT,
  category TEXT,
  date_taken DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. music 表 - 音乐列表
```sql
CREATE TABLE music (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  artist TEXT,
  filename TEXT NOT NULL,
  duration TEXT,
  is_active BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 4. settings 表 - 网站设置
```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

---

## API 设计

### 时间轴 API

```javascript
// 获取所有时间轴事件
GET /api/timelines
Response: {
  success: true,
  data: [
    {
      id: 1,
      date: "2023-02-14",
      title: "第一次见面",
      icon: "fa-heart",
      description: "在咖啡馆的第一次见面..."
    }
  ]
}

// 添加新事件
POST /api/timelines
Body: { date, title, icon, description }
Response: { success: true, data: { id, ... } }

// 更新事件
PUT /api/timelines/:id
Body: { date, title, icon, description }
Response: { success: true, data: { id, ... } }

// 删除事件
DELETE /api/timelines/:id
Response: { success: true }
```

### 照片 API

```javascript
// 获取所有照片
GET /api/photos
Response: {
  success: true,
  data: [
    {
      id: 1,
      filename: "photo-001.jpg",
      caption: "海边日落",
      category: "旅行",
      dateTaken: "2023-08-15",
      url: "/uploads/photos/photo-001.jpg"
    }
  ]
}

// 上传照片
POST /api/photos/upload
Content-Type: multipart/form-data
Body: { file: <image>, caption, category, dateTaken }
Response: { success: true, data: { id, filename, url } }

// 删除照片
DELETE /api/photos/:id
Response: { success: true }
```

### 音乐 API

```javascript
// 获取音乐列表
GET /api/music
Response: {
  success: true,
  data: [
    {
      id: 1,
      title: "Perfect",
      artist: "Ed Sheeran",
      filename: "perfect.mp3",
      duration: "4:23",
      url: "/uploads/music/perfect.mp3",
      isActive: true
    }
  ]
}

// 上传音乐
POST /api/music/upload
Content-Type: multipart/form-data
Body: { file: <audio>, title, artist, duration }
Response: { success: true, data: { id, ... } }

// 删除音乐
DELETE /api/music/:id
Response: { success: true }

// 设置当前播放
PUT /api/music/:id/active
Response: { success: true }
```

### 设置 API

```javascript
// 获取设置
GET /api/settings
Response: {
  success: true,
  data: {
    startDate: "2023-02-14",
    language: "zh-CN"
  }
}

// 更新设置
PUT /api/settings
Body: { startDate, language }
Response: { success: true, data: { ... } }
```

---

## 管理后台设计

### 界面布局

```
┌─────────────────────────────────────────────┐
│  Logo  爱情回忆录管理         退出    │ 顶部导航
├─────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────────────────┐ │
│  │ 侧边栏  │  │      内容区域          │ │
│  │ 导航    │  │  表格/表单          │ │
│  │ • 时间轴│  │                     │ │
│  │ • 照片  │  │                     │ │
│  │ • 音乐  │  │                     │ │
│  │ • 设置  │  │                     │ │
│  └─────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 功能模块

**1. 时间轴管理**
- 列表展示所有事件
- 添加/编辑/删除事件
- 图标选择器（Font Awesome）
- 日期排序

**2. 照片管理**
- 网格布局展示照片缩略图
- 拖拽上传
- 批量删除
- 分类标签

**3. 音乐管理**
- 列表显示（播放按钮、歌名、歌手）
- 上传 MP3
- 设置当前播放

**4. 设置页面**
- 纪念日期设置
- 语言选择
- 网站标题

### 安全考虑

- 简单密码保护（硬编码或环境变量）
- Session 认证
- 文件上传大小限制（照片 5MB，音乐 10MB）
- 文件类型验证

---

## 前端集成

### 修改现有前端

**1. 数据来源改为 API**
```javascript
// 从 API 获取数据
async function loadSettings() {
  const response = await fetch('/api/settings');
  const result = await response.json();
  return result.data.startDate;
}

async function loadTimelines() {
  const response = await fetch('/api/timelines');
  const result = await response.json();
  return result.data;
}
```

**2. 时间轴动态渲染**
```javascript
function renderTimelines(timelines) {
  const container = document.querySelector('.timeline');
  container.innerHTML = timelines.map((item, index) => `
    <div class="timeline-box ${index % 2 === 0 ? 'left' : 'right'} reveal">
      <div class="date-badge">${formatDate(item.date)}</div>
      <div class="box-content">
        <h3><i class="fas ${item.icon}"></i> ${item.title}</h3>
        <p>${item.description}</p>
      </div>
    </div>
  `).join('');
}
```

**3. 照片画廊动态渲染**
```javascript
function renderPhotos(photos) {
  const container = document.querySelector('.gallery-container');
  container.innerHTML = photos.map((photo, index) => `
    <div class="polaroid ${index % 2 === 0 ? 'rotate-left' : 'rotate-right'}">
      <img src="/uploads/photos/${photo.filename}" alt="${photo.caption}" />
      <div class="caption">${photo.caption}</div>
    </div>
  `).join('');
}
```

---

## 部署方案

### 开发环境

```bash
# 1. 安装依赖
npm install

# 2. 启动后端服务器
node server/server.js
# 访问 http://localhost:3001

# 3. 或使用 nodemon 自动重启
npx nodemon server/server.js
```

### 生产环境部署

**推荐：自己的 VPS**

1. **购买服务器**
   - 阿里云/腾讯云轻量服务器
   - 配置：1核2G，5M 带宽
   - 系统：Ubuntu 20.04 + Node.js 18

2. **PM2 进程管理**
```bash
npm install -g pm2
pm2 start server/server.js --name "love-memories"
pm2 save
pm2 startup
```

3. **Nginx 反向代理**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }

    location /uploads {
        alias /path/to/romantic-memory-website/public/uploads;
    }
}
```

4. **HTTPS 证书**
   - Let's Encrypt 免费证书
   - Certbot 自动续期

**备选：Railway.app / Render**
- 连接 GitHub 自动部署
- 提供 HTTPS 域名
- 免费额度足够

---

## 开发路线图

### Phase 1: 后端基础（1-2天）
- [ ] 初始化 Express 服务器
- [ ] 配置 SQLite 数据库
- [ ] 实现设置 API（GET/PUT /api/settings）
- [ ] 测试爱情计时器功能

### Phase 2: 时间轴管理（1-2天）
- [ ] 实现时间轴 API（CRUD）
- [ ] 创建管理后台页面
- [ ] 修改前端时间轴为动态加载
- [ ] 测试完整流程

### Phase 3: 照片管理（2-3天）
- [ ] 实现照片上传 API
- [ ] 创建照片管理页面
- [ ] 修改前端照片画廊为动态加载
- [ ] 添加图片优化（缩放、压缩）

### Phase 4: 音乐管理（1-2天）
- [ ] 实现音乐上传 API
- [ ] 创建音乐管理页面
- [ ] 修改前端播放器为动态加载
- [ ] 测试音乐播放功能

### Phase 5: 优化和部署（1-2天）
- [ ] 添加简单登录认证
- [ ] 错误处理优化
- [ ] 响应式测试
- [ ] 部署到生产服务器
- [ ] 备份脚本

**总计：6-11 天**

---

## 核心功能流程

### 爱情计时器
1. 前端从 API 获取 `startDate` 设置
2. 前端 JS 实时计算时间差
3. 每秒更新显示

### 时间轴展示
1. 前端请求 `GET /api/timelines`
2. 后端返回按日期排序的事件列表
3. 前端渲染时间轴组件

### 照片画廊
1. 前端请求 `GET /api/photos`
2. 后端返回照片元数据
3. 前端加载 `/uploads/photos/{filename}`

### 音乐播放器
1. 前端请求 `GET /api/music`
2. 后端返回音乐列表
3. 前端 `<audio>` 标签加载文件

---

## 错误处理

**统一错误响应格式：**
```javascript
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "用户友好的错误信息"
  }
}
```

**常见错误码：**
- `INVALID_INPUT` - 输入数据验证失败
- `FILE_TOO_LARGE` - 文件超过大小限制
- `INVALID_FILE_TYPE` - 不支持的文件类型
- `NOT_FOUND` - 资源不存在
- `DATABASE_ERROR` - 数据库操作失败

---

## 成功标准

### 功能要求
- ✅ 能够通过管理后台添加时间轴事件
- ✅ 能够上传和管理照片
- ✅ 能够上传和管理音乐
- ✅ 能够修改纪念日期等设置
- ✅ 前端实时显示所有更新

### 性能要求
- ✅ 页面加载 < 2秒
- ✅ 照片优化（自动压缩）
- ✅ API 响应 < 200ms

### 维护性要求
- ✅ 代码清晰，注释充分
- ✅ 数据库易于备份
- ✅ 支持数据导出

---

## 设计原则

### YAGNI（You Aren't Gonna Need It）
- 专注核心功能，不过度设计
- 不添加复杂的权限系统
- 不为了技术而技术

### 简约优先
- 管理后台也要美观易用
- 保持前端的浪漫风格
- 每个操作都有友好反馈

### 可维护性
- 代码结构清晰
- 数据库易于备份和迁移
- 部署简单，重启快速

---

## 总结

这个设计文档完整定义了爱情回忆录网站升级的所有关键设计决策，从技术选型到数据库设计，从 API 设计到部署方案都有明确方案。

**核心价值主张：**
> 用技术守护爱情，让每段回忆都能永久保存，随时更新。

**下一步：**
调用 `writing-plans` skill 创建详细的实施计划。

---

*设计文档版本：v1.0*
*最后更新：2026-02-14*
