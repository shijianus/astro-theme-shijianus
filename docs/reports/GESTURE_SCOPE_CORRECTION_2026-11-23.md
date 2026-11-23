# Gesture 详情页范围与配色修正

生产基准：`2e9074ba9512afe9b7f72c65109d18996ca3ffb4`。本地修正分支：`fix/gesture-detail-scope`。
前一版及无关工作保留在 `refactor/gesturebook-reading`。仅更新已授权的 `shijianus-blog` / `refactor/gesturebook-reading` Preview。

- [x] 将详情实现与公共留言列表、公共 Boost、共享客户端/存储隔离：`0214967` / `02149676b314762b7ce21a78fb6fa6f85f57cf8e`。
- [x] 保持原列表入口兼容详情稳定楼层链接，切换话题时独立初始化：`7cdf15f` / `7cdf15f3bb3d21d61a41fcbecc8eebfe75b8adc9`。列表文件唯一差异为详情 URL 解析的一行正则。
- [x] 恢复详情页随网站切换的亮色与暗色：`3fdde71` / `3fdde71752361d0a483ee632c51e5d4a0f225785`。白色阅读底板、深灰正文、原站蓝色强调；暗色保留原深蓝灰底板。
- [x] 公共 Boost 与详情交互回归、实际截图检查：`1ded941` / `1ded941391085a467774f4b80e34fa9c90520f3f`（见下方真实运行记录）。
- [x] 线上截图复检后，收紧手机时间轴的长相对日期，保持单行：`a9b040d` / `a9b040d9faf1fd14765185ddacd93544b9a6acf9`。
- [ ] 更新 Cloudflare Preview 并线上验收。

## 证据

| 命令 | Exit Code | 日志 |
|---|---|---|
| `node --input-type=module -e 'import { build } from "esbuild"; await build({ entryPoints: ["src/components/theme/gesture-detail/GestureDetailPage.tsx", "functions/api/gestures.ts"], bundle: true, packages: "external", outdir: "/tmp/gesture-scope-compile", logLevel: "info" });'` | 0 | `reports/gesture-scope-correction-20261123/logs/scope-compile.log` |
| `git diff --exit-code 2e9074b -- src/components/theme/GuestbookBoard.tsx src/styles/guestbook-board.css src/lib/comment-client.ts src/lib/gesture-client.ts functions/api/comments.ts functions/_lib/gesture-shared.ts functions/_lib/auth-service.ts src/styles/global.css src/styles/rebuild.css src/pages/status.astro src/components/status docs/standards/status.md` | 0 | `reports/gesture-scope-correction-20261123/logs/public-scope-diff.log` |

本地验收已完成；线上验收记录见本报告后续部分。

## 范围与保留项

公共列表布局、三行 Boost 流、按索引取模分配、悬停暂停、速度计算、30 字自动分类、标题/分区/标签/图片触发 Gesture 的规则，以及公共 API 的 30 字限制均保留生产实现。`GuestbookBoard.tsx` 只有一行详情链接解析差异，接受新详情生成的稳定楼层 ID；共享 `gesture-client.ts`、`comment-client.ts`、`comments.ts`、`gesture-shared.ts`、账号服务及站点样式与生产基准逐字一致。

保留已存储的原贴、回复、Boost、编辑次数与浏览计数。16 字限制仅限详情页内新增 Boost。未删除或过滤已有内容。无新生产部署、Git 推送或数据库迁移。

详情页使用独立 `--gd-*` 颜色变量与 portal 类名，离开详情后不会改变公共列表。移动端只调整详情阅读区的内部留白与顶部间距；导航、公共 Boost、全局工具与音乐入口沿用原版。

## 本地验收

| 命令 | Exit Code | 日志 |
|---|---|---|
| `BLOG_BUILD_TARGET=static PUBLIC_STATIC_EXPORT=1 ./node_modules/.bin/astro build` | 0 | `reports/gesture-scope-correction-20261123/logs/build-final.log` |
| `npm run check` | 0 | `reports/gesture-scope-correction-20261123/logs/typecheck-final.log` |
| `npm run test:brand` | 0 | `reports/gesture-scope-correction-20261123/logs/brand.log` |
| `node scripts/verify-gesture-scope.mjs` | 0 | `reports/gesture-scope-correction-20261123/logs/scope-e2e-final.log` |
| `GESTURE_SHOTS=reports/gesture-scope-correction-20261123/detail node scripts/verify-gesture-detail.mjs` | 0 | `reports/gesture-scope-correction-20261123/logs/detail-e2e-final.log` |
| `node scripts/verify-gesture-link-clicks.mjs` | 0 | `reports/gesture-scope-correction-20261123/logs/link-clicks.log` |
| `node scripts/verify-gesture-baseline-hydration.mjs` | 0 | `reports/gesture-scope-correction-20261123/logs/baseline-hydration-repro.log` |

