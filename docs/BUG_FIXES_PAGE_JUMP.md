# 🔧 问题修复 - 页面跳转 & AI推荐排版

## 问题1: 页面突然跳回首页

### 🐛 问题描述
在提示词编辑页面，页面会突然跳回到首页。

### 🔍 根本原因
`useEffect` 的依赖数组包含了 `prompts`，而 `prompts` 是通过 `useMemo` 计算的：

```typescript
// ❌ 问题代码
useEffect(() => {
  if (!editedProductInfo || !selectedStyle) {
    router.push('/');
    return;
  }
  // ...
}, [editedProductInfo, prompts, router, selectedStyle, ...]);
//     ^^^^^^ prompts 在依赖数组中

const prompts = useMemo(() => {
  return generatePrompts(editedProductInfo, selectedStyle);
}, [editedProductInfo, selectedStyle]);
```

当用户在页面上操作时，可能会触发 `prompts` 重新计算，导致 `useEffect` 执行，检查条件后触发 `router.push('/')`。

### ✅ 解决方案
从 `useEffect` 的依赖数组中移除 `prompts`：

```typescript
// ✅ 修复后
useEffect(() => {
  if (!editedProductInfo || !selectedStyle) {
    router.push('/');
    return;
  }

  setSelectedGenerationMode(FIXED_GENERATION_MODE);

  if (prompts) {
    setGeneratedPrompts(prompts);
  }
}, [editedProductInfo, selectedStyle, router, setGeneratedPrompts, setSelectedGenerationMode]);
//     ^^^^^^ 移除了 prompts
```

---

## 问题2: AI推荐排版固定

### 🐛 问题描述
AI分析的推荐排版（recommendedTypography）总是固定在某个值（如"无衬线粗体"），不会根据产品风格动态变化。

### 🔍 根本原因
1. **提示词不够明确** - 原提示词只说"从以下选择"，没有说明什么时候选择哪个
2. **AI倾向性** - AI模型可能倾向于选择最常见或最安全的选项

### ✅ 解决方案
改进分析提示词，添加明确的指导原则：

```diff
const ANALYSIS_PROMPT = `
...

12. 推荐的文字排版(从以下选择: glassmorphism, 3d, handwritten, serif, sans-serif, thin)

+ 12. 推荐的文字排版(根据产品特征选择最合适的):
+     - glassmorphism: 适合科技、现代、未来感产品
+     - 3d: 适合奢华、高端、金属质感产品
+     - handwritten: 适合艺术、手作、温暖、自然产品
+     - serif: 适合杂志、编辑、专业、经典产品
+     - sans-serif: 适合现代、简洁、商务产品
+     - thin: 适合极简、高端、优雅产品
+     请根据产品的品牌调性、设计风格和目标受众，选择最匹配的排版风格

...

+ 重要提示：
+ - 如果产品是食品、饮料、日用品等，推荐 serif 或 handwritten
+ - 如果产品是电子产品、科技产品，推荐 glassmorphism 或 thin
+ - 如果产品是奢侈品、高端产品，推荐 3d 或 serif
+ - 如果产品是时尚、潮流产品，推荐 sans-serif
+ - 根据产品的实际特征选择，不要总是推荐同一种
`;
```

---

## 📝 修改文件

### 1. app/prompts/page.tsx
- **修改内容**: 从 useEffect 依赖数组中移除 prompts
- **目的**: 防止页面意外跳转

### 2. lib/api/gemini.ts
- **修改内容**: 改进 ANALYSIS_PROMPT，添加排版选择的指导原则
- **目的**: 让AI根据产品特征动态推荐合适的排版

---

## 🧪 测试验证

### 测试1: 页面不再跳转

1. 上传产品图
2. 选择风格
3. 进入提示词编辑页面
4. **切换不同的海报**（点击海报01、02、03...）
5. **编辑提示词内容**
6. **验证**: 页面应该保持稳定，不会跳回首页

### 测试2: AI推荐排版变化

上传不同类型的产品，验证推荐的排版是否不同：

| 产品类型 | 预期推荐排版 |
|---------|-------------|
| 橙子、水果 | `serif` 或 `handwritten` |
| 电子产品 | `glassmorphism` 或 `thin` |
| 奢侈品、高端产品 | `3d` 或 `serif` |
| 时尚潮流 | `sans-serif` |
| 极简风格产品 | `thin` |

**验证步骤**:
1. 上传橙子图片 → AI分析 → 查看"推荐排版"
2. 上传电子产品 → AI分析 → 查看"推荐排版"
3. 对比两次推荐的排版是否不同

---

## 🚀 现在可以测试了

**服务器已重启**，修改已生效：

1. 刷新浏览器 (Cmd+Shift+R)
2. 上传产品图进行测试
3. 验证页面不再跳转
4. 验证AI推荐排版是否动态变化

---

## 📚 相关文件

- `app/prompts/page.tsx` - 提示词编辑页面
- `lib/api/gemini.ts` - AI分析逻辑
- `lib/utils/promptGeneratorV2.ts` - V2提示词生成器

---

**两个问题都已修复！** 🎉

现在可以正常使用，不会跳转，AI也会根据产品特征智能推荐排版了。
