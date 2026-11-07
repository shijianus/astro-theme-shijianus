/**
 * Astro Blog「试验田 Lab」独立纯静态沙盒安全部署与构建门禁脚本
 *
 * 为什么必须使用本脚本而非在主站根目录直接执行 `wrangler pages deploy sandbox-runner`？
 * 主站根目录存在 `wrangler.jsonc`（含 D1 / Workers AI 绑定）与 `functions/` 目录。
 * 若在主站根目录直接运行 `wrangler pages deploy sandbox-runner`，Wrangler CLI 会自动向上扫描并编译主站
 * `functions/`（含 `_middleware.ts` 与 `/api/*`）一同上传至沙盒项目！
 *
 * 本脚本执行严格物理隔离与生产/预发布宿主白名单分级：
 * 1. 强校验 `sandbox-runner/` 仅包含白名单纯静态文件（`index.html`、`404.html`、`_headers`），严禁存在 `functions` 或 `_worker.js`；
 * 2. 严格区分 `--env production`（默认，仅放行 `https://blog.epocanvas.com`）与 `--env staging`（仅限 `*-staging` 项目，额外放行 Pages Preview 域名）；
 * 3. 在系统临时目录 (`/tmp/lab-sandbox-static-*`) 生成显式零绑定 `wrangler.json`（0 D1、0 R2、0 KV、0 AI、0 Secrets、0 Functions）；
 * 4. 支持 `--dry-run` 在本地与 CI 中离线验证构建包纯净度与 CSP 边界，不向 Cloudflare 发起任何写入请求。
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const sandboxDir = path.join(repoRoot, 'sandbox-runner');
const wranglerBin = path.join(repoRoot, 'node_modules', '.bin', 'wrangler');

function parseArgs(argv) {
  let projectName = '';
  let branch = 'main';
  let envMode = '';
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--project-name' && argv[i + 1]) {
      projectName = argv[++i].trim();
    } else if (arg.startsWith('--project-name=')) {
      projectName = arg.split('=')[1].trim();
    } else if (arg === '--branch' && argv[i + 1]) {
      branch = argv[++i].trim();
    } else if (arg.startsWith('--branch=')) {
      branch = arg.split('=')[1].trim();
    } else if (arg === '--env' && argv[i + 1]) {
      envMode = argv[++i].trim().toLowerCase();
    } else if (arg.startsWith('--env=')) {
      envMode = arg.split('=')[1].trim().toLowerCase();
    } else if (arg === '--dry-run') {
      dryRun = true;
    }
  }

  if (!envMode && projectName) {
    envMode = projectName.endsWith('-staging') ? 'staging' : 'production';
  }
  return { projectName, branch, envMode, dryRun };
}

const { projectName, branch, envMode, dryRun } = parseArgs(process.argv.slice(2));

if (!projectName) {
  console.error(
    '用法错误: node scripts/deploy-lab-sandbox.mjs --project-name <sandbox-pages-project> [--env production|staging] [--branch main] [--dry-run]'
  );
  process.exit(1);
}

const FORBIDDEN_HOST_PROJECTS = new Set(['shijianus-blog', 'shijianus-github-io', 'cfsolara']);
if (FORBIDDEN_HOST_PROJECTS.has(projectName)) {
  console.error(`安全阻断: 严禁将纯静态沙盒部署至主站或无关项目 (${projectName})！`);
  process.exit(1);
}

if (envMode !== 'production' && envMode !== 'staging') {
  console.error(`安全阻断: 非法 --env "${envMode}"，仅允许 "production" 或 "staging"。`);
  process.exit(1);
}

if (envMode === 'staging' && !projectName.endsWith('-staging')) {
  console.error(
    `安全阻断: "--env staging" 仅允许用于以 "-staging" 结尾的预发布沙盒项目（当前目标: "${projectName}"），严禁向生产沙盒注入宽泛 Preview 宿主白名单！`
  );
  process.exit(1);
}

if (envMode === 'production' && projectName.endsWith('-staging')) {
  console.error(
    `安全阻断: 预发布项目 "${projectName}" 请显式指定 "--env staging"，避免混淆生产与预发布环境。`
  );
  process.exit(1);
}

const ALLOWED_FILES = new Set(['index.html', '404.html', '_headers', 'bridge.js']);
const entries = fs.readdirSync(sandboxDir);
for (const entry of entries) {
  if (!ALLOWED_FILES.has(entry)) {
    console.error(
      `安全阻断: sandbox-runner/ 下发现非白名单文件或目录 "${entry}"（严禁包含 functions、_worker.js 或 _routes.json）！`
    );
    process.exit(1);
  }
}

for (const reqFile of ALLOWED_FILES) {
  if (!fs.existsSync(path.join(sandboxDir, reqFile))) {
    console.error(`缺失必要文件: sandbox-runner/${reqFile}`);
    process.exit(1);
  }
}

const PRODUCTION_FRAME_ANCESTORS = 'frame-ancestors https://blog.epocanvas.com;';
const STAGING_FRAME_ANCESTORS =
  'frame-ancestors https://blog.epocanvas.com https://shijianus-blog.pages.dev https://*.shijianus-blog.pages.dev;';

const isolatedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-sandbox-static-'));
const assetsDir = path.join(isolatedDir, 'public');
fs.mkdirSync(assetsDir, { recursive: true });

try {
  fs.copyFileSync(path.join(sandboxDir, '404.html'), path.join(assetsDir, '404.html'));
  fs.copyFileSync(path.join(sandboxDir, 'bridge.js'), path.join(assetsDir, 'bridge.js'));

  let rawHeaders = fs.readFileSync(path.join(sandboxDir, '_headers'), 'utf8');
  assert.ok(
    rawHeaders.includes(PRODUCTION_FRAME_ANCESTORS),
    '源码态 sandbox-runner/_headers 必须默认锁定为仅允许生产主站 frame-ancestors https://blog.epocanvas.com;'
  );
  assert.equal(
    rawHeaders.includes('*.shijianus-blog.pages.dev'),
    false,
    '源码态生产默认 sandbox-runner/_headers 严禁包含通配 Preview 子域！'
  );

  if (envMode === 'staging') {
    rawHeaders = rawHeaders.replace(PRODUCTION_FRAME_ANCESTORS, STAGING_FRAME_ANCESTORS);
  }
  fs.writeFileSync(path.join(assetsDir, '_headers'), rawHeaders, 'utf8');

  let rawIndexHtml = fs.readFileSync(path.join(sandboxDir, 'index.html'), 'utf8');
  assert.ok(
    rawIndexHtml.includes('data-sandbox-env="production"'),
    '源码态 sandbox-runner/index.html 必须默认标记 data-sandbox-env="production"'
  );
  if (envMode === 'staging') {
    rawIndexHtml = rawIndexHtml.replace(
      'data-sandbox-env="production"',
      'data-sandbox-env="staging"'
    );
  }
  fs.writeFileSync(path.join(assetsDir, 'index.html'), rawIndexHtml, 'utf8');

  // 复核输出隔离目录：仅含 4 个纯静态文件，零 Functions / Worker
  const builtFiles = fs.readdirSync(assetsDir).sort();
  assert.deepEqual(builtFiles, ['404.html', '_headers', 'bridge.js', 'index.html']);

  const finalHeaders = fs.readFileSync(path.join(assetsDir, '_headers'), 'utf8');
  if (envMode === 'production') {
    assert.ok(finalHeaders.includes(PRODUCTION_FRAME_ANCESTORS));
    assert.equal(finalHeaders.includes('shijianus-blog.pages.dev'), false);
  } else {
    assert.ok(finalHeaders.includes(STAGING_FRAME_ANCESTORS));
  }

  // 显式写入零绑定配置，阻断 Wrangler 向上查找任何父级配置
  const zeroBindingConfig = {
    name: projectName,
    compatibility_date: '2026-04-27',
    pages_build_output_dir: './public',
  };
  const configPath = path.join(isolatedDir, 'wrangler.json');
  fs.writeFileSync(configPath, JSON.stringify(zeroBindingConfig, null, 2), 'utf8');

  const manifest = {
    ok: true,
    dryRun,
    projectName,
    envMode,
    branch,
    files: builtFiles,
    hasFunctions: false,
    hasWorkerBundle: false,
    bindings: {
      d1_databases: 0,
      r2_buckets: 0,
      kv_namespaces: 0,
      ai_bindings: 0,
      secrets: 0,
    },
    frameAncestors:
      envMode === 'production' ? PRODUCTION_FRAME_ANCESTORS : STAGING_FRAME_ANCESTORS,
  };

  if (dryRun) {
    console.log(JSON.stringify(manifest, null, 2));
    process.exit(0);
  }

  console.log(
    `🔒 [Isolated Static Sandbox Deploy] 正在从零绑定隔离目录部署至 ${projectName} (env=${envMode}, branch=${branch})...`
  );
  const output = execFileSync(
    wranglerBin,
    [
      'pages',
      'deploy',
      './public',
      '--project-name',
      projectName,
      '--branch',
      branch,
      '--commit-dirty=true',
    ],
    {
      cwd: isolatedDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );

  process.stdout.write(output);

  if (output.includes('Uploading Functions bundle') || output.includes('Compiled Worker')) {
    throw new Error('安全断言失败：检测到 Functions 构建产物上传，违反纯静态零 Functions 准则！');
  }

  console.log(
    `✅ [Isolated Static Sandbox Deploy] 纯静态沙盒 (${projectName}, env=${envMode}) 部署成功（0 Functions · 0 D1/R2/KV/AI · 0 Secrets）。`
  );
} finally {
  fs.rmSync(isolatedDir, { recursive: true, force: true });
}
