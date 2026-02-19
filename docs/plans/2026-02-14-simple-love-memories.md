# 爱情回忆录简化版实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将 romantic-memory-website 改造为纯静态 JSON 配置驱动的网站，用户只需编辑 JSON 文件和复制照片即可维护内容。

**Architecture:** 保持原 HTML/CSS/JS 前端设计，将硬编码数据改为从 data.json 动态加载，使用 GitHub + Cloudflare Pages 实现零成本自动部署。

**Tech Stack:** HTML5, CSS3, JavaScript (ES6+), Git, Cloudflare Pages

---

## Task 1: 创建 data.json 配置文件

**Files:**
- Create: `romantic-memory-website/data.json`

**Step 1: 创建示例 data.json**

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
      "description": "还记得那个下午，我们在咖啡馆第一次见面，阳光正好洒在你侧脸..."
    },
    {
      "date": "2023-05-20",
      "title": "第一次旅行",
      "icon": "fa-plane",
      "description": "我们去了海边，看着日落，你说想永远记住这一刻..."
    },
    {
      "date": "2023-08-14",
      "title": "一起做饭",
      "icon": "fa-utensils",
      "description": "你在厨房忙碌的背影，我觉得这就是家的感觉..."
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
    },
    {
      "file": "photo-003.jpg",
      "caption": "你的笑容",
      "category": "日常"
    }
  ],
  "music": [
    {
      "file": "music-001.mp3",
      "title": "Perfect",
      "artist": "Ed Sheeran",
      "duration": "4:23"
    },
    {
      "file": "music-002.mp3",
      "title": "A Thousand Years",
      "artist": "Christina Perri",
      "duration": "4:45"
    }
  ]
}
```

**Step 2: 验证 JSON 格式**

Run:
```bash
cd romantic-memory-website
node -e "JSON.parse(require('fs').readFileSync('data.json'))"
```

Expected: 无错误输出

**Step 3: 提交配置文件**

```bash
git add data.json
git commit -m "feat: add data.json configuration file"
```

---

## Task 2: 创建 photos 文件夹

**Files:**
- Create: `romantic-memory-website/photos/.gitkeep`

**Step 1: 创建文件夹结构**

```bash
mkdir -p romantic-memory-website/photos
mkdir -p romantic-memory-website/music
```

**Step 2: 创建占位文件说明**

创建 `romantic-memory-website/photos/README.md`:

```markdown
# 照片文件夹

将照片放到这个文件夹，命名为：
- photo-001.jpg
- photo-002.jpg
- photo-003.jpg
...

然后在 data.json 的 "photos" 数组中添加对应信息。

支持格式：JPG, PNG, GIF, WebP
建议尺寸：1920x1080 或更大
```

创建 `romantic-memory-website/music/README.md`:

```markdown
# 音乐文件夹

将音乐放到这个文件夹，命名为：
- music-001.mp3
- music-002.mp3
- music-003.mp3
...

然后在 data.json 的 "music" 数组中添加对应信息。

支持格式：MP3, WAV
建议大小：每首不超过 10MB
```

**Step 3: 提交文件夹**

```bash
git add photos/ music/
git commit -m "feat: add photos and music folders with README"
```

---

## Task 3: 修改 script.js 加载 JSON 数据

**Files:**
- Modify: `romantic-memory-website/script.js`

**Step 1: 添加 JSON 加载函数**

在 script.js 顶部添加（约第 6 行之后）：

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

**Step 2: 修改爱情计时器初始化**

将：
```javascript
const startDate = new Date("2023-02-14T00:00:00").getTime();
```

修改为：
```javascript
let startDate = new Date("2023-02-14T00:00:00").getTime();
```

**Step 3: 添加数据初始化函数**

在 changeText 函数之后添加：

```javascript
// 初始化应用数据
async function initApp() {
  const data = await loadData();

  if (data && data.settings) {
    // 更新起始日期
    if (data.settings.startDate) {
      startDate = new Date(data.settings.startDate).getTime();
    }

    // 渲染时间轴
    if (data.timelines && data.timelines.length > 0) {
      renderTimelines(data.timelines);
    }

    // 渲染照片
    if (data.photos && data.photos.length > 0) {
      renderPhotos(data.photos);
    }

    // 加载音乐
    if (data.music && data.music.length > 0) {
      loadMusic(data.music);
    }
  }
}
```

**Step 4: 修改 enterWebsite 函数**

将原来的 enterWebsite 函数修改为：

```javascript
function enterWebsite() {
  clearInterval(textInterval);

  const welcome = document.getElementById("welcomeScreen");
  const main = document.getElementById("mainContent");

  welcome.style.opacity = "0";
  setTimeout(() => {
    welcome.style.display = "none";
    main.classList.add("show-content");

    // 加载并播放音乐
    audio.volume = 0.5;
    audio.play().catch(error => {
      console.log("自动播放被阻止:", error);
    });

    // 初始化应用数据
    initApp();
  }, 800);
}
```

**Step 5: 提交修改**

```bash
git add script.js
git commit -m "feat: load data from JSON instead of hardcoded"
```

---

## Task 4: 添加动态渲染函数

**Files:**
- Modify: `romantic-memory-website/script.js`

**Step 1: 添加时间轴渲染函数**

在 createHeartShower 函数之前添加：

```javascript
// 渲染时间轴
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

  // 重新绑定滚动动画
  window.removeEventListener('scroll', reveal);
  window.addEventListener('scroll', reveal);
  reveal();
}
```

**Step 2: 添加照片渲染函数**

在 renderTimelines 函数之后添加：

```javascript
// 渲染照片
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

