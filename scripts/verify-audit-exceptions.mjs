#!/usr/bin/env node
/**
 * scripts/verify-audit-exceptions.mjs
 *
 * 严格执行供应链门禁与版本化例外清单审计：
 * 1. 执行 npm audit --json 并解析全部漏洞；
 * 2. 任何 high 或 critical 等级的漏洞必须在 security/npm-audit-exceptions.json 中明确登记；
 * 3. 校验例外清单有效性：禁止过期 (expiresAt)、禁止空责任人 (owner)、禁止空修复计划 (remediation)；
 * 4. 出现未登记漏洞或过期例外立即 Fail-Closed (exit 1)。
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ROOT_DIR = process.cwd();
const EXCEPTIONS_FILE = path.resolve(ROOT_DIR, 'security/npm-audit-exceptions.json');

if (!fs.existsSync(EXCEPTIONS_FILE)) {
  console.error('[Audit Gate] 致命错误: 缺少版本化例外清单 security/npm-audit-exceptions.json');
  process.exit(1);
}

let exceptions = [];
try {
  exceptions = JSON.parse(fs.readFileSync(EXCEPTIONS_FILE, 'utf8'));
} catch (e) {
  console.error('[Audit Gate] 致命错误: security/npm-audit-exceptions.json JSON 格式非法', e);
  process.exit(1);
}

const now = new Date();
const todayStr = now.toISOString().split('T')[0];

console.log('[Audit Gate] 正在审计版本化例外清单规范性...');
for (const exc of exceptions) {
  if (!exc.advisory || !exc.package || !exc.scope || !exc.owner || !exc.expiresAt || !exc.remediation) {
    console.error(`[Audit Gate] 例外项格式不全: ${JSON.stringify(exc)}`);
    process.exit(1);
  }
  if (exc.expiresAt < todayStr) {
    console.error(`[Audit Gate] 致命错误: 例外项 [${exc.advisory}] (${exc.package}) 已于 ${exc.expiresAt} 过期！必须立即修复或更新。`);
    process.exit(1);
  }
}
console.log(`[Audit Gate] -> PASS: 全部 ${exceptions.length} 项登记例外格式合规且处于有效期内。`);

console.log('[Audit Gate] 正在执行 npm audit 真实依赖扫描...');
let auditOutput = '';
try {
  auditOutput = execSync('npm audit --json --registry=https://registry.npmjs.org', {
    encoding: 'utf8',
    maxBuffer: 15 * 1024 * 1024,
  });
} catch (err) {
  auditOutput = err.stdout?.toString() || '';
}

if (!auditOutput) {
  console.error('[Audit Gate] 致命错误: 无法获取 npm audit 输出');
  process.exit(1);
}

let report;
try {
  report = JSON.parse(auditOutput);
} catch (err) {
  console.error('[Audit Gate] 致命错误: 解析 npm audit JSON 报告失败', err);
  process.exit(1);
}

const activeHighOrCritical = [];
const registeredAdvisories = new Set(exceptions.map((e) => e.advisory));

for (const [pkgName, v] of Object.entries(report.vulnerabilities || {})) {
  const sources = (v.via || []).filter((item) => typeof item === 'object');
  for (const s of sources) {
    if (s.severity === 'high' || s.severity === 'critical') {
      const advisoryId = s.url ? s.url.split('/').pop() : String(s.source);
      activeHighOrCritical.push({
        advisory: advisoryId,
        package: s.name || pkgName,
        severity: s.severity,
        title: s.title,
        url: s.url,
      });
    }
  }
}

console.log(`[Audit Gate] 扫描发现当前依赖树中存在 ${activeHighOrCritical.length} 处高危/严重警告项。`);

const unhandled = [];
for (const item of activeHighOrCritical) {
  if (!registeredAdvisories.has(item.advisory)) {
    unhandled.push(item);
  }
}

if (unhandled.length > 0) {
  console.error('[Audit Gate] ❌ 供应链门禁失败: 发现未登记的高危/严重漏洞:');
  for (const u of unhandled) {
    console.error(`  - [${u.severity.toUpperCase()}] ${u.package} -> ${u.advisory} (${u.title}) [${u.url}]`);
  }
  console.error('\n请通过官方安全升级，或由架构师/安全负责人评估后录入 security/npm-audit-exceptions.json。');
  process.exit(1);
}

console.log('[Audit Gate] ✓ PASS: 所有活跃高危/严重漏洞均已在 security/npm-audit-exceptions.json 中备案且未过期。');
