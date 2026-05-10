const fs = require('fs');

let content = fs.readFileSync('src/components/ThemeDock.tsx', 'utf-8');

// 1. Update imports
const importRegex = /import\s+\{([^}]+)\}\s+from\s+'lucide-react';/;
content = content.replace(importRegex, (match, imports) => {
  const newImports = new Set(imports.split(',').map(s => s.trim()).filter(Boolean));
  ['ArrowUp', 'MoonStar', 'Palette', 'PanelRightClose', 'PanelRightOpen', 'Settings2', 'SunMedium', 'Languages', 'Settings', 'MessageSquare', 'List'].forEach(i => newImports.add(i));
  return `import { ${Array.from(newImports).sort().join(', ')} } from 'lucide-react';`;
});

// 2. Replace rightside block
const dockRegex = /<div[\s\S]*?id="rightside"[\s\S]*?className=\{visible \? 'is-visible' : ''\}[\s\S]*?>[\s\S]*?<\/div>\s*<\/div>/m;

const newDock = `<div id="rightside" className={visible ? 'is-visible' : ''}>
      <div id="rightside-config-hide" className={configOpen ? 'show' : ''}>
        <button
          type="button"
          id="darkmode"
          title={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
          className={theme === 'dark' ? 'is-active' : ''}
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <SunMedium className="rightside-icon" aria-hidden="true" style={{ width: '1.2em', height: '1.2em' }} />
          ) : (
            <MoonStar className="rightside-icon" aria-hidden="true" style={{ width: '1.2em', height: '1.2em' }} />
          )}
        </button>

        <button
          type="button"
          id="hide-aside-btn"
          title={asideCollapsed ? '展开侧栏' : '收起侧栏'}
          aria-label={asideCollapsed ? '展开侧栏' : '收起侧栏'}
          className={asideCollapsed ? 'is-active' : ''}
          onClick={toggleAside}
        >
          {asideCollapsed ? (
            <PanelRightOpen className="rightside-icon" aria-hidden="true" style={{ width: '1.2em', height: '1.2em' }} />
          ) : (
            <PanelRightClose className="rightside-icon" aria-hidden="true" style={{ width: '1.2em', height: '1.2em' }} />
          )}
        </button>

        <button
          type="button"
          id="background-cycle"
          title="切换背景"
          aria-label="切换背景"
          onClick={cycleBackground}
        >
          <Palette className="rightside-icon" aria-hidden="true" style={{ width: '1.2em', height: '1.2em' }} />
        </button>
      </div>

      <div id="rightside-config-show">
        <button
          type="button"
          id="rightside-config"
          title="设置"
          aria-label="设置"
          aria-expanded={configOpen}
          className={configOpen ? 'is-active' : ''}
          onClick={() => setConfigOpen((value) => !value)}
        >
          <Settings className="rightside-icon" aria-hidden="true" style={{ width: '1.2em', height: '1.2em' }} />
        </button>

        <button
          type="button"
          id="mobile-toc-button"
          className="close"
          title="目录"
          aria-label="目录"
          onClick={() => {
            window.dispatchEvent(new CustomEvent('shijianus:toggle-mobile-toc'));
          }}
        >
          <List className="rightside-icon" aria-hidden="true" style={{ width: '1.2em', height: '1.2em' }} />
        </button>

        <a id="to_comment" href="#post-comment" title="直达评论" aria-label="直达评论">
          <MessageSquare className="rightside-icon" aria-hidden="true" style={{ width: '1.2em', height: '1.2em' }} />
        </a>

        <button
          type="button"
          id="go-up"
          title="回到顶部"
          aria-label="回到顶部"
          onClick={jumpToTop}
        >
          <ArrowUp className="rightside-icon" aria-hidden="true" style={{ width: '1.2em', height: '1.2em' }} />
        </button>
      </div>
    </div>`;

content = content.replace(dockRegex, newDock);

fs.writeFileSync('src/components/ThemeDock.tsx', content);
console.log("Updated ThemeDock.tsx");
