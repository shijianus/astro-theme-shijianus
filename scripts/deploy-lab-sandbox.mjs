/**
 * Astro Blog「试验田 Lab」独立纯静态沙盒安全部署脚本
 *
 * 为什么必须使用本脚本而非在主站根目录直接执行 `wrangler pages deploy sandbox-runner`？
 * 主站根目录存在 `wrangler.jsonc`（含 D1 / Workers AI 绑定）与 `functions/` 目录。
 * 若在主站根目录直接运行 `wrangler pages deploy sandbox-runner`，Wrangler CLI 会自动向上扫描并编译主站
 * `functions/`（含 `_middleware.ts` 与 `/api/*`）一同上传至沙盒项目！
 *
 * 本脚本执行严格物理隔离部署：
 * 1. 强校验 `sandbox-runner/` 仅包含白名单纯静态文件（`index.html`、`_headers`），严禁存在 `functions` 或 `_worker.js`；
 * 2. 在系统临时目录 (`/tmp/lab-sandbox-static-*`) 创建与主站仓库完全隔离的干净目录；
 * 3. 生成显式零绑定 `wrangler.json`（0 D1、0 R2、0 KV、0 AI、0 Secrets、0 Functions）；
 * 4. 在隔离目录中调用 Wrangler 部署纯静态资产，并断言输出中绝不包含 `Uploading Functions bundle`。
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const sandboxDir = path.join(repoRoot, 'sandbox-runner');
const wranglerBin = path.join(repoRoot, 'node_modules', '.bin', 'wrangler');

function parseArgs(argv) {
  let projectName = '';
  let branch = 'main';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--project-name' && argv[i + 1]) {
      projectName = argv[++i].trim();
    } else if (argv[i].startsWith('--project-name=')) {
      projectName = argv[i].split('=')[1].trim();
    } else if (argv[i] === '--branch' && argv[i + 1]) {
      branch = argv[++i].trim();
    } else if (argv[i].startsWith('--branch=')) {
      branch = argv[i].split('=')[1].trim();
    }
  }
  return { projectName, branch };
}

const { projectName, branch } = parseArgs(process.argv.slice(2));

if (!projectName) {
  console.error('用法错误: node scripts/deploy-lab-sandbox.mjs --project-name <sandbox-pages-project> [--branch main]');
  process.exit(1);
}

if (projectName === 'shijianus-blog' || projectName === 'shijianus-github-io') {
  console.error(`安全阻断: 严禁将纯静态沙盒部署至主站项目 (${projectName})！`);
  process.exit(1);
}

const ALLOWED_FILES = new Set(['index.html', '404.html', '_headers']);
const entries = fs.readdirSync(sandboxDir);
for (const entry of entries) {
  if (!ALLOWED_FILES.has(entry)) {
    console.error(`安全阻断: sandbox-runner/ 下发现非白名单文件或目录 "${entry}"（严禁包含 functions 或 _worker.js）！`);
    process.exit(1);
  }
}

for (const reqFile of ALLOWED_FILES) {
  if (!fs.existsSync(path.join(sandboxDir, reqFile))) {
    console.error(`缺失必要文件: sandbox-runner/${reqFile}`);
    process.exit(1);
  }
}

const isolatedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lab-sandbox-static-'));
const assetsDir = path.join(isolatedDir, 'public');
fs.mkdirSync(assetsDir, { recursive: true });

try {
  for (const file of ALLOWED_FILES) {
    fs.copyFileSync(path.join(sandboxDir, file), path.join(assetsDir, file));
  }

  // 显式写入零绑定配置，阻断 Wrangler 向上查找任何父级配置
  const zeroBindingConfig = {
    name: projectName,
    compatibility_date: '2026-04-27',
    pages_build_output_dir: './public',
  };
  const configPath = path.join(isolatedDir, 'wrangler.json');
  fs.writeFileSync(configPath, JSON.stringify(zeroBindingConfig, null, 2), 'utf8');

  console.log(`🔒 [Isolated Static Sandbox Deploy] 正在从零绑定隔离目录部署至 ${projectName} (branch=${branch})...`);
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

  console.log(`✅ [Isolated Static Sandbox Deploy] 纯静态沙盒 (${projectName}) 部署成功（0 Functions · 0 D1/R2/KV/AI · 0 Secrets）。`);
} finally {
  fs.rmSync(isolatedDir, { recursive: true, force: true });
}
