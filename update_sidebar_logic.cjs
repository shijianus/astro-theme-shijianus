const fs = require('fs');

let content = fs.readFileSync('src/components/theme/Sidebar.astro', 'utf-8');

// Update logic to show standard widgets on post pages
content = content.replace(
  /const showCategories = .*?;/,
  'const showCategories = siteConfig.theme.features.asideCategories && categories.length > 0 && !isHomePage;'
);

content = content.replace(
  /const showTags = .*?;/,
  'const showTags = siteConfig.theme.features.asideTags && tags.length > 0 && !isHomePage && !showPostAsideFeed;'
);

content = content.replace(
  /const showArchives = .*?;/,
  'const showArchives = siteConfig.theme.features.asideArchives && archives.length > 0 && !isHomePage && !showPostAsideFeed;'
);

content = content.replace(
  /const showWebInfo = .*?;/,
  'const showWebInfo = siteConfig.theme.features.asideWebInfo && !isHomePage;'
);

// We need the .toc-item to NOT use --toc-level but use native classes or just simple indent/fontsize.
content = content.replace(/<li class="toc-item" style="--toc-level:\$\{level\};">/, '<li class="toc-item toc-level-${level}">');

fs.writeFileSync('src/components/theme/Sidebar.astro', content);
console.log("Updated Sidebar.astro");
