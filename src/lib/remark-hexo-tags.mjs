/**
 * Remark Plugin: Hexo-Theme-Anzhiyu Tag Plugins 100% Native Compatibility Layer
 *
 * Automatically parses and transforms all 22+ Hexo Anzhiyu / Butterfly shortcode tags
 * ({% note %}, {% folding %}, {% tabs %}, {% hideInline %}, {% hideBlock %}, {% hideToggle %},
 *  {% btn %}, {% btns %}, {% cell %}, {% checkbox %}, {% radio %}, {% label %}, {% u %},
 *  {% emp %}, {% wavy %}, {% del %}, {% kbd %}, {% psw %}, {% tip %}, {% timeline %},
 *  {% link %}, {% site %}, {% sitegroup %}, {% bilibili %}, {% dogeplayer %}, {% audio %},
 *  {% video %}, {% videos %}, {% gallery %}, {% inlineImg %}, {% image %}, {% iconfont %},
 *  {% span %}, {% p %}, {% intCard %}, {% mermaid %}, {% flink %})
 * into semantic, accessible Astro + Anzhiyu HTML structures while leaving `code` and
 * `inlineCode` AST nodes completely untouched.
 */

const BLOCK_TAG_NAMES = [
  'note',
  'subnote',
  'folding',
  'hideBlock',
  'hideToggle',
  'tip',
  'btns',
  'tabs',
  'timeline',
  'gallery',
  'sitegroup',
  'mermaid',
  'flink',
  'videos',
];

