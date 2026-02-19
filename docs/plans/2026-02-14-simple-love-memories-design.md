# 爱情回忆录简化版设计文档

**日期：** 2026-02-14
**项目名称：** Romantic Memory Website - 简化版
**目标：** 零代码方式管理内容，纯静态网站
**部署方式：** Cloudflare Pages（自有域名）

---

## 项目概述

将 romantic-memory-website 改造为纯静态 JSON 配置驱动的网站，用户只需编辑简单的 JSON 文件和复制照片文件，无需编写任何代码即可维护内容。

---

## 核心设计原则

### YAGNI（You Aren't Gonna Need It）
- 零后端服务器
- 零数据库
- 零管理后台
- 零构建工具
- 只保留最核心的功能

### 简约优先
- 用户工作流：复制文件 + 编辑 JSON
- 部署方式：Git push + 自动部署
- 维护成本：接近零

---

## 项目结构

```
romantic-memory-website/
├── index.html           # 主页面（保持原设计）
├── style.css            # 样式文件（保持原设计）
├── script.js            # 前端逻辑（修改：读取 JSON）
├── data.json            # 🆕 所有数据配置文件
├── photos/              # 🆕 照片文件夹
│   ├── photo-001.jpg
│   ├── photo-002.jpg
│   └── photo-003.jpg
├── music/               # 🆕 音乐文件夹
│   ├── music-001.mp3
│   └── music-002.mp3
└── README.md            # 使用说明
```

---

## 数据结构

### data.json 完整格式

```json
{
  "settings": {
    "startDate": "2023-02-14",
    "title": "我们的回忆录",
    "language": "zh-CN"
  },
  "timelines": [
    {
      "date": "2023-02-14",
      "title": "第一次见面",
      "icon": "fa-heart",
      "description": "还记得那个下午，我们在咖啡馆第一次见面..."
    },
    {
      "date": "2023-05-20",
      "title": "第一次旅行",
      "icon": "fa-plane",
      "description": "我们去了海边，看着日落，你说想永远记住这一刻..."
    }
  ],
  "photos": [
    {
      "file": "photo-001.jpg",
      "caption": "海边日落",
      "category": "旅行"
    },
    {
      "file": "photo-002.jpg",
      "caption": "纪念日晚餐",
      "category": "生活"
    }
  ],
  "music": [
    {
      "file": "music-001.mp3",
      "title": "Perfect",
      "artist": "Ed Sheeran",
      "duration": "4:23"
    }
  ]
}
```

---

## 前端修改

### 1. 添加 JSON 加载函数

**在 script.js 顶部添加：**

```javascript
// 加载配置数据
async function loadData() {
  try {
    const response = await fetch('data.json');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('加载数据失败:', error);
    return null;
  }
}
```

### 2. 修改爱情计时器

**原来：**
```javascript
const startDate = new Date("2023-02-14T00:00:00").getTime();
```

**修改为：**
```javascript
let startDate = new Date("2023-02-14T00:00:00").getTime();

// 页面加载时从 JSON 获取
async function initApp() {
  const data = await loadData();
  if (data && data.settings) {
    startDate = new Date(data.settings.startDate).getTime();
  }

  // 渲染内容
  if (data) {
    renderTimelines(data.timelines || []);
    renderPhotos(data.photos || []);
    loadMusic(data.music || []);
  }
}

initApp();
```

### 3. 动态渲染时间轴

```javascript
function renderTimelines(timelines) {
  const container = document.querySelector('.timeline');
  if (!container) return;

  container.innerHTML = timelines.map((item, index) => {
    const side = index % 2 === 0 ? 'left' : 'right';
    return `
      <div class="timeline-box ${side} reveal">
        <div class="date-badge">${item.date}</div>
        <div class="box-content">
          <h3><i class="fas ${item.icon || 'fa-heart'}"></i> ${item.title}</h3>
          <p>${item.description || ''}</p>
        </div>
      </div>
    `;
  }).join('');
}
```

### 4. 动态渲染照片画廊

```javascript
function renderPhotos(photos) {
  const container = document.querySelector('.gallery-container');
  if (!container) return;

  container.innerHTML = photos.map((photo, index) => {
    const rotation = index % 2 === 0 ? 'rotate-left' : 'rotate-right';
    return `
      <div class="polaroid ${rotation}">
        <img src="photos/${photo.file}" alt="${photo.caption || ''}" />
        <div class="caption">${photo.caption || ''}</div>
      </div>
    `;
  }).join('');
}
```

---

## 部署方案

### GitHub + Cloudflare Pages

#### 步骤 1：推送到 GitHub

```bash
cd romantic-memory-website
git init
git add .
git commit -m "Initial love memories website"

# 创建仓库后
git remote add origin https://github.com/yourusername/love-memories.git
git push -u origin main
```

#### 步骤 2：连接 Cloudflare Pages