**Step 3: 添加音乐加载函数**

在 renderPhotos 函数之后添加：

```javascript
// 加载音乐列表
function loadMusic(musicList) {
  // 更新歌曲对象
  songs = {};
  musicList.forEach((song, index) => {
    const key = `music${index}`;
    songs[key] = {
      url: `music/${song.file}`,
      title: `${song.title} - ${song.artist}`
    };
  });
}
```

**Step 4: 修改原来的歌曲对象定义**

将原来的：
```javascript
const songs = {
  perfect: { url: "myAudio/lagu-perfect.mp3", title: "Perfect - Ed Sheeran" },
  thousand: { url: "myAudio/lagu-thousand.mp3", title: "A Thousand Years" },
  allofme: { url: "myAudio/lagu-allofme.mp3", title: "All of Me - John Legend" }
};
```

修改为：
```javascript
let songs = {};
```

**Step 5: 提交修改**

```bash
git add script.js
git commit -m "feat: add dynamic rendering functions"
```

---

## Task 5: 移除 HTML 中的硬编码数据

**Files:**
- Modify: `romantic-memory-website/index.html`

**Step 1: 移除硬编码的时间轴 HTML**

找到第 130-204 行的时间轴部分，删除所有硬编码的 `<div class="timeline-box">` 元素，只保留：

```html
<div class="timeline">
  <!-- 时间轴将通过 JavaScript 动态生成 -->
</div>
```

**Step 2: 移除硬编码的照片 HTML**

找到第 211-233 行的照片画廊部分，删除所有硬编码的 `<div class="polaroid">` 元素，只保留：

```html
<div class="gallery-container reveal">
  <!-- 照片将通过 JavaScript 动态生成 -->
</div>
```

**Step 3: 移除未使用的音频元素**

删除第 278-280 行的旧音频标签：

```html
<!-- 删除这部分 -->
<audio id="myAudio" loop>
  <source src="myAudio/lagu-kotainitaksamatanpamu.mp3" type="audio/mpeg" />
</audio>
```

**Step 4: 添加新的音频标签**

在 `</main>` 之前添加：

```html
<audio id="myAudio" loop></audio>
```

**Step 5: 提交修改**

```bash
git add index.html
git commit -m "feat: remove hardcoded data, use dynamic rendering"
```

---

## Task 6: 创建 README 文档

**Files:**
- Create: `romantic-memory-website/README.md`

**Step 1: 创建使用说明**