验证内容：公共 Boost 17/30 字可发表、31 字返回 400；公共编辑器自动分类；三行均匀分配且每条仅出现一次；详情 Boost 不进入公共墙；亮暗两色桌面/手机正文与浮层颜色正确；七档 360–1920px 的详情双轴、头像、线轨尺寸与向上浮层；真实本地 D1 的回复/引用/编辑/删除/表态/链接计数；1001 条回复分页与跨页跳转返回，返程位置偏差 0px；原有内容与统计保留。

本地视觉截图：`reports/gesture-scope-correction-20261123/screenshots/`。此前失败日志一并保留：`scope-e2e.log` 是测试脚本未回到列表就寻找发帖按钮；`scope-e2e-retry.log` 与 `detail-e2e.log` 在其他断言通过后，被原生产已有的 React #418 提示触发错误断言。

最终部署制品构建：`BLOG_BUILD_TARGET=static PUBLIC_STATIC_EXPORT=1 ./node_modules/.bin/astro build`，Exit Code 0，日志 `logs/build-deploy.log`；此构建包含移动端标题均衡换行。Functions 编译：`./node_modules/.bin/wrangler pages functions build --outdir /tmp/gesture-scope-functions`，Exit Code 0，日志 `logs/functions-build.log`。制品 SHA-256 清单：`artifact.json`。上述证据路径均相对于 `reports/gesture-scope-correction-20261123/`。

## 验收限制与参考

结论：**CONDITIONAL GO（仅 Preview）**。详情布局、配色、交互与公共 Boost 回归通过；原公共列表的 SSR 初始化提示保留。原版从 localStorage 初始化已读/书签徽章与服务端 HTML 不一致，旧的相对日期也可触发 React #418；生产域名只读复现到 2 次，当前本地完整回归复现 4 次，React 会重新生成该列表。该原有代码没有为这次视觉任务额外修改。测试明确记录这项已知基线提示，仍阻断其他浏览器错误，不宣称全站零错误。

LinuxDo 参考沿用前一轮下载的官方论坛公开面板截图（Topic Map、父楼、子回复与时间轴），原始 URL 与散列保存在 `reference/sources.json`。`reference/linuxdo-live-challenge.png` 记录其线上访问被验证页拦截；不将公开截图冒称为当前实时面板截图。本轮恢复网站原配色，不复制 LinuxDo 的品牌配色。

## 首轮线上验证（配色修正版）

Preview `https://95ab8e77.shijianus-blog.pages.dev`，源码 `1ded941391085a467774f4b80e34fa9c90520f3f`，部署环境 `preview` / `refactor/gesturebook-reading`。生产部署仍为 `50485961-32f3-417c-89fe-62b502442de0`。

| 命令 | Exit Code | 日志 |
|---|---|---|
| `./node_modules/.bin/wrangler pages deploy dist --project-name shijianus-blog --branch refactor/gesturebook-reading --commit-hash 1ded941391085a467774f4b80e34fa9c90520f3f --commit-dirty=false` | 0 | `logs/deploy.log` |
| `GESTURE_BASE_URL=https://95ab8e77.shijianus-blog.pages.dev GESTURE_SHOTS=reports/gesture-scope-correction-20261123/online node scripts/verify-gesture-deployed.mjs` | 0 | `logs/online.log` |
| `GESTURE_BASE_URL=https://95ab8e77.shijianus-blog.pages.dev GESTURE_COMMIT=1ded941391085a467774f4b80e34fa9c90520f3f GESTURE_STATE_OUTPUT=reports/gesture-scope-correction-20261123/deployment.json node scripts/verify-gesture-deployment-state.mjs` | 0 | `logs/deployment-state.log` |
| `GESTURE_BASE_URL=https://95ab8e77.shijianus-blog.pages.dev node scripts/verify-gesture-public-api.mjs` | 0 | `logs/public-api.log` |

日志路径相对于 `reports/gesture-scope-correction-20261123/`。部署提示工作区有报告改动，只有本地验收报告在部署启动后补记了提交 SHA；已部署的应用源码与 `1ded941` 一致，制品未变化。后续交付部署再次固化证据后执行。

在线检查只读，浏览器拦截所有 POST，详情请求设置 `trackView=0`。真实主题有 4 条回复、2 个真实正文引用链接，已有 Boost 与统计保持原值。公共 API 与生产逐项比较相同，公开存储评论为 5 条，公共 Boost 数据行 0；公共墙显示原有初始化内容，未补造新的数据。线上截图位于 `online/`，确认桌面/移动亮色白底深字，暗色为原深蓝灰；表情向上弹出，父楼展开/跳转/返回恢复成功。

单行日期修正版再次构建：`BLOG_BUILD_TARGET=static PUBLIC_STATIC_EXPORT=1 ./node_modules/.bin/astro build`，Exit Code 0，日志 `reports/gesture-scope-correction-20261123/logs/build-reviewed.log`，制品清单 `artifact-reviewed.json`。
