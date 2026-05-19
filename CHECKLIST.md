# UI 修复自检清单 (CHECKLIST)

请在最终执行 Git Commit 之前，严格对照此清单进行自我核查。如果任何一项未达标，请重新修改代码。

- [ ] **组件间距 (Gap)**
  - 确认 `categoryGroup` 或对应的 flex 容器 `gap` 已经被设置为 `2px`。
- [ ] **悬停拉伸幅度 (Hover State)**
  - 确认 `.categoryGroup:hover .categoryItem:hover` 的弹性伸缩比例已经扩大到了 `flex: 6 1 0%` 或更高，具有夸张的延展性。
- [ ] **未悬停压缩幅度 (Compressed State)**
  - 确认 `.categoryGroup:hover .categoryItem:not(:hover)` 的比例已经压缩至 `flex: 0.25 1 0%` 或类似极限值。
- [ ] **标题文本保护 (Title Constraint)**
  - 确认标题元素未被添加任何会导致字号缩小的属性。
  - 确认标题元素具备了兜底的宽度（`min-width`），且 `white-space` 为 `nowrap`，在极限压缩下也不会变形或遮挡。
- [ ] **描述文本容灾 (Description Text in Compressed State)**
  - 确认已经**专门针对**被压缩的描述文本（`:not(:hover) .categoryButtonDesc`）编写了降级 CSS。
  - 确认该状态下的文本去除了所有的 `text-overflow: ellipsis` 逻辑。
  - 确认该状态下允许缩小字号，且允许自适应换行（2行），保证全部文本可见。
- [ ] **整体向左对齐排版 (Left Alignment Shift)**
  - 确认文本容器的左侧内边距（`padding-left`）被有效减少（例如修改为 `8px`），实现了文本视觉重心的整体左移，且未破坏右侧和上下的呼吸感。
- [ ] **最小改动原则 (Minimal Scope)**
  - 确认除上述 `categoryItem` 相关的分类卡片外，没有对其他的组件、布局、或者全局样式产生污染。
- [ ] **Git 交付 (Final Delivery)**
  - 确认修改已经通过 `git commit` 提交，且准备在输出中附带 Hash 值。
