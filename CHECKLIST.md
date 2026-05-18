### 🚨 UI 精准卡片化封装 Checklist

- [ ] **Phase 1: 容器骨架对齐 (Skeleton Alignment)**
  - [ ] 确保核心容器 `swiper_container_card` 的所有直接子元素被强制应用了 `align-items: stretch;`，视觉上左右两栏**底部绝对像素级对齐**。
  - [ ] 检查区块之间的 `gap` 属性，确保间距与系统整体律动统一。

- [ ] **Phase 2: 右侧卡片封装 (Right Card Containment)**
  - [ ] 确认外壳 `.topGroup` 已设置 `position: relative;` 且**强制设置** `overflow: hidden;`，彻底消除了右侧和底部的内容溢出/溢出乱码。
  - [ ] 校验锚点链接 `.todayCard-link` 被设为块级元素 (`display: block`) 且宽高均为 `100%`，确保其“完整覆盖”整个 `.topGroup`。
  - [ ] 检查背景图片 `.todayCard-cover` 已改为 `position: absolute; object-fit: cover;` 且置于底层（`z-index: 1`），完美撑满空间。

- [ ] **Phase 3: 文字布局与留白 (Typography & Breathe)**
  - [ ] 确认文字容器 `.todayCard-info` 已改为 `position: absolute; bottom: 0;` 被强制“沉底”。
  - [ ] 校验文字内边距（Padding）已增加（建议 `24px - 32px`），拉开了内容与边缘的距离，增强了呼吸感。
  - [ ] 确认在图片上方添加了正确的 `linear-gradient` 渐变遮罩，确保白色文字的可读性。

- [ ] **Phase 4: 像素级验收 (Polishing Acceptance)**
  - [ ] **比例未变**：校验左右容器的宽度百分比/比例与手动退回前完全一致，未发生变形。
  - [ ] **圆角统一**：校验 `.topGroup` 的大卡片圆角已设置为全局统一值（建议 `16px`）。
