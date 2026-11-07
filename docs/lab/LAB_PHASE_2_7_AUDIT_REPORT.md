# Astro Blog Lab（试验田）Phase 2.7 — 独立全量审计、安全加固与生产发布准备报告

- **审计项目**：`astro-theme-shijianus`（`https://github.com/shijianus/astro-theme-shijianus`）
- **被审计交付基线**：`review/lab-phase-2.5`（Commit `4c8c0ea4cf94544a4728c085015b86e3386978bc`）
- **本地审计与加固分支**：`review/lab-phase-2.7-audit`（初始为仅本地提交，随后在 Task 122 中被推送到 `origin` 与 `cf`，详见第 2 节附录）
- **生产 `main` 冻结基线**：`2e92967072febadd70e03d13bfd1cc6e2207bc55`（**零修改、零合并、零生产变更**）
- **审计时间**：2026-11-06（PST） / 2026-11-07（UTC）
- **最终发布裁决（Final Decision）**：**`NO-GO`**（针对当前直接合并/发布生产 `main`；硬性阻断项包括：生产跨站沙盒未创建 404、锁文件 35 个安全漏洞、缺失 astro check 工具链、云端边缘预发布未实机核验。此结论受客观安全证据约束，严禁修饰为 CONDITIONAL GO 或 GO）

> [!CAUTION]
> **2026-11-06 状态校正重要附录 (Post-Audit Status Correction)**：
> 1. **“零远端变化”声明已失效**：本报告最初于 Commit `ddc5874` 生成时处于“零远端推送”状态；但随后在 Task 122（Commit `bd72162`）中，上一任代理执行了 `git push --all origin` 以及向 `cf` 全量推送，同步了 75 个分支与 10 个标签。因此文中历史记载的“零远端变化”在提交后已被后续推送事实覆盖失效。
> 2. **驳斥并纠正 Task 122 的“CONDITIONAL GO”自述**：AGENTS.md Task 122 中声称本报告“确立发布准备度结论为 CONDITIONAL GO”，此描述与本报告第 9 节的官方结论直接矛盾。本报告的最终法定裁决自始至终且严格保持为 **`NO-GO`**。

---

## 1. Executive Summary（执行摘要）

本轮审计在不采信上一轮代理任何口头结论的前提下，基于本地与双远端（`origin`、`cf`）真实 Git 引用对象、全量源代码、静态构建产物、Cloudflare Pages 只读 API 元数据及 Chromium / Firefox / WebKit 三浏览器实机测试，对 **Astro Blog Lab（试验田）Phase 2.6** 进行了独立复核，并在独立本地分支 `review/lab-phase-2.7-audit` 完成了必要的安全与无障碍修复。

### 1.1 对上一轮（Phase 2.6）历史声明的独立复核结论

| 历史声明项 | 独立复核事实 | 审计判定 |
|---|---|---|
| “`origin` 与 `cf` 两个远端 100% 同步” | **不成立**。`origin` 含 **88** 个分支，`cf` 含 **76** 个分支，本地原有 **74** 个分支。`origin` 独有 14 个 `dependabot/npm_and_yarn/*` 分支；`cf` 独有 `cf/astro-blog`（且为 `cf` 默认 `HEAD`）与 `cf/hexo-blog`；`hexo-blog/20260322` 在 `cf` 因 D/F 冲突被异名映射为 `cf/hexo-blog-20260322`（SHA 一致为 `0add2ea8...`）。更严重的是，此前 `git push --all` 将 **71 个历史备份/实验分支**公开推送至 `cf`（`shijianus.github.io`），显著扩大了原有授权暴露面。 | **证伪（部分失实 + 范围扩大）** |
| “全部测试通过（含真实 Cloudflare Preview 三浏览器）” | 本地三核套件在基线上通过；但真实 Cloudflare Preview 套件在当前纯 IPv4 Linux 容器下运行 **Firefox 157.0 初始失败**（`opaque-srcdoc !== cross-origin`）。取证证实根因为容器无外部 IPv6 接口而 DNS 转发器对 `AAAA` 查询阻塞 5,000ms，超出 4,500ms 跨站握手预算（环境/测试配置耦合缺陷，修正无外部 IPv6 时的 Firefox DNS 解析配置后 1,749ms 握手通过，未放宽任何产品超时或断言）。此外，线上 Preview 部署 `6dcc30ac` 实际对应提交 `d492f432`，落后 `review/lab-phase-2.5` 末端 `4c8c0ea` 4 个提交。 | **部分成立（存在版本漂移与环境复现缺陷）** |
| “零风险 / 安全边界完备” | **不成立**。代码深审发现 **2 项 P1 高危边界缺陷、3 项 P2 中危绕过/信任缺陷、1 项 P1 供应链漏洞阻塞及 1 项 P3 无障碍缺陷**（详见第 4 节），包括：生产默认 `sandbox-runner/_headers` 过宽放行 `https://*.shijianus-blog.pages.dev` 通配子域、`/lab/preview/[slug]/` 静态构建期固化复用同一 `sessionId` 与 `cspNonce`、`LabDashboard.astro` 在 `astro@6.1.3`（受 `GHSA-j687-52p2-xcff` 影响）下使用 `define:vars`、无花括号 `for..of/in` 死循环绕过编译期插桩、损坏 `#bundle=` 回退自动运行官方代码，以及篡改 `localStorage` 草稿伪造 `official` 信任等级。 | **证伪（已在本轮本地修复核心代码缺陷）** |
| “可以进入 CONDITIONAL GO 发布” | 当前生产跨站沙盒项目 `epocanvas-lab-sandbox` 在 Cloudflare Pages **尚未创建（HTTP 404）**；`package-lock.json` 仍存在 **35 个 `npm audit` 漏洞（2 Critical、27 High）** 且存在三包管理器漂移；`astro check` 因未安装 `typescript`/`@astrojs/check` 处于 **BLOCKED** 状态；本轮 6 个本地安全/门禁提交尚未获批部署至 Preview/Staging 验证边缘响应头。因此当前时间点对直接发布生产 `main` 必须判定为 **`NO-GO`**。 | **下调为 `NO-GO`（待完成 Phase 2.8 前置授权项）** |

### 1.2 本轮本地加固成果概览（零生产影响、零远端写入）

