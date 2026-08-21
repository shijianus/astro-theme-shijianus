# Design Specification: Article Card & Feed Layout

## 布局规范

- **网格列数**：`grid-cols-1 md:grid-cols-2`（固定 2 列，不再扩展到 3/4 列，右侧保留固定宽度侧边栏）
- **间距**：`gap-4`
- **侧边栏结构**：右侧始终保留固定宽度侧边栏（占据约 25%-30% 页面宽度，与主内容区左右并排）

## 卡片规范 (PostCard)

- **卡片容器**：`rounded-xl overflow-hidden bg-[var(--card-bg)] flex flex-col border border-[var(--card-border)]`
- **封面容器**：`aspect-[16/10] w-full overflow-hidden`，内部图片 `object-cover w-full h-full`，永远位于卡片顶部
- **内容区域**：`p-3 flex flex-col gap-1.5`
- **标题**：`text-[15px] font-semibold line-clamp-2 leading-snug`
- **摘要**：卡片列表中不显示摘要正文
- **标签行**：`flex flex-wrap gap-1.5 items-center`，每个标签使用胶囊样式 `px-2 py-0.5 rounded-full text-[11px] bg-[var(--tag-bg)] text-[var(--tag-text)]`
- **日期行**：`text-[11px] text-neutral-400`，与标签行在同一行通过 `justify-between` 左右分开
