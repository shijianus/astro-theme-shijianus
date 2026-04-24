#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

function readArg(name, fallback = '') {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

const remote = readArg('--remote', 'origin');
const repo = readArg('--repo');
const message = readArg('--message', 'chore: publish theme updates');
const branch =
  readArg('--branch') ||
  execFileSync('git', ['branch', '--show-current'], {
    encoding: 'utf8',
  }).trim() ||
  'main';

if (repo) {
  const existingRemotes = execFileSync('git', ['remote'], { encoding: 'utf8' })
    .split('\n')
    .map((value) => value.trim())
    .filter(Boolean);

  if (existingRemotes.includes(remote)) {
    execFileSync('git', ['remote', 'set-url', remote, repo], { stdio: 'inherit' });
  } else {
    execFileSync('git', ['remote', 'add', remote, repo], { stdio: 'inherit' });
  }
}

execFileSync('git', ['add', '-A'], { stdio: 'inherit' });

const hasChanges = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim().length > 0;
if (hasChanges) {
  execFileSync('git', ['commit', '-m', message], { stdio: 'inherit' });
}

execFileSync('git', ['push', '--set-upstream', remote, branch], { stdio: 'inherit' });
