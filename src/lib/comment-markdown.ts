/**
 * Safe and lightweight Markdown/Discourse parser for PostComments preview and rendering.
 * Supports standard Markdown, GFM tables, code blocks, spoilers, polls, callouts, and details.
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderCommentMarkdown(raw: string): string {
  if (!raw || !raw.trim()) return '';

  let text = raw;

  // 1. Code blocks (```language ... ```) - extract and placeholder to prevent inner parsing
  const codeBlocks: string[] = [];
  text = text.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const idx = codeBlocks.length;
    const cleanLang = (lang || 'code').toLowerCase();
    const escapedCode = escapeHtml(code.trimEnd());
    if (cleanLang === 'mermaid' || cleanLang === 'chart' || cleanLang === 'graphviz') {
      codeBlocks.push(
        `<div class="tk-chart-container tk-chart-${cleanLang}">
          <div class="tk-chart-badge">${cleanLang.toUpperCase()} 图表</div>
          <pre class="tk-code-pre"><code>${escapedCode}</code></pre>
        </div>`
      );
    } else {
      codeBlocks.push(
        `<pre class="tk-code-block" data-lang="${cleanLang}"><code class="language-${cleanLang}">${escapedCode}</code></pre>`
      );
    }
    return `<!--CODE_BLOCK_${idx}-->`;
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

    return `
      <div class="tk-poll-card">
        <div class="tk-poll-header">📊 投票调查 (预览)</div>
        <div class="tk-poll-options">${optionsHtml}</div>
        <div class="tk-poll-footer">共 ${options.length} 个候选项</div>
      </div>
    `;
  });

  // 3. Callout / Container (::: note title \n content \n :::)
  text = text.replace(/:::\s*([a-zA-Z0-9_-]*)(?:[^\n]*)\n([\s\S]*?):::/g, (_, type, body) => {
    const cleanType = (type || 'note').toLowerCase();
    return `<div class="tk-callout tk-callout-${cleanType}"><div class="tk-callout-body">${escapeHtml(body.trim())}</div></div>`;
  });

  // 4. Details / Summary (<details><summary>...</summary>...</details>)
  text = text.replace(/<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi, (_, summary, body) => {
    return `<details class="tk-details"><summary class="tk-summary">${escapeHtml(summary.trim())}</summary><div class="tk-details-content">${escapeHtml(body.trim())}</div></details>`;
  });

  // 5. Spoiler tags: [spoiler]text[/spoiler] or <span class="spoiler">text</span>
  text = text.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, (_, spText) => {
    return `<span class="tk-spoiler" title="剧透内容，点击或悬浮查看">${escapeHtml(spText)}</span>`;
  });
  text = text.replace(/<span\s+class=["']spoiler["']>([\s\S]*?)<\/span>/gi, (_, spText) => {
    return `<span class="tk-spoiler" title="剧透内容，点击或悬浮查看">${escapeHtml(spText)}</span>`;
  });

  // 6. Math formulas: $$ ... $$ and $ ... $
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    return `<div class="tk-math-block"><code>${escapeHtml(math.trim())}</code></div>`;
  });
  text = text.replace(/\$([^\$\n]+)\$/g, (_, math) => {
    return `<span class="tk-math-inline"><code>${escapeHtml(math.trim())}</code></span>`;
  });

  // 7. Dates: [date=... format="..."]
  text = text.replace(/\[date=([^\s\]]+)(?:\s+format=["']?([^"']+)["']?)?\]/gi, (_, dVal) => {
    return `<time class="tk-date-badge">📅 ${escapeHtml(dVal)}</time>`;
  });

  // 8. Markdown Headings (# to ####)
  text = text.replace(/^####\s+(.*)$/gm, '<h5 class="tk-md-h">$1</h5>');
  text = text.replace(/^###\s+(.*)$/gm, '<h4 class="tk-md-h">$1</h4>');
  text = text.replace(/^##\s+(.*)$/gm, '<h3 class="tk-md-h">$1</h3>');
  text = text.replace(/^#\s+(.*)$/gm, '<h2 class="tk-md-h">$1</h2>');

  // 9. Tables: GFM table format
  text = text.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (tableMatch) => {
    const rows = tableMatch.trim().split('\n').map((r) => r.trim());
    if (rows.length < 2) return tableMatch;
    // Check if second row is separator | --- | --- |
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

    return `<div class="tk-table-wrapper"><table class="tk-md-table">${thead}${tbody}</table></div>`;
  });

  // 10. Blockquotes (> ...)
  text = text.replace(/^(?:>\s*(?:.*)(?:\r?\n|$))+/gm, (blockquoteMatch) => {
    const inner = blockquoteMatch
      .split('\n')
      .map((l) => l.replace(/^>\s?/, ''))
      .join('<br />');
    return `<blockquote class="tk-md-blockquote">${inner}</blockquote>`;
  });

  // 11. Lists (- item, * item, 1. item)
  text = text.replace(/^([*-]\s+.*(?:\r?\n[*-]\s+.*)*)/gm, (listMatch) => {
    const items = listMatch
      .split('\n')
      .map((l) => `<li>${escapeHtml(l.replace(/^[*-]\s+/, ''))}</li>`)
      .join('');
    return `<ul class="tk-md-ul">${items}</ul>`;
  });
  text = text.replace(/^(\d+\.\s+.*(?:\r?\n\d+\.\s+.*)*)/gm, (listMatch) => {
    const items = listMatch
      .split('\n')
      .map((l) => `<li>${escapeHtml(l.replace(/^\d+\.\s+/, ''))}</li>`)
      .join('');
    return `<ol class="tk-md-ol">${items}</ol>`;
  });

  // 12. Inline codes (`...`)
  text = text.replace(/`([^`\n]+)`/g, '<code class="tk-inline-code">$1</code>');

  // 13. Bold and Italic
  text = text.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 14. Links ([text](url)) and Images (![alt](url))
  text = text.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, (_, alt, url) => {
    return `<img class="tk-md-img" src="${escapeHtml(url)}" alt="${escapeHtml(alt)}" loading="lazy" />`;
  });
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_, title, url) => {
    return `<a class="tk-md-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(title)}</a>`;
  });

  // 15. Footnotes: [^1] and [^1]: ...
  text = text.replace(/\[\^(\w+)\]:\s*([^\n]+)/g, (_, fnId, fnText) => {
    return `<div class="tk-footnote-def" id="fn-${escapeHtml(fnId)}"><span class="tk-fn-num">[${escapeHtml(fnId)}]</span> ${escapeHtml(fnText)}</div>`;
  });
  text = text.replace(/\[\^(\w+)\]/g, (_, fnId) => {
    return `<sup class="tk-footnote-ref"><a href="#fn-${escapeHtml(fnId)}">[${escapeHtml(fnId)}]</a></sup>`;
  });

  // 16. Paragraphs and Linebreaks
  text = text.replace(/\n\n+/g, '</p><p>');
  text = text.replace(/\n/g, '<br />');

  // 17. Restore Code Blocks
  text = text.replace(/<!--CODE_BLOCK_(\d+)-->/g, (_, idx) => {
    return codeBlocks[Number(idx)] || '';
  });

  return `<div class="tk-markdown-body"><p>${text}</p></div>`;
}
