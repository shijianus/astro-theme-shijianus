const fs = require('fs');

// Revert Sidebar.astro to have --toc-level
let sidebar = fs.readFileSync('src/components/theme/Sidebar.astro', 'utf-8');
sidebar = sidebar.replace(/<li class="toc-item toc-level-\$\{level\}">/, '<li class="toc-item" style="--toc-level:${level};">');
fs.writeFileSync('src/components/theme/Sidebar.astro', sidebar);

// Fix rebuild.css
let css = fs.readFileSync('src/styles/rebuild.css', 'utf-8');

// Remove left padding based on toc-level
css = css.replace(/padding.*calc\(.*var\(--toc-level.*\).*;/g, 'padding: 8px 10px 8px 22px;');
css = css.replace(/left:.*calc\(.*var\(--toc-level.*\).*;/g, 'left: 10px;');

// Apply font size based on toc-level
css += `\n
#card-toc .toc-item > .toc-link {
  font-size: calc(14px - var(--toc-level, 0) * 1px) !important;
  font-weight: calc(600 - var(--toc-level, 0) * 50) !important;
}
#card-toc .toc-content::-webkit-scrollbar {
  display: none !important;
}
#card-toc .toc-content {
  scrollbar-width: none !important;
}
`;

fs.writeFileSync('src/styles/rebuild.css', css);
console.log("Fixed TOC styling.");
