#!/usr/bin/env node

import { execFileSync } from 'node:child_process';

function readArg(name, fallback = '') {
  const index = process.argv.indexOf(name);
  if (index === -1) return fallback;
  return process.argv[index + 1] ?? fallback;
}

const remote = readArg('--remote', 'origin');
const branch =
  readArg('--branch') ||
  execFileSync('git', ['branch', '--show-current'], {
    encoding: 'utf8',
  }).trim() ||
  'main';

execFileSync('git', ['push', '--set-upstream', remote, branch], { stdio: 'inherit' });
