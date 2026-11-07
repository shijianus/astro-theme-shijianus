#!/usr/bin/env node
/**
 * scripts/generate-license-report.mjs
 *
 * 扫描全部依赖（直属与传递），生成机器可读 security/licenses.json
 * 与 Markdown 格式 security/LICENSES.md 报告，供 CI Artifact 保存与法律审计。
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const LOCK_FILE = path.resolve(ROOT_DIR, 'package-lock.json');
const PKG_FILE = path.resolve(ROOT_DIR, 'package.json');
const OUT_JSON = path.resolve(ROOT_DIR, 'security/licenses.json');
const OUT_MD = path.resolve(ROOT_DIR, 'security/LICENSES.md');

if (!fs.existsSync(LOCK_FILE)) {
  console.error('[License Report] 缺少 package-lock.json');
  process.exit(1);
}

const lock = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
const pkg = JSON.parse(fs.readFileSync(PKG_FILE, 'utf8'));

const directDeps = new Set([
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
]);

const packageLicenseMap = new Map();

for (const [nodePath, nodeInfo] of Object.entries(lock.packages || {})) {
  if (!nodePath) continue;
  const pkgName = nodePath.replace(/^node_modules\//, '').replace(/^.*node_modules\//, '');
  const version = nodeInfo.version || 'unknown';
  let license = nodeInfo.license;
  if (!license && nodeInfo.licenses) {
    license = Array.isArray(nodeInfo.licenses)
      ? nodeInfo.licenses.map((l) => (typeof l === 'object' ? l.type : l)).join(', ')
      : String(nodeInfo.licenses);
  }
  if (!license) {
    license = 'UNSPECIFIED';
  }

  const isDirect = directDeps.has(pkgName);
  const isDev = Boolean(nodeInfo.dev);

  packageLicenseMap.set(`${pkgName}@${version}`, {
    name: pkgName,
    version,
    license,
    scope: isDev ? 'dev' : 'production',
    isDirect,
  });
}

const inventory = Array.from(packageLicenseMap.values()).sort((a, b) => a.name.localeCompare(b.name));

// 识别互惠传染型或限制型许可证
const COPYLEFT_REGEX = /GPL|AGPL|SSPL|EUPL/i;
const copyleftItems = inventory.filter((item) => COPYLEFT_REGEX.test(item.license));

const reportPayload = {
  generatedAt: new Date().toISOString(),
  totalPackages: inventory.length,
  copyleftRiskCount: copyleftItems.length,
  copyleftPackages: copyleftItems,
  packages: inventory,
};

fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(reportPayload, null, 2), 'utf8');

let mdContent = `# 开源依赖许可证合规报告 (Open Source License Inventory)

> **生成时间**: ${reportPayload.generatedAt}  
> **包总数**: ${reportPayload.totalPackages}  
> **强互惠 / 限制型许可证包数**: ${reportPayload.copyleftRiskCount}  

---

## 1. 风险许可证审计 (Copyleft / AGPL / GPL)

`;

if (copyleftItems.length === 0) {
  mdContent += `✓ **未检测到任何 AGPL / GPL / 强互惠型依赖。** 所有依赖均为宽松开源许可证 (MIT / Apache-2.0 / BSD / ISC 等)。\n\n`;
} else {
  mdContent += `> [!WARNING]\n> 检测到以下依赖包含互惠或强传染型许可证，需注意前端客户端打包分发风险：\n\n`;
  mdContent += `| 包名 | 版本 | 许可证 | 作用域 | 是否直属依赖 |\n| :--- | :--- | :--- | :--- | :--- |\n`;
  for (const c of copyleftItems) {
    mdContent += `| \`${c.name}\` | \`${c.version}\` | **${c.license}** | \`${c.scope}\` | ${c.isDirect ? '✓ 直属' : '传递'} |\n`;
  }
  mdContent += `\n`;
}

mdContent += `---

## 2. 全量依赖许可证清单 (Full License Inventory)

| 依赖包名 | 版本 | 许可证 | 作用域 | 直属依赖 |
| :--- | :--- | :--- | :--- | :---: |
`;

for (const item of inventory) {
  mdContent += `| \`${item.name}\` | \`${item.version}\` | \`${item.license}\` | \`${item.scope}\` | ${item.isDirect ? '✓' : '-'} |\n`;
}

fs.writeFileSync(OUT_MD, mdContent, 'utf8');

console.log(`[License Report] 已生成许可证报告:`);
console.log(`  - JSON: ${OUT_JSON}`);
console.log(`  - Markdown: ${OUT_MD}`);
console.log(`  - 总包数: ${inventory.length}, Copyleft 警告项: ${copyleftItems.length}`);
