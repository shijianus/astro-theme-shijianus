### 🚨 V2 重构强制检验清单 (DOM & Flexbox 级对齐)

- [x] **Phase 1: 骨架与维度 (DOM & Layout)**
  - [x] 确认父容器（如 `swiper_container_card`）拥有明确的高度（如 `height: 380px`）和 `display: flex; gap: 20px; align-items: stretch;`。
  - [x] 确认左栏（`flex: 6.5` 或类似）与右栏（`flex: 3.5` 或类似）作为直接子元素并排，且**高度在视觉上绝对像素级平齐**。

- [x] **Phase 2: 左侧内部空间分配 (Left Column)**
  - [x] 左侧容器应用了 `display: flex; flex-direction: column; gap: 20px;`。
  - [x] 左侧**上部主卡片**应用了 `flex: 1` 或 `height: 100%`（使其自动填满除去底部按钮后的剩余高度）。
  - [x] 左侧**底部按钮组**应用了固定的高度（如 `100px` 或 `120px`），且内部 3 个按钮使用 `flex: 1` 等宽排列。

- [x] **Phase 3: 右侧留白与沉底 (Right Column)**
  - [x] 右侧容器是一个单一的卡片容器，且成功被拉伸至与左侧同高（380px）。
  - [x] 右侧容器内部**必须**应用 `display: flex; flex-direction: column; justify-content: flex-end;`。
  - [x] 确认右侧卡片上半部分拥有大面积纯净留白，文本与“更多推荐”悬浮胶囊按钮被强制压在卡片最底部（可配合 padding 控制触底边缘）。

- [x] **Phase 4: 像素级质感 (Polishing)**
  - [x] 全局卡片圆角彻底统一，检查是否有任何卡片漏加了 `border-radius: 16px;`。
  - [x] 检查内边距（Padding）：左侧主卡片和右侧卡片必须有充裕的 `padding`（如 24px-32px），防止内容贴边。
  - [x] 确认“更多推荐”按钮是完全的胶囊状（`border-radius: 999px;`）。
