# shijianus Theme Alignment Plan

## Goal

以 `hexo-theme-anzhiyu` 为对照基线，继续完善当前 `shijianus` 的 Astro 重构版。目标不是按 Hexo/Pug/Stylus 逐文件照抄，而是把安知鱼已经成熟的功能感、视觉层次和交互闭环，收束成适合当前 Astro 架构的可维护实现。

## Reference Baseline

- Upstream reference:
  - GitHub: https://github.com/anzhiyu-c/hexo-theme-anzhiyu
  - Local mirror in repo: `themes/anzhiyu/**/*`
- Current rebuilt theme:
  - Layout shell: `src/layouts/BlogLayout.astro`
  - Components: `src/components/**/*`
  - Theme config: `src/config/site.ts`
  - Style layers: `src/styles/global.css`, `src/styles/rebuild.css`

## Current Audit Summary

### 1. Dark Atmosphere / `#universe`

- AnZhiYu reference
  - 深色模式默认带 `#universe` 星空层，不是规则网格点阵。
  - `layout/includes/additional-js.pug` 中在 dark 路径注入 `canvas#universe`。
  - `source/css/_extra/fix/dark.css` 明确只在深色模式展示 `#universe`。
- Current shijianus state
  - 已有 `ThemeUniverse.tsx` 和 `starfield / nebula / aurora` 三种暗色背景模式。
  - 但 `ThemeOverlays.tsx` 的 dark toggle 仍直接 `syncTheme()`，没有联动 theme-aware background 逻辑。
  - 结果是部分入口切换 dark 后仍停在 `grid`，用户看到的就是规则点状底景。
- Required fixes
  - 所有 dark toggle 统一走 `applyThemeWithBackground()`。
  - 强化 `starfield` 的视觉辨识度，让 dark 默认明显进入星空状态。
  - 保留手动切换背景能力，但 dark 默认不应落回 `grid`。

### 2. Home Top `#random-hover`

- AnZhiYu reference
  - `source/css/_layout/home_top.styl` 中 `#random-hover` 是简单直接的整层覆盖。
  - 结构就是大 icon + 主文案 + 箭头，hover 时信息层级单一，不会互相挤压。
- Current shijianus state
  - 结构里同时放了 monogram、label、arrow、hint。
  - 大屏和特定宽度下，`bannerText` 与 hint 的节奏不够清晰，视觉上仍会打架。
- Required fixes
  - 改为更接近安知鱼的两段式结构：主视觉 + 副说明。
  - 限制每段最大宽度和换行行为，减少 hover 时的文字冲突。

### 3. Sidebar `card-webinfo` / Workboard

- AnZhiYu reference
  - `card_webinfo.pug` 负责站点总览。
  - `workboard` / runtime 类信息承担“站点正在运行”的状态感。
- Current shijianus state
  - `workboard` 已经被迁进 `card-webinfo`，方向是对的。
  - 但当前更像一个上方的独立提示块，和底部统计没有完全融合成一个“状态总览卡”。
  - 当前还缺少“最近更新 / 最近维护”等更接近安知鱼的真实状态项。
- Required fixes
  - 让 `workboard` 成为 `card-webinfo` 的主状态区，而不是单独贴一个模块。
  - 补足 runtime / 最近更新 / 当前阶段，形成更完整的信息层次。

### 4. Footer Layering

- AnZhiYu reference
  - `footer.pug` 明确分成 `#footer-wrap` 与 `#footer-bar` 两层。
  - `source/css/_layout/footer.styl` 里这两层的背景与密度区分明显。
- Current shijianus state
  - 结构上已经分层。
  - 但 dark 下页尾和正文尾部仍不够断开，`footer-bar` 识别度也不够强。
- Required fixes
  - 强化 `.site-footer` 主体与 `#footer-bar` 的颜色分区和边界。
  - 让 dark footer 有独立的色相，不只是“更深一点的同色块”。

### 5. Post Reward / Share

