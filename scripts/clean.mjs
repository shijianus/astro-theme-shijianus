#!/usr/bin/env node

import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';

const targets = process.argv.slice(2);
const defaultTargets = ['dist', '.astro', 'node_modules/.vite'];
const resolvedTargets = (targets.length > 0 ? targets : defaultTargets).map((target) => ({
  label: target,
  path: path.resolve(process.cwd(), target),
}));

for (const target of resolvedTargets) {
  if (!existsSync(target.path)) {
    console.log(`skip ${target.label}`);
    continue;
  }

  rmSync(target.path, { recursive: true, force: true });
  console.log(`removed ${target.label}`);
}
