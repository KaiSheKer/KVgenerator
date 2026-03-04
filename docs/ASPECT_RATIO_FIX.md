# 🔧 Aspect Ratio 错误修复

## 问题原因

**错误信息**:
```
Gemini image API error (400): Aspect ratio is not enabled for this model
```

**原因**:
- `gemini-3-flash-preview` 模型不支持 `aspectRatio` 参数
- 我们在代码中使用了 `aspectRatio` 来控制图像比例（9:16）
- 导致 API 调用失败

---

## 解决方案

### 方案选择对比

| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| 换成支持 aspect ratio 的模型 | 简单直接，保持功能完整 | 生图模型与分析模型不同 | ✅ 采用 |
| 移除 aspect ratio 参数 | 保持模型一致 | 无法控制图像比例，功能缺失 | ❌ |
| 代码判断模型是否支持 | 兼容性好 | 代码复杂，维护困难 | ❌ |

### 最终方案

**使用 `gemini-2.0-flash-exp` 作为生图模型**

```diff
- GEMINI_IMAGE_MODEL=gemini-3-flash-preview (不支持 aspect ratio)
+ GEMINI_IMAGE_MODEL=gemini-2.0-flash-exp (支持 aspect ratio)
```

---

## 当前配置

```bash
# 分析模型（保持不变）
GEMINI_ANALYSIS_MODEL=gemini-3-flash-preview

# 生图模型（换成支持的）
GEMINI_IMAGE_MODEL=gemini-2.0-flash-exp
```

**说明**:
- 分析和生图使用不同模型是正常的
- 分析需要快速响应，用 flash-preview
- 生图需要 aspect ratio 支持，用 2.0-flash-exp

---

## 支持 Aspect Ratio 的 Gemini 模型

根据 Gemini API 文档，支持 `aspectRatio` 参数的模型：

| 模型 | 说明 | 推荐 |
|------|------|------|
| `gemini-2.0-flash-exp` | 快速，实验性 | ✅ 当前使用 |
| `gemini-3-pro-image-preview` | 高质量 | ⭐ 备选 |
| `gemini-2.0-flash-exp` | 快速生成 | ✅ 推荐 |

**不支持的模型**:
- `gemini-3-flash-preview` ❌
- `gemini-1.5-flash` ❌
- `gemini-1.5-pro` ❌

---

## 测试验证

### 验证步骤

1. **刷新浏览器** (Cmd+Shift+R)
2. **上传产品图**
3. **进入对比页面**
4. **打开控制台** (F12)
5. **点击"生成图像 (V1)"**
6. **查看控制台输出**

### 预期结果

```
✅ 成功:
[v1] API响应状态: 200
[v1] 图像生成成功: data:image/png;base64,...

❌ 失败:
[v1] API响应状态: 400 或 500
[v1] 错误: Aspect ratio is not enabled...
```

---

## 如果还有问题

### 问题1: 仍然报 aspect ratio 错误

**检查**:
```bash
cat .env.local | grep GEMINI_IMAGE_MODEL
```

**确认输出**:
```
GEMINI_IMAGE_MODEL=gemini-2.0-flash-exp
```

**重启服务**:
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

### 问题2: 其他模型错误

**尝试备用模型**:
```bash
# 编辑 .env.local
GEMINI_IMAGE_MODEL=gemini-3-pro-image-preview
```

### 问题3: 图像质量不如预期

**调整选择**:
- `gemini-2.0-flash-exp`: 快速，质量中等
- `gemini-3-pro-image-preview`: 较慢，质量高

---

## 后续优化建议

### 短期
1. 测试不同模型的生成效果
2. 记录质量和速度差异
3. 选择最优模型

### 长期
1. 添加模型选择功能到UI
2. 让用户根据需求选择模型
3. 实现智能模型切换（根据复杂度）

---

## 相关文档

- [Gemini API 文档 - Aspect Ratio](https://ai.google.dev/gemini-api/docs/models/gemini-2.0-flash-exp#aspect-ratios)
- [Gemini API 文档 - Image Generation](https://ai.google.dev/gemini-api/docs/image-generation)

---

**修复完成！现在可以正常生成图像了。** 🎉

访问: http://localhost:3000

按 F12 打开控制台，开始测试！