1. 登录 Cloudflare Dashboard
2. 进入 **Workers & Pages** → **Pages**
3. 点击 **Create a project**
4. 选择 **Connect to Git**
5. 授权 GitHub 并选择 `love-memories` 仓库
6. 配置构建设置：
   - **Build command:** （留空）
   - **Build output directory:** `/`
   - **Root directory:** `/`

#### 步骤 3：配置自定义域名

1. 在 Pages 项目设置 → **Custom domains**
2. 添加你的域名（如 `love.yourdomain.com`）
3. Cloudflare 自动配置 DNS 和 HTTPS 证书

---

## 日常使用流程

### 添加新照片

**Step 1：复制照片**
```bash
cp ~/Downloads/新照片.jpg romantic-memory-website/photos/photo-004.jpg
```

**Step 2：编辑 data.json**
```json
{
  "photos": [
    {
      "file": "photo-004.jpg",
      "caption": "我们的新回忆"
    }
  ]
}
```

**Step 3：提交更新**
```bash
git add photos/photo-004.jpg data.json
git commit -m "Add new photo"
git push
```

**Step 4：自动部署**
- Cloudflare 自动检测推送
- 1-2 分钟后网站更新

### 添加时间轴事件

**Step 1：编辑 data.json**
```json
{
  "timelines": [
    {
      "date": "2024-02-14",
      "title": "一周年纪念",
      "icon": "fa-heart",
      "description": "我们一起庆祝了..."
    }
  ]
}
```

**Step 2：提交并推送**
```bash
git add data.json
git commit -m "Add timeline event"
git push
```

---

## 文件命名规范

### 照片命名
```
photo-001.jpg
photo-002.jpg
photo-003.jpg
```

### 音乐命名
```
music-001.mp3
music-002.mp3
```

**好处：**
✅ 有序，易于管理
✅ 避免文件名冲突
✅ 支持批量重命名

---

## 技术对比

### 改进前 vs 改进后

| 项目 | 改进前 | 改进后 |
|------|--------|--------|
| 照片管理 | 硬编码在 HTML | JSON 配置 + 本地文件 |
| 数据来源 | 外链 Unsplash | 本地 photos 文件夹 |
| 添加内容 | 修改 HTML 代码 | 编辑 JSON 文件 |
| 部署 | 手动上传文件 | Git push 自动部署 |
| HTTPS | 需要手动配置 | Cloudflare 自动配置 |
| CDN | 无 | Cloudflare 全球 CDN |
| 成本 | 可能需要 VPS | 完全免费 |

---

## 不需要什么

**❌ 完全不需要：**
- 后端服务器（Node.js、PHP、Python）
- 数据库（MySQL、MongoDB、SQLite）
- 管理后台界面
- 复杂的构建工具
- Webpack、Rollup 等打包工具
- 服务器运行时环境
- VPS 或云服务器

**✅ 只需要：**
- 一个文本编辑器（记事本、VS Code）
- Git 基础操作（`git add`、`git commit`、`git push`）
- GitHub 账号（免费）
- Cloudflare 账号（免费）

---

## 工作原理

```
用户操作：
1. 编辑 data.json（记事本打开）
2. 复制照片到 photos 文件夹
3. git push 推送到 GitHub
        ↓
Cloudflare Pages：
4. 检测到 GitHub 推送
5. 自动构建网站
6. 部署到全球 CDN
        ↓
用户访问：
7. 访问网站，自动加载最新的 data.json
8. 浏览器渲染内容
```

---

## 成功标准

### 功能要求
- ✅ 用户可以编辑 JSON 添加内容
- ✅ 用户可以复制照片文件
- ✅ 网站自动加载最新数据
- ✅ 部署后自动 HTTPS
- ✅ 全球 CDN 加速

### 易用性要求
- ✅ JSON 格式简单直观
- ✅ 记事本就能编辑
- ✅ 无需编程知识
- ✅ 无需安装开发环境

### 维护性要求
- ✅ Git 版本管理
- ✅ Cloudflare 自动部署
- ✅ 零运行成本
- ✅ 零维护负担

---

## 优势总结

### 对比复杂方案

**复杂方案的问题：**
- 需要学习后端开发
- 需要配置服务器
- 需要维护数据库
- 需要处理安全漏洞
- 需要持续监控服务

**简化方案的优势：**
- 纯静态，永不过期
- 零服务器，零成本
- Git 版本，安全可靠
- CDN 加速，全球访问
- 修改简单，记事本即可

---

## 总结

这个设计文档定义了一个极简的爱情回忆录网站方案，通过 JSON 配置文件管理所有内容，使用 Cloudflare Pages 实现零成本部署和全球加速。

**核心价值主张：**
> 最简单的方式守护爱情回忆，编辑 JSON 就像写日记一样轻松。

**下一步：**
调用 `writing-plans` skill 创建详细的实施计划。

---

*设计文档版本：v1.0*
*最后更新：2026-02-14*