```markdown
# 💕 爱情回忆录

一个浪漫的回忆网站，记录我们的美好瞬间。

## 📝 如何添加内容

### 添加照片

1. 将照片放到 `photos/` 文件夹
2. 命名为 `photo-001.jpg`, `photo-002.jpg` 等
3. 在 `data.json` 的 `photos` 数组中添加信息：

```json
{
  "file": "photo-001.jpg",
  "caption": "海边日落",
  "category": "旅行"
}
```

### 添加时间轴事件

在 `data.json` 的 `timelines` 数组中添加：

```json
{
  "date": "2024-02-14",
  "title": "一周年纪念",
  "icon": "fa-heart",
  "description": "我们一起庆祝了..."
}
```

### 添加音乐

1. 将音乐放到 `music/` 文件夹
2. 命名为 `music-001.mp3`, `music-002.mp3` 等
3. 在 `data.json` 的 `music` 数组中添加信息：

```json
{
  "file": "music-001.mp3",
  "title": "歌曲名",
  "artist": "歌手",
  "duration": "4:23"
}
```

### 修改起始日期

在 `data.json` 的 `settings` 中修改：

```json
{
  "startDate": "2023-02-14"
}
```

## 🚀 部署到 Cloudflare Pages

### 方法一：GitHub 自动部署（推荐）

1. 推送代码到 GitHub
2. 登录 Cloudflare Dashboard
3. 进入 Workers & Pages → Pages
4. 连接 GitHub 仓库
5. 自动部署，全球 CDN 加速

### 方法二：直接上传

1. 在 Cloudflare Pages 点击 "Create a project"
2. 选择 "Direct upload"
3. 拖拽整个文件夹上传
4. 1-2 分钟后网站上线

## 📦 项目结构

```
romantic-memory-website/
├── index.html      # 主页面
├── style.css       # 样式文件
├── script.js       # 前端逻辑
├── data.json       # 数据配置文件
├── photos/         # 照片文件夹
├── music/          # 音乐文件夹
└── README.md       # 说明文档
```

## 💡 提示

- 照片建议尺寸：1920x1080 或更大
- 音乐格式：MP3，每首不超过 10MB
- JSON 格式要正确，注意逗号和引号
- 修改后推送 GitHub 会自动部署

## 📄 许可证

MIT License - 为爱制作 ❤️
```

**Step 2: 提交文档**

```bash
git add README.md
git commit -m "docs: add comprehensive README"
```

---

## Task 7: 创建 .gitignore 文件

**Files:**
- Create: `romantic-memory-website/.gitignore`

**Step 1: 创建 .gitignore**

```bash
# macOS
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# 编辑器
.vscode/
.idea/
*.swp
*.swo
*~

# 临时文件
*.tmp
*.temp
```

**Step 2: 提交 .gitignore**

```bash
git add .gitignore
git commit -m "chore: add .gitignore file"
```

---

## Task 8: 本地测试功能

**Files:**
- Test: Manual testing in browser

**Step 1: 启动本地服务器**

```bash
cd romantic-memory-website
python3 -m http.server 8000
```

**Step 2: 打开浏览器测试**

访问: http://localhost:8000

**Step 3: 验证功能**

测试清单：
- [ ] 页面正常加载
- [ ] 爱情计时器显示正确
- [ ] 时间轴动态渲染
- [ ] 照片显示正常
- [ ] 音乐可以播放
- [ ] 控制台无错误

**Step 4: 测试 JSON 加载**

打开浏览器开发者工具（F12）：
- 查看 Network 标签
- 检查 data.json 是否成功加载
- 检查返回的 JSON 格式是否正确

**Step 5: 测试响应式设计**

- 调整浏览器窗口大小
- 在手机模式下测试
- 验证布局正常

**Step 6: 添加测试照片（可选）**

如果有真实照片：
1. 复制 3 张照片到 photos 文件夹
2. 命名为 photo-001.jpg, photo-002.jpg, photo-003.jpg
3. 验证照片显示正常

---

## Task 9: 推送到 GitHub

**Files:**
- Create: Git repository on GitHub

**Step 1: 初始化 Git 仓库**

```bash
cd romantic-memory-website
git init
```

**Step 2: 添加所有文件**

```bash
git add .
```

**Step 3: 创建首次提交**

```bash
git commit -m "Initial commit: love memories website"
```

**Step 4: 创建 GitHub 仓库**

1. 访问 https://github.com/new
2. 仓库名：`love-memories`
3. 设置为 Public
4. 不要初始化 README（已经有了）
5. 点击 "Create repository"

**Step 5: 连接远程仓库**

```bash
git remote add origin https://github.com/YOUR_USERNAME/love-memories.git
git branch -M main
git push -u origin main
```

替换 `YOUR_USERNAME` 为你的 GitHub 用户名。

**Step 6: 验证推送成功**

访问: https://github.com/YOUR_USERNAME/love-memories

应该能看到所有文件。

---

## Task 10: 连接 Cloudflare Pages

**Files:**
- External: Cloudflare Dashboard

**Step 1: 登录 Cloudflare**

访问: https://dash.cloudflare.com/

**Step 2: 进入 Pages**

左侧菜单 → Workers & Pages → Pages

**Step 3: 创建项目**

点击 "Create a project" → "Connect to Git"

