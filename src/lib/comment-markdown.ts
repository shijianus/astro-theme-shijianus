/**
 * Safe, robust, and lightweight Markdown/Discourse parser for PostComments preview and rendering.
 * Fully protects against Stored XSS while supporting rich formatting:
 * - Code blocks (syntax highlight / Mermaid / Charts)
 * - Polls, Callouts, Details/Summary, Math formulas, Spoilers
 * - Headings, Blockquotes, GFM Tables, Ordered/Unordered Lists, Strikethrough, Bold/Italic
 * - Safe Links & Images (strictly whitelist http/https)
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (/^https?:\/\//i.test(trimmed) || /^\/(?!\/)/.test(trimmed)) {
    return escapeHtml(trimmed);
  }
  return '#';
}

export function renderCommentMarkdown(raw: string): string {
  if (!raw || !raw.trim()) return '';

  let text = raw;

  // Placeholder store for multi-line block structures
  const placeholders: string[] = [];
  function saveBlock(html: string): string {
    const key = `\x00BLOCK_${placeholders.length}_\x00`;
    placeholders.push(html);
    return key;
  }

  // 1. Code blocks (```language ... ```) - extract and escape content
  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const cleanLang = (lang || 'code').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const escapedCode = escapeHtml(code.trimEnd());
    if (cleanLang === 'mermaid' || cleanLang === 'chart' || cleanLang === 'graphviz') {
      return saveBlock(
        `<div class="tk-chart-container tk-chart-${cleanLang}"><div class="tk-chart-badge">${cleanLang.toUpperCase()} 图表</div><pre class="tk-code-pre"><code>${escapedCode}</code></pre></div>`
      );
    }
    return saveBlock(
      `<pre class="tk-code-block" data-lang="${cleanLang}"><code class="language-${cleanLang}">${escapedCode}</code></pre>`
    );
  });

  // 2. Polls ([poll ...] ... [/poll])
  text = text.replace(/\[poll(?:\s+[^\]]*)?\]([\s\S]*?)\[\/poll\]/gi, (_, pollBody) => {
    const lines = pollBody.trim().split('\n');
    const options = lines
      .map((l: string) => l.trim())
      .filter((l: string) => l.startsWith('*') || l.startsWith('-'))
      .map((l: string) => escapeHtml(l.replace(/^[*-\s]+/, '')));

    const optionsHtml = options
      .map(
        (opt: string, i: number) => `
        <label class="tk-poll-option">
          <input type="radio" name="poll_preview" disabled />
          <span class="tk-poll-text">${opt || `选项 ${i + 1}`}</span>
        </label>`
      )
      .join('');

    return saveBlock(`
      <div class="tk-poll-card">
        <div class="tk-poll-header">📊 投票调查 (预览)</div>
        <div class="tk-poll-options">${optionsHtml}</div>
        <div class="tk-poll-footer">共 ${options.length} 个候选项</div>
      </div>
    `);
  });

  // 3. Callout / Container (::: note title \n content \n :::)
  text = text.replace(/:::\s*([a-zA-Z0-9_-]*)(?:[^\n]*)\n([\s\S]*?):::/g, (_, type, body) => {
    const cleanType = (type || 'note').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    return saveBlock(
      `<div class="tk-callout tk-callout-${cleanType}"><div class="tk-callout-body">${escapeHtml(body.trim())}</div></div>`
    );
  });

  // 4. Details / Summary (<details><summary>...</summary>...</details>)
  text = text.replace(/<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi, (_, summary, body) => {
    return saveBlock(
      `<details class="tk-details"><summary class="tk-summary">${escapeHtml(summary.trim())}</summary><div class="tk-details-content">${escapeHtml(body.trim())}</div></details>`
    );
  });

  // 5. Math blocks ($$ ... $$)
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    return saveBlock(`<div class="tk-math-block"><code>${escapeHtml(math.trim())}</code></div>`);
  });

  // 6. Tables: GFM table format
  text = text.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (tableMatch) => {
    const rows = tableMatch.trim().split('\n').map((r) => r.trim());
    if (rows.length < 2) return tableMatch;
    const isSep = rows[1].replace(/[\s|:-]/g, '').length === 0;
    if (!isSep) return tableMatch;

    const parseCells = (rowStr: string) =>
      rowStr
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

    const headers = parseCells(rows[0]);
    const bodyRows = rows.slice(2);

    const thead = `<thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>`;
    const tbody = `<tbody>${bodyRows
      .map(
        (r) =>
          `<tr>${parseCells(r)
            .map((c) => `<td>${escapeHtml(c)}</td>`)
            .join('')}</tr>`
      )
      .join('')}</tbody>`;

    return saveBlock(`<div class="tk-table-wrapper"><table class="tk-md-table">${thead}${tbody}</table></div>`);
  });

  // =========================================================================
  // CRITICAL SECURITY BARRIER:
  // Escape ALL remaining characters in text. Any unparsed HTML tags (<script>,
  // <img>, <svg>, <iframe...>) are permanently neutralized to safe entities!
  // =========================================================================
  text = escapeHtml(text);

  // 7. Spoiler tags: [spoiler]text[/spoiler] or escaped <span class="spoiler">text</span>
  text = text.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, (_, spText) => {
    return `<span class="tk-spoiler" title="剧透内容，点击或悬浮查看">${spText}</span>`;
  });
  text = text.replace(/&lt;span\s+class=(?:&quot;|&#039;)spoiler(?:&quot;|&#039;)&gt;([\s\S]*?)&lt;\/span&gt;/gi, (_, spText) => {
    return `<span class="tk-spoiler" title="剧透内容，点击或悬浮查看">${spText}</span>`;
  });

  // 8. Math inline ($ ... $)
  text = text.replace(/\$([^\$\n]+)\$/g, (_, math) => {
    return `<span class="tk-math-inline"><code>${math.trim()}</code></span>`;
  });

  // 9. Dates: [date=... format="..."]
  text = text.replace(/\[date=([^\s\]]+)(?:\s+format=(?:&quot;|&#039;)?([^"']*)(?:&quot;|&#039;)?)?\]/gi, (_, dVal) => {
    return `<time class="tk-date-badge">📅 ${dVal}</time>`;
  });

  // 10. Markdown Headings (# to ####) - input is already HTML-escaped
  text = text.replace(/^####\s+(.*)$/gm, '<h5 class="tk-md-h">$1</h5>');
  text = text.replace(/^###\s+(.*)$/gm, '<h4 class="tk-md-h">$1</h4>');
  text = text.replace(/^##\s+(.*)$/gm, '<h3 class="tk-md-h">$1</h3>');
  text = text.replace(/^#\s+(.*)$/gm, '<h2 class="tk-md-h">$1</h2>');

  // 11. Blockquotes (> ...) - since > was escaped to &gt;
  text = text.replace(/^(?:&gt;\s?(?:.*)(?:\r?\n|$))+/gm, (blockquoteMatch) => {
    const inner = blockquoteMatch
      .split('\n')
      .map((l) => l.replace(/^&gt;\s?/, ''))
      .join('<br />');
    return `<blockquote class="tk-md-blockquote">${inner}</blockquote>`;
  });

  // 12. Lists (- item, * item, 1. item)
  text = text.replace(/^([*-]\s+.*(?:\r?\n[*-]\s+.*)*)/gm, (listMatch) => {
    const items = listMatch
      .split('\n')
      .map((l) => `<li>${l.replace(/^[*-]\s+/, '')}</li>`)
      .join('');
    return `<ul class="tk-md-ul">${items}</ul>`;
  });
  text = text.replace(/^(\d+\.\s+.*(?:\r?\n\d+\.\s+.*)*)/gm, (listMatch) => {
    const items = listMatch
      .split('\n')
      .map((l) => `<li>${l.replace(/^\d+\.\s+/, '')}</li>`)
      .join('');
    return `<ol class="tk-md-ol">${items}</ol>`;
  });

  // 13. Inline codes (`...`) - input is already HTML-escaped
  text = text.replace(/`([^`\n]+)`/g, '<code class="tk-inline-code">$1</code>');

  // 14. Strikethrough (~~text~~)
  text = text.replace(/~~([^~]+)~~/g, '<del class="tk-strikethrough">$1</del>');

  // 15. Bold and Italic
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 16. Links and Images (strictly whitelist http/https)
  text = text.replace(/!\[([^\]]*)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, (_, alt, url) => {
    return `<img class="tk-md-img" src="${sanitizeUrl(url)}" alt="${alt}" loading="lazy" />`;
  });
  text = text.replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, (_, title, url) => {
    return `<a class="tk-md-link" href="${sanitizeUrl(url)}" target="_blank" rel="noopener noreferrer">${title}</a>`;
  });

  // 17. Footnotes: [^1] and [^1]: ...
  text = text.replace(/\[\^(\w+)\]:\s*([^\n]+)/g, (_, fnId, fnText) => {
    return `<div class="tk-footnote-def" id="fn-${fnId}"><span class="tk-fn-num">[${fnId}]</span> ${fnText}</div>`;
  });
  text = text.replace(/\[\^(\w+)\]/g, (_, fnId) => {
    return `<sup class="tk-footnote-ref"><a href="#fn-${fnId}">[${fnId}]</a></sup>`;
  });

  // 18. Paragraphs and Linebreaks
  text = text.replace(/\n\n+/g, '</p><p>');
  text = text.replace(/\n/g, '<br />');

  // 19. Restore Placeholders in reverse order
  placeholders.forEach((html, i) => {
    text = text.replace(`\x00BLOCK_${i}_\x00`, html);
  });

  return `<div class="tk-markdown-body"><p>${text}</p></div>`;
}
