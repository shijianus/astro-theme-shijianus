import katex from 'katex';
import MarkdownIt from 'markdown-it';

const markdown = new MarkdownIt({ html: false, breaks: true, linkify: true });
markdown.linkify.set({ fuzzyLink: false, fuzzyEmail: false });
const escape = markdown.utils.escapeHtml;
const blockExtensions = [
  { type: 'formula', start: '$$', pattern: /^\$\$([\s\S]+?)\$\$[ \t]*(?:\n|$)/ },
  {
    type: 'details',
    start: '<details>',
    pattern: /^<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>[ \t]*(?:\n|$)/i,
  },
  { type: 'callout', start: ':::', pattern: /^:::[ \t]*(\w*)[ \t]*([^\n]*)\n([\s\S]*?)^:::[ \t]*(?:\n|$)/m },
  { type: 'poll', start: '[poll', pattern: /^\[poll(?:\s+[^\]]*)?\]([\s\S]*?)\[\/poll\][ \t]*(?:\n|$)/i },
  { type: 'footnote', start: '[^', pattern: /^\[\^(\w+)\]:[ \t]*([^\n]*)(?:\n|$)/ },
];
markdown.block.ruler.before(
  'reference',
  'gesture_extension',
  (state, line, end, silent) => {
    if (state.sCount[line] - state.blkIndent >= 4) return false;
    const offset = state.bMarks[line] + state.tShift[line];
    for (const rule of blockExtensions) {
      if (!state.src.startsWith(rule.start, offset)) continue;
      const match = rule.pattern.exec(state.src.slice(offset, state.eMarks[end - 1] + 1));
      if (!match || match.index !== 0) continue;
      if (silent) return true;
      const token = state.push('gesture_' + rule.type, '', 0);
      token.meta = match.slice(1);
      let next = line + 1;
      while (next < end && state.bMarks[next] < offset + match[0].length) next++;
      token.map = [line, next];
      state.line = next;
      return true;
    }
    return false;
  },
  { alt: ['paragraph', 'reference', 'blockquote'] },
);

const inlineExtensions = [
  { type: 'math', start: '$', pattern: /^\$(?!\$|\s)((?:\\.|[^$\\\n])+?)\$(?!\d)/ },
  { type: 'spoiler', start: '[spoiler]', pattern: /^\[spoiler\]([\s\S]*?)\[\/spoiler\]/i },
  { type: 'spoiler', start: '<span', pattern: /^<span\s+class=["']spoiler["']>([\s\S]*?)<\/span>/i },
  { type: 'date', start: '[date=', pattern: /^\[date=([^\s\]]+)(?:\s+format=["'][^"']*["'])?\]/ },
  { type: 'note_ref', start: '[^', pattern: /^\[\^(\w+)\]/ },
];
markdown.inline.ruler.before('escape', 'gesture_inline', (state, silent) => {
  for (const rule of inlineExtensions) {
    if (!state.src.startsWith(rule.start, state.pos)) continue;
    const match = rule.pattern.exec(state.src.slice(state.pos, state.posMax));
    if (!match) continue;
    if (!silent) state.push('gesture_' + rule.type, '', 0).content = match[1];
    state.pos += match[0].length;
    return true;
  }
  return false;
});

function formula(source: string, displayMode: boolean) {
  return katex.renderToString(source.trim(), {
    displayMode,
    throwOnError: false,
    trust: false,
    maxExpand: 500,
    maxSize: 10,
  });
}
const rules = markdown.renderer.rules;
rules.gesture_formula = (tokens, i) =>
  '<div class="tk-math-block">' + formula(tokens[i].meta[0], true) + '</div>';
rules.gesture_math = (tokens, i) => formula(tokens[i].content, false);
rules.gesture_details = (tokens, i) => {
  const [title, body] = tokens[i].meta;
  return (
    '<details class="tk-details"><summary>' +
    markdown.renderInline(title) +
    '</summary><div class="tk-details-content">' +
    markdown.render(body.trim()) +
    '</div></details>'
  );
};
rules.gesture_callout = (tokens, i) => {
  const [type, title, body] = tokens[i].meta;
  return (
    '<aside class="tk-callout tk-callout-' +
    escape(type || 'note') +
    '">' +
    (title ? '<strong>' + escape(title) + '</strong>' : '') +
    markdown.render(body.trim()) +
    '</aside>'
  );
};
rules.gesture_poll = (tokens, i) => {
  const choices = tokens[i].meta[0]
    .split('\n')
    .map((line: string) => /^[ \t]*[-*][ \t]+(.+)/.exec(line)?.[1])
    .filter(Boolean);
  return (
    '<div class="tk-poll-card"><strong>投票调查（预览）</strong>' +
    choices
      .map(
        (choice: string) =>
          '<label class="tk-poll-option"><input type="radio" disabled> ' + escape(choice) + '</label>',
      )
      .join('') +
    '</div>'
  );
};
rules.gesture_footnote = (tokens, i) => {
  const [id, body] = tokens[i].meta;
  return (
    '<aside class="tk-footnote-def" id="fn-' +
    id +
    '">[' +
    id +
    '] ' +
    markdown.renderInline(body) +
    '</aside>'
  );
};
rules.gesture_spoiler = (tokens, i) =>
  '<span class="tk-spoiler" tabindex="0">' + escape(tokens[i].content) + '</span>';
rules.gesture_note_ref = (tokens, i) =>
  '<sup><a href="#fn-' + tokens[i].content + '">[' + tokens[i].content + ']</a></sup>';
rules.gesture_date = (tokens, i) => '<time class="tk-date-badge">' + escape(tokens[i].content) + '</time>';
rules.table_open = () => '<div class="tk-table-wrapper"><table class="tk-md-table">';
rules.table_close = () => '</table></div>';
const image = rules.image;
rules.image = (tokens, i, options, env, renderer) => {
  tokens[i].attrSet('loading', 'lazy');
  return image(tokens, i, options, env, renderer);
};
const fence = rules.fence;
rules.fence = (tokens, i, options, env, renderer) => {
  const language = tokens[i].info.trim();
  const code = fence(tokens, i, options, env, renderer);
  return ['mermaid', 'chart', 'graphviz'].includes(language)
    ? '<div class="tk-chart-container"><small>' +
        escape(language.toUpperCase()) +
        '</small>' +
        code +
        '</div>'
    : code;
};

export function renderGestureMarkdown(message: string) {
  return markdown.render(message);
}