**Step 4: 授权 GitHub**

1. 点击 "Connect GitHub"
2. 登录并授权 Cloudflare
3. 选择 `love-memories` 仓库

**Step 5: 配置构建设置**

```
Build command: (留空)
Build output directory: (留空)
Root directory: (留空)
```

**Step 6: 部署**

点击 "Save and Deploy"

等待 1-2 分钟，构建完成后会显示：
```
✅ Your site is live at: https://love-memories.pages.dev
```

**Step 7: 访问网站**

点击提供的链接，验证网站正常显示。

---

## Task 11: 配置自定义域名

**Files:**
- External: Cloudflare Dashboard + Domain Registrar

**Step 1: 添加自定义域名**

在 Cloudflare Pages 项目中：
1. 点击 "Custom domains"
2. 点击 "Set up a custom domain"
3. 输入你的域名（如 `love.yourdomain.com`）
4. 点击 "Continue"

**Step 2: 配置 DNS**

Cloudflare 会自动检测你的域名是否使用 Cloudflare DNS。

**情况 A：域名在 Cloudflare**

会自动添加 DNS 记录，无需操作。

**情况 B：域名不在 Cloudflare**

Cloudflare 会提供配置说明：
1. 登录你的域名注册商
2. 添加 CNAME 记录：
   ```
   Type: CNAME
   Name: love (或你想要的子域名)
   Target: YOUR_PROJECT.pages.dev
   ```
3. 保存后等待生效

**Step 3: 等待验证**

Cloudflare 会自动检测 DNS 记录，通常需要几分钟到几小时。

**Step 4: 启用 HTTPS**

DNS 验证通过后，Cloudflare 会自动：
- 颁发 SSL 证书
- 启用 HTTPS
- 配置自动重定向

**Step 5: 访问自定义域名**

访问: https://love.yourdomain.com

---

## Task 12: 测试更新流程

**Files:**
- Test: Full update workflow

**Step 1: 添加新照片**

```bash
# 复制照片
cp ~/Downloads/new-photo.jpg romantic-memory-website/photos/photo-004.jpg
```

**Step 2: 更新 data.json**

在 `data.json` 的 `photos` 数组添加：

```json
{
  "file": "photo-004.jpg",
  "caption": "我们的新回忆",
  "category": "生活"
}
```

**Step 3: 提交更改**

```bash
git add photos/photo-004.jpg data.json
git commit -m "Add new photo: our new memory"
git push
```

**Step 4: 等待自动部署**

Cloudflare 会自动检测到推送并重新部署，通常 1-2 分钟。

**Step 5: 验证更新**

访问网站，检查新照片是否显示。

**Step 6: 测试回滚（可选）**

如果发现问题：
```bash
git revert HEAD
git push
```

Cloudflare 会自动回滚到上一个版本。

---

## Task 13: 优化和文档

**Files:**
- Create: `romantic-memory-website/UPDATE.md`

**Step 1: 创建更新指南**

```markdown
# 📝 网站更新指南

## 日常更新流程

### 1. 添加新照片

```bash
# 1. 复制照片到文件夹
cp ~/Downloads/新照片.jpg photos/photo-XXX.jpg

# 2. 编辑 data.json
# 在 "photos" 数组添加：
{
  "file": "photo-XXX.jpg",
  "caption": "照片描述",
  "category": "分类"
}

# 3. 提交
git add photos/photo-XXX.jpg data.json
git commit -m "Add new photo"
git push
```

### 2. 添加时间轴事件

```bash
# 1. 编辑 data.json
# 在 "timelines" 数组添加：
{
  "date": "2024-02-14",
  "title": "事件标题",
  "icon": "fa-heart",
  "description": "事件描述..."
}

# 2. 提交
git add data.json
git commit -m "Add timeline event"
git push
```

### 3. 添加音乐

```bash
# 1. 复制音乐到文件夹
cp ~/Downloads/新歌.mp3 music/music-XXX.mp3

# 2. 编辑 data.json
# 在 "music" 数组添加：
{
  "file": "music-XXX.mp3",
  "title": "歌曲名",
  "artist": "歌手",
  "duration": "4:23"
}

