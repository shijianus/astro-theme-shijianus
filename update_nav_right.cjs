const fs = require('fs');

let content = fs.readFileSync('src/components/SiteHeader.tsx', 'utf-8');

// 1. Update imports
const importRegex = /import\s+\{([^}]+)\}\s+from\s+'lucide-react';/;
content = content.replace(importRegex, (match, imports) => {
  const newImports = new Set(imports.split(',').map(s => s.trim()).filter(Boolean));
  ['Archive', 'ExternalLink', 'FolderKanban', 'House', 'Menu', 'Tags', 'UserRound', 'X', 'Dice5', 'Search', 'ArrowUp', 'MoonStar', 'SunMedium'].forEach(i => newImports.add(i));
  return `import { ${Array.from(newImports).sort().join(', ')} } from 'lucide-react';`;
});

// 2. Replace nav-right block
const navRightRegex = /<div id="nav-right">[\s\S]*?(?=<div id="toggle-menu")/m;

const newNavRight = `<div id="nav-right">
            <div className="nav-button only-home" id="travellings_button" title="开往">
              <a className="site-page" href="#" title="开往">
                <ExternalLink className="nav-icon" aria-hidden="true" style={{ width: '1.2em', height: '1.2em' }} />
              </a>
            </div>

            <div className="nav-button" id="randomPost_button">
              <a className="site-page" href="#" title="随机文章" onClick={(e) => {
                e.preventDefault();
                window.location.href = quickActions[Math.floor(Math.random() * quickActions.length)]?.href ?? '/';
              }}>
                <Dice5 className="nav-icon" aria-hidden="true" style={{ width: '1.2em', height: '1.2em' }} />
              </a>
            </div>

            <div className="nav-button" id="search-button">
              <a className="site-page social-icon search" href="#" title="搜索" onClick={(e) => e.preventDefault()}>
                <Search className="nav-icon" aria-hidden="true" style={{ width: '1.2em', height: '1.2em' }} />
              </a>
            </div>

            {showCenterConsoleTrigger && (
              <>
                <input id="center-console" type="checkbox" checked={consoleOpen} readOnly />
                <label
                  className="widget"
                  htmlFor="center-console"
                  title="控制台"
                  onClick={(e) => {
                    e.preventDefault();
                    if (consoleOpen) {
                      closeCenterConsole();
                    } else {
                      openCenterConsole();
                    }
                  }}
                >
                  <i className="left" />
                  <i className="widget center" />
                  <i className="widget right" />
                </label>
              </>
            )}

            <div className="nav-button" id="nav-totop">
              <a
                className="totopbtn"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <ArrowUp className="nav-icon" aria-hidden="true" style={{ width: '1.2em', height: '1.2em' }} />
                <span id="percent">{scrolled ? '100' : '0'}</span>
              </a>
            </div>

            `;

content = content.replace(navRightRegex, newNavRight);

// 3. Fix toggle menu
const toggleMenuRegex = /<div id="toggle-menu" className=\{menuOpen \? 'is-open' : ''\}>[\s\S]*?<\/div>\s*<\/div>/m;
const newToggleMenu = `<div id="toggle-menu" className={menuOpen ? 'is-open' : ''}>
              <a
                className="site-page"
                href="#"
                title="切换菜单"
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(!menuOpen);
                }}
              >
                <Menu className="nav-icon" aria-hidden="true" style={{ width: '1.2em', height: '1.2em' }} />
              </a>
            </div>
          </div>`;

content = content.replace(toggleMenuRegex, newToggleMenu);

fs.writeFileSync('src/components/SiteHeader.tsx', content);
console.log("Updated SiteHeader.tsx");
