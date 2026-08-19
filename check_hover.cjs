const fs = require('fs');
const path = require('path');

const dir = '/home/shijian/projects/shijianus-blog/src/styles';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.css'));

let results = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  // strip comments for easier parsing
  const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, '');
  
  const blocks = cleanContent.split('}');
  blocks.forEach(block => {
    if (!block.trim()) return;
    const parts = block.split('{');
    if (parts.length !== 2) return;
    const selector = parts[0].trim();
    const rules = parts[1].trim();
    
    if (selector.includes(':hover') && (selector.includes('dark') || selector.includes('data-theme') || true)) {
       if (rules.includes('box-shadow') || rules.includes('backdrop') || rules.includes('transition')) {
           results.push({ file, selector, rules });
       }
    }
  });
});

results.filter(r => r.selector.includes('dark') || r.selector.includes('data-theme')).forEach(r => {
    console.log(`\n--- ${r.file} ---\n${r.selector} {\n  ${r.rules}\n}`);
});

