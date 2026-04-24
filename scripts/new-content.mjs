#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function readArg(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) return '';
  return process.argv[index + 1] ?? '';
}

function readPositionalTitle() {
  return process.argv
    .slice(2)
    .filter((value, index, values) => {
      if (value.startsWith('--')) return false;
      if (index > 0 && values[index - 1].startsWith('--')) return false;
      return true;
    })
    .join(' ')
    .trim();
}

function slugify(value) {
  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

const type = readArg('--type') || 'post';
const title = readArg('--title') || readPositionalTitle();

if (!title) {
  console.error('Usage: npm run new:post -- "Post Title"');
  process.exit(1);
}

const slug = readArg('--slug') || slugify(title) || `untitled-${Date.now()}`;
const isoDate = new Date().toISOString();
const rootDir = process.cwd();
const templatePath = path.join(rootDir, 'scaffolds', `${type}.md`);
const outputPath =
  type === 'page'
    ? path.join(rootDir, 'src', 'pages', `${slug}.md`)
    : path.join(rootDir, 'src', 'content', 'posts', `${slug}.md`);

if (!existsSync(templatePath)) {
  console.error(`Missing scaffold template: ${templatePath}`);
  process.exit(1);
}

if (existsSync(outputPath)) {
  console.error(`File already exists: ${outputPath}`);
  process.exit(1);
}

const template = readFileSync(templatePath, 'utf8');
const content = template
  .replaceAll('{{ title }}', title)
  .replaceAll('{{ slug }}', slug)
  .replaceAll('{{ isoDate }}', isoDate);

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, content, 'utf8');

console.log(`created ${path.relative(rootDir, outputPath)}`);
