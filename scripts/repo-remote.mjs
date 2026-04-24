#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

function readArg(name, fallback = '') {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

const remote = readArg('--remote', 'origin');
const repo = readArg('--repo');

if (!repo) {
  console.error('Usage: npm run repo:remote -- --repo https://github.com/<owner>/<repo>.git [--remote origin]');
  process.exit(1);
}

const existingRemotes = execFileSync('git', ['remote'], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean);

if (existingRemotes.includes(remote)) {
  execFileSync('git', ['remote', 'set-url', remote, repo], { stdio: 'inherit' });
} else {
  execFileSync('git', ['remote', 'add', remote, repo], { stdio: 'inherit' });
}

console.log(`configured ${remote} -> ${repo}`);