- AnZhiYu reference
  - `layout/includes/post/reward.pug` 中打赏是直接弹出二维码卡组。
  - `_config.yml` 内 `reward.QR_code` 直接配置二维码图。
  - 分享则通过 `sharejs` / `addtoany` 等真正的多平台入口，而不是空按钮。
- Current shijianus state
  - `PostCopyright.astro` 已经做了分享矩阵、系统分享、复制链接和 WeChat 二维码。
  - 但打赏渠道仍偏“支持入口”，缺少更像原主题那样的二维码配置面与真实入口模型。
  - 渠道配置仍需更诚实，不应该看起来像接入了支付但实际上没有。
- Required fixes
  - reward channel 支持“真实二维码图片”和“二维码值生成”两种模式。
  - 默认配置不再伪装真实收款码；如果仓库没有支付码素材，就保持真实路由描述。
  - 分享矩阵继续保留国际平台和本地平台，并验证按钮与二维码面板交互。

### 6. About Reward Area

- AnZhiYu reference
  - About 页的 reward 区不是孤立名单，而是入口、说明、名单三者组成闭环。
- Current shijianus state
  - 当前 `AboutDashboard.astro` 已显示二维码卡和支持名单。
  - 但和文章页之间还可以进一步统一文案、入口说明和渠道结构。
- Required fixes
  - 统一文章页与 about 页的 reward channel schema。
  - 提高 about 支持区的完成度，避免“有卡片，但入口语义还不够完整”。

## Implementation Scope For This Round

### A. Planning / Documentation

- 更新本文件，明确差异、文件映射和验证标准。

### B. Theme / Background

- Files
  - `src/lib/client-theme.ts`
  - `src/components/ThemeOverlays.tsx`
  - `src/components/ThemeUniverse.tsx`
  - `src/styles/global.css`
- Deliverables
  - 修复 dark toggle 背景联动。
  - 强化 dark 星空层的观感。

### C. Home Hero

- Files
  - `src/components/theme/HomeHero.astro`
  - `src/styles/global.css`
- Deliverables
  - 重做 `#random-hover` 结构与 hover 排版约束。

### D. Aside + Footer

- Files
  - `src/components/theme/Sidebar.astro`
  - `src/components/theme/Footer.astro`
  - `src/styles/global.css`
- Deliverables
  - `card-webinfo` 与 workboard 更深度融合。
  - footer / footer-bar 深色区分加强。

### E. Reward / Share

- Files
  - `src/config/site.ts`
  - `src/components/theme/QrCodeImage.astro`
  - `src/components/theme/PostCopyright.astro`
  - `src/components/theme/AboutDashboard.astro`
  - `src/styles/rebuild.css`
- Deliverables
  - reward channel 新增真实二维码图片支持。
  - about / post 两处共用同一配置面。
  - 校验分享矩阵、系统分享、复制链接和 WeChat 二维码的交互链路。

## Non-goals For This Round

- 不引入完整 Hexo/Pjax 行为复刻。
- 不迁入安知鱼全部第三方插件。
- 不在本轮接入真实评论后端、搜索后端或访问统计服务。
- 不凭空伪造不存在的支付渠道素材。

## Validation Checklist

- `npm run build` 通过。
- dark 模式下默认进入星空背景，不再停留在规则网格。
- `#random-hover` 在桌面宽度下无文字冲突。
- `card-webinfo` 内能同时表达站点状态、运行时长和统计信息。
- footer 与 footer-bar 在 dark 下边界清晰、颜色层次明显。
- 文章页 reward 面板能展示二维码卡组。
- 文章页 share 面板支持复制、系统分享、WeChat 二维码和平台跳转。
- about 页 reward 区与文章页共用统一配置模型。
- 使用 MCP 浏览器检查首页、文章页、关于页关键交互。

## Backlog After This Round

- footer 友链随机刷新
- footer subtitle 动态文案
- 中控台信息密度继续向安知鱼靠拢
- 页面级 dark/light 氛围切换继续细化
- 评论 provider 真正接入
