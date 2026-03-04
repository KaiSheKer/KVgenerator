# 提示词组装逻辑 - 快速参考

## 🎯 核心原则

```
叙述式描述 > 模块化模板
视觉流线 > 信息堆砌
产品还原 > 其他所有信息
自然语言 > 技术术语
```

---

## 📐 标准结构（7步）

```typescript
// 1. 开头：比例 + 风格
9:16 vertical poster, Organic Magazine Style.

// 2. Logo位置
Top center: Logo 'Brand Name'.

// 3. 中心：产品描述（最重要）
Center: Product description. Strictly restore uploaded product.

// 4. 标题和副标题
Below: Main title in Bold Sans, subtitle in Light Serif.

// 5. 卖点（最多2个）
Key selling points: Point 1 / Point 2.

// 6. 背景和光影
Background is clean and minimalist. Soft morning sunlight.

// 7. 技术规格（收尾）
High-end food photography, 8k resolution, cinematic lighting.
```

---

## 🔑 关键改进点

### 1. 信息密度控制
```typescript
// ❌ 错误：5个卖点全展示
sellingPoints: [sp1, sp2, sp3, sp4, sp5]

// ✅ 正确：最多2个核心卖点
sellingPoints: [sp1, sp2]
```

### 2. 风格一致性检查
```typescript
// ❌ 错误：风格矛盾
visual: 'organic'  // 自然有机
typography: 'sans-serif'  // 霓虹发光

// ✅ 正确：风格统一
visual: 'organic'
typography: 'serif'  // 杂志衬线
```

### 3. 产品还原优先
```typescript
// ✅ 始终放在前面，强化描述
Center: Product. Strictly restore uploaded product image, including packaging, colors, logo position.
```

### 4. 技术规格收尾
```typescript
// ✅ 技术参数放在最后
... (视觉描述)

Professional studio photography, 8k resolution, cinematic lighting.
```

---

## 🎨 风格配置速查表

| 视觉风格 | 推荐光影 | 推荐背景 | 推荐排版 |
|---------|---------|---------|---------|
| magazine | soft morning sunlight, studio lighting | clean minimalist, light beige fabric | serif (粗衬线) |
| watercolor | soft diffuse natural light | watercolor wash, brush strokes | handwritten (手写体) |
| tech | cool blue ambient, rim lighting | dark gradient, geometric patterns | thin (极细线条) |
| vintage | warm tungsten, soft shadows | vintage texture, film grain | serif (粗衬线) |
| minimal | soft even, low contrast | pure white, large negative space | thin (极细线条) |
| cyber | neon glow, colored rim lights | dark urban, neon lights | sans-serif (无衬线粗体) |
| organic | soft natural sunlight, warm tones | natural elements, plant textures | serif (粗衬线) |

---

## 📊 10种海报类型速查

```typescript
01 - hero         // 主KV视觉：产品全貌展示
02 - lifestyle    // 生活场景：实际使用场景
03 - process      // 工艺技术：技术优势可视化
04 - detail       // 细节特写01：材质/品质
05 - detail       // 细节特写02：材料/触感
06 - detail       // 细节特写03：功能/操作
07 - detail       // 细节特写04：用户体验
08 - brand        // 品牌故事：品牌调性展示
09 - specs        // 产品参数：数据可视化
10 - usage        // 使用指南：步骤化说明
```

---

## 💡 常见问题速查

### Q: 提示词太长，怎么压缩？
**A:** 按优先级删减：
1. 卖点：5个 → 2个
2. 规格：详细 → 精简
3. 背景描述：详细 → 关键词

### Q: 风格矛盾怎么解决？
**A:** 检查配置：
```typescript
// 检查这三者是否一致
visual: 'organic'
typography: 'serif'
targetAudience: '自然,健康,纯净'
```

### Q: 如何提高产品还原度？
**A:** 强化描述：
```typescript
// ✅ 使用强化的词汇
Strictly restore the uploaded product image
Precisely reproduce
Exactly match
Keep unchanged
```

### Q: 如何添加新的海报类型？
**A:** 在 `convertProductToPromptConfig` 中：
```typescript
case 'newtype':
  return {
    ...baseConfig,
    productDescription: '...',
    // ...
  };
```

---

## 🔧 代码迁移清单

- [ ] 备份 `promptGenerator.ts`
- [ ] 安装 `promptGeneratorV2.ts`
- [ ] 更新导入语句
- [ ] 替换生成逻辑
- [ ] 测试所有海报类型
- [ ] 验证风格一致性
- [ ] 对比出图质量
- [ ] 调整配置参数

---

## 📈 质量检查清单

生成提示词后，检查：

- [ ] 一次性可读（不被打断）
- [ ] 视觉流线性（像描述画面）
- [ ] 优先级清晰（产品还原 > 其他）
- [ ] 无风格矛盾（视觉/排版/背景）
- [ ] 信息密度合理（卖点不超过2个）
- [ ] 技术规格收尾（不影响视觉描述）
- [ ] 自然语言（少用技术术语）

---

**最后更新**: 2026-02-25
**版本**: v2.0.0
