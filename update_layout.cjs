const fs = require('fs');

let content = fs.readFileSync('src/layouts/BlogLayout.astro', 'utf-8');

// Remove StickySidebarObserver import
content = content.replace(/import\s+\{\s*StickySidebarObserver\s*\}\s*from\s*'..\/components\/StickySidebarObserver';\s*/g, '');

// Remove <StickySidebarObserver pageType={pageType} client:load /> or similar
content = content.replace(/<StickySidebarObserver[^>]*\/>/g, '');

fs.writeFileSync('src/layouts/BlogLayout.astro', content);
console.log("Updated BlogLayout.astro");