# 3. 提交
git add music/music-XXX.mp3 data.json
git commit -m "Add new music"
git push
```

## 部署状态

查看部署状态：
- 访问 Cloudflare Dashboard
- 进入 Pages → love-memories
- 查看 "Deploys" 标签

## 常见问题

### Q: 网站没有更新？
A:
1. 检查 git push 是否成功
2. 在 Cloudflare 查看部署状态
3. 清除浏览器缓存（Ctrl+Shift+R）

### Q: JSON 格式错误？
A:
1. 使用 https://jsonlint.com 验证格式
2. 检查逗号、引号、括号
3. 运行 `node -e "JSON.parse(require('fs').readFileSync('data.json'))"`

### Q: 照片不显示？
A:
1. 检查文件名是否正确（区分大小写）
2. 检查照片是否在 photos 文件夹
3. 检查 data.json 中的文件名
```

**Step 2: 提交文档**

```bash
git add UPDATE.md
git commit -m "docs: add update guide"
```

---

## Task 14: 最终测试和验证

**Files:**
- Test: Complete functionality test

**Step 1: 功能测试**

在浏览器中完整测试：
- [ ] 页面加载正常
- [ ] 爱情计时器正确显示
- [ ] 时间轴显示所有事件
- [ ] 照片画廊显示所有照片
- [ ] 音乐播放器工作正常
- [ ] 键盘导航（← →）正常
- [ ] 移动端显示正常
- [ ] 控制台无错误

**Step 2: 性能测试**

打开浏览器开发者工具（F12）：
- Network 标签：检查加载时间
- data.json 应该 < 100ms
- 照片应该懒加载
- 总加载时间 < 3 秒

**Step 3: 响应式测试**

测试不同设备：
- [ ] 桌面端（1920x1080）
- [ ] 笔记本（1366x768）
- [ ] 平板（768x1024）
- [ ] 手机（375x667）

**Step 4: 跨浏览器测试**

测试不同浏览器：
- [ ] Chrome
- [ ] Safari
- [ ] Firefox
- [ ] Edge
- [ ] 微信浏览器

**Step 5: 创建版本标签**

```bash
git tag v2.0.0
git push --tags
```

---

## 验收标准

完成所有任务后，确认：

### 功能完整性
- [ ] 用户可以通过编辑 data.json 添加内容
- [ ] 用户可以通过复制照片文件添加照片
- [ ] 网站自动加载 JSON 数据
- [ ] Cloudflare 自动部署
- [ ] 自定义域名正常工作

### 易用性
- [ ] JSON 格式简单直观
- [ ] 文件夹结构清晰
- [ ] README 文档完整
- [ ] 更新流程简单

### 性能
- [ ] 首屏加载 < 3 秒
- [ ] data.json 加载 < 100ms
- [ ] CDN 全球加速
- [ ] 照片懒加载

### 维护性
- [ ] Git 版本管理
- [ ] 自动部署
- [ ] 零运行成本
- [ ] 文档完整

---

## 预计完成时间

| 阶段 | 任务 | 时间 |
|------|------|------|
| 1-3 | 基础搭建 | 30 分钟 |
| 4-6 | 动态渲染 | 1 小时 |
| 7-9 | 部署配置 | 30 分钟 |
| 10-12 | 测试验证 | 30 分钟 |
| 13-14 | 文档优化 | 30 分钟 |
| **总计** | | **3 小时** |

---

## 故障排查

### data.json 加载失败

**原因：**
- JSON 格式错误
- 文件路径错误

**解决：**
1. 使用 JSON Lint 验证格式
2. 检查浏览器控制台错误
3. 运行 `node -e "JSON.parse(require('fs').readFileSync('data.json'))"`

### 照片 404 错误

**原因：**
- 文件名不匹配（区分大小写）
- 照片不在 photos 文件夹

**解决：**
1. 检查 data.json 中的文件名
2. 检查实际文件名（包括扩展名）
3. 确保文件在 photos 文件夹

### Cloudflare 部署失败

**原因：**
- 构建配置错误
- 仓库访问权限问题

**解决：**
1. 检查 Cloudflare 构建日志
2. 重新连接 GitHub 仓库
3. 检查构建设置

### 自定义域名不生效

**原因：**
- DNS 记录未配置
- DNS 记录未生效

**解决：**
1. 使用 nslookup 检查 DNS
2. 等待 DNS 生效（可能需要几小时）
3. 检查 CNAME 记录配置

---

## 下一步优化（可选）

- [ ] 添加图片自动压缩
- [ ] 添加图片懒加载优化
- [ ] 添加 Google Analytics
- [ ] 添加多语言支持
- [ ] 添加主题切换功能

---

**实施计划完成！准备开始编码了 🚀**

记得：YAGNI、TDD、频繁提交、每步都测试。
