# SHIJIANUS-CONST-001 · 核心架构宪法与版本治理协议

**文档标识符**：`SHIJIANUS-CONST-001`  
**文档类型**：Constitutional Specification（最高约束层）  
**版本**：`v1.0.0`  
**状态**：`BINDING — 自签署起永久生效`  
**生效日期**：见 Git Tag `constitution/v1.0.0`  
**所有者**：Shijianus Project Maintainer  
**效力范围**：本文档对所有参与 Shijianus 项目的贡献行为具有最高约束力，优先级高于任何口头约定、临时决策或工具默认配置。  
**修订机制**：见第五章 §5.3

---

## 目录

1. [序言与核心价值观](#第一章-序言与核心价值观)
2. [历史不可变原则（Immutable Ledger）](#第二章-历史不可变原则immutable-ledger)
3. [绝对单线程与物理锁定协议（Physical Locking Protocol）](#第三章-绝对单线程与物理锁定协议physical-locking-protocol)
4. [语义化版本演进规范（Semantic Versioning Protocol）](#第四章-语义化版本演进规范semantic-versioning-protocol)
5. [分支治理模型（Branch Governance）](#第五章-分支治理模型branch-governance)
6. [代码审查与合并协议（Review & Merge Protocol）](#第六章-代码审查与合并协议review--merge-protocol)
7. [自动化防护层（Automated Enforcement Layer）](#第七章-自动化防护层automated-enforcement-layer)
8. [违规处理与宪法修订](#第八章-违规处理与宪法修订)
9. [附录](#第九章-附录)

---

## 第一章 序言与核心价值观

### 1.1 立法背景

软件项目的衰退通常不始于某次重大错误，而是无数次"这次就算了"的妥协累积：一次因急于修复而执行的 `--force push`，一次"顺手格式化"导致的跨域污染，一个"版本号以后再说"的发布。这些行为单独看来微不足道，但它们所侵蚀的是项目最核心的资产——**可信赖的、线性的历史叙事**。

Shijianus 是一个以**架构诚实性**为第一优先级的项目。本宪法的存在，是为了将这种诚实性从个人自律转化为系统约束。

### 1.2 三项不可动摇的核心价值

**价值一：历史即文档**  
Git 提交历史不仅是版本控制记录，更是项目演进的第一手叙事文档。抹除历史等同于销毁文档。

**价值二：变更应有明确意图**  
每一次提交必须服务于单一、明确的目的。混合意图的提交是架构腐化的起点。

**价值三：版本号是对外的承诺**  
版本号的每一次变化都是向使用者、协作者和未来的自己发出的结构化信号。随意的版本号等同于无效的承诺。

---

## 第二章 历史不可变原则（Immutable Ledger）

### 2.1 不可变性宣言

> **任何在 `main` 分支上已存在的 commit，其存在性和内容均不可被抹除、修改或重排序。无论原因，无论情境，无一例外。**

本原则不设"紧急豁免"条款。认为自己处于"必须重写历史"情境的人，在 99% 的情况下面临的实际问题是另有合法解法的。

### 2.2 永久禁止的操作清单

以下 Git 操作在本项目中**永久且无条件禁止**。任何自动化工具或脚本均不得包含这些命令：

```
# ═══════════════════════════════════════════════════════
#  PROHIBITED OPERATIONS — NEVER EXECUTE ON main BRANCH
# ═══════════════════════════════════════════════════════

git reset --hard <ref>           # 破坏性重置，抹除工作区与提交历史
git reset --soft <ref>           # 在 main 上拆解已推送的 commit
git reset --mixed <ref>          # 同上

git push --force                 # 强制推送，覆盖远端历史
git push --force-with-lease      # 即便有 lease 保护，仍禁止
git push -f                      # 前者的简写形式

git commit --amend               # 修改最近一次 commit（已推送后）
git rebase -i HEAD~N             # 交互式变基，用于合并/修改/删除 commit
git rebase <branch>              # 在已发布分支上的任何变基

git filter-branch                # 历史过滤（已废弃，但仍明确禁止）
git filter-repo                  # filter-branch 的现代替代品，同样禁止

git cherry-pick -n ... --no-commit  # 配合后续 amend 使用的间接篡改路径

# 以下为间接违规路径，同样禁止
git stash drop stash@{0}         # 在 stash 被用作"临时忽略违规内容"时
```

**本地开发分支豁免**：上述禁令仅适用于已推送至远端的分支（尤其是 `main`）。在个人本地的、从未推送的 feature 分支上，`git rebase -i` 等操作是被允许的。一旦分支推送，即受约束。

### 2.3 状态回退的唯一合法路径

当需要将项目状态回退至某历史节点时，唯一合法的操作序列如下：

#### 路径 A：使用 `git revert`（推荐，适用于单次或少量 commit 的撤销）

```bash
#!/bin/bash
# rollback-via-revert.sh

# ── 步骤 0：前置脏检查（任何回退操作前的强制步骤）──────────────────
echo "[CHECK] Verifying working tree cleanliness..."
if ! git diff --quiet; then
  echo "[ABORT] Unstaged changes detected."
  echo "        Please run: git stash push -m 'pre-rollback/$(date +%Y%m%d-%H%M%S)'"
  exit 1
fi

if ! git diff --cached --quiet; then
  echo "[ABORT] Staged but uncommitted changes detected."
  echo "        Please commit or stash before proceeding."
  exit 1
fi

echo "[OK] Working tree is clean."

# ── 步骤 1：确认当前分支为 main ─────────────────────────────────────
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "[ABORT] This operation must be performed on 'main'."
  echo "        Current branch: $CURRENT_BRANCH"
  exit 1
fi

# ── 步骤 2：执行 revert ──────────────────────────────────────────────
TARGET_COMMIT="$1"
if [ -z "$TARGET_COMMIT" ]; then
  echo "Usage: $0 <commit-hash-to-revert>"
  exit 1
fi

echo "[EXEC] Reverting commit $TARGET_COMMIT..."
git revert --no-edit "$TARGET_COMMIT"

# revert commit message 必须被编辑以包含原因说明
# 使用 --no-edit 后需立即执行 amend 补充原因（此处为本地未推送的 revert commit，允许 amend）
echo "[REMIND] Amend the revert commit message to include the reason for reversal."
echo "         Run: git commit --amend"
```

#### 路径 B：从历史节点创建新分支（适用于需要从某状态重新演进的场景）

```bash
#!/bin/bash
# rollback-via-branch.sh

# ── 步骤 0：前置脏检查（同路径 A）──────────────────────────────────
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[ABORT] Working tree is dirty."
  echo "        Stash your changes: git stash push -m 'pre-branch-rollback/$(date +%s)'"
  exit 1
fi

# ── 步骤 1：签出目标 commit 到具名新分支 ────────────────────────────
TARGET_COMMIT="$1"
REASON="$2"  # 必填，用于分支命名

if [ -z "$TARGET_COMMIT" ] || [ -z "$REASON" ]; then
  echo "Usage: $0 <target-commit-hash> <reason-slug>"
  echo "Example: $0 a3f8c2d1 'remove-broken-search-feature'"
  exit 1
fi

SHORT_HASH="${TARGET_COMMIT:0:8}"
BRANCH_NAME="rollback/from-${SHORT_HASH}/${REASON}/$(date +%Y%m%d)"

echo "[EXEC] Creating rollback branch: $BRANCH_NAME"
git checkout -b "$BRANCH_NAME" "$TARGET_COMMIT"

echo ""
echo "[NEXT STEPS]"
echo "  1. Make your corrections on this branch."
echo "  2. When ready, open a pull request from '$BRANCH_NAME' to 'main'."
echo "  3. The PR description MUST include:"
echo "     - Reason for rollback"
echo "     - Original commit hash: $TARGET_COMMIT"
echo "     - What will change relative to current main"
```

#### 路径 C：`git revert` 多个连续 commit

```bash
# 撤销一段范围内的 commit（左开右闭区间）
# 注意：OLDEST 是需要撤销范围内的最老 commit
git revert --no-commit OLDEST^..NEWEST
git commit -m "revert: roll back changes from OLDEST to NEWEST

Reason: <必须填写具体原因>
Reverted commits:
  - NEWEST: <subject>
  - ...
  - OLDEST: <subject>"
```

### 2.4 Stash 操作规范

`git stash` 是合法工具，但须遵守以下规范：

- **必须使用具名 stash**：`git stash push -m '<描述>'`，禁止使用无名 stash
- **Stash 最大保留期限**：30 天。超期 stash 在每次 pre-push 检查时触发清理提醒
- **禁止将 stash 用作长期代码寄存**：stash 仅用于临时保存工作区状态，不得替代 WIP commit 或 feature 分支

### 2.5 合法的历史操作汇总

| 操作 | 合法性 | 适用条件 |
|------|--------|---------|
| `git revert` | ✅ 合法 | 撤销已推送的 commit，产生新 commit |
| 从历史节点建立新分支 | ✅ 合法 | 需要从某状态重新演进 |
| `git cherry-pick` | ✅ 合法 | 将其他分支的特定 commit 移植到当前分支 |
| `git tag` (annotated) | ✅ 合法 | 标记发布节点 |
| 本地未推送分支的 `rebase -i` | ⚠️ 条件合法 | 仅限从未推送至远端的本地分支 |
| `git reset --hard` | ❌ 禁止 | 任何情况 |
| `git push --force` | ❌ 禁止 | 任何情况 |

---

## 第三章 绝对单线程与物理锁定协议（Physical Locking Protocol）

### 3.1 修改领域（Change Domain）定义

项目文件系统被划分为若干**修改领域**。每次 commit 必须严格隶属于**且仅属于一个**领域。

#### 完整领域映射表

| 领域标识符 | 优先级 | 覆盖路径（Glob 表达式）| 允许的变更类型 |
|-----------|--------|----------------------|-------------|
| `domain:constitution` | P0（最高）| `CONST-*.md`, `RFC-*.md`, `.github/workflows/*.yml` | 协议文档、CI 配置 |
| `domain:layout` | P1 | `src/layouts/**`, `src/components/SiteHeader.*`, `src/components/SiteFooter.*`, `src/components/Navigation.*` | 全局布局、导航、页脚 |
| `domain:content-ui` | P1 | `src/components/ArticleCard.*`, `src/components/TagCloud.*`, `src/components/Pagination.*`, `src/components/Toc.*`, `src/pages/blog/**` | 内容展示组件 |
| `domain:config` | P1 | `astro.config.*`, `tsconfig.json`, `package.json`, `package-lock.json`, `.env.*`, `*.config.ts`, `*.config.js` | 构建、依赖、环境配置 |
| `domain:style-system` | P1 | `src/styles/**`, `tailwind.config.*`, `src/tokens/**` | 全局样式系统、设计 Token |
| `domain:content` | P2 | `src/content/**` | 纯内容文件（.md, .mdx） |
| `domain:infra` | P2 | `scripts/**`, `.github/**`, `Dockerfile`, `docker-compose.*`, `.husky/**` | 自动化、CI/CD、容器 |
| `domain:test` | P2 | `tests/**`, `__tests__/**`, `*.test.ts`, `*.spec.ts` | 测试文件 |
| `domain:docs` | P3 | `docs/**`, `README.md`, `CHANGELOG.md`, `LICENSE` | 项目文档（宪法文档除外）|
| `domain:misc` | P3（最低）| 其他未分类文件 | 需在 commit message 中说明 |

### 3.2 跨域禁令

**在同一个 commit 中混合来自不同领域的文件变更，构成本宪法第三章违规。**

**唯一豁免情形**：当一项功能变更在架构上必然导致多个领域同时变化（如新增一个同时涉及组件与样式的页面类型），此时允许合并，但 commit message 中**必须**：

1. 列出所有涉及的领域
2. 说明为何不可分拆
3. 使用 `[cross-domain]` 标签

```
feat(cross-domain): add dark mode toggle

[cross-domain] domains: domain:layout, domain:style-system
Reason: The toggle component and its CSS custom properties must be
introduced atomically; the component fails without the variables,
and the variables alone produce no visible effect. Splitting would
leave the project in a broken intermediate state across commits.

Affected files:
  - src/components/SiteHeader.tsx (domain:layout)
  - src/styles/themes.css (domain:style-system)
  - src/tokens/dark-mode.ts (domain:style-system)
```

### 3.3 变更锁定的实际含义

当你正在执行 `domain:layout` 的任务时：

- ❌ **不得**因"顺眼看到了"而修改 `ArticleCard.tsx`
- ❌ **不得**"顺手"更新 `package.json` 中一个不相关的依赖版本
- ❌ **不得**对无关文件执行代码格式化（即使它们"正好开着"）
- ✅ 你应当：将发现的无关问题**记录为新 Issue**，在当前任务完成后单独处理

### 3.4 Commit Message 强制规范

所有 commit message 必须遵循 **Conventional Commits 1.0** 的扩展方言：

```
<type>(<domain-short>): <subject>

[optional body]

[optional footer(s)]
```

**类型（type）枚举**：

| 类型 | 含义 | 触发版本号变化 |
|------|------|-------------|
| `feat` | 新功能 | MINOR++ |
| `fix` | Bug 修复 | PATCH++ |
| `perf` | 性能改进（无 API 变化）| PATCH++ |
| `refactor` | 重构（无功能变化）| PATCH++ |
| `style` | 代码格式（不影响逻辑）| 无 |
| `docs` | 文档变更 | 无（内容文章除外）|
| `test` | 测试相关 | 无 |
| `chore` | 工具、依赖更新 | PATCH++（若涉及 runtime dep）|
| `content` | 文章内容发布/更新 | 无（使用 +BUILD 后缀）|
| `breaking` | 破坏性变更 | MAJOR++ |
| `revert` | 通过 revert 撤销 | 视被撤销内容决定 |

**Subject 行规范**：
- 长度：50 字符以内
- 时态：祈使句（"add feature" 而非 "added feature"）
- 首字母小写，结尾不加句号
- 禁止使用含糊词汇：~~"update"、"change"、"misc"、"fix things"~~

**Body 规范**：
- 与 subject 以空行分隔
- 解释**为什么**做出此变更，而非**做了什么**（"what"已由 diff 表达）
- 每行不超过 72 字符

**Footer 规范**：

```
# 关联 Issue
Closes #123
Fixes #456

# 破坏性变更（必须在 footer 声明）
BREAKING CHANGE: The `pubDate` field in Frontmatter now requires
ISO 8601 format with timezone. YYYY-MM-DD format is no longer accepted.

# 共同作者
Co-authored-by: Name <email@example.com>

# 领域声明（跨域 commit 必须包含）
Domains: domain:layout, domain:style-system
```

---

## 第四章 语义化版本演进规范（Semantic Versioning Protocol）

### 4.1 Shijianus 版本号结构

本项目采用扩展的语义版本格式：

```
MAJOR.MINOR.PATCH[+BUILD_QUALIFIER]
```

示例：`2.1.3`、`2.1.3+content.20240315`、`3.0.0`

### 4.2 版本号自增触发规则

#### MAJOR 版本（不兼容的架构变更）

以下任意一项触发 MAJOR 自增：

| 触发条件 | 示例 |
|---------|------|
| 更换底层构建框架 | Astro → Next.js；Astro 大版本迁移（如 v4→v5）且涉及 API 破坏 |
| 更换内容集合系统 | 从文件系统 .md 迁移至 headless CMS |
| 对外暴露 API 的破坏性变更 | RSS Feed 格式变更、Sitemap URL 结构变更 |
| 路由系统重大重构 | URL 结构的不向后兼容变化 |
| Frontmatter Schema 破坏性变更 | 删除必填字段、修改日期格式约定 |

**MAJOR 变更的附加义务**：
1. 必须提前在 `CHANGELOG.md` 中发布迁移指南（Migration Guide）
2. 必须在 Git Tag 的 annotated message 中详述破坏性变更清单
3. 如果项目有外部订阅者，须在发布前至少 14 天通知

#### MINOR 版本（向后兼容的功能新增）

以下任意一项触发 MINOR 自增：

- 新增页面类型或路由（如新增 `/projects` 页面）
- 新增 Astro 集成或 Remark/Rehype 插件
- 新增内容分类系统（如新增 Tag 或 Series 功能）
- 新增自动化脚本（活跃度评分、密度评分等）
- 新增国际化（i18n）支持
- 新增 RSS/JSON Feed 变体

#### PATCH 版本（向后兼容的修复与改进）

以下触发 PATCH 自增：

- Bug 修复（样式错位、链接失效、构建警告）
- 依赖安全更新（`npm audit fix`）
- 性能优化（图片懒加载、Bundle 大小优化）
- 无破坏性的重构（组件提取、代码清理）
- 文档修正（README 更新、注释补充）

#### BUILD 限定符（不触发版本自增）

纯内容发布使用 BUILD 限定符，不触发任何版本字段变化：

```
# 格式：+content.YYYYMMDD
# 示例：发布于 2024-03-15 的文章批次
1.4.2+content.20240315

# 批量迁移/重组不触发 MINOR，使用特殊限定符
1.4.2+migration.20240315
```

### 4.3 版本号的计算规则

- PATCH 自增 → PATCH + 1，其余不变
- MINOR 自增 → MINOR + 1，PATCH 归零
- MAJOR 自增 → MAJOR + 1，MINOR 归零，PATCH 归零
- BUILD 限定符在每次构建时可以不同，不影响三段式版本号
- **不允许手动跳号**：版本号只能逐步自增，不得直接从 `1.2.3` 跳至 `1.5.0`

### 4.4 Pre-release 版本标识

```
# Alpha（早期实验，可能破坏构建）
2.0.0-alpha.1

# Beta（功能完整，寻求反馈）
2.0.0-beta.1

# Release Candidate（待发布，仅修复关键 Bug）
2.0.0-rc.1
```

Pre-release 版本标识符**只允许在非 main 分支上存在**。合并至 main 时必须去除 pre-release 后缀。

---

## 第五章 分支治理模型（Branch Governance）

### 5.1 分支类型与命名规范

| 分支类型 | 命名模式 | 生命周期 | 合并目标 |
|---------|---------|---------|---------|
| 主干 | `main` | 永久 | — |
| 功能分支 | `feat/<domain-short>/<description>` | 功能完成后删除 | `main` |
| 修复分支 | `fix/<issue-or-description>` | 修复后删除 | `main` |
| 回退分支 | `rollback/from-<hash>/<reason>/<date>` | PR 合并后删除 | `main` |
| 发布准备 | `release/v<major>.<minor>.<patch>` | Tag 打完后删除 | `main` |
| 宪法修订 | `const/amend-<clause-ref>` | 修订批准后删除 | `main` |
| 内容批次 | `content/<YYYYMMDD>` | 合并后删除（可选保留）| `main` |

**命名约束**：
- 所有字母使用小写
- 单词间使用连字符 `-`，不使用下划线 `_`
- `description` 部分不超过 30 字符
- 禁止使用模糊命名：~~`test`、`temp`、`wip`、`my-branch`~~

### 5.2 分支保护规则

`main` 分支须配置以下保护（在 GitHub/Gitea 等平台的仓库设置中强制执行）：

```yaml
# .github/branch-protection.yml（文档化配置，需手动在平台设置）
main:
  required_status_checks:
    strict: true
    contexts:
      - "ci/build"
      - "ci/lint-commits"
      - "ci/domain-check"
      - "ci/type-check"
  enforce_admins: true          # 管理员同样受保护规则约束
  required_pull_request_reviews:
    required_approving_review_count: 1
    dismiss_stale_reviews: true
  restrictions: null
  allow_force_pushes: false     # 与本宪法第二章完全对齐
  allow_deletions: false
```

### 5.3 宪法修订流程

宪法文档（本文件及所有 RFC 文档）的修订须经过以下流程：

```
1. 提出修订 Issue
   └─ 在 Issues 中以 [CONST-AMEND] 标题提出修订需求
      └─ 必须包含：修订条款编号、当前文本、提议文本、修订理由

2. 讨论期
   └─ 重大条款变更（第二章、第三章）：最少 7 天讨论期
   └─ 轻微文本修正（格式、错别字）：无讨论期要求

3. 创建修订分支
   └─ git checkout -b const/amend-<clause-ref>

4. 提交 Pull Request
   └─ PR 标题格式：[CONST-AMEND] Clause §X.X: <描述>
   └─ PR 必须关联步骤 1 中的 Issue

5. 合并与归档
   └─ 修订内容合并至 main
   └─ 更新本文档的变更历史（§9.3）
   └─ 打 annotated tag：constitution/v<version>
```

---

## 第六章 代码审查与合并协议（Review & Merge Protocol）

### 6.1 PR 创建要求

每个 Pull Request 在提交审查前必须满足：

- [ ] 所有 CI 检查通过（见第七章）
- [ ] PR 描述使用标准模板（见下）
- [ ] 变更范围符合单一领域约束（或有合法的 `[cross-domain]` 声明）
- [ ] CHANGELOG.md 已按 §6.3 规范更新（MINOR 及以上版本变更）
- [ ] 无 WIP（Work In Progress）标记

**PR 描述标准模板**：

```markdown
## 变更概述

<!-- 一句话描述此 PR 做了什么 -->

## 变更类型

- [ ] feat（新功能）
- [ ] fix（Bug 修复）
- [ ] refactor（重构）
- [ ] style（样式/格式）
- [ ] docs（文档）
- [ ] chore（工具/依赖）
- [ ] content（内容发布）
- [ ] breaking（破坏性变更）

## 影响领域

- [ ] domain:layout
- [ ] domain:content-ui
- [ ] domain:style-system
- [ ] domain:config
- [ ] domain:content
- [ ] domain:infra
- [ ] domain:docs
- [ ] 其他：___

## 涉及的 RFC / 约束条款

<!-- 例如：此变更影响 RFC-002 §5.2 中的内容密度权重计算 -->

## 跨域声明（如适用）

<!-- 如果此 PR 涉及多个领域，在此解释为何无法拆分 -->

## 破坏性变更说明（如适用）

<!-- 详细描述破坏性变更及迁移路径 -->

## 自测清单

- [ ] 本地构建通过（`astro build`）
- [ ] 类型检查通过（`tsc --noEmit`）
- [ ] Lint 检查通过
- [ ] 在主流浏览器中目视验证
```

### 6.2 合并策略

| 场景 | 合并方式 | 理由 |
|------|---------|------|
| 功能分支 → main | **Squash Merge**（推荐）或 **Merge Commit** | 保持 main 历史整洁 |
| 修复分支 → main | **Merge Commit** | 保留修复过程的完整历史 |
| 发布分支 → main | **Merge Commit**（带 `--no-ff`）| 明确的发布节点 |
| 宪法修订 → main | **Merge Commit**（带 `--no-ff`）| 宪法变更应有明显的历史节点 |

**禁止使用 Rebase Merge**（在远端 PR 合并时），因为它会改变 commit 的 SHA，可能与本地的 `git log` 产生混淆。

### 6.3 CHANGELOG 维护规范

`CHANGELOG.md` 遵循 [Keep a Changelog](https://keepachangelog.com/) 格式：

```markdown
# Changelog

All notable changes to Shijianus will be documented in this file.
Dates are in YYYY-MM-DD format (Asia/Shanghai timezone).

## [Unreleased]

### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
### Infrastructure

---

## [1.3.0] - 2024-03-15

### Added
- Content density scoring system (RFC-002) integrated into build pipeline
- Floating Table of Contents for Deep-dive Paper level articles

### Changed
- Activity score alpha parameter adjusted from 0.70 to 0.65 (#87)
  Rationale: better balance for mixed-content blogs

### Fixed
- Incorrect timezone handling in pubDate parsing (issue #91)

### Infrastructure
- Migrated CI from GitHub Actions to self-hosted Gitea Actions
```

**CHANGELOG 写作规范**：
- 条目面向**人类读者**，而非 git log 的机械复制
- 每条条目说明"做了什么"，附带理由（"why"比"what"更有价值）
- 安全修复必须单独列在 `Security` 节，并附上 CVE 编号（如有）

---

## 第七章 自动化防护层（Automated Enforcement Layer）

### 7.1 Pre-commit Hook

```bash
#!/bin/bash
# .husky/pre-commit
# 在每次 commit 前自动执行

set -e

# ── 1. 领域单一性检查 ────────────────────────────────────────────────
echo "[HOOK] Checking change domain isolation..."

STAGED_FILES=$(git diff --cached --name-only)

classify_domain() {
  local file="$1"
  case "$file" in
    CONST-*.md|RFC-*.md|.github/workflows/*)
      echo "domain:constitution" ;;
    src/layouts/*|src/components/SiteHeader.*|src/components/SiteFooter.*|src/components/Navigation.*)
      echo "domain:layout" ;;
    src/components/ArticleCard.*|src/components/TagCloud.*|src/components/Pagination.*|src/components/Toc.*|src/pages/blog/*)
      echo "domain:content-ui" ;;
    astro.config.*|tsconfig.json|package.json|package-lock.json|*.config.ts|*.config.js|.env.*)
      echo "domain:config" ;;
    src/styles/*|tailwind.config.*|src/tokens/*)
      echo "domain:style-system" ;;
    src/content/*)
      echo "domain:content" ;;
    scripts/*|.github/*|Dockerfile|docker-compose.*|.husky/*)
      echo "domain:infra" ;;
    tests/*|__tests__/*|*.test.ts|*.spec.ts)
      echo "domain:test" ;;
    docs/*|README.md|CHANGELOG.md|LICENSE)
      echo "domain:docs" ;;
    *)
      echo "domain:misc" ;;
  esac
}

DOMAINS=$(echo "$STAGED_FILES" | while IFS= read -r file; do
  [ -n "$file" ] && classify_domain "$file"
done | sort -u)

DOMAIN_COUNT=$(echo "$DOMAINS" | grep -c .)

if [ "$DOMAIN_COUNT" -gt 1 ]; then
  # 检查是否有合法的 cross-domain 声明（从暂存的 commit msg 文件中读取）
  if [ -f ".git/COMMIT_EDITMSG" ] && grep -q "\[cross-domain\]" ".git/COMMIT_EDITMSG"; then
    echo "[WARN] Cross-domain commit detected, but [cross-domain] tag is present. Proceeding."
  else
    echo ""
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║  DOMAIN ISOLATION VIOLATION — CONST-001 §3.2            ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo ""
    echo "This commit spans multiple change domains:"
    echo "$DOMAINS" | sed 's/^/  • /'
    echo ""
    echo "Remediation options:"
    echo "  1. Split your changes: git add -p to stage only one domain"
    echo "  2. If truly inseparable, add [cross-domain] tag to commit message"
    echo "     and list affected domains + justification"
    echo ""
    exit 1
  fi
fi

# ── 2. Frontmatter 时间戳验证 ────────────────────────────────────────
echo "[HOOK] Validating Frontmatter timestamps..."

CONTENT_FILES=$(echo "$STAGED_FILES" | grep -E '^src/content/.*\.mdx?$' || true)

if [ -n "$CONTENT_FILES" ]; then
  echo "$CONTENT_FILES" | while IFS= read -r file; do
    if [ -f "$file" ]; then
      # 提取 pubDate 和 updatedDate（简单版本，生产环境建议用 Node.js 脚本）
      PUB_DATE=$(grep -m1 '^pubDate:' "$file" | awk '{print $2}' | tr -d '"' || true)
      UPDATED_DATE=$(grep -m1 '^updatedDate:' "$file" | awk '{print $2}' | tr -d '"' || true)
      
      if [ -z "$PUB_DATE" ]; then
        echo "[ERROR] Missing required 'pubDate' in: $file"
        exit 1
      fi
      
      echo "[OK] $file: pubDate=$PUB_DATE"
    fi
  done
fi

echo "[HOOK] All pre-commit checks passed."
```

### 7.2 Commit-msg Hook

```bash
#!/bin/bash
# .husky/commit-msg
# 验证 commit message 格式

COMMIT_MSG_FILE="$1"
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# 忽略 merge commit 和 revert commit 的自动生成消息
if echo "$COMMIT_MSG" | grep -qE "^(Merge|Revert)"; then
  exit 0
fi

# Conventional Commits 格式验证
PATTERN="^(feat|fix|perf|refactor|style|docs|test|chore|content|breaking|revert)(\([a-z:/-]+\))?: .{1,50}"

if ! echo "$COMMIT_MSG" | grep -qE "$PATTERN"; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════╗"
  echo "║  INVALID COMMIT MESSAGE FORMAT — CONST-001 §3.4         ║"
  echo "╚══════════════════════════════════════════════════════════╝"
  echo ""
  echo "Your message: $COMMIT_MSG"
  echo ""
  echo "Expected format:"
  echo "  <type>(<domain>): <subject>"
  echo ""
  echo "Valid types: feat fix perf refactor style docs test chore content breaking revert"
  echo ""
  echo "Examples:"
  echo "  feat(layout): add responsive sidebar component"
  echo "  fix(content-ui): correct pagination link overflow"
  echo "  content(content): publish article on AST parsing techniques"
  echo ""
  exit 1
fi

# subject 长度检查
SUBJECT=$(echo "$COMMIT_MSG" | head -1)
if [ ${#SUBJECT} -gt 72 ]; then
  echo "[WARN] Commit subject exceeds 50 chars (${#SUBJECT} chars). Consider shortening."
  # 警告但不阻断
fi

echo "[HOOK] Commit message format validated."
```

### 7.3 Pre-push Hook

```bash
#!/bin/bash
# .husky/pre-push

REMOTE="$1"
CURRENT_BRANCH=$(git branch --show-current)

# ── 强制推送检测 ────────────────────────────────────────────────────
# 注意：此 hook 的 args 中不含 --force 信息，通过检测 reflog 判断
# 生产环境建议直接在远端仓库配置 force-push 禁止规则

# ── main 分支直接推送检测 ──────────────────────────────────────────
if [ "$CURRENT_BRANCH" = "main" ]; then
  # 检查是否是发布 commit（通过 tag 判断）
  LATEST_TAG=$(git describe --exact-match --tags HEAD 2>/dev/null || true)
  if [ -z "$LATEST_TAG" ]; then
    echo "[WARN] Pushing to 'main' without a release tag."
    echo "       Consider: Is this push accompanied by a version tag?"
  fi
fi

# ── Stash 清理提醒 ─────────────────────────────────────────────────
STASH_COUNT=$(git stash list | wc -l | tr -d ' ')
if [ "$STASH_COUNT" -gt 0 ]; then
  echo "[REMIND] You have $STASH_COUNT stash(es) pending."
  echo "         Run 'git stash list' to review. Stashes older than 30 days should be resolved."
fi

echo "[HOOK] Pre-push checks complete."
```

### 7.4 CI Pipeline 配置

```yaml
# .github/workflows/ci.yml

name: Shijianus CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-commits:
    name: Validate Commit Messages
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: wagoid/commitlint-github-action@v5
        with:
          configFile: commitlint.config.js

  domain-check:
    name: Domain Isolation Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run domain isolation validator
        run: node scripts/check-domain-isolation.js

  type-check:
    name: TypeScript Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit

  build:
    name: Astro Build
    runs-on: ubuntu-latest
    needs: [lint-commits, domain-check, type-check]
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0    # 需要完整历史用于活跃度评分计算
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - name: Archive build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

---

## 第八章 违规处理与宪法修订

### 8.1 违规分级

| 级别 | 描述 | 典型情形 | 处置 |
|------|------|---------|------|
| **L1** | 轻微违规 | Commit message 格式不符合规范；单次 trivial 跨域修改 | CI 失败，修改后重新提交 |
| **L2** | 中度违规 | 跨域 commit 未附带 `[cross-domain]` 声明；版本号跳号 | PR 被拒绝，要求拆分并说明 |
| **L3** | 严重违规 | 在已推送分支上使用 `git revert` 以外的任何撤销操作 | 立即停止操作，通过合法路径修复；在 CHANGELOG 中记录事件 |
| **L4** | 宪法级违规 | 在 `main` 上执行任何形式的 force push 或历史重写 | 立即冻结 main 分支，通过新分支恢复，在 Incident Report 中永久记录 |

### 8.2 违规修复的一般原则

1. **停止**：一旦发现违规，立即停止所有相关操作
2. **评估**：判断违规级别和影响范围
3. **隔离**：如果违规已污染 main 分支，立即创建保护性快照分支
4. **修复**：通过合法路径（`git revert` 或新建分支）恢复正确状态
5. **记录**：在 CHANGELOG 或专门的 Incident Log 中记录违规事件，包括：发生时间、违规类型、影响范围、修复方式
6. **改进**：审查导致违规的根本原因，考虑加强自动化防护

### 8.3 宪法的效力与局限

本宪法规定的自动化检查（Hooks、CI）能够防止大多数 L1–L2 级违规，但对 L3–L4 级违规（通常绕过 hooks 直接操作）的防护依赖仓库平台的分支保护配置（§5.2）。

**本宪法无法做到的事情**：
- 防止具有仓库管理员权限的人在平台层面禁用保护后执行违规操作
- 自动检测所有形式的语义性违规（如"形式上属于单一领域但逻辑上应拆分的 commit"）

这些局限的存在提醒我们：**宪法的最终保障是创作者对架构诚实性价值的内在认同，而非外部约束。**

---

## 第九章 附录

### A. 发布流程完整检查清单

```bash
#!/bin/bash
# scripts/release.sh

set -e

VERSION="$1"
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>  (e.g., 1.3.0)"
  exit 1
fi

echo "═══════════════════════════════════════════════"
echo "  Shijianus Release Script v$VERSION"
echo "═══════════════════════════════════════════════"

# 前置检查
echo ""
echo "[CHECK 1/5] Working tree cleanliness..."
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[ABORT] Dirty working tree."
  exit 1
fi
echo "  ✓ Clean"

echo "[CHECK 2/5] Current branch..."
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "[ABORT] Must release from 'main'. Current: $BRANCH"
  exit 1
fi
echo "  ✓ On main"

echo "[CHECK 3/5] All CI checks (local simulation)..."
npm run type-check
npm run lint
echo "  ✓ Type check and lint passed"

echo "[CHECK 4/5] Build succeeds..."
npm run build
echo "  ✓ Build successful"

echo "[CHECK 5/5] CHANGELOG entry exists for v$VERSION..."
if ! grep -q "\[$VERSION\]" CHANGELOG.md; then
  echo "[ABORT] No CHANGELOG entry found for version $VERSION."
  echo "        Please update CHANGELOG.md before releasing."
  exit 1
fi
echo "  ✓ CHANGELOG entry found"

# 更新 package.json 版本号
echo ""
echo "[ACTION] Updating package.json version to $VERSION..."
npm version "$VERSION" --no-git-tag-version

# 提交版本更新
git add package.json package-lock.json
git commit -m "chore(config): bump version to $VERSION

Release preparation commit.
See CHANGELOG.md for changes in this version."

# 打 annotated tag
echo "[ACTION] Creating annotated tag v$VERSION..."
CHANGELOG_SECTION=$(awk "/## \[$VERSION\]/,/## \[/" CHANGELOG.md | head -n -1)
git tag -a "v$VERSION" -m "release: v$VERSION

$CHANGELOG_SECTION"

echo ""
echo "═══════════════════════════════════════════════"
echo "  Release v$VERSION prepared successfully!"
echo "═══════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Review: git show v$VERSION"
echo "  2. Push:   git push origin main && git push origin v$VERSION"
echo ""
```

### B. 常见场景操作速查

| 场景 | 正确操作 |
|------|---------|
| 刚提交发现 typo（未 push）| `git commit --amend` ✅ |
| 已 push 后发现 typo | `git revert HEAD` + 新 commit 修正 |
| 想撤销最近 3 个 commit（已 push）| `git revert HEAD~2^..HEAD` |
| 想回到 2 个月前的状态开发新功能 | `git checkout -b rollback/from-<hash>/reason/<date> <hash>` |
| 上游依赖发布了安全更新 | 新建 `fix/security-dep-update`，PR 至 main，打 PATCH 版本 tag |
| 发现一个 issue 需要跨多个文件修改 | 检查是否属于同一领域；是则单次 commit；否则拆分为多次 commit |

### C. 文档变更历史

| 版本 | 日期 | 修订摘要 | 修订者 |
|------|------|---------|-------|
| v1.0.0 | 见 Git Tag | 初始宪法发布 | Shijianus Maintainer |

---

*本文档是 Shijianus 项目的最高约束性文件。对本文档的任何修订须经 §5.3 规定的宪法修订流程，并以 annotated Git Tag 形式归档。本文档的历史版本通过 Git 历史永久可查，不得删除。*
