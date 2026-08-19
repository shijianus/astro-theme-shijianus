const fs = require('fs');
const path = require('path');

const dir = '/home/shijian/projects/shijianus-blog/src/styles';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.css'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  const blocks = content.split('}');
  blocks.forEach((block, index) => {
    if (block.includes('dark') && block.includes(':hover')) {
      if (block.includes('box-shadow') || block.includes('backdrop-filter') || block.includes('transition')) {
        console.log(`Found in ${file} block #${index}:`);
        console.log(block.trim() + '}');
        console.log('------------------');
      }
    }
  });
});