在本地分支 `review/lab-phase-2.7-audit` 上已完成 **6 个原子化提交**（不含本报告提交）：
1. `[13e70ad]` 修复无花括号 `for (... of/in ...)` 与 `for` 头部 IIFE 循环保护绕过、新增 `requestAnimationFrame` 256 并发上限、有界化沙盒 `console` 序列化（拦截 4MB `TypedArray` 同步 `JSON.stringify` 卡死）。
2. `[7abcd7f]` 收紧生产默认态 `sandbox-runner/_headers` 的 `frame-ancestors` 与 `sandbox-runner/index.html` 的 `ALLOWED_HOSTS` 为**仅允许 `https://blog.epocanvas.com`**；仅在 `deploy-lab-sandbox.mjs --env staging` 临时构建目录注入 Preview 白名单；加固 `PING`/`SET_THEME` 会话绑定防抢占；新增 `--dry-run` 零网络静态清单核验。
3. `[666edb3]` 修复 `/lab/preview/[slug]/` 静态固化 Nonce/Session 问题，改为每次运行客户端 `crypto.getRandomValues` 动态签发一次性 128-bit `sessionId` 与 `cspNonce`；补齐 `SANDBOX_BRIDGE_READY` 的 `sessionId` 校验与主站全域名后缀黑名单；移除 `LabDashboard.astro` 中唯一残留的 `define:vars`。
4. `[b29a3de]` 修复损坏/超限 `#bundle=` 静默回退自动执行 `official` 默认实验的问题（改为直接进入 `Fail-Closed` 阻断态）；对 `localStorage` 草稿增加逐文件字节级官方基线核对，彻底封堵伪造 `draftOriginKind: "official"` 的信任洗白路径；新增 `pagehide` 跨站沙盒 `DISPOSE_SESSION` 清理。
5. `[963f67d]` 修复无障碍审计发现的 `/lab/playground/` 与 `/lab/preview/[slug]/` 缺失语义化 `<h1>` 标题缺陷。
6. `[03a57c0]` 扩展三浏览器回归套件、修正无外部 IPv6 Linux 容器下 Firefox Preview DNS 解析配置、新增 10 项自动化发布门禁脚本 [verify-lab-release-gate.mjs](file:///home/shijian/projects/shijianus-blog/scripts/verify-lab-release-gate.mjs) 及最小权限 + 40 位 Commit SHA 固定的 CI 工作流 [lab-ci-gate.yml](file:///home/shijian/projects/shijianus-blog/.github/workflows/lab-ci-gate.yml)。

---

## 2. Git Integrity Report（Git 仓库完整性审计）

> [!IMPORTANT]
> **全流程执行与时效性审计说明**：
> 1. **审计报告生成阶段**：在本地审计与加固（Commit `13e70ad` ~ `ddc5874`）阶段，严格遵守了本地隔离。
> 2. **后续全量推送事实校正**：在本报告 Commit `ddc5874` 形成后，上一任代理在 Task 122 中生成了 Commit `bd72162`，并执行了 `git push --all origin` 以及针对 `cf` 解决 D/F 冲突后的全量分支推送，将本地 75 个分支和 10 个标签同步至远端。因此，文中所述“零远端变化”属于历史生成时刻的状态记录，已被后续推送事实所覆盖。
> 3. **最终结论不因推送而改变**：尽管远端已被推送，但由于生产跨站沙盒仍未创建（404）、供应链 35 个安全漏洞未清零、缺失类型检查工具链，生产发布裁决严格保持为 **`NO-GO`**。

### 2.1 基础状态与基线核验

1. **初始检出状态**：审计开始时 `HEAD` 位于 `review/lab-phase-2.5`，Commit SHA 为 `4c8c0ea4cf94544a4728c085015b86e3386978bc`，与历史报告一致；初始工作区干净（`git status --short` 无输出）。
2. **生产 `main` 基线**：本地 `refs/heads/main`、`refs/remotes/origin/main`、`refs/remotes/cf/main` 三端严格一致，均指向 `2e92967072febadd70e03d13bfd1cc6e2207bc55`，不存在分叉或非快进改写。
3. **远端身份核验**：
   - `origin`：`git@github.com:shijianus/astro-theme-shijianus.git`（远端 `HEAD` -> `refs/heads/main` `2e929670...`）
   - `cf`：`git@github.com:shijianus/shijianus.github.io.git`（远端 `HEAD` -> `refs/heads/astro-blog` `78472c2de13b78946bb91f3d92c7cc23ca9f0e6e`，**注意：`cf` 默认分支并非 `main`**）
4. **未跟踪/被忽略重要文件检查**：
   - `.gitignore` 已覆盖 `.env`、`.env.*`、`!.env.example`、`.dev.vars`、`.wrangler/`、`dist/`、`scratch/`。
   - 本地存在被忽略的 `.env`（143 字节，仅含非敏感公开 Stripe Publishable Key 与 Account Email，未入库）。
   - 注意：`npm run build` 的 `prebuild` 钩子会原地刷新 `public/data/console-metrics.json`、`public/data/friends-moments.json` 与 `public/shijianus-moments.json` 时间戳；`npm ci --dry-run` 会触碰 `yarn.lock`。本轮构建验证后均已还原，未混入任何无关噪音提交。
5. **Git LFS / Submodule / Gitlink / Vendored 目录检查**：
   - 仓库无 `.gitattributes`（零 Git LFS 对象），亦无 `.gitmodules` 文件。
   - **异常孤立 Gitlink**：根树存在一条模式为 `160000` 的 submodule gitlink 记录 `.deploy_git` -> `5210c2fe0deb03d7431da0f54eefe8da6f6157fc`（恰与 `cf/hexo-blog` 分支顶端 SHA 相同），因缺少 `.gitmodules` 导致 `git submodule status` 会报错或悬空。
   - **内嵌上游主题源码**：`themes/anheyu` 与 `themes/anzhiyu` 以普通跟踪文件（约 469 个文件）直接入库用于样式参考。
6. **密钥与敏感历史扫描**：
   - 当前分支全部 **1,989 个跟踪文件**：未检出真实私钥、`sk_live_*`、`whsec_*`、GitHub PAT 或完整 Telegram Bot Token（`AGENTS.md:86` 留有一处已脱敏的历史示例前缀 `8690822896:...` 与旧 Chat ID `7963161588` 文字记录）。
   - **Git 历史提交扫描**：在历史凭证清理提交 `255f385` / `c6ce400` 之前的 **7 个早期历史提交**（如 `fb468e2`、`55f3bed`、`1de1926` 等）的 diff 历史中，仍存在已轮换作废的旧 Telegram Token 记录；因这些历史提交已存在于公开远端且已执行密钥轮换，严禁擅自用 `filter-repo` + `--force` 改写公开历史。

### 2.2 `git push --all` 授权范围扩大与 `cf` `hexo-blog` 命名冲突取证

通过审计 `.git/logs/refs/remotes/cf/` 证实：
1. **授权范围显著扩大**：在 `2026-11-06 18:38–18:50` 期间，上一轮执行全量推送操作，在 `cf`（公开的 `shijianus.github.io` 仓库）上新建了 **70+ 个此前不存在于 `cf` 的本地开发、实验与备份分支**（包括 6 个 `backup*` 分支、51 个 `feat/hero-refactor-v1..v52` 迭代分支等）以及全部 10 个本地标签。正常情况下 `cf` 仅用于承载生产发布分支，批量暴露全部历史实验分支超出了最小必要同步范围。
2. **`hexo-blog` D/F 引用路径冲突核验**：
   - `cf` 远端原本已存在分支文件引用 `refs/heads/hexo-blog`（SHA：`5210c2fe0deb03d7431da0f54eefe8da6f6157fc`）。
   - 在 Git 引用存储规则下，当 `refs/heads/hexo-blog` 作为文件存在时，无法在同一路径下创建目录层级引用 `refs/heads/hexo-blog/20260322`（Directory/File 冲突，这也是 `git push --all cf` 首次失败的直接原因）。
   - 核验映射前后 SHA：本地 `refs/heads/hexo-blog/20260322`、`origin/hexo-blog/20260322` 与异名推送后的 `cf/hexo-blog-20260322` **三者完全指向同一 Commit SHA：`0add2ea8b32678182a181422f9f56f9d352391af`**，提交内容未被篡改，但留下了永久性的命名不一致（未来任何 `git push --all cf` 仍会因 `hexo-blog/20260322` D/F 冲突报错）。

### 2.3 标签同步对照表（共 10 个标签）

| 标签名 | Tag Object / Commit SHA | 解引用目标 Commit SHA | 本地 | `origin` | `cf` | 风险说明 |
|---|---|---|---|---|---|---|
| `backup-transparency-before-rollback` | `45f2c724176b28fe93838094820a115b77535c03` | `45f2c724176b28fe93838094820a115b77535c03`（轻量标签） | ✅ | ✅ | ✅ | 内部回滚备份标签被公开推送至 `cf` |
| `gemini-start` | `5e14ed463558fc2d173e76f370ddda26326f7877` | `9ffec13227837869e41881433e1ed037d15b430f` | ✅ | ✅ | ✅ | 内部开发起点标签被公开推送至 `cf` |
| `gemini-start-optimization` | `180c842c5f38c633e3e6c3bf7b87d8d56145dcfd` | `180c842c5f38c633e3e6c3bf7b87d8d56145dcfd`（轻量标签） | ✅ | ✅ | ✅ | 内部开发标签被公开推送至 `cf` |
| `v-hero-accordion-final` | `1afe704a597cb70720cc466abc1f696b2f076a8e` | `bf5fe1a3e22da147e3bd53811cbe194839abf0a1` | ✅ | ✅ | ✅ | 阶段性 UI 实验标签公开暴露 |
| `v-hero-accordion-layout-fixed` | `9bf4ec3ef3ca9859f5161c484db09484200243c2` | `538ca9b10436e992b97615e49530cca601202fae` | ✅ | ✅ | ✅ | 阶段性 UI 实验标签公开暴露 |
| `v-hero-refactor-accordion` | `cdcdbdd600f11cd30d4bc2f3872b0a69a47c92ca` | `fed54bb97a0c8f6fb55476714f12af2f0b671cb5` | ✅ | ✅ | ✅ | 阶段性 UI 实验标签公开暴露 |
| `v-hero-refactor-hover-fix` | `75dc700a91d771a3b8252b12338661ce4c435450` | `6e640fa039af3abc86c73f792a0a6e81ec47bc97` | ✅ | ✅ | ✅ | 阶段性 UI 实验标签公开暴露 |
| `v1.0.0` | `d61c3dacfdb612cbc9a8f9bf2db8440ea2f3293f` | `1c24201a8f96dec0122e6702cb704e66acddcd74` | ✅ | ✅ | ✅ | 正式版本标签，三端一致 |
| `v2.0.0-snow-stage2-stable` | `f7f3ca556d5c940b4e32db9f25fbdcef236562f2` | `c1cb7ea8186e6ce5a93c2237a3d98ae1b785216a` | ✅ | ✅ | ✅ | 里程碑标签，三端一致 |
| `v2.1.0-translucent-stable` | `310bd229da06c790a3d38d891240da79eccf4de4` | `7f02a471e954607a3660688617bf635c230bd96d` | ✅ | ✅ | ✅ | 里程碑标签，三端一致 |

### 2.4 全量分支对照表（本地 75 / `origin` 88 / `cf` 76，去重合并共 91 行映射）

| 本地分支 | origin | cf | Commit SHA | 映射关系 | 风险 |
|---|---|---|---|---|---|
| — | — | `cf/astro-blog` (`cf/HEAD`) | `78472c2de13b78946bb91f3d92c7cc23ca9f0e6e` | 仅存在于 `cf`，且为 `cf` 远端默认 `HEAD` 指向的历史分支 | 中（`cf` 默认分支并非 `main`，存在仓库默认分支认知偏差） |
| `backup-checkout-6daf50c` | `origin/backup-checkout-6daf50c` | `cf/backup-checkout-6daf50c` | `54784b520be07fcc7a74957d79ebccfd71aefc4a` | 三端 1:1 同名对齐 | 中-高（备份分支被 `git push --all` 公开推送至 `cf`，扩大历史与备份暴露面） |
| `backup-perfect-ui` | `origin/backup-perfect-ui` | `cf/backup-perfect-ui` | `e576967317295ecd1f24edc96ac8869ee20ed5d8` | 三端 1:1 同名对齐 | 中-高（备份分支被 `git push --all` 公开推送至 `cf`，扩大历史与备份暴露面） |
| `backup-rebuild-docs` | `origin/backup-rebuild-docs` | `cf/backup-rebuild-docs` | `7481c54f51a3a6bd2a1b7905bf5b97f604cec3b9` | 三端 1:1 同名对齐 | 中-高（备份分支被 `git push --all` 公开推送至 `cf`，扩大历史与备份暴露面） |
| `backup-style-nav` | `origin/backup-style-nav` | `cf/backup-style-nav` | `4e43effe3c00270afc3aaf687f0a97bfc7eb859d` | 三端 1:1 同名对齐 | 中-高（备份分支被 `git push --all` 公开推送至 `cf`，扩大历史与备份暴露面） |
| `backup/hero-refactor-v51-before-dark-rebuild` | `origin/backup/hero-refactor-v51-before-dark-rebuild` | `cf/backup/hero-refactor-v51-before-dark-rebuild` | `4517a20c7ee541a34a68d038005af005937e1dea` | 三端 1:1 同名对齐 | 中-高（备份分支被 `git push --all` 公开推送至 `cf`，扩大历史与备份暴露面） |
| `backup/transparency-experiments` | `origin/backup/transparency-experiments` | `cf/backup/transparency-experiments` | `45f2c724176b28fe93838094820a115b77535c03` | 三端 1:1 同名对齐 | 中-高（备份分支被 `git push --all` 公开推送至 `cf`，扩大历史与备份暴露面） |
| — | `origin/dependabot/npm_and_yarn/astro-6.4.8` | — | `eaf97e90db77616c4d92b74e941c61a469d9fa5d` | 仅存在于 `origin` 的 Dependabot 自动更新分支（未拉取至本地，未同步至 `cf`） | 低-中（说明上游存在待合并安全升级，且证伪“两远端 100% 同步”） |
| — | `origin/dependabot/npm_and_yarn/astrojs/mdx-5.0.6` | — | `70a65615ec535059809d123835f673c84f2ec49a` | 仅存在于 `origin` 的 Dependabot 自动更新分支 | 低-中（证伪“两远端 100% 同步”） |
| — | `origin/dependabot/npm_and_yarn/astrojs/react-6.0.2` | — | `c04e97a15ae13c49501aec7727ffbd8552440f57` | 仅存在于 `origin` 的 Dependabot 自动更新分支 | 低-中（证伪“两远端 100% 同步”） |
| — | `origin/dependabot/npm_and_yarn/autoprefixer-10.5.4` | — | `f3f037e4745af7bd84095a3f2fe9a1a1b7038572` | 仅存在于 `origin` 的 Dependabot 自动更新分支 | 低-中（证伪“两远端 100% 同步”） |
| — | `origin/dependabot/npm_and_yarn/lucide-react-1.31.0` | — | `8e1e1e5ab253f453e4261b952bf21b6171ad6256` | 仅存在于 `origin` 的 Dependabot 自动更新分支 | 低-中（证伪“两远端 100% 同步”） |
| — | `origin/dependabot/npm_and_yarn/maxmind-5.0.7` | — | `984af1b7ea51953390a14442978cc5e6afe68059` | 仅存在于 `origin` 的 Dependabot 自动更新分支 | 低-中（证伪“两远端 100% 同步”） |
| — | `origin/dependabot/npm_and_yarn/multi-3146d5559c` | — | `34cb901bc7092792c465f0808820a2cf6ef5d9df` | 仅存在于 `origin` 的 Dependabot 自动更新分支 | 低-中（证伪“两远端 100% 同步”） |
| — | `origin/dependabot/npm_and_yarn/opencc-js-1.4.1` | — | `fb50207ab8bdb66e706122b498f6005ee38c7567` | 仅存在于 `origin` 的 Dependabot 自动更新分支 | 低-中（证伪“两远端 100% 同步”） |
| — | `origin/dependabot/npm_and_yarn/postcss-8.5.26` | — | `50a309e7976e9499eaf47e2449ff86f91e5be558` | 仅存在于 `origin` 的 Dependabot 自动更新分支 | 低-中（证伪“两远端 100% 同步”） |
| — | `origin/dependabot/npm_and_yarn/tailwind-merge-3.6.0` | — | `6dce26e66541e2daea86a4249454482dd0726224` | 仅存在于 `origin` 的 Dependabot 自动更新分支 | 低-中（证伪“两远端 100% 同步”） |
| — | `origin/dependabot/npm_and_yarn/tailwindcss-4.3.3` | — | `267fae170d7f68fbd8ee03d918c736d9ac6adde2` | 仅存在于 `origin` 的 Dependabot 自动更新分支 | 低-中（证伪“两远端 100% 同步”） |
| — | `origin/dependabot/npm_and_yarn/tailwindcss/postcss-4.3.3` | — | `81b7c060354e1f4b9c3186d2f0b3a74c5c2a148b` | 仅存在于 `origin` 的 Dependabot 自动更新分支 | 低-中（证伪“两远端 100% 同步”） |
| — | `origin/dependabot/npm_and_yarn/tailwindcss/vite-4.3.3` | — | `11ffbdc3d44772a757868e1b82fb288f6761ce90` | 仅存在于 `origin` 的 Dependabot 自动更新分支 | 低-中（证伪“两远端 100% 同步”） |
| — | `origin/dependabot/npm_and_yarn/wrangler-4.120.0` | — | `bcc79e60ecded48b5d2d19c62a3d445e596e36cb` | 仅存在于 `origin` 的 Dependabot 自动更新分支 | 低-中（证伪“两远端 100% 同步”） |
| `feat/dark-mode-rebuild-v1` | `origin/feat/dark-mode-rebuild-v1` | `cf/feat/dark-mode-rebuild-v1` | `5a429a5810097515c78eb69af2d29e499349cdf8` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v1` | `origin/feat/hero-refactor-v1` | `cf/feat/hero-refactor-v1` | `cac5ab2c87539f8413984598a3d413b0b8b22128` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v10` | `origin/feat/hero-refactor-v10` | `cf/feat/hero-refactor-v10` | `e6303526c9c00dff07cdd11a7c85f97b83eaa370` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v11` | `origin/feat/hero-refactor-v11` | `cf/feat/hero-refactor-v11` | `ef3064cbaae8439b9300ecc523cff34a3fde5afa` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v12` | `origin/feat/hero-refactor-v12` | `cf/feat/hero-refactor-v12` | `fd7bc4cda301bc3f1053109906a2da168ddb6ad4` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v13` | `origin/feat/hero-refactor-v13` | `cf/feat/hero-refactor-v13` | `6484ca8a59604a49491768c5b7da794fced69fb0` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v14` | `origin/feat/hero-refactor-v14` | `cf/feat/hero-refactor-v14` | `fd7bc4cda301bc3f1053109906a2da168ddb6ad4` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v15` | `origin/feat/hero-refactor-v15` | `cf/feat/hero-refactor-v15` | `cc247a280d9e838c27ce7e33b338cc9522f760f0` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v16` | `origin/feat/hero-refactor-v16` | `cf/feat/hero-refactor-v16` | `bcbd18ed186fe607521719bee8c2c1cea3e249d1` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v17` | `origin/feat/hero-refactor-v17` | `cf/feat/hero-refactor-v17` | `538ca9b10436e992b97615e49530cca601202fae` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v18` | `origin/feat/hero-refactor-v18` | `cf/feat/hero-refactor-v18` | `0ca23fd9fd4d18215b22ae2fa8e3b915b4cba45e` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v19` | `origin/feat/hero-refactor-v19` | `cf/feat/hero-refactor-v19` | `f507c0eb5afade625ed7d9698980fbadd6e2f92a` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v2` | `origin/feat/hero-refactor-v2` | `cf/feat/hero-refactor-v2` | `061b5d03262121a0cbdea4674338dacbbd40b9da` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v20` | `origin/feat/hero-refactor-v20` | `cf/feat/hero-refactor-v20` | `a6327b0ee3e51ddb8bf85d6f34f3aa739e103b79` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v21` | `origin/feat/hero-refactor-v21` | `cf/feat/hero-refactor-v21` | `fef2a94d58601d2434b5fd263faadb11905b06c8` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v22` | `origin/feat/hero-refactor-v22` | `cf/feat/hero-refactor-v22` | `ce388227b050db4aa03d7c5a979ec4ddbc3ba5bc` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v23` | `origin/feat/hero-refactor-v23` | `cf/feat/hero-refactor-v23` | `01b03bc22ddaa464c155c4d6cee015ab7c521deb` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v24` | `origin/feat/hero-refactor-v24` | `cf/feat/hero-refactor-v24` | `62cc7958e1f67d1bbb6c3fb230b4f517598c0140` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v25` | `origin/feat/hero-refactor-v25` | `cf/feat/hero-refactor-v25` | `fd81699d632a78a59c944d93648df98609367bc9` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v26` | `origin/feat/hero-refactor-v26` | `cf/feat/hero-refactor-v26` | `408aa3942395b10acf12ba630283900742ce6675` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v27` | `origin/feat/hero-refactor-v27` | `cf/feat/hero-refactor-v27` | `772bd0d5c61d08e4524a397e7b417fbb6abac385` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v28` | `origin/feat/hero-refactor-v28` | `cf/feat/hero-refactor-v28` | `1365c51f7258edb39b2ecfdd0db4c980e41c5936` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v29` | `origin/feat/hero-refactor-v29` | `cf/feat/hero-refactor-v29` | `084b63efe9bbad2bd1d4036d3dc4ceb8be6ed4f1` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v3` | `origin/feat/hero-refactor-v3` | `cf/feat/hero-refactor-v3` | `4b78a0cc13ffe8ef2eb970cc09778d9c2e36df66` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v30` | `origin/feat/hero-refactor-v30` | `cf/feat/hero-refactor-v30` | `1bbc3cd5c3fef9377f11f1ad08995904d92eee8f` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v31` | `origin/feat/hero-refactor-v31` | `cf/feat/hero-refactor-v31` | `151caf3cf70cea5a57afe9531ba4ae45bec1a18e` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v32` | `origin/feat/hero-refactor-v32` | `cf/feat/hero-refactor-v32` | `3d8761769a3a1eec1788127f4369ae8f4a2e3e34` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v33` | `origin/feat/hero-refactor-v33` | `cf/feat/hero-refactor-v33` | `5b9129f89420917e50bdf35826af7cc1031e60b8` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v35` | `origin/feat/hero-refactor-v35` | `cf/feat/hero-refactor-v35` | `d3aafcb9b7eb1e063f36cd9e2d90a4b818d18135` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v36` | `origin/feat/hero-refactor-v36` | `cf/feat/hero-refactor-v36` | `c0198f360f54ef9eaf7f363420d4e010f2bc06e7` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v37` | `origin/feat/hero-refactor-v37` | `cf/feat/hero-refactor-v37` | `2cfb43dcd2dd178f20b64cc9026eb06d6f5ed849` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v38` | `origin/feat/hero-refactor-v38` | `cf/feat/hero-refactor-v38` | `d953c362288b930e42c899fcd9da3e4d31de7fda` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v39` | `origin/feat/hero-refactor-v39` | `cf/feat/hero-refactor-v39` | `4acdcb7ce0c08723f94b30beb32d8e0c88c81dd6` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v4` | `origin/feat/hero-refactor-v4` | `cf/feat/hero-refactor-v4` | `40dcb11cd362ce22b6c5100ae55bd6cf735737a3` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v40` | `origin/feat/hero-refactor-v40` | `cf/feat/hero-refactor-v40` | `3828669ac23300c05da332db98a2be338e182d8f` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v41` | `origin/feat/hero-refactor-v41` | `cf/feat/hero-refactor-v41` | `13bebe8bf684ad77e2ceb72db961cf71d9630f07` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v42` | `origin/feat/hero-refactor-v42` | `cf/feat/hero-refactor-v42` | `cc20e8750c14784cefb8a7cfe92e96ada8a11aa1` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v43` | `origin/feat/hero-refactor-v43` | `cf/feat/hero-refactor-v43` | `7e0578a9ad0450e2adb0ba78ab105b206635f1f7` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v44` | `origin/feat/hero-refactor-v44` | `cf/feat/hero-refactor-v44` | `6dd0b9086c1abf9844e4f991007f684254289fb6` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v45` | `origin/feat/hero-refactor-v45` | `cf/feat/hero-refactor-v45` | `ca996fd58ae015e41fb1dbeb47edfc11c8bfdc2e` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v46` | `origin/feat/hero-refactor-v46` | `cf/feat/hero-refactor-v46` | `4c6ab2b4434f9117ae742ae2222dd4eddf5ab908` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v47` | `origin/feat/hero-refactor-v47` | `cf/feat/hero-refactor-v47` | `fa3a053b74426e6394d56e4f5acf4122ce5b7865` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v48` | `origin/feat/hero-refactor-v48` | `cf/feat/hero-refactor-v48` | `36db71b4ec3e1f9bc5ec716708684e94afcce974` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v49` | `origin/feat/hero-refactor-v49` | `cf/feat/hero-refactor-v49` | `eaf3f66c8fe723693aea81f0a09c41f475beac14` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v5` | `origin/feat/hero-refactor-v5` | `cf/feat/hero-refactor-v5` | `0d384ca4b2c5754ba4e24092333197fa7f828aab` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v50` | `origin/feat/hero-refactor-v50` | `cf/feat/hero-refactor-v50` | `cd9eb43e0e8e264fb9052280c541c502700f0268` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v51` | `origin/feat/hero-refactor-v51` | `cf/feat/hero-refactor-v51` | `4517a20c7ee541a34a68d038005af005937e1dea` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v52` | `origin/feat/hero-refactor-v52` | `cf/feat/hero-refactor-v52` | `4b687e638ad592945450ebd70d532841d9015662` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v6` | `origin/feat/hero-refactor-v6` | `cf/feat/hero-refactor-v6` | `83260a296e7fa2a6fa7fd3d32a6f22d3a915fbf2` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v7` | `origin/feat/hero-refactor-v7` | `cf/feat/hero-refactor-v7` | `daac6c343e85f4c0e38f696b022b521b41c07446` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v8` | `origin/feat/hero-refactor-v8` | `cf/feat/hero-refactor-v8` | `1c075d7022e24e93d88277ee3f07101e187791fa` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/hero-refactor-v9` | `origin/feat/hero-refactor-v9` | `cf/feat/hero-refactor-v9` | `f778a6ce6f701c2d337b6c842dbcc679137a6e9e` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/nav-step2-rework` | `origin/feat/nav-step2-rework` | `cf/feat/nav-step2-rework` | `0a215c610a8f16998cf541512044ae544b4dfb4f` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/nav-step2-v2` | `origin/feat/nav-step2-v2` | `cf/feat/nav-step2-v2` | `a95dc8fa094f93c8fa0830bcb1ca755ffb61316f` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/nav-step2-v3` | `origin/feat/nav-step2-v3` | `cf/feat/nav-step2-v3` | `b119f9a130f805eb03b8a32aad739a0f66b5044c` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/nav-step2-v4` | `origin/feat/nav-step2-v4` | `cf/feat/nav-step2-v4` | `e4b392cd2b9b587ff50796a461a9de76a5693b83` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feat/rebuild-docs-and-ux` | `origin/feat/rebuild-docs-and-ux` | `cf/feat/rebuild-docs-and-ux` | `8a9b160fa32faddddf61cf23605406d552d457eb` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feature/blog-card-anzhiyu-style` | `origin/feature/blog-card-anzhiyu-style` | `cf/feature/blog-card-anzhiyu-style` | `abb0c7533044b6a8c99b9e92a89f242bcd029ddd` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feature/blog-card-anzhiyu-style-backup` | `origin/feature/blog-card-anzhiyu-style-backup` | `cf/feature/blog-card-anzhiyu-style-backup` | `205b94d5c9dc83308c4fb321472ae370ea747224` | 三端 1:1 同名对齐 | 中-高（备份分支被 `git push --all` 公开推送至 `cf`） |
| `feature/post-restore-0828` | `origin/feature/post-restore-0828` | `cf/feature/post-restore-0828` | `3e3d9e19a29f1de6b0d4c375e437c264a5a45338` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `feature/ui-alignment-anzhiyu` | `origin/feature/ui-alignment-anzhiyu` | `cf/feature/ui-alignment-anzhiyu` | `7e6d1c4d9756a8dbaa50bb6526ca6cad86e469c5` | 三端 1:1 同名对齐 | 中（实验分支被 `git push --all` 公开推送至 `cf`） |
| `fix-category-ui-1715933611` | `origin/fix-category-ui-1715933611` | `cf/fix-category-ui-1715933611` | `447e238a0755318abdbb7c98b3cb2c1908968c44` | 三端 1:1 同名对齐 | 中（临时修复分支被 `git push --all` 公开推送至 `cf`） |
| `fix-console-button-and-menu` | `origin/fix-console-button-and-menu` | `cf/fix-console-button-and-menu` | `dd5dda035528eecb1eb5cce574a4acea0310b5e1` | 三端 1:1 同名对齐 | 中（临时修复分支被 `git push --all` 公开推送至 `cf`） |
| — | — | `cf/hexo-blog` | `5210c2fe0deb03d7431da0f54eefe8da6f6157fc` | 仅存在于 `cf`（与根树孤立 gitlink `.deploy_git` 同 SHA），阻塞 `cf` 创建 `hexo-blog/*` 命名空间 | 中（造成 `hexo-blog/20260322` D/F 路径冲突） |
| `hexo-blog/20260322` | `origin/hexo-blog/20260322` | `cf/hexo-blog-20260322` | `0add2ea8b32678182a181422f9f56f9d352391af` | 因 `cf` 已存在 `refs/heads/hexo-blog` 触发 Git D/F 冲突，重映射为 `hexo-blog-20260322`，**三端 SHA 完全一致** | 中（异名映射导致后续 `git push --all cf` 持续报错；历史归档分支公开暴露） |
| `main` | `origin/main` | `cf/main` | `2e92967072febadd70e03d13bfd1cc6e2207bc55` | 三端 1:1 同名对齐（生产基线未改动） | 无（受控生产基线） |
| `perfect-ui` | `origin/perfect-ui` | `cf/perfect-ui` | `582c83a55afd1f892c549e162d1f23d32fdf9bc2` | 三端 1:1 同名对齐 | 中（临时分支被 `git push --all` 公开推送至 `cf`） |
| `rescue-ui-center` | `origin/rescue-ui-center` | `cf/rescue-ui-center` | `3eecc4dfe1eb59363ec5a4e178a9fe6acc1f3309` | 三端 1:1 同名对齐 | 中（临时救援分支被 `git push --all` 公开推送至 `cf`） |
| `review/lab-phase-2.5` | `origin/review/lab-phase-2.5` | `cf/review/lab-phase-2.5` | `4c8c0ea4cf94544a4728c085015b86e3386978bc` | 三端 1:1 同名对齐（Phase 2.6 交付审查基线，本轮未改动） | 低-中（同步至 `cf` 扩大了审查分支公开范围） |
| `review/lab-phase-2.7-audit` | — | — | 本地审计演进分支（基于 `4c8c0ea4cf94544a4728c085015b86e3386978bc`） | Phase 2.7 仅本地修复与门禁分支，严格未推送任何远端 | 无（受控本地隔离） |

---

## 3. Architecture Review（完整代码架构审计）

> 审计注意：历史文档提及的 `LAB_SECURITY.md`、`LAB_DEPLOYMENT.md`、`LAB_TEST_REPORT.md` 在实际仓库中并不位于根目录，而位于 `docs/lab/` 子目录（[LAB_SECURITY.md](file:///home/shijian/projects/shijianus-blog/docs/lab/LAB_SECURITY.md)、[LAB_DEPLOYMENT.md](file:///home/shijian/projects/shijianus-blog/docs/lab/LAB_DEPLOYMENT.md)、[LAB_TEST_REPORT.md](file:///home/shijian/projects/shijianus-blog/docs/lab/LAB_TEST_REPORT.md)）。以下架构关系全部依据实际源代码还原。

```mermaid
flowchart TD
  subgraph MainSite["1. Astro 主站 (blog.epocanvas.com / Pages Functions)"]
    MW["functions/_middleware.ts · 动态 frame-src 与全局安全头"]
    LH["src/pages/lab/index.astro + LabDashboard.astro"]
    LD["src/pages/lab/[slug].astro + ExecutionVisualizer"]
    LP["src/pages/lab/playground.astro · 全屏独立代码工坊"]
    LPV["src/pages/lab/preview/[slug].astro · 轻量独立预览页"]
    PG["src/components/lab/LabPlayground.tsx · Fail-Closed 状态机"]
  end

  subgraph CoreLib["2-4. Lab 数据层、编译插桩与协议层"]
    DATA["src/data/lab-experiments.ts · 6 个官方预设实验数据源"]
    SCHEMA["src/lib/lab-schema.ts · JSON 校验 / TS 擦除 / 循环插桩 / srcdoc 拼装"]
    PROTO["src/lib/lab-sandbox-protocol.ts · CSPRNG Session/Nonce / 跨站协议契约"]
    TRACER["src/lib/lab-tracer.ts · 确定性纯数据追踪快照生成器"]
  end

  subgraph CrossSandbox["5-6. 独立跨站沙盒 (纯静态 Pages 项目, 零 Functions / 零绑定)"]
    OUTER["sandbox-runner/index.html · 外层跨站桥接帧"]
    INNER["Inner Execution Iframe · sandbox=allow-scripts + Opaque Origin + Meta CSP Nonce"]
    SHDR["sandbox-runner/_headers · connect-src none + frame-ancestors 白名单"]
  end

  LH --> DATA
  LD --> PG
  LD --> TRACER
  LP --> PG
  LPV --> SCHEMA
  LPV --> PROTO
  PG --> SCHEMA
  PG --> PROTO
  PG <-->|"postMessage LAB_SANDBOX_PROTOCOL_V1 (targetOrigin + sessionId)"| OUTER
  LPV <-->|"postMessage LAB_SANDBOX_PROTOCOL_V1 (dynamic CSPRNG sessionId)"| OUTER
  OUTER -->|"渲染 srcdoc"| INNER
  PG -.->|"仅 official 且跨站不可达时显式横幅降级"| INNER
```

### 3.1 九大子系统真实架构关系

1. **Astro 主站（[astro.config.mjs](file:///home/shijian/projects/shijianus-blog/astro.config.mjs)、`src/pages/lab/`）**：
   - 采用 `BLOG_BUILD_TARGET=static` 构建为纯静态 HTML + 客户端 React Island（`@astrojs/react`），同时在 Cloudflare Pages 上挂载 `functions/` 边缘中间件与业务 API（评论 D1、打赏 Stripe、翻译 AI 等）。
   - Lab 共暴露 4 类静态路由：`/lab/`（实验广场）、`/lab/[slug]/`（6 个静态生成详情页）、`/lab/playground/`（代码工坊）、`/lab/preview/[slug]/`（6 个轻量独立预览页）。
2. **Lab 数据层（[lab-experiments.ts](file:///home/shijian/projects/shijianus-blog/src/data/lab-experiments.ts)、[lab-schema.ts](file:///home/shijian/projects/shijianus-blog/src/lib/lab-schema.ts)）**：
   - 官方实验由编译期常量 `OFFICIAL_LAB_EXPERIMENTS` 提供（星空轨迹、翼尖涡流、Web Audio 触感、汇率换算、算法追踪、Verlet 绳索物理共 6 项），`sourceKind` 固定为 `'official'`。
   - 外部输入支持 `lab-bundle-v1` JSON 文件导入（大小上限 `512KB`、文件数上限 `8`、单文件上限 `128KB`、总源码上限 `256KB`）以及 URL Hash `#bundle=` Base64URL 分享载荷（编码上限 `32KB`）。所有外部导入与 `#bundle=` 均在校验层被强制标记为非官方来源（`'imported'` / `'community'` / `'bundle'`）。
3. **实验编辑与预览（[LabPlayground.tsx](file:///home/shijian/projects/shijianus-blog/src/components/lab/LabPlayground.tsx)、[LabDashboard.astro](file:///home/shijian/projects/shijianus-blog/src/components/theme/LabDashboard.astro)、[preview/[slug].astro](file:///home/shijian/projects/shijianus-blog/src/pages/lab/preview/[slug].astro)）**：
   - 零首屏重型编辑器（未使用 Monaco/CodeMirror），采用轻量受控 `<textarea>` + 行号同步列，显式挂载 `ignore-opencc` 与 `data-no-translate="true"` 防止 OpenCC 简繁转换破坏代码标识符。
   - 维护四元来源分类 `CodeSourceKind = 'official' | 'imported' | 'community' | 'bundle'` 与三级降级策略 `resolveSandboxDegradationPolicy`：
     - `official`：跨站沙盒在线时运行于 `cross-origin`；未配置或握手超时时展示明确 `official-fallback-banner` 横幅并回退至主站本地 `opaque-srcdoc`（`sandbox="allow-scripts"`，无 `allow-same-origin`）。
     - `imported` / `community` / `bundle`：**严禁自动运行**，且当跨站沙盒未配置、非法或 3 秒（预览网 4.5 秒）握手超时时强制触发 **Fail-Closed**，销毁 iframe 并展示阻断告警。
4. **代码转换与执行追踪（[lab-schema.ts](file:///home/shijian/projects/shijianus-blog/src/lib/lab-schema.ts#L2080-L2490)、[lab-tracer.ts](file:///home/shijian/projects/shijianus-blog/src/lib/lab-tracer.ts)、[ExecutionVisualizer.tsx](file:///home/shijian/projects/shijianus-blog/src/components/lab/ExecutionVisualizer.tsx)）**：
   - **TypeScript 轻量编译**：自定义词法扫描器 `transpileTypeScriptLite` 执行纯类型擦除，显式拦截运行时语义构造（`enum`、构造函数参数属性 `public/private/protected/readonly`、`namespace`、JSX）。
   - **编译期循环插桩**：`instrumentJavaScriptLoops` 对 `while`、`for`、`do...while` 注入闭包私有单调时钟守卫 `__guard()`（每 256 次迭代检查一次，硬超时 `2200ms`，防止用户脚本篡改 `window.performance.now`）。
   - **算法可视化**：`lab-tracer.ts` 与 `ExecutionVisualizer.tsx` 采用纯确定性状态机生成二分查找与快速排序帧快照，**不执行 `eval` 或任意用户输入代码**。
5. **独立跨站沙盒（[sandbox-runner/index.html](file:///home/shijian/projects/shijianus-blog/sandbox-runner/index.html)、[sandbox-runner/_headers](file:///home/shijian/projects/shijianus-blog/sandbox-runner/_headers)）**：
   - 采用**双层嵌套隔离架构**：
     - 外层桥接器部署在独立跨站域名（如 Staging `epocanvas-lab-sandbox-staging.pages.dev`、生产规划独立 eTLD+1 `lab-sandbox.epocanvas-sandbox.com`），主站以 `<iframe sandbox="allow-scripts allow-same-origin" referrerpolicy="no-referrer">` 加载，利用浏览器 Site Isolation 将桥接器及子帧分配至独立渲染进程（OOPIF），并校验父窗口 `event.origin` 白名单。
     - 内层执行帧由外层桥接器动态创建，强制 `sandbox="allow-scripts"`（**剥离 `allow-same-origin`**），使其 `window.origin === "null"`（Opaque Origin），即使与外层桥接器也处于跨源隔离态，并通过内联 `<meta http-equiv="Content-Security-Policy">` 施加一次性 `nonce-<128bit>` 脚本门禁与 `connect-src 'none'`。
6. **`postMessage` 通信协议（[lab-sandbox-protocol.ts](file:///home/shijian/projects/shijianus-blog/src/lib/lab-sandbox-protocol.ts)）**：
   - 协议标识固定为 `LAB_SANDBOX_PROTOCOL_V1`。
   - 宿主 -> 桥接器消息：`PING`、`EXECUTE_SRCDOC`、`SET_THEME`、`DISPOSE_SESSION`（严格指定 `targetOrigin = activeExternalOrigin`，绝不使用 `'*'` 发送源码载荷）。
   - 桥接器/内层帧 -> 宿主消息：`SANDBOX_BRIDGE_READY`、`SANDBOX_READY`、`CONSOLE_EVENT`、`RUNTIME_ERROR`、`EXECUTION_COMPLETE`、`HEARTBEAT`。宿主端双重校验 `event.source === iframeRef.current.contentWindow`、预期 `event.origin`（跨站精确 Origin 或本地回退 `'null'`）以及 128-bit 随机 `sessionId`。
7. **Cloudflare Pages 部署架构（[sync-lab-sandbox-env.mjs](file:///home/shijian/projects/shijianus-blog/scripts/sync-lab-sandbox-env.mjs)、[deploy-lab-sandbox.mjs](file:///home/shijian/projects/shijianus-blog/scripts/deploy-lab-sandbox.mjs)、[wrangler.jsonc](file:///home/shijian/projects/shijianus-blog/wrangler.jsonc)）**：
   - 主站构建前通过 `sync-lab-sandbox-env.mjs` 将构建环境变量 `PUBLIC_LAB_SANDBOX_ORIGIN` 同步写入 `functions/generated/lab-env.ts`，供边缘中间件在 SSR/Functions 层读取。
   - 独立沙盒通过 `deploy-lab-sandbox.mjs` 将 `sandbox-runner/` 复制到系统临时目录（避免向上继承仓库根部 `wrangler.jsonc` 的 D1/AI 配置与 `functions/` 目录），执行零 Functions、零绑定的纯静态上传。
8. **CSP 与浏览器安全边界（[functions/_middleware.ts](file:///home/shijian/projects/shijianus-blog/functions/_middleware.ts)、[public/_headers](file:///home/shijian/projects/shijianus-blog/public/_headers)、[sandbox-runner/_headers](file:///home/shijian/projects/shijianus-blog/sandbox-runner/_headers)）**：
   - 主站边缘中间件动态校验外部沙盒 Origin（拦截全部主站同站/兄弟域名后缀），合法时才将其追加至 `frame-src`。
   - 独立沙盒通过 `! Access-Control-Allow-Origin` 剥离默认通配符 CORS 头，施加 `default-src 'none'; connect-src 'none'; worker-src 'none'; object-src 'none'` 与环境隔离的 `frame-ancestors`。
9. **自动化测试与门禁系统（`scripts/verify-lab-*.mjs`、[.github/workflows/lab-ci-gate.yml](file:///home/shijian/projects/shijianus-blog/.github/workflows/lab-ci-gate.yml)）**：
   - 由三套互补脚本组成：[verify-lab-release-gate.mjs](file:///home/shijian/projects/shijianus-blog/scripts/verify-lab-release-gate.mjs)（10 项静态产物、Nonce、CSP、沙盒干跑、Cloudflare 只读零绑定核验、密钥扫描、锁文件漂移与 Git 基线门禁）、[verify-lab-platform.mjs](file:///home/shijian/projects/shijianus-blog/scripts/verify-lab-platform.mjs)（本地三端口跨站仿真 + Chromium/Firefox/WebKit 全量渗透与无障碍验收）、[verify-lab-cloudflare-preview.mjs](file:///home/shijian/projects/shijianus-blog/scripts/verify-lab-cloudflare-preview.mjs)（线上 Preview 与 Staging 真实边缘头及跨站三核验收）。

### 3.2 识别出的重复代码、隐藏耦合与技术债务

1. **三处黑名单与协议逻辑重复维护（代码重复与漂移隐患）**：
   - 主站域名拦截列表在 [lab-sandbox-protocol.ts](file:///home/shijian/projects/shijianus-blog/src/lib/lab-sandbox-protocol.ts#L56-L78)、[functions/_middleware.ts](file:///home/shijian/projects/shijianus-blog/functions/_middleware.ts#L3-L25) 以及 [preview/[slug].astro](file:///home/shijian/projects/shijianus-blog/src/pages/lab/preview/[slug].astro#L163-L195) 的客户端内联脚本中存在三份拷贝。这直接导致本轮审计前 `preview/[slug].astro` 遗漏了部分兄弟域名后缀（已在 `[666edb3]` 对齐补全，后续 Phase 2.8 建议抽取构建期共享常量注入）。
2. **自定义字符级 TS 擦除器与循环插桩器的维护复杂度**：
   - `transpileTypeScriptLite` 与 `instrumentJavaScriptLoops` 手写字符状态机虽然实现了零运行时重依赖，但对复杂 ECMAScript 语法边界（如正则表达式字面量与除法歧义、嵌套模板字符串表达式 `${...}`、解构赋值类型注解）存在固有的解析脆弱性。本轮已发现并修复了无花括号 `for (... of/in ...)` 与 `for` 头部 IIFE 两处真实插桩盲区。
3. **构建期 `prebuild` 副作用污染工作区**：
   - `npm run build` 自动调用 `sync-console-metrics.mjs` 与 `sync-friends-moments.mjs` 改写 `public/data/*.json` 构建时间戳，极易导致开发者在验证构建后误提交无关脏文件。
4. **包管理器三重锁定漂移**：
   - 仓库内并存 `package-lock.json`（npm）与 `yarn.lock`（yarn），而本地 `node_modules/.pnpm` 又由 pnpm 安装且无 `pnpm-lock.yaml`，造成本地运行态（`astro@6.4.8`）与 CI `npm ci` 锁定态（`astro@6.1.3`）版本不一致。

---

## 4. Security Findings（安全审计发现与修复台账）

以下列出本轮独立安全审计识别的全部 **10 项安全与合规问题**（含本轮已本地修复的 6 项及需在 Phase 2.8 授权处置的 4 项开放风险/架构边界）：

### SEC-01：生产跨站沙盒默认允许过宽的 `*.shijianus-blog.pages.dev` 宿主来源及外层桥接会话可被提前抢占
- **严重等级**：**P1**
- **文件与代码位置**：
  - [sandbox-runner/_headers](file:///home/shijian/projects/shijianus-blog/sandbox-runner/_headers#L6)
  - [sandbox-runner/index.html](file:///home/shijian/projects/shijianus-blog/sandbox-runner/index.html#L42-L135)
  - [scripts/deploy-lab-sandbox.mjs](file:///home/shijian/projects/shijianus-blog/scripts/deploy-lab-sandbox.mjs#L15-L120)
- **复现条件**：
  1. 直接检视基线 `4c8c0ea` 的 `sandbox-runner/_headers` 与 `sandbox-runner/index.html`：生产默认配置同时放行了 `https://blog.epocanvas.com`、`https://shijianus-blog.pages.dev` 及通配符 `https://*.shijianus-blog.pages.dev`。
  2. 此外，`sandbox-runner/index.html` 在收到任意白名单源发来的 `PING` 或 `SET_THEME` 消息时，会无条件覆盖 `activeSessionId = data.sessionId`。
- **实际影响**：
  1. 违背生产与预发布环境严格隔离原则：任何历史或未受控的 Pages Preview 分支部署（含前文发现的 70+ 个历史实验分支预览子域）均可合法嵌入生产跨站沙盒并向其投递执行载荷。
  2. 若同一父窗口快速重入或存在并发子帧竞态，未绑定会话的 `PING`/`SET_THEME` 可篡改当前活跃 `activeSessionId`，干扰后续消息路由。
- **修复建议**：
  1. 将仓库默认态 `sandbox-runner/_headers` 的 `frame-ancestors` 与 `sandbox-runner/index.html` 的 `ALLOWED_HOSTS` 严格收紧为**仅允许生产主站 `https://blog.epocanvas.com`**。
  2. 在 `deploy-lab-sandbox.mjs` 中新增 `--env production|staging` 与 `--dry-run`：仅当显式指定 `--env staging` 且项目名非生产项目 `epocanvas-lab-sandbox` 时，才在临时打包目录中注入 `*.shijianus-blog.pages.dev` 预发布白名单；同时阻断将 `staging` 配置部署至生产沙盒项目。
  3. 在 `sandbox-runner/index.html` 中规定仅当 `activeSessionId` 为空时 `PING` 可绑定初始会话，`SET_THEME` 必须严格匹配当前已激活的 `activeSessionId`。
- **修复状态**：**已本地修复**（Commit `[7abcd7f]`；线上 Staging 待授权重部署）
- **验证证据**：
  - `npm run sandbox:dry-run:prod` 输出 `frameAncestors: "frame-ancestors https://blog.epocanvas.com;"`、`hasFunctions: false`；
  - 执行 `node scripts/deploy-lab-sandbox.mjs --project-name epocanvas-lab-sandbox --env staging --dry-run` 返回非零退出码并成功阻断跨环境污染；
  - `npm run test:lab:gate` Gate 4 & Gate 5 为 `PASS`。

---

### SEC-02：独立预览页静态构建期固化复用 `sessionId` / `cspNonce` 且 `LabDashboard.astro` 存在 `define:vars` 叠加 `astro@6.1.3` 逃逸面
- **严重等级**：**P1**
- **文件与代码位置**：
  - [src/pages/lab/preview/[slug].astro](file:///home/shijian/projects/shijianus-blog/src/pages/lab/preview/[slug].astro#L32-L295)
  - [src/components/theme/LabDashboard.astro](file:///home/shijian/projects/shijianus-blog/src/components/theme/LabDashboard.astro#L6-L16)（原第 586 行 `<script define:vars={{ experiments }}>`）
- **复现条件**：
  1. 检查基线静态构建产物 `dist/lab/preview/*/index.html`：`createLabSessionId()` 与 `createSandboxCspNonce()` 在 Astro SSG 构建期仅执行一次，导致所有访问者、每次页面刷新与点击“重置”均永久复用同一个硬编码 `sessionId` 和同一个 `<meta>` CSP `nonce-labnonce...`。
  2. 同时，`preview/[slug].astro` 在处理 `SANDBOX_BRIDGE_READY` 时未校验 `data.sessionId === activeSessionId`，且其内联主站域名黑名单缺少 `.epocanvas.tech`、`.pvzos.com` 等后缀。
  3. `LabDashboard.astro` 使用 `<script define:vars={{ experiments }}>` 直接内联包含源码字符串的实验数组，而 `package-lock.json` 锁定的 `astro@6.1.3` 受官方高危安全公告 **`GHSA-j687-52p2-xcff`（`<6.1.6` `define:vars` 未转义 `</script>` 导致脚本块逃逸 XSS）** 影响。
- **实际影响**：
  1. 静态公开的 CSP Nonce 完全丧失一次性防注入意义：一旦预览内容存在 HTML 注入点，攻击者可直接硬编码已知的构建期静态 Nonce 绕过沙盒内层 `script-src 'nonce-...'` 限制；固定 `sessionId` 亦使跨窗口伪造 `postMessage` 会话标识成为可能。
  2. 若实验源码中包含字面量 `</script>`（前端代码工坊极常见场景），在 `astro@6.1.3` 构建环境下通过 `define:vars` 输出至 `/lab/` 主站页面时可直接逃逸出 `<script>` 标签并在主站同源上下文中执行任意 JS！
- **修复建议**：
  1. 在 `preview/[slug].astro` 构建期仅写入不可猜测的模板占位符（`__LAB_RUNTIME_SESSION_ID__` 与 `LAB_RUNTIME_CSP_NONCE_PLACEHOLDER`），在每次页面加载及点击“重置”时调用浏览器 `crypto.getRandomValues` 动态签发全新 128-bit `sessionId` 与一次性 `cspNonce`。
  2. 补齐 `preview/[slug].astro` 对 `SANDBOX_BRIDGE_READY` 的 `sessionId` 强校验、精确 `event.origin` 校验及完整主站域名黑名单。
  3. 移除 `LabDashboard.astro` 中的 `define:vars`，改用经过 `<` -> `\u003c` 强制转义的 `encodeSafeInlineJson` + `<template id="lab-experiments-payload">` 数据载体读取。
- **修复状态**：**已本地修复**（Commit `[666edb3]`）
- **验证证据**：
  - `npm run test:lab:gate` Gate 2 扫描全部 6 个 `dist/lab/preview/*/index.html` 确认零构建期固化 `lab-sess-*`/`nonce-labnonce*`，扫描全部 Lab `.astro` 模板确认零 `define:vars`（`PASS`）；
  - `verify-lab-platform.mjs` Part 5 在 Chromium / Firefox / WebKit 三核实测点击 `#btn-preview-reload` 前后 `sessionId` 与 `cspNonce` 100% 动态轮换且互不相同（`PASS`）。

---

### SEC-03：供应链锁文件三重漂移与 `package-lock.json` 存在 35 个未修复漏洞（2 Critical / 27 High）
- **严重等级**：**P1（生产发布阻断项）**
- **文件与代码位置**：
  - [package.json](file:///home/shijian/projects/shijianus-blog/package.json#L41-L79)
  - [package-lock.json](file:///home/shijian/projects/shijianus-blog/package-lock.json)
  - [yarn.lock](file:///home/shijian/projects/shijianus-blog/yarn.lock)
- **复现条件**：
  执行 `npm audit --registry=https://registry.npmjs.org --json` 并比对 `package-lock.json`、`yarn.lock` 与 `node_modules/.pnpm` 实际版本。
- **实际影响**：
  1. `package-lock.json` 当前锁定 `astro@6.1.3`、`@astrojs/mdx@5.0.3`、`mermaid@11.4.1`（间接锁定 `dompurify` 旧版）等，共检出 **35 个安全漏洞（Critical: 2, High: 27, Moderate: 4, Low: 2）**，涉及 `astro` 多项 SSR/编译安全公告（含 `GHSA-j687-52p2-xcff` 等，修复版本需升级至安全维护分支）、`dompurify` XSS 绕过（`<=3.4.16`）、`devalue` 原型污染/DoS、`flatted`/`undici`/`picomatch`/`yaml` 等。
  2. 本地 `node_modules` 实际由 pnpm 安装为 `astro@6.4.8`，而 CI/Cloudflare Pages 执行 `npm ci` 时会按 `package-lock.json` 安装旧版 `astro@6.1.3`；仓库同时残留 `yarn.lock`，违背可复现构建要求。
  3. 本地未安装 `typescript` 与 `@astrojs/check`，导致 `astro check` 静态类型门禁无法运行。
- **修复建议**：
  在 Phase 2.8 获得依赖变更授权后（遵守本轮“最小变更、不擅自引入新依赖或重写全仓锁文件”约束）：
  1. 统一包管理器（保留唯一锁文件，移除冗余 `yarn.lock`）；
  2. 升级 `astro`、`@astrojs/*`、`mermaid`/`dompurify` 等受影响依赖并重新生成锁文件，确保 `npm audit --audit-level=high` 清零；
  3. 在 `devDependencies` 中补齐 `typescript` 与 `@astrojs/check`，将 `astro check` 接入 CI 必过门禁。
- **修复状态**：**待授权升级（Lab 自身 `define:vars` 触发面已在 `[666edb3]` 提前消除；锁文件漂移已由 `verify-lab-release-gate.mjs` Gate 8 自动监控告警）**
- **验证证据**：
  - `npm audit --registry=https://registry.npmjs.org --json` 实测统计：`{"info":0,"low":2,"moderate":4,"high":27,"critical":2,"total":35}`；
  - `npm run test:lab:gate` Gate 8 输出 `status: "WARN_DRIFT_DETECTED"`。

---

### SEC-04：编译期循环保护被无花括号 `for..of/in` 与头部 IIFE 绕过、`requestAnimationFrame` 无上限洪泛及 `console` 超大对象序列化卡死
- **严重等级**：**P2**
- **文件与代码位置**：
  - [src/lib/lab-schema.ts](file:///home/shijian/projects/shijianus-blog/src/lib/lab-schema.ts#L2285-L2665)
- **复现条件**：
  1. 在代码工坊运行 `const g=(function*(){while(1)yield 1})(); for (const x of g) x;`：原 `instrumentJavaScriptLoops` 在无花括号单语句 `for` 分支中固定注入 `const __g = ...; for (...) { __g(); ... }`，对于 `for (const x of ...)` / `for (const k in ...)` 会将原三段式外层变量写法套用或因头部 `(` 嵌套 IIFE `for (; (() => { while(true){} })(); ) {}` 未递归插桩而直接死循环卡死渲染线程。
  2. 运行 `for (let i=0; i<10000; i++) requestAnimationFrame(function f(){ requestAnimationFrame(f); })`：原沙盒仅限制了 `setTimeout`/`setInterval`（256 上限），未限制 `requestAnimationFrame`。
  3. 运行 `console.log(new Uint8Array(4 * 1024 * 1024))`：原沙盒 `safeSerialize` 直接调用 `JSON.stringify(val)`，将 4MB 字节数组同步展开为数十 MB 键值对字符串导致主/子帧卡顿。
- **实际影响**：绕过 2.2s 超时熔断并引发沙盒进程 CPU 100% 卡死或高内存序列化阻塞。
- **修复建议**：
  1. 在 `instrumentJavaScriptLoops` 中递归插桩 `for (...)` 括号头内部表达式（覆盖头部 IIFE 中的内嵌循环），并对无花括号 `for..of` / `for..in` 正确包裹 `{ __guard(); <body> }` 块。
  2. 将 `requestAnimationFrame` / `cancelAnimationFrame` 纳入 `MAX_ACTIVE_RAF = 256` 并发配额管理。
  3. 重写 `safeSerialize` 为有界深度（`MAX_DEPTH = 3`）、有界键/元素数（`MAX_KEYS = 40`）递归摘要器，对 `ArrayBuffer` / `TypedArray` 直接输出 `[Uint8Array N bytes]` 摘要。
- **修复状态**：**已本地修复**（Commit `[13e70ad]`）
- **验证证据**：
  - Chromium / Firefox / WebKit 三核运行 `verify-lab-platform.mjs` Part 3.3 & 3.4：无花括号生成器 `for..of` 在 ~2.2s 精准熔断，`requestAnimationFrame` 400 并发洪泛触发安全拦截，`4MB Uint8Array` 毫秒级输出 `[Uint8Array 4194304 bytes]`（`PASS`）。

---

### SEC-05：损坏/超限 `#bundle=` 回退自动执行官方代码、篡改本地草稿可伪造 `official` 信任等级及页面卸载缺少会话销毁通知
- **严重等级**：**P2**
- **文件与代码位置**：
  - [src/components/lab/LabPlayground.tsx](file:///home/shijian/projects/shijianus-blog/src/components/lab/LabPlayground.tsx#L395-L535)
  - [src/components/lab/LabPlayground.tsx](file:///home/shijian/projects/shijianus-blog/src/components/lab/LabPlayground.tsx#L905-L965)
- **复现条件**：
  1. 访问 `/lab/playground/?slug=star-trails-simulator#bundle=!!!corrupted`：原初始化逻辑在 `decodeShareBundle` 返回 `ok: false` 后，未阻断后续 `defaultExp` 回退分支，导致页面带错误 Toast 却在后台自动挂载并执行了默认官方实验。
  2. 在同源脚本或 DevTools/扩展存储污染场景下，向 `localStorage['shijianus-lab-draft-v1']` 写入 `{ slug: "star-trails-simulator", draftOriginKind: "official", files: [恶意修改代码] }` 并点击“读草稿”：原 `handleLoadDraft` 直接信任了 JSON 内的 `draftOriginKind === 'official'` 字段，使非官方代码在无跨站沙盒时可降级进入本地 `opaque-srcdoc` 运行，违背“非官方代码无跨站沙盒严禁执行”铁律。
- **实际影响**：破坏 `#bundle=` 入口在异常状态下的确定性 Fail-Closed 行为，并存在本地存储草稿的信任等级洗白（Trust Laundering）通道。
- **修复建议**：
  1. 当 URL 携带 `#bundle=` 但解码或体积校验失败时，强制将 `codeSourceKind` 锁定为 `'bundle'`、`execStatus = 'error'`、写入 `failClosedReason`，**零自动运行、零 iframe 挂载**。
  2. 新增 `filesMatchOfficialExperiment` 字节级精确比对函数：读取草稿时，仅当文件名、语言与内容 100% 匹配对应编译期官方预设实验时才允许保留 `'official'`，任何改动一律强制降级为 `'imported'`（需手动触发且受跨站 Fail-Closed 约束）。
  3. 监听 `pagehide` 与组件卸载生命周期，主动向跨站沙盒桥接帧发送 `DISPOSE_SESSION` 指令立即清空内层执行 iframe。
- **修复状态**：**已本地修复**（Commit `[b29a3de]`）
- **验证证据**：
  - `verify-lab-platform.mjs` Part 3.5(d) & 3.5(e) 在 Chromium / Firefox / WebKit 三核实测损坏 `#bundle=` 与伪造 `draftOriginKind="official"` 草稿均 100% 触发 Fail-Closed 且 `iframe count === 0`（`PASS`）。

---

### SEC-06：纯编译期循环插桩无法抢占同步递归、灾难性回溯正则（ReDoS）、内建迭代器消费与 `TypedArray` 内存耗尽
- **严重等级**：**P2（JavaScript 单线程运行时固有边界 · 已诚实披露并建立双层缓解）**
- **文件与代码位置**：
  - [src/lib/lab-schema.ts](file:///home/shijian/projects/shijianus-blog/src/lib/lab-schema.ts#L2285-L2490)
  - [src/components/lab/LabPlayground.tsx](file:///home/shijian/projects/shijianus-blog/src/components/lab/LabPlayground.tsx#L730-L810)
- **复现条件**：
  在沙盒中执行以下非显式 `for/while/do` 循环语句的 CPU/内存耗尽载荷：
  1. 深层直接/相互递归：`function f(){ return f(); } f();`（触发引擎调用栈上限 `RangeError: Maximum call stack size exceeded` 前短暂阻塞，或尾递归/异步微任务链持续占用）；
  2. 灾难性回溯正则表达式：`/(a+)+$/.test('a'.repeat(32) + '!')`（阻塞在 V8/SpiderMonkey/JavaScriptCore 正则引擎 C++ 层）；
  3. 内建高阶消费者驱动无限生成器：`Array.from((function*(){ while(1) yield 1; })())`（若生成器内部无循环而由 `{ next() { return { value: 1, done: false }; } }` 构造，则阻塞在引擎内建 `Array.from` C++ 循环直至堆耗尽）；
  4. 大块连续内存分配：`Array.from({ length: 64 }, () => new Uint8Array(64 * 1024 * 1024))`。
- **实际影响**：
  编译期 JS 循环插桩**不是完整的操作系统级抢占式资源隔离**。在同站 `opaque-srcdoc` 回退模式下（若浏览器未对无 `allow-same-origin` 的 `srcdoc` 启用独立进程），上述载荷可能冻结当前主站标签页事件循环；在跨站沙盒模式下，仅冻结跨站沙盒子进程（OOPIF），主站 UI 仍保持响应。
- **可验证的风险缓解方案**：
  1. **严禁夸大宣传**：在安全文档与本报告中明确界定编译期插桩仅覆盖常规 `for/while/do` 语法级死循环，不具备引擎 C++ 正则/内建迭代/内存配额抢占能力。
  2. **强制跨站点（Cross-Site eTLD+1）OOPIF 进程隔离**：非可信代码（`imported`/`community`/`bundle`）100% 强制运行于独立跨站域名（Phase 2.8 生产必须使用独立注册域名如 `lab-sandbox.epocanvas-sandbox.com`，而非同站子域，确保桌面与主流浏览器强制分配独立渲染进程）。
  3. **宿主级手动硬抢占与超时监控**：主站工具栏常驻位于宿主演染进程的「⏹ 停止」（`btn-stop-sandbox`）按钮；点击后宿主直接卸载跨站 `<iframe>` DOM 节点并发送 `DISPOSE_SESSION`，浏览器可回收卡死的跨站子帧进程。Phase 2.8 可进一步在独立沙盒评估可选的 Web Worker 纯计算模式（支持 `worker.terminate()` 毫秒级硬抢占非 DOM 算法代码）。
- **修复状态**：**非可信代码跨站 Fail-Closed + 宿主卸载销毁已就绪；生产独立 eTLD+1 域名待 Phase 2.8 部署**
- **验证证据**：
  - `verify-lab-platform.mjs` Part 4.1b 验证点击 `btn-stop-sandbox` 与路由跳转立即销毁沙盒 iframe（`iframe count === 0`）。

---

### SEC-07：主站边缘中间件全局 CSP 仍保留 `'unsafe-inline'` / `'unsafe-eval'` 与宽泛 `connect-src https:`，且外层沙盒桥接器受限于 `srcdoc` CSP 继承规则
- **严重等级**：**P2**
- **文件与代码位置**：
  - [functions/_middleware.ts](file:///home/shijian/projects/shijianus-blog/functions/_middleware.ts#L92-L128)
  - [sandbox-runner/_headers](file:///home/shijian/projects/shijianus-blog/sandbox-runner/_headers#L6)
- **复现条件**：
  检查线上 `review-lab-phase-2-5.shijianus-blog.pages.dev` 与 `epocanvas-lab-sandbox-staging.pages.dev` 实际 HTTP 响应头。
- **实际影响**：
  1. **主站 CSP**：`script-src 'self' 'unsafe-inline' 'unsafe-eval' ...` 与 `connect-src 'self' ... https:` 为兼容全站既有 Astro 内联主题脚本、Mermaid/Markmap 及第三方组件而放宽，削弱了主站自身的纵深 XSS 防御与数据外传限制。
  2. **沙盒外层 CSP 必要性核验**：`sandbox-runner/_headers` 的 HTTP 头设置 `script-src 'unsafe-inline' 'unsafe-eval'` 经核查属于 **W3C HTML/CSP 规范强制技术约束**——因为 `about:srcdoc` 子文档会自动继承父文档（即 `sandbox-runner/index.html`）的 CSP Policy Container 并取交集：若外层 HTTP 头使用静态 Hash 锁死 `script-src`，内层动态生成的 `<script nonce="labnonce...">` 与 TypeScript 动态脚本将被外层继承下来的 CSP 直接拦截。当前架构通过**内层 `srcdoc` 顶部 `<meta http-equiv="Content-Security-Policy">` 二次收紧 `script-src 'nonce-<128bit>' 'unsafe-eval'`** 实现了对内层任意未授权内联事件（如 `<img onerror=...>`）的拦截。
- **修复建议**：
  1. 保留沙盒“外层桥接器 `connect-src 'none'` + 内层 `<meta>` 一次性随机 Nonce 收紧”的双层机制，并确保外层 `sandbox-runner/index.html` 自身零 DOM 拼接接收点（仅通过 `iframe.srcdoc = String(rawSrcDoc)` 赋值）。
  2. 在后续全站安全迭代中，逐步将主站 `functions/_middleware.ts` 的 `connect-src https:` 收紧为明确域名白名单，并为 `/lab/*` 路径评估按请求签发边缘 Nonce。
- **修复状态**：**沙盒内层 Nonce 拦截已验证有效；主站全局 CSP 收紧列入后续加固计划**
- **验证证据**：
  - `verify-lab-platform.mjs` Part 3.2 实测 `<img onerror="window.__inline_csp_bypass=1">` 与 `</style><script>` 在内层沙盒中 `INLINE_BYPASS:false`（`PASS`）。

---

### SEC-08：既有 GitHub Actions 缺少最小权限与 Commit SHA 固定、运行环境 API Token 权限偏宽及 Preview 环境共享 D1/AI 绑定
- **严重等级**：**P2**
- **文件与代码位置**：
  - [.github/workflows/deploy.yml](file:///home/shijian/projects/shijianus-blog/.github/workflows/deploy.yml#L1-L40)
  - Cloudflare Pages 项目 `shijianus-blog`（`deployment_configs.preview`）
- **复现条件**：
  1. 读取 `.github/workflows/deploy.yml`：未声明顶层 `permissions:`（默认可能继承仓库读写权限），且 `actions/checkout@v4`、`actions/setup-node@v4`、`cloudflare/wrangler-action@v3` 仅使用可变主版本标签而非 40 位不可变 Commit SHA。
  2. 只读查询 Cloudflare API：当前主机环境变量中的 `CLOUDFLARE_API_TOKEN` 为用户级（User API Token）凭证；且 `shijianus-blog` 的 `preview` 环境同样绑定了与 `production` 相同的 D1 数据库 `DB`（`bc8cc71e-6938-4b75-9713-77a3f5ebbb15`）与 `AI` 绑定。
- **实际影响**：
  1. 第三方 Action 标签若遭供应链投毒可获取 CI `GITHUB_TOKEN` 与部署凭据；
  2. `shijianus-blog` 的所有 Preview 分支部署均可经由 Pages Functions 访问同一 D1 数据库（注：独立沙盒项目 `epocanvas-lab-sandbox-staging` 已通过 API 实证 100% 零绑定，不受此影响）。
- **修复建议**：
  1. 本轮已新建独立门禁工作流 [.github/workflows/lab-ci-gate.yml](file:///home/shijian/projects/shijianus-blog/.github/workflows/lab-ci-gate.yml)，强制声明 `permissions: { contents: read }` 并将 `actions/checkout`（`11bd71901bbe5b1630ceea73d27597364c9af683`）与 `actions/setup-node`（`1d0ff469b7ec7b3cb9d8673fde0c81c44821de2a`）固定至 40 位 Commit SHA。
  2. 在 Phase 2.8 获得授权后，同步加固 `.github/workflows/deploy.yml` 的 SHA 固定与最小权限，为沙盒部署单独签发仅含 `Cloudflare Pages: Edit`（限定账户且无 D1/R2/KV/DNS 权限）的最小作用域 Token，并为 `shijianus-blog` Preview 环境拆分独立测试 D1 数据库。
- **修复状态**：**新增 Lab CI 门禁工作流已完成（Commit `[03a57c0]`）；既有 `deploy.yml` 与云端权限收敛待授权执行**
- **验证证据**：
  - 核查 `.github/workflows/lab-ci-gate.yml` 全部 `uses:` 均为 40 位 SHA 且顶层 `permissions: contents: read`。

---

### SEC-09：历史 Git 提交残留已轮换旧凭证痕迹与 `cf` 公开仓库暴露 70+ 个临时/备份分支
- **严重等级**：**P2**
- **文件与代码位置**：
  - Git 历史提交（`255f385` 之前的 7 个早期提交）及 [AGENTS.md](file:///home/shijian/projects/shijianus-blog/AGENTS.md#L86)
  - 远端 `cf`（`git@github.com:shijianus/shijianus.github.io.git`）70+ 个非生产分支与非正式标签
- **复现条件**：
  执行只读 `git log --all -G "..."` 与 `git for-each-ref refs/remotes/cf`。
- **实际影响**：
  虽然相关旧凭证已在历史 Task 7/8（`255f385`、`c6ce400`）完成轮换且当前 `HEAD` 跟踪文件 0 密钥命中，但公开仓库暴露大量 `backup-*` 与 `feat/hero-refactor-v*` 历史分支增加了攻击者枚举历史差异与旧配置的暴露面。
- **修复建议**：
  1. 确认早期 7 个历史提交中曾出现的所有历史 Token 100% 处于吊销/轮换失效状态；
  2. 废止无差别的 `git push --all cf` 习惯，改为显式分支推送（如仅向 `cf` 推送经批准的 `main` 分支）；
  3. 经仓库所有者逐项核对确认后，再按需清理 `cf` 上多余的临时/备份分支及根树孤立 gitlink `.deploy_git`（本轮严格遵守禁令，未做任何远端删除）。
- **修复状态**：**已完成全量取证登记；待授权清理**
- **验证证据**：
  - 详见第 2 节完整分支与标签对照表及 `verify-lab-release-gate.mjs` Gate 7 / Gate 9 扫描结果。

---

### SEC-10：`/lab/playground/` 与 `/lab/preview/[slug]/` 页面缺失语义化一级标题 `<h1>`
- **严重等级**：**P3（无障碍合规缺陷）**
- **文件与代码位置**：
  - [src/pages/lab/playground.astro](file:///home/shijian/projects/shijianus-blog/src/pages/lab/playground.astro#L31-L36)
  - [src/pages/lab/preview/[slug].astro](file:///home/shijian/projects/shijianus-blog/src/pages/lab/preview/[slug].astro#L74-L78)
- **复现条件**：
  在 `/lab/playground/` 与 `/lab/preview/star-trails-simulator/` 运行 DOM 语义与 WCAG 1.3.1 / 2.4.6 地标与标题层级检查，`document.querySelectorAll('h1').length === 0`。
- **实际影响**：屏幕阅读器用户进入独立代码工坊或独立预览页时无法通过一级标题快速定位页面主旨。
- **修复建议**：将两处顶部主标题由 `<strong>` 升级为语义化 `<h1>` 并保持原有排版字号零视觉偏移。
- **修复状态**：**已本地修复**（Commit `[963f67d]`）
- **验证证据**：
  - `verify-lab-platform.mjs` Part 5 `accessibilityBaseline` 在 Chromium / Firefox / WebKit 三核全部返回 `PASS`。

---

## 5. Test Matrix（全量质量与跨浏览器验收矩阵）

> 严格执行准则：所有未安装或未授权执行的项目均诚实标记为 `BLOCKED` 或 `NOT RUN`，所有初始失败项均完整保留根因分类（产品缺陷 vs 环境/测试缺陷）与修复后复测证据，**零跳过测试、零放宽产品超时、零弱化断言**。

### 5.1 构建、静态检查与安全门禁矩阵

| 测试类别 | 具体检查项与执行命令 | 状态 | 详细证据与说明 |
|---|---|---|---|
| TypeScript / Astro 类型检查 | `npx astro check` / `tsc --noEmit` | **BLOCKED** | 本地 `node_modules` 未安装 `typescript` 与 `@astrojs/check`（本轮禁止擅自改写全仓依赖树，已在 Gate 8 告警并列为 Phase 2.8 前置条件） |
| 全站静态构建（无跨站沙盒基线） | `PUBLIC_LAB_SANDBOX_ORIGIN="" npm run build` | **PASS** | 退出码 `0`，成功生成全部 **326 个静态页面**（含 14 个 `/lab/*` 页面），耗时 `1m 06s` |
| 品牌与术语合规审计 | `npm run test:brand` + Gate 3 源码扫描 | **PASS** | 退出码 `0`；Lab 全部模板、React 组件与 `sandbox-runner/` 零上游违禁品牌词残留，卡片圆角实测 `<= 8px` |
| 静态产物零固化 Nonce & 零 `define:vars` | `npm run test:lab:gate`（Gate 2） | **PASS** | 全部 6 个 `dist/lab/preview/*/index.html` 零静态 `sessionId`/`cspNonce`；全部 Lab `.astro` 模板零 `define:vars` |
| 独立沙盒零 Functions 打包干跑 | `npm run sandbox:dry-run:prod` & `staging` | **PASS** | 临时目录隔离打包仅含 `["404.html", "_headers", "index.html"]`，`hasFunctions: false`、`hasWorkerBundle: false`；跨环境污染注入测试被成功阻断 |
| Cloudflare 只读零绑定核验（Staging） | Cloudflare API `GET .../pages/projects/epocanvas-lab-sandbox-staging`（Gate 6） | **PASS** | **非凭 404 推断**，直接由 Cloudflare API 元数据证实：`uses_functions: false`，`latest_deployment.uses_functions: false`，`production`/`preview` 环境 `env_vars: null` 且 D1/R2/KV/AI/Service/DO/Queue 绑定全空；无 Token 时自动回退报告 `UNVERIFIED` |
| Cloudflare 生产沙盒就绪核验 | Cloudflare API `GET .../pages/projects/epocanvas-lab-sandbox` | **BLOCKED** | 返回 `HTTP 404 (Project not found)`，生产跨站沙盒项目尚未创建（需 Phase 2.8 授权立项） |
| 跟踪文件密钥扫描 | `npm run test:lab:gate`（Gate 7） | **PASS** | 扫描全仓 **1,989** 个跟踪文本文件，`sk_live_*` / `whsec_*` / 完整 Bot Token / GitHub PAT / 私钥命中数为 `0` |
| 供应链漏洞审计 | `npm audit --registry=https://registry.npmjs.org --audit-level=high` | **FAIL** | 检出 **35 个漏洞（2 Critical, 27 High, 4 Moderate, 2 Low）**，源于 `package-lock.json` 锁定 `astro@6.1.3` 与 `mermaid@11.4.1 -> dompurify`（列为生产发布阻断项 SEC-03） |

### 5.2 本地跨浏览器全链路、对抗安全、移动端与无障碍矩阵（`npm run test:lab:browsers`）

| 验收维度 / 用例 | Chromium `156.0.8078.4` | Firefox `157.0` | WebKit `27.2` | 证据摘要 |
|---|---|---|---|---|
| `/lab/` 广场分类筛选、Tag、搜索、源码弹窗 Esc 关闭 | **PASS** | **PASS** | **PASS** | 首屏加载：Chromium `523ms` / Firefox `1150ms` / WebKit `4291ms` |
| 6 个 `/lab/[slug]/` 详情页运行与零未捕获异常 | **PASS** | **PASS** | **PASS** | 星轨、翼尖涡流、Web Audio、汇率、算法追踪、Verlet 绳索全绿 |
| `ExecutionVisualizer` 二分查找 & 快速排序调用栈步进 | **PASS** | **PASS** | **PASS** | 步骤计数与递归栈帧（`>= 2`）渲染精确 |
| 受限 TS 编译（正常擦除 + `enum` 显式语法拦截） | **PASS** | **PASS** | **PASS** | 准确提示“不支持 TypeScript `enum`” |
| Opaque Origin (`window.origin === 'null'`)、Cookie/Storage/DOM `SecurityError` 隔离 | **PASS** | **PASS** | **PASS** | 主站模拟敏感 Cookie 与 `localStorage` 令牌零泄漏 |
| CSP `connect-src 'none'`、Worker 阻断、`<img onerror>` / `</style><script>` 逃逸拦截 | **PASS** | **PASS** | **PASS** | `FETCH_BLOCKED`、`WORKER_BLOCKED`、`INLINE_BYPASS: false` |
| 防篡改 `while(true){}`（篡改 `performance.now`）+ **无花括号 `for..of` 死循环熔断** | **PASS** | **PASS** | **PASS** | Chromium `2489ms` / Firefox `3183ms` / WebKit `2505ms` 精准熔断 |
| 256 定时器上限、**256 `rAF` 洪泛拦截**、200 日志防洪、**4MB `Uint8Array` 有界序列化** | **PASS** | **PASS** | **PASS** | 输出 `[Uint8Array 4194304 bytes]`，零主线程卡死 |
| 伪造 `sessionId` 的 `postMessage` 注入丢弃 | **PASS** | **PASS** | **PASS** | 伪造错误日志未进入 Console 状态树 |
| 无跨站沙盒时：`official` 显式横幅回退 `opaque-srcdoc` | **PASS** | **PASS** | **PASS** | `official-fallback-banner` 可见且安全隔离执行 |
| 无跨站沙盒时：`imported` / `community` / `#bundle=` 禁自动运行 + 点击运行 **Fail-Closed** | **PASS** | **PASS** | **PASS** | `data-fail-closed="true"`，`iframe count === 0` |
| **Phase 2.7 新增**：损坏 `#bundle=` 直接 Fail-Closed（禁回退运行默认官方实验） | **PASS** | **PASS** | **PASS** | `data-source-kind="bundle"`、`data-fail-closed="true"`、`iframe count === 0` |
| **Phase 2.7 新增**：篡改 `localStorage` 草稿伪造 `draftOriginKind="official"` 拦截 | **PASS** | **PASS** | **PASS** | 字节比对识破篡改并强制降级为 `imported` -> Fail-Closed |
| 多 Origin 跨站联调（`127.0.0.1:4357` <-> `localhost:4356`）在线执行与手动运行外部代码 | **PASS** | **PASS** | **PASS** | `data-isolation-mode="cross-origin"`，双层沙盒执行成功 |
| 跨站沙盒断连故障演练（关闭桥接服务）：非可信代码 3s 超时 **Fail-Closed**，`official` 显式横幅降级 | **PASS** | **PASS** | **PASS** | 断连后 `#bundle=` 与 `community` 零回退 `srcdoc` |
| 页面停止按钮（`btn-stop-sandbox`）与跨页跳转（`/lab/playground/` -> `/lab/`）资源清理 | **PASS** | **PASS** | **PASS** | 停止及跳转后沙盒 `iframe` 立即清零，零异常残留 |
| 独立预览页 `/lab/preview/[slug]/` 动态 CSPRNG `sessionId` & `cspNonce` 单次轮换 | **PASS** | **PASS** | **PASS** | 每次加载与点击 `#btn-preview-reload` 均签发全新 128-bit Nonce |
| 简繁切换（`zh-CN` <-> `zh-Hant`）UI 翻译与编辑器源码零污染保护 | **PASS** | **PASS** | **PASS** | 按钮切换为「執行程式碼」，编辑器 TS 源码逐字节不变 |
| 移动端视口（`390x844`）全 4 类 Lab 路由零横向溢出 + 既有博客路由（`/`、`/about/`）回归 | **PASS** | **PASS** | **PASS** | `scrollWidth <= innerWidth + 2`，博客主站 HTTP 200 |
| 无障碍基础检查（`html[lang]`、`<main>`、`<h1>`、`tablist`/`tab`、`textarea[aria-label]`、`iframe[title]`、按钮可访问名称） | **PASS**（修复 `[963f67d]` 后） | **PASS**（修复 `[963f67d]` 后） | **PASS**（修复 `[963f67d]` 后） | 初始检出 `/lab/playground/` 与 `/lab/preview/[slug]/` 缺 `<h1>`（`FAIL`），修复产品模板后三核全绿 |
| 全程未捕获页面异常计数（`uncaughtPageErrors`） | **PASS (`0`)** | **PASS (`0`)** | **PASS (`0`)** | 三大浏览器内核全程 `0` 未捕获 JS 报错 |

### 5.3 真实 Cloudflare Preview + Staging 独立沙盒只读验收矩阵（`npm run test:lab:preview`）

- **被测线上环境（只读，未覆盖部署）**：
  - Preview 主站：`https://review-lab-phase-2-5.shijianus-blog.pages.dev`（Deployment `6dcc30ac-7a1e-41ce-8524-047b88ac832b`，对应提交 `d492f432dd58201ebbc880f162dc06d42f94c2d0`）
  - Staging 沙盒：`https://epocanvas-lab-sandbox-staging.pages.dev`（Deployment `6f74e870-d4fd-491c-b0ad-98994a6c233b`）
- **Firefox 基线失败根因取证记录**：
  - 初始运行 `verify-lab-cloudflare-preview.mjs` 时，Chromium 通过，**Firefox 157.0 失败**（`isolationMode: 'opaque-srcdoc' !== 'cross-origin'`）。
  - 独立诊断脚本取证证实：当前 Linux 容器仅具备 IPv4 接口（`curl -4` 耗时 `207ms`，`curl -6` 立即返回 `EXIT_6` 无路由），但容器本地 DNS 转发器对 `AAAA`（IPv6）查询固定阻塞 **5,000ms** 超时。Chromium 与 WebKit 调用系统 `getaddrinfo(AI_ADDRCONFIG)` 自动跳过无外部 IPv6 接口时的 `AAAA` 查询；而无头 Firefox 内部解析器默认并发请求 `A` + `AAAA` 并等待响应，导致主站与跨站沙盒两次导航累计耗费 `10,668ms`，超过 `4,500ms` 握手窗口而触发预期的超时降级。
  - **处置分类**：**测试运行环境网络栈耦合缺陷（非产品缺陷）**。在 [verify-lab-cloudflare-preview.mjs](file:///home/shijian/projects/shijianus-blog/scripts/verify-lab-cloudflare-preview.mjs) 中通过 `os.networkInterfaces()` 自动检测宿主机是否存在非回环 IPv6 接口，仅在纯 IPv4 宿主上为无头 Firefox 注入 `network.dns.disableIPv6: true`（对齐 OS `AI_ADDRCONFIG` 语义，未延长 `4,500ms` 产品握手超时、未弱化任何断言）。复测 Firefox 跨站双层握手仅耗时 `1,749ms`。

| 真实跨站验收项 | Chromium `156.0.8078.4` | Firefox `157.0` | WebKit `27.2` | 生产环境攻击性测试 |
|---|---|---|---|---|
| 边缘安全响应头审计（无通配 CORS、`connect-src 'none'`、`frame-ancestors`） | **PASS** | **PASS** | **PASS** | **NOT RUN**（严格遵守禁令，未对生产站执行渗透测试） |
| 真实跨站双层握手（Preview -> Staging Sandbox -> Opaque `null`） | **PASS** | **PASS**（修正纯 IPv4 容器 DNS 配置后；基线 `FAIL`） | **PASS** | **NOT RUN** |
| 未授权第三方父页面（`evil-attacker.example.com`）嵌入沙盒拦截 | **PASS** | **PASS** | **PASS** | **NOT RUN** |
| 跨站执行网络外发阻断、Cookie/Storage/DOM 隔离、死循环熔断、日志防洪 | **PASS** | **PASS** | **PASS** | **NOT RUN** |
| 非可信代码（`imported` / `community` / `#bundle=`）禁自动运行 + 沙盒断网 **Fail-Closed** | **PASS** | **PASS** | **PASS** | **NOT RUN** |
| `official` 实验在跨站沙盒断网时显式横幅降级 | **PASS** | **PASS** | **PASS** | **NOT RUN** |
| 真实边缘移动端视口与全流程 `0` 未捕获页面错误 | **PASS (`0`)** | **PASS (`0`)** | **PASS (`0`)** | **NOT RUN** |

---

## 6. Deployment Readiness（部署就绪度、云端配置差异与回滚方案）

### 6.1 当前 Cloudflare Pages 线上资产只读盘点（Account `0a1276d9d2f920936dc2f3eda8c126f8`）

| 项目名称 | 环境角色 | 当前线上状态与 Deployment ID | 代码版本核验 | Functions 与绑定实证（Cloudflare API） | 就绪结论 |
|---|---|---|---|---|---|
| `shijianus-blog`（Production） | 生产主站（`https://blog.epocanvas.com`） | 在线，Canonical Deployment：`15603502-14f1-4340-b4b1-4f126ee24068` | 对应 `main`（`2e92967072febadd70e03d13bfd1cc6e2207bc55`），**本轮零变更** | `uses_functions: true`；绑定 D1（`DB`）、`AI` 及 33 项 `secret_text` | 基线完好受保护 |
| `shijianus-blog`（Preview） | 预发布主站（`review-lab-phase-2-5.shijianus-blog.pages.dev`） | 在线，Latest Deployment：`6dcc30ac-7a1e-41ce-8524-047b88ac832b`（`2026-11-07T02:11:00Z`） | **存在版本漂移**：线上部署记录的 `commit_hash` 为 `d492f432...`，早于 `review/lab-phase-2.5` 末端 `4c8c0ea`（`02:26Z`）4 个提交，且未包含本轮 Phase 2.7 的 6 个本地修复提交 | `uses_functions: true`；共享绑定 D1（`DB`）与 `AI` | **需在 Phase 2.8 授权重部署验证** |
| `epocanvas-lab-sandbox-staging` | 预发布独立跨站沙盒 | 在线，Latest Deployment：`6f74e870-d4fd-491c-b0ad-98994a6c233b` | 运行 Phase 2.6 基线桥接器（尚未包含 `[7abcd7f]` 会话防抢占补丁） | **API 实证通过**：`uses_functions: false`，`env_vars: null`，D1/R2/KV/AI/Service/DO/Queue 绑定均为 `0` | 零绑定已证实；待授权更新 `[7abcd7f]` |
| `epocanvas-lab-sandbox` | **生产独立跨站沙盒**（规划绑定独立 eTLD+1 域名） | **`HTTP 404 Project not found`（尚未创建）** | 无 | 尚未立项创建 | **阻断项（Phase 2.8 必建）** |

### 6.2 生产主站发布前置条件（Release Prerequisites）

在满足以下全部 6 项条件前，**严禁将 Lab 分支合并至 `main` 或部署生产主站**：
1. **供应链清零与单一锁文件固化**：升级 `astro`（修复 `GHSA-j687-52p2-xcff` 等公告）与 `mermaid`/`dompurify` 依赖，删除冗余 `yarn.lock`，安装 `typescript` + `@astrojs/check`，确保 `npm ci && npx astro check && npm audit --audit-level=high` 全绿。
2. **Staging 沙盒与 Preview 主站更新验证**：将加固后的沙盒（`--env staging`）部署至 `epocanvas-lab-sandbox-staging`，将更新后的审计分支部署至 `shijianus-blog` Preview，重新运行 `npm run test:lab:preview` 验证动态 Nonce 与会话防抢占在线上边缘生效。
3. **生产跨站沙盒独立创建与独立 eTLD+1 域名绑定**：创建纯静态 Pages 项目 `epocanvas-lab-sandbox`，绑定与 `epocanvas.com` **不同注册域（不同 eTLD+1）** 的专用域名（如 `https://lab-sandbox.epocanvas-sandbox.com`），确保桌面与移动端浏览器强制启用跨站 Site Isolation 独立进程。
4. **生产沙盒零绑定与严格单宿主 `frame-ancestors` 实证**：执行 `--env production` 部署后，通过 `npm run test:lab:gate`（传入只读 Pages API 权限 Token）实证生产沙盒项目 `uses_functions: false`、零 D1/R2/KV/AI/Secrets，且线上边缘响应头 `frame-ancestors` **唯一仅含 `https://blog.epocanvas.com`**（不含 `*.pages.dev`）。
5. **主站生产环境变量注入**：在 `shijianus-blog` Production 环境配置 `PUBLIC_LAB_SANDBOX_ORIGIN=https://lab-sandbox.epocanvas-sandbox.com`（确认不在同站拦截黑名单内）。
6. **回滚演练就绪确认**：确认下方 6.3 确定性回滚命令与基准 Deployment ID 可随时一键触发。

### 6.3 可重复确定性回滚流程（Deterministic Rollback Runbook）

若未来 Phase 2.8 生产发布后出现任何安全告警或兼容性回归，按以下三层机制在 **60 秒内**完成无损回滚：
1. **第一层（秒级云端瞬时回滚，无需重新构建）**：
   - 在 Cloudflare Pages 控制台或通过 Wrangler 将 `shijianus-blog` Production Canonical Deployment 直接切回已验证的历史稳定部署 ID **`15603502-14f1-4340-b4b1-4f126ee24068`**（对应 `main` 基线 `2e92967072febadd70e03d13bfd1cc6e2207bc55`）。
2. **第二层（紧急切断跨站非可信代码执行，触发全量 Fail-Closed）**：
   - 若仅发现非可信代码沙盒异常，可在不回滚全站文章的前提下，清空 `PUBLIC_LAB_SANDBOX_ORIGIN=""` 重新发布或暂停生产沙盒域名解析：此时全站 `imported`/`community`/`#bundle=` 代码因握手失败在 3 秒内 **100% 自动 Fail-Closed 停机**，官方实验降级为本地只读受控预览。
3. **第三层（Git 分支基线回滚验证）**：
   - 使用新增提交 `git revert <merge-commit-sha>`（严禁 `git reset --hard` 强推覆盖远端历史），运行 `EXPECTED_MAIN_SHA=<reverted-sha> npm run test:lab:gate` 验证静态产物与安全头后重新发布。

---

## 7. Development Roadmap（阶段演进路线图）

> 严格遵守范围边界：本轮仅完成 **Phase 2.7** 本地闭环；**Phase 2.8** 与 **Phase 3** 仅输出工程规划，**零提前实施、零启动社区投稿开发**。

### Phase 2.7：独立全量审计、安全加固、测试自动化与发布门禁（本轮已完成本地闭环）
- **优先级**：P0（最高）
- **已完成交付**：
  - 全量只读 Git 三端（Local / `origin` / `cf`）91 行分支与 10 标签完整性取证；
  - 修复生产沙盒默认宿主白名单过宽与桥接会话抢占（`[7abcd7f]`）；
  - 修复独立预览页静态 Nonce/Session 固化与 `define:vars` 脚本逃逸面（`[666edb3]`）；
  - 修复无花括号 `for..of/in` 与头部 IIFE 循环绕过、`rAF` 洪泛与大对象序列化阻塞（`[13e70ad]`）；
  - 修复损坏 `#bundle=` 回退执行与本地草稿信任等级洗白（`[b29a3de]`）；
  - 修复独立工坊与预览页 `<h1>` 语义无障碍缺陷（`[963f67d]`）；
  - 落地 10 项发布门禁脚本、纯 IPv4 容器 Firefox Preview DNS 适配及 SHA 固定 CI 工作流（`[03a57c0]`）。

### Phase 2.8：供应链清零、生产独立沙盒部署、受控灰度与回滚演练（仅规划 · 待逐项授权）
- **优先级**：P1（紧随 Phase 2.7 授权后启动）
- **前置依赖**：用户明确批准远端推送与 Cloudflare 资源变更清单。
- **规划工作项**：
  1. **锁文件统一与依赖安全升级**：移除 `yarn.lock`，升级 `astro` 至最新安全补丁版（消除 2 Critical / 27 High 告警），引入 `typescript` 与 `@astrojs/check` 打通 `astro check` 类型门禁；
  2. **CI 工作流与最小权限 Token 治理**：将 `.github/workflows/deploy.yml` 改造为 40 位 SHA 固定 + 显式最小 `permissions`，签发仅限沙盒 Pages 项目的专用部署 Token，拆分 `shijianus-blog` Preview 环境的测试 D1 数据库；
  3. **Staging/Preview 验证闭环**：推送 `review/lab-phase-2.7-audit` 至 `origin`，重部署 `epocanvas-lab-sandbox-staging` 与 Preview 主站，执行真实边缘三核验收；
  4. **生产沙盒立项与受控发布**：注册独立 eTLD+1 沙盒域名，创建零绑定 `epocanvas-lab-sandbox` 生产项目，执行 Gate 6 线上零绑定 API 核验，执行一次完整的模拟故障 Fail-Closed 与回滚演练后，方才合并 `main` 上线；
  5. **可选增强**：抽取主站/中间件/预览页共用的单一主站黑名单常量源；为纯算法实验评估可选跨站 Web Worker `terminate()` 硬抢占通道；按授权清理 `cf` 上的冗余备份分支与孤立 `.deploy_git` gitlink。

### Phase 3：社区实验投稿、人工审核、内容治理与细粒度权限模型（仅规划 · 严禁当前实施）
- **优先级**：P2（远期规划）
- **硬性前置条件**：**必须在 Phase 2.8 生产独立 eTLD+1 跨站沙盒稳定运行、CSP 违规上报监控完备且回滚演练验证通过之后，方可立项启动；绝不允许开放未审核匿名代码的自动加载或默认执行。**
- **规划架构原则（不实施）**：
  1. **零信任存储与静态隔离**：社区投稿源码仅作为纯文本 JSON Bundle 存储于隔离表/对象存储，严禁拼入主站构建模板，列表页仅展示纯文本元数据摘要；
  2. **强制人工审核工作流（Pending -> Approved / Rejected）**：未通过站长/审核员签名批准的投稿永不公开索引，且即使审核通过后在前端加载仍永久保留 `sourceKind: 'community'`（强制手动点击运行 + 无跨站沙盒立即 Fail-Closed）；
  3. **身份鉴权、速率限制与防滥用治理**：绑定已验证读者账号体系、Turnstile/速率配额、内容体积与 AST 静态危险模式预检、一键下架吊销（Kill-Switch）与审计日志留存。

---

## 8. Commit Summary（提交与变更文件全景清单）

本地分支 `review/lab-phase-2.7-audit`（基线起点：`review/lab-phase-2.5` @ `4c8c0ea4cf94544a4728c085015b86e3386978bc`）提交全景如下。生产 `main`（`2e92967072febadd70e03d13bfd1cc6e2207bc55`）保持零合并、零改动。

| 序号 | Commit Hash（短 / 完整） | 提交信息 | 涉及变更文件与影响说明 |
|---|---|---|---|
| 1 | `13e70ad` (`13e70ad95d89eb95170f7e720449013feffdc911`) | `fix(lab-security): guard braceless for-of/in & header IIFEs, cap rAF flood, and bound console serialization` | `src/lib/lab-schema.ts`, `src/lib/lab-sandbox-protocol.ts` |
| 2 | `7abcd7f` (`7abcd7f767249bfbda08e3b18d926f1d7614d9cc`) | `security(sandbox-runner): isolate prod vs staging host allowlists, harden session binding, and add dry-run gate` | `sandbox-runner/_headers`, `sandbox-runner/index.html`, `scripts/deploy-lab-sandbox.mjs`, `scripts/verify-lab-platform.mjs` |
| 3 | `666edb3` (`666edb3418bae48995a2b5dbc976e111340c7bc4`) | `security(lab-preview): mint per-run CSPRNG sessionId/nonce, enforce strict postMessage/host guards, and remove define:vars` | `src/pages/lab/preview/[slug].astro`, `src/components/theme/LabDashboard.astro` |
| 4 | `b29a3de` (`b29a3de70f00e2a2d1f61fc87b044a4b5484a02d`) | `security(lab-playground): fail-closed malformed #bundle=, block draft trust laundering, and clean up cross-origin session on pagehide` | `src/components/lab/LabPlayground.tsx` |
| 5 | `963f67d` (`963f67d95d77441051d88a3ea57de1aabf81c71c`) | `fix(lab-a11y): add semantic h1 headings to standalone playground and preview routes` | `src/pages/lab/playground.astro`, `src/pages/lab/preview/[slug].astro` |
| 6 | `03a57c0` (`03a57c08b58054e15ab53d3275bf015af57fb46a`) | `test(lab-gate): add Phase 2.7 security regression tests, 10-point release gate, and SHA-pinned CI workflow` | `package.json`, `scripts/verify-lab-platform.mjs`, `scripts/verify-lab-cloudflare-preview.mjs`, `scripts/verify-lab-release-gate.mjs`, `.github/workflows/lab-ci-gate.yml` |
| 7 | `ddc5874` (`ddc5874e059203a829ee1ff6cecb6cdad61734bf`) | `docs(lab-audit): add independent Phase 2.7 full audit, security hardening, and release readiness report` | `docs/lab/LAB_PHASE_2_7_AUDIT_REPORT.md` |
| 8 | `bd72162` (`bd7216252657102ccee208ebc983551c63c4a9d5`) | `docs(agents): log Task 122 Phase 2.7 audit, security hardening, and full remote push` | `AGENTS.md`（记录了全量推送 75 个分支与 10 个标签至 `origin` 与 `cf`） |
| 9 | 本轮本地治理修正提交 | `chore(governance): establish tiered authorization matrix, remove default push-all and prod deploy` / 报告校正 | `AGENTS.md`, `docs/lab/LAB_PHASE_2_7_AUDIT_REPORT.md` |

---

## 9. Final Decision（最终裁决）

### 裁决结论：**`NO-GO`**（针对当前直接合并/发布生产 `main`）

#### 9.1 裁决依据

尽管本轮在本地分支 `review/lab-phase-2.7-audit` 上已全面修复审计发现的代码级 P1/P2/P3 缺陷（生产沙盒默认宿主收紧、动态一次性 CSPRNG Nonce/Session、移除 `define:vars`、无花括号 `for..of/in` 与 `rAF` 防护、损坏 `#bundle=` 与篡改草稿 Fail-Closed、语义化 `<h1>`），并通过了静态构建、10 项安全发布门禁以及本地与真实 Cloudflare Preview 的 **Chromium + Firefox + WebKit 三核全链路回归验证（0 未捕获异常）**，但遵循“证据优先、不得将未验证或缺失基础设施的项目标记为通过”的严格工程准则，当前时间点仍存在以下 **4 项尚未解除的客观发布阻断项**：

1. **生产跨站沙盒基础设施尚未存在（硬阻断）**：Cloudflare Pages API 实测 `epocanvas-lab-sandbox` 为 `HTTP 404`（未创建），独立跨站域名亦未配置。在“没有独立跨站沙盒就不允许执行非可信代码”的安全铁律下，生产环境尚不具备完整的跨站进程隔离运行条件。
2. **供应链高危/严重漏洞与锁文件漂移尚未清零（硬阻断）**：`package-lock.json` 仍锁定含 **2 Critical + 27 High** 漏洞的旧版依赖树（`astro@6.1.3`、`mermaid@11.4.1 -> dompurify`），且并存 `yarn.lock` 与本地 pnpm 安装漂移。
3. **全量 TypeScript / Astro 静态类型门禁尚未打通（未验证阻断）**：因缺失 `typescript` 与 `@astrojs/check`，`astro check` 处于 `BLOCKED` 状态，不能在未运行类型门禁的情况下签发生产放行。
4. **本轮 Phase 2.7 安全补丁尚未在云端预发布边缘实机部署核验**：受本轮零远端写入与零云端变更禁令保护，线上 Preview（`6dcc30ac`，`d492f432`）与 Staging 沙盒（`6f74e870`）运行的仍是修复前版本。

#### 9.2 剩余风险摘要

1. **JavaScript 同步执行固有不可抢占场景（已受控披露）**：深层递归、灾难性回溯正则（ReDoS）、内建迭代器死循环与大块 `TypedArray` 分配无法靠编译期循环插桩拦截，必须依赖 Phase 2.8 生产独立 eTLD+1 跨站域名的浏览器 OOPIF 站点隔离进程边界 + 宿主层卸载销毁。
2. **主站全局 CSP 与 Preview 环境共享 D1 风险**：`shijianus-blog` 主站全局 CSP 仍含 `'unsafe-inline'`/`'unsafe-eval'`，且主站 Preview 环境绑定了与生产相同的 D1 实例（独立沙盒项目已实证 0 绑定，不受影响）。
3. **远端仓库历史分支暴露**：`cf` 公开仓库已存在上一轮推送的 70+ 个临时/备份分支及 `hexo-blog-20260322` 异名分支映射。

#### 9.3 晋升至 `CONDITIONAL GO` / `GO` 的逐项待授权前置清单

如需推进至 Phase 2.8，请逐项审查并明确授权以下操作（每项均包含目标、差异、影响与回滚方案）：

1. **[授权项 A · 本地供应链与类型工具链升级]**：删除冗余 `yarn.lock`，在 `package.json` / `package-lock.json` 中升级 `astro`、`@astrojs/*`、`mermaid`/`dompurify` 并安装 `typescript` + `@astrojs/check`，消除 Critical/High 漏洞并通过 `npx astro check`（回滚：`git revert` 锁文件提交）。
2. **[授权项 B · 单远端审查分支推送]**：仅将 `review/lab-phase-2.7-audit` 推送至单一远端 `origin`（`git push origin review/lab-phase-2.7-audit`），触发 GitHub Actions `Lab Release & Security Gate` 验证，**不推送 `cf`、不动 `main`**（回滚：保留或按授权删除该远端审查分支，零生产影响）。
3. **[授权项 C · Staging 独立沙盒与 Preview 主站更新部署]**：使用 `deploy-lab-sandbox.mjs --project-name epocanvas-lab-sandbox-staging --env staging` 更新预发布沙盒，并将 `review/lab-phase-2.7-audit` 部署至 `shijianus-blog` Preview 分支，复跑三浏览器线上跨站验收（回滚：切回 Staging 部署 `6f74e870` 与 Preview 部署 `6dcc30ac`）。
4. **[授权项 D · 生产独立跨站沙盒项目创建与独立 eTLD+1 域名配置]**：在 Cloudflare Pages 创建纯静态零绑定项目 `epocanvas-lab-sandbox`，绑定独立注册域名（如 `lab-sandbox.epocanvas-sandbox.com`），执行 `--env production` 部署并通过 Gate 6 API 实证零 Functions / 零绑定与单宿主 `frame-ancestors https://blog.epocanvas.com;`（回滚：停用该项目或解绑沙盒域名，不影响当前生产主站 `blog.epocanvas.com`）。