function escapeHtmlAttr(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderSimpleMarkdownInline(text = '') {
  return String(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function renderSimpleMarkdownBlock(text = '') {
  const trimmed = String(text).trim();
  if (!trimmed) return '';
  // First transform any nested inline Hexo tags
  const withInlineTags = replaceInlineHexoTags(trimmed);
  const paragraphs = withInlineTags.split(/\n{2,}/);
  return paragraphs
    .map((p) => {
      const line = p.trim();
      if (!line) return '';
      if (/^<(div|p|ul|ol|li|details|figure|pre|blockquote|h[1-6]|a|span|section)/i.test(line)) {
        return line;
      }
      return `<p>${renderSimpleMarkdownInline(line).replace(/\n/g, '<br />')}</p>`;
    })
    .join('\n');
}

/**
 * Transform a matched paired block tag `{% tagName rawArgs %} content {% endtagName %}`
 */
function renderBlockTag(tagName, rawArgs = '', rawContent = '') {
  const argsStr = rawArgs.trim();
  const content = rawContent.trim();

  switch (tagName) {
    case 'note':
    case 'subnote': {
      const parts = argsStr.split(/\s+/).filter(Boolean);
      const validTypes = new Set([
        'info',
        'warning',
        'danger',
        'success',
        'primary',
        'default',
        'note',
        'tip',
        'important',
        'caution',
        'question',
        'quote',
      ]);
      let noteType = 'info';
      const extraClasses = [];
      for (const p of parts) {
        const lower = p.toLowerCase();
        if (validTypes.has(lower)) {
          noteType = lower === 'primary' || lower === 'default' ? 'note' : lower;
        } else {
          extraClasses.push(p);
        }
      }
      const mappedType = noteType === 'info' ? 'info' : noteType;
      return `<div class="note admonition admonition-${escapeHtmlAttr(mappedType)} ${escapeHtmlAttr(parts.join(' '))}" data-hexo-tag="${tagName}">
  <div class="admonition-content">${renderSimpleMarkdownBlock(content)}</div>
</div>`;
    }

    case 'folding': {
      const commaParts = argsStr.split(',');
      let stylePart = '';
      let titlePart = '';
      if (commaParts.length > 1) {
        stylePart = commaParts[0].trim();
        titlePart = commaParts.slice(1).join(',').trim();
      } else {
        titlePart = (commaParts[0] || '点击展开查看详情').trim();
      }
      const isOpen = /\bopen\b/i.test(stylePart);
      const colorMatch = stylePart.match(/\b(blue|cyan|green|yellow|orange|red|pink|purple|dark)\b/i);
      const colorClass = colorMatch ? ` folding-${colorMatch[1].toLowerCase()}` : '';
      return `<details class="folding-tag article-accordion${colorClass}"${isOpen ? ' open' : ''} data-hexo-tag="folding">
  <summary>
    <span>${renderSimpleMarkdownInline(titlePart)}</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="content accordion-content">${renderSimpleMarkdownBlock(content)}</div>
</details>`;
    }

    case 'hideBlock': {
      const parts = argsStr.split(',').map((s) => s.trim());
      const display = parts[0] || '点击展开隐藏内容';
      const bg = parts[1] || '';
      const color = parts[2] || '';
      let style = '';
      if (bg) style += `background-color:${escapeHtmlAttr(bg)};`;
      if (color) style += `color:${escapeHtmlAttr(color)};`;
      return `<div class="hide-block" data-hexo-tag="hideBlock">
  <button type="button" class="hide-button"${style ? ` style="${style}"` : ''}>${escapeHtmlAttr(display)}</button>
  <div class="hide-content">${renderSimpleMarkdownBlock(content)}</div>
</div>`;
    }

    case 'hideToggle': {
      const parts = argsStr.split(',').map((s) => s.trim());
      const display = parts[0] || '点击展开隐藏内容';
      const bg = parts[1] || '';
      const color = parts[2] || '';
      let style = '';
      if (bg) style += `background-color:${escapeHtmlAttr(bg)};`;
      if (color) style += `color:${escapeHtmlAttr(color)};`;
      return `<details class="hide-toggle folding-tag article-accordion" data-hexo-tag="hideToggle"${bg ? ` style="border-color:${escapeHtmlAttr(bg)}"` : ''}>
  <summary class="hide-button"${style ? ` style="${style}"` : ''}>
    <span>${escapeHtmlAttr(display)}</span>
    <svg class="accordion-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </summary>
  <div class="hide-content accordion-content">${renderSimpleMarkdownBlock(content)}</div>
</details>`;
    }

    case 'tip': {
      const cls = argsStr || 'info';
      return `<div class="tip admonition admonition-tip ${escapeHtmlAttr(cls)}" data-hexo-tag="tip">
  <div class="admonition-content">${renderSimpleMarkdownBlock(content)}</div>
</div>`;
    }

    case 'btns': {
      return `<div class="btns ${escapeHtmlAttr(argsStr)}" data-hexo-tag="btns">${replaceInlineHexoTags(content)}</div>`;
    }

    case 'sitegroup': {
      return `<div class="site-card-group" data-hexo-tag="sitegroup">${replaceInlineHexoTags(content)}</div>`;
    }

    case 'videos': {
      const parts = argsStr.split(',').map((s) => s.trim());
      const cls = parts[0] || '';
      const col = Number(parts[1]) || 0;
      return `<div class="videos${cls ? ' ' + escapeHtmlAttr(cls) : ''}"${col > 0 ? ` col="${col}"` : ''} data-hexo-tag="videos">${replaceInlineHexoTags(content)}</div>`;
    }

    case 'gallery': {
      const imgRegex = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
      const items = [];
      let m;
      while ((m = imgRegex.exec(content)) !== null) {
        const alt = m[1] || m[3] || '';
        const src = m[2];
        items.push(`<div class="gallery-item">
      <img src="${escapeHtmlAttr(src)}" alt="${escapeHtmlAttr(alt)}" loading="lazy" />
      ${alt ? `<div class="gallery-item__caption">${escapeHtmlAttr(alt)}</div>` : ''}
    </div>`);
      }
      if (items.length === 0) {
        return `<div class="article-gallery hexo-gallery" data-hexo-tag="gallery">${content}</div>`;
      }
      return `<div class="article-gallery hexo-gallery" data-hexo-tag="gallery">
  <div class="gallery-grid gallery-grid-3">
    ${items.join('\n    ')}
  </div>
</div>`;
    }

    case 'tabs': {
      const parts = argsStr.split(',').map((s) => s.trim());
      const tabName = (parts[0] || 'hexo-tabs').toLowerCase().replace(/\s+/g, '-');
      const tabActive = Number(parts[1]) || 1;
      const tabBlockRegex = /<!--\s*tab\s*(.*?)\s*-->([\s\S]*?)<!--\s*endtab\s*-->/g;
      const buttons = [];
      const panels = [];
      let match;
      let idx = 0;
      while ((match = tabBlockRegex.exec(content)) !== null) {
        idx += 1;
        const rawHeader = (match[1] || '').trim();
        const body = (match[2] || '').trim();
        const [captionPart, iconPart] = rawHeader.split('@').map((s) => s.trim());
        const caption = captionPart || `${tabName}-${idx}`;
        const isActive = idx === (tabActive > 0 ? tabActive : 1);
        const iconHtml = iconPart ? `<i class="${escapeHtmlAttr(iconPart)}"></i> ` : '';
        buttons.push(
          `<button class="tab article-tabs__button${isActive ? ' active is-active' : ''}" type="button" data-href="${escapeHtmlAttr(tabName)}-${idx}">${iconHtml}${escapeHtmlAttr(caption)}</button>`
        );
        panels.push(
          `<div class="tab-item-content article-tabs__panel${isActive ? ' active is-active' : ''}" id="${escapeHtmlAttr(tabName)}-${idx}">${renderSimpleMarkdownBlock(body)}</div>`
        );
      }
      if (buttons.length === 0) {
        return `<div class="tabs article-tabs" id="${escapeHtmlAttr(tabName)}" data-hexo-tag="tabs">${renderSimpleMarkdownBlock(content)}</div>`;
      }
      return `<div class="tabs article-tabs" id="${escapeHtmlAttr(tabName)}" data-hexo-tag="tabs">
  <div class="nav-tabs article-tabs__nav">${buttons.join('')}</div>
  <div class="tab-contents article-tabs__panels">${panels.join('')}</div>
</div>`;
    }

    case 'timeline': {
      const parts = argsStr.split(',').map((s) => s.trim());
      const headline = parts[0] || '';
      const color = parts[1] || '';
      const tlBlockRegex = /<!--\s*timeline\s+(.*?)\s*-->([\s\S]*?)<!--\s*endtimeline\s*-->/g;
      const nodes = [];
      if (headline) {
        nodes.push(`<div class="timeline-item headline timeline-node">
    <div class="timeline-node__dot"></div>
    <div class="timeline-item-title timeline-node__content">
      <div class="item-circle timeline-node__title">${renderSimpleMarkdownInline(headline)}</div>
    </div>
  </div>`);
      }
      let match;
      while ((match = tlBlockRegex.exec(content)) !== null) {
        const nodeTitle = (match[1] || '').trim();
        const nodeBody = (match[2] || '').trim();
        nodes.push(`<div class="timeline-item timeline-node">
    <div class="timeline-node__dot"></div>
    <div class="timeline-node__content">
      <div class="timeline-item-title timeline-node__date">${renderSimpleMarkdownInline(nodeTitle)}</div>
      <div class="timeline-item-content timeline-node__desc">${renderSimpleMarkdownBlock(nodeBody)}</div>
    </div>
  </div>`);
      }
      return `<div class="timeline article-timeline${color ? ' ' + escapeHtmlAttr(color) : ''}" data-hexo-tag="timeline">
  ${nodes.join('\n  ')}
</div>`;
    }

    case 'mermaid': {
      return `<pre class="mermaid" data-language="mermaid" data-hexo-tag="mermaid">${escapeHtmlAttr(content)}</pre>`;
    }

    case 'flink': {
      return `<div class="hexo-flink-block" data-hexo-tag="flink">${renderSimpleMarkdownBlock(content)}</div>`;
    }

    default:
      return rawContent;
  }
}

/**
 * Transform single/inline Hexo tags inside a string
 */
export function replaceInlineHexoTags(input = '') {
  if (!input || !input.includes('{%')) return input;

  let out = input;

  // First handle any single-string paired block tags that might be inside the same text/paragraph chunk
  for (const tagName of BLOCK_TAG_NAMES) {
    const blockRegex = new RegExp(
      `\\{%\\s*${tagName}(?:\\s+([^%]*?))?\\s*%\\}([\\s\\S]*?)\\{%\\s*end${tagName}\\s*%\\}`,
      'g'
    );
    out = out.replace(blockRegex, (_, args = '', content = '') => renderBlockTag(tagName, args, content));
  }

  // Inline tags: {% tagName args %}
  const inlineRegex = /\{%\s*(label|u|emp|wavy|del|kbd|psw|span|p|iconfont|inlineImg|image|hideInline|btn|cell|checkbox|radio|link|site|bilibili|dogeplayer|audio|video|intCard)\b([^%]*?)%\}/g;

  out = out.replace(inlineRegex, (fullMatch, tagName, rawArgs = '') => {
    const argsStr = rawArgs.trim();

    switch (tagName) {
      case 'label': {
        const parts = argsStr.split(/\s+/).filter(Boolean);
        const text = parts[0] || '';
        const color = parts[1] || 'default';
        return `<mark class="hl-label mark-${escapeHtmlAttr(color)} ${escapeHtmlAttr(color)}" data-hexo-tag="label">${escapeHtmlAttr(text)}</mark>`;
      }
      case 'u':
        return `<u data-hexo-tag="u">${escapeHtmlAttr(argsStr)}</u>`;
      case 'emp':
        return `<emp class="hexo-emp" data-hexo-tag="emp">${escapeHtmlAttr(argsStr)}</emp>`;
      case 'wavy':
        return `<wavy class="u-wavy" data-hexo-tag="wavy">${escapeHtmlAttr(argsStr)}</wavy>`;
      case 'del':
        return `<del data-hexo-tag="del">${escapeHtmlAttr(argsStr)}</del>`;
      case 'kbd':
        return `<kbd data-hexo-tag="kbd">${escapeHtmlAttr(argsStr)}</kbd>`;
      case 'psw':
        return `<psw class="spoiler-mask" role="button" tabindex="0" aria-pressed="false" data-hexo-tag="psw">${escapeHtmlAttr(argsStr)}</psw>`;
      case 'span': {
        const parts = argsStr.split(',');
        const cls = (parts[0] || '').trim();
        const text = parts.slice(1).join(',').trim();
        return `<span class="p ${escapeHtmlAttr(cls)}" data-hexo-tag="span">${escapeHtmlAttr(text)}</span>`;
      }
      case 'p': {
        const parts = argsStr.split(',');
        const cls = (parts[0] || '').trim();
        const text = parts.slice(1).join(',').trim();
        return `<p class="p ${escapeHtmlAttr(cls)}" data-hexo-tag="p">${escapeHtmlAttr(text)}</p>`;
      }
      case 'iconfont': {
        const parts = argsStr.split(',').map((s) => s.trim());
        const icon = parts[0] || '';
        const size = parts[1] ? ` style="font-size:${escapeHtmlAttr(parts[1])}em"` : '';
        return `<i class="anzhiyufont ${escapeHtmlAttr(icon)}"${size} data-hexo-tag="iconfont"></i>`;
      }
      case 'inlineImg': {
        const parts = argsStr.split(/\s+/).filter(Boolean);
        const src = parts[0] || '';
        const height = parts[1] ? ` style="height:${escapeHtmlAttr(parts[1])}"` : '';
        return `<img class="inline-img" src="${escapeHtmlAttr(src)}"${height} alt="inline" data-hexo-tag="inlineImg" />`;
      }
      case 'image': {
        const parts = argsStr.split(',').map((s) => s.trim());
        const url = parts[0] || '';
        let alt = '';
        let width = '';
        for (const p of parts.slice(1)) {
          if (p.startsWith('alt=')) alt = p.slice(4);
          else if (p.startsWith('width=')) width = p.slice(6);
          else if (!alt) alt = p;
        }
        return `<figure class="hexo-image-tag" data-hexo-tag="image"><img src="${escapeHtmlAttr(url)}" alt="${escapeHtmlAttr(alt)}"${width ? ` style="width:${escapeHtmlAttr(width)}"` : ''} loading="lazy" />${alt ? `<figcaption>${escapeHtmlAttr(alt)}</figcaption>` : ''}</figure>`;
      }
      case 'hideInline': {
        const parts = argsStr.split(',').map((s) => s.trim());
        const content = parts[0] || '';
        const display = parts[1] || 'Click';
        const bg = parts[2] || '';
        const color = parts[3] || '';
        let style = '';
        if (bg) style += `background-color:${escapeHtmlAttr(bg)};`;
        if (color) style += `color:${escapeHtmlAttr(color)};`;
        return `<span class="hide-inline" data-hexo-tag="hideInline"><button type="button" class="hide-button"${style ? ` style="${style}"` : ''}>${escapeHtmlAttr(display)}</button><span class="hide-content">${escapeHtmlAttr(content)}</span></span>`;
      }
      case 'btn': {
        const parts = argsStr.split(',').map((s) => s.trim());
        const url = parts[0] || '#';
        const text = parts[1] || '';
        const icon = parts[2] || '';
        const option = parts[3] || '';
        return `<a class="btn-anzhiyu article-btn ${escapeHtmlAttr(option)}" href="${escapeHtmlAttr(url)}" title="${escapeHtmlAttr(text)}" data-hexo-tag="btn">${icon ? `<i class="${escapeHtmlAttr(icon)}"></i>` : ''}<span>${escapeHtmlAttr(text)}</span></a>`;
      }
      case 'cell': {
        const parts = argsStr.split(',').map((s) => s.trim());
        const text = parts[0] || '';
        const url = parts[1] || '#';
        const iconOrImg = parts[2] || '';
        const mediaHtml = iconOrImg.includes('anzhiyufont') || iconOrImg.startsWith('fa')
          ? `<i class="${escapeHtmlAttr(iconOrImg)}"></i>`
          : iconOrImg
          ? `<img src="${escapeHtmlAttr(iconOrImg)}" alt="${escapeHtmlAttr(text)}" />`
          : '';
        return `<a class="button no-text-decoration" href="${escapeHtmlAttr(url)}" title="${escapeHtmlAttr(text)}" data-hexo-tag="cell">${mediaHtml}<span>${escapeHtmlAttr(text)}</span></a>`;
      }
      case 'checkbox':
      case 'radio': {
        const parts = argsStr.split(',').map((s) => s.trim());
        let cls = '';
        let text = '';
        let checked = false;
        if (parts.length > 1) {
          cls = parts[0];
          checked = cls.includes('checked');
          text = parts.slice(1).join(',');
        } else {
          text = parts[0] || '';
        }
        const inputType = tagName === 'radio' ? 'radio' : 'checkbox';
        return `<div class="checkbox ${escapeHtmlAttr(cls)}" data-hexo-tag="${tagName}"><input type="${inputType}"${checked ? ' checked="checked"' : ''} /><span>${renderSimpleMarkdownInline(text)}</span></div>`;
      }
      case 'link': {
        const parts = argsStr.split(',').map((s) => s.trim());
        const title = parts[0] || '';
        const sitename = parts[1] || '';
        const url = parts[2] || parts[1] || '#';
        const imgUrl = parts[3] || '';
        const isInside = url.startsWith('/') && !url.startsWith('//');
        const iconSrc = imgUrl && imgUrl !== 'true' ? imgUrl : '/favicon.ico';
        return `<div class="anzhiyu-tag-link" data-hexo-tag="link">
  <a class="tag-Link" href="${escapeHtmlAttr(url)}"${isInside ? '' : ' target="_blank" rel="noopener noreferrer"'}>
    <div class="tag-link-tips">${isInside ? '站内地址' : '引用站外地址'}</div>
    <div class="tag-link-bottom">
      <div class="tag-link-left">
        <img class="tag-link-favicon no-lightbox" src="${escapeHtmlAttr(iconSrc)}" alt="icon" onerror="this.style.display='none'" />
      </div>
      <div class="tag-link-right">
        <div class="tag-link-title">${escapeHtmlAttr(title)}</div>
        <div class="tag-link-sitename">${escapeHtmlAttr(sitename)}</div>
      </div>
      <i class="anzhiyufont anzhiyu-icon-angle-right"></i>
    </div>
  </a>
</div>`;
      }
      case 'site': {
        const parts = argsStr.split(',').map((s) => s.trim());
        const url = parts[0] || '#';
        const img = parts[1] || '/media/shijianus/default.png';
        const title = parts[2] || '';
        const desc = parts[3] || '';
        return `<a class="site-card" href="${escapeHtmlAttr(url)}" target="_blank" rel="noopener noreferrer" data-hexo-tag="site">
  <div class="img"><img class="no-lightbox" src="${escapeHtmlAttr(img)}" alt="${escapeHtmlAttr(title)}" loading="lazy" /></div>
  <div class="info">
    <span class="site-title">${escapeHtmlAttr(title)}</span>
    ${desc ? `<span class="site-desc">${escapeHtmlAttr(desc)}</span>` : ''}
  </div>
</a>`;
      }
      case 'bilibili': {
        const parts = argsStr.split(/\s+/).filter(Boolean);
        const rawId = parts[0] || '';
        const bvid = rawId.replace(/.*video\/([^/?]+).*/, '$1');
        const page = parts[1] || '1';
        return `<div class="video-embed-card bilibili-tag-card" data-hexo-tag="bilibili" data-bvid="${escapeHtmlAttr(bvid)}">
  <iframe src="https://player.bilibili.com/player.html?bvid=${escapeHtmlAttr(bvid)}&page=${escapeHtmlAttr(page)}&high_quality=1&danmaku=0" allowfullscreen="true" loading="lazy"></iframe>
  <div class="embed-caption">Bilibili · ${escapeHtmlAttr(bvid)}</div>
</div>`;
      }
      case 'dogeplayer':
      case 'video': {
        const src = argsStr.split(',')[0].trim();
        return `<div class="video" data-hexo-tag="${tagName}"><video controls preload="metadata" src="${escapeHtmlAttr(src)}"></video></div>`;
      }
      case 'audio': {
        const src = argsStr.split(',')[0].trim();
        return `<div class="audio" data-hexo-tag="audio"><audio controls preload="none" src="${escapeHtmlAttr(src)}"></audio></div>`;
      }
      case 'intCard': {
        const parts = argsStr.split(/\s+/).filter(Boolean);
        const [link = '#', img = '/media/shijianus/default.png', tip = '推荐', cardTitle = '精选卡片', logo = '', title = '', subTitle = ''] = parts;
        return `<div class="introduction-card" data-hexo-tag="intCard">
  <div class="introduction-card-top">
    <div class="int-card-info">
      <div class="int-tip">${escapeHtmlAttr(tip)}</div>
      <div class="int-cardTitle">${escapeHtmlAttr(cardTitle)}</div>
    </div>
    <img src="${escapeHtmlAttr(img)}" class="no-lightbox" alt="${escapeHtmlAttr(cardTitle)}" loading="lazy" />
  </div>
  ${title || subTitle ? `<div class="introduction-card-bottom">
    <div class="left">
      ${logo ? `<img src="${escapeHtmlAttr(logo)}" class="no-lightbox" alt="${escapeHtmlAttr(title)}" />` : ''}
      <div class="info">
        <div class="title">${escapeHtmlAttr(title)}</div>
        <div class="subTitle">${escapeHtmlAttr(subTitle)}</div>
      </div>
    </div>
    <div class="right"><a href="${escapeHtmlAttr(link)}" class="no-text-decoration">前往</a></div>
  </div>` : ''}
</div>`;
      }
      default:
        return fullMatch;
    }
  });

  return out;
}

/**
 * Serialize an mdast node back to plain text / markdown for block tag inner content
 */
function serializeMdastNode(node) {
  if (!node) return '';
  if (node.type === 'text' || node.type === 'html') return node.value || '';
  if (node.type === 'inlineCode') return `\`${node.value || ''}\``;
  if (node.type === 'code') return `\n\`\`\`${node.lang || ''}\n${node.value || ''}\n\`\`\`\n`;
  if (node.type === 'strong') return `**${(node.children || []).map(serializeMdastNode).join('')}**`;
  if (node.type === 'emphasis') return `*${(node.children || []).map(serializeMdastNode).join('')}*`;
  if (node.type === 'delete') return `~~${(node.children || []).map(serializeMdastNode).join('')}~~`;
  if (node.type === 'link') return `[${(node.children || []).map(serializeMdastNode).join('')}](${node.url || ''})`;
  if (node.type === 'image') return `![${node.alt || ''}](${node.url || ''})`;
  if (Array.isArray(node.children)) {
    return node.children.map(serializeMdastNode).join('');
  }
  return '';
}

function processParentChildren(parent) {
  if (!parent || !Array.isArray(parent.children)) return;
  if (parent.type === 'code' || parent.type === 'inlineCode') return;

  // Step 1: Merge multi-sibling block tags (e.g. {% note ... %} in child[i] and {% endnote %} in child[j])
  const openTagRegex = new RegExp(`^\\s*\\{%\\s*(${BLOCK_TAG_NAMES.join('|')})(?:\\s+([^%]*?))?\\s*%\\}([\\s\\S]*)$`);
  let i = 0;
  while (i < parent.children.length) {
    const child = parent.children[i];
    if (child.type !== 'code' && child.type !== 'inlineCode') {
      const serialized = serializeMdastNode(child);
      const openMatch = serialized.match(openTagRegex);
      if (openMatch) {
        const tagName = openMatch[1];
        const args = openMatch[2] || '';
        const closeRegex = new RegExp(`([\\s\\S]*?)\\{%\\s*end${tagName}\\s*%\\}\\s*$`);

        // Check if it closes within the same child
        const sameClose = openMatch[3].match(closeRegex);
        if (sameClose) {
          const html = renderBlockTag(tagName, args, sameClose[1]);
          parent.children[i] = { type: 'html', value: html };
          i += 1;
          continue;
        }

        // Otherwise look ahead across subsequent siblings for {% endtagName %}
        let foundCloseIdx = -1;
        const innerChunks = [openMatch[3]];
        for (let j = i + 1; j < parent.children.length; j++) {
          const nextSer = serializeMdastNode(parent.children[j]);
          const closeMatch = nextSer.match(closeRegex);
          if (closeMatch) {
            if (closeMatch[1].trim()) innerChunks.push(closeMatch[1]);
            foundCloseIdx = j;
            break;
          } else {
            innerChunks.push(nextSer);
          }
        }

        if (foundCloseIdx !== -1) {
          const html = renderBlockTag(tagName, args, innerChunks.join('\n\n'));
          parent.children.splice(i, foundCloseIdx - i + 1, { type: 'html', value: html });
          i += 1;
          continue;
        }
      }
    }
    i += 1;
  }

  // Step 2: Process individual nodes & recurse
  for (let k = 0; k < parent.children.length; k++) {
    const node = parent.children[k];
    if (!node || node.type === 'code' || node.type === 'inlineCode') continue;

    if (node.type === 'text' && node.value && node.value.includes('{%')) {
      const replaced = replaceInlineHexoTags(node.value);
      if (replaced !== node.value) {
        parent.children[k] = { type: 'html', value: replaced };
        continue;
      }
    }

    if (node.type === 'paragraph' && Array.isArray(node.children)) {
      const fullText = serializeMdastNode(node);
      if (fullText.includes('{%')) {
        // Check if the paragraph contains a paired block tag or inline tags
        const replaced = replaceInlineHexoTags(fullText);
        if (replaced !== fullText) {
          // If it starts with a block HTML tag, replace the paragraph with an html node
          if (/^\s*<(div|details|figure|pre|p\b|a\s+class="site-card")/i.test(replaced)) {
            parent.children[k] = { type: 'html', value: replaced };
            continue;
          }
        }
      }
    }

    if (Array.isArray(node.children)) {
      processParentChildren(node);
    }
  }
}

export default function remarkHexoTags() {
  return (tree) => {
    processParentChildren(tree);
  };
}
