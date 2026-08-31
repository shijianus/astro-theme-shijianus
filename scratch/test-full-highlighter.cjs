// test-full-highlighter.cjs
function unescapeHtml(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#123;/g, '{')
    .replace(/&#125;/g, '}')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const KEYWORDS_JS = new Set([
  'import', 'export', 'from', 'default', 'as', 'const', 'let', 'var', 'function',
  'return', 'if', 'else', 'switch', 'case', 'break', 'continue', 'for', 'while',
  'do', 'try', 'catch', 'finally', 'throw', 'new', 'typeof', 'instanceof', 'in',
  'of', 'async', 'await', 'yield', 'class', 'extends', 'implements', 'interface',
  'type', 'enum', 'public', 'private', 'protected', 'readonly', 'static', 'override',
  'abstract', 'void', 'any', 'unknown', 'never', 'symbol', 'bigint', 'this', 'super'
]);

const BUILTINS_JS = new Set([
  'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useContext',
  'useReducer', 'useId', 'useTransition', 'useDeferredValue', 'ref', 'computed',
  'reactive', 'watch', 'watchEffect', 'onMounted', 'onUnmounted', '$state',
  '$derived', '$effect', '$props', '$bindable', 'Astro', 'console', 'document',
  'window', 'globalThis', 'Math', 'JSON', 'Promise', 'Object', 'Array', 'String',
  'Number', 'Boolean', 'RegExp', 'Date', 'Error', 'Map', 'Set', 'WeakMap',
  'WeakSet', 'Symbol', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval',
  'fetch', 'Response', 'Request', 'Headers', 'CustomEvent', 'Event'
]);

const LITERALS_JS = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity']);

function highlightJsTsx(code) {
  let result = '';
  // Tokenizer pattern
  // 1: Comments (// or /* */)
  // 2: Template literals or strings ('...' / "..." / `...`)
  // 3: JSX Tags (<button, </button>, />)
  // 4: Numbers
  // 5: Identifiers / Words
  // 6: Operators & Punctuation
  const tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(<\/?(?:[A-Za-z0-9_.-]+)|(?:\/>|>))|(\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b)|([a-zA-Z_$][a-zA-Z0-9_$]*)|(=>|===|!==|==|!=|<=|>=|&&|\|\||\+\+|--|\+|-|\*|\/|%|\?|:|\.\.\.|\.|,|;|\{|\}|\(|\)|\[|\]|=|<|>)/g;

  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(code)) !== null) {
    // text before match (whitespace)
    if (match.index > lastIndex) {
      result += escapeHtml(code.slice(lastIndex, match.index));
    }
    lastIndex = tokenRegex.lastIndex;

    const [full, comment, string, jsxTag, number, ident, punct] = match;

    if (comment) {
      result += `<span class="tok-comment">${escapeHtml(comment)}</span>`;
    } else if (string) {
      result += `<span class="tok-string">${escapeHtml(string)}</span>`;
    } else if (jsxTag) {
      if (jsxTag.startsWith('</')) {
        const tagName = jsxTag.slice(2);
        result += `&lt;/<span class="tok-tag">${escapeHtml(tagName)}</span>`;
      } else if (jsxTag.startsWith('<')) {
        const tagName = jsxTag.slice(1);
        result += `&lt;<span class="tok-tag">${escapeHtml(tagName)}</span>`;
      } else if (jsxTag === '/>') {
        result += `/<span class="tok-operator">&gt;</span>`;
      } else if (jsxTag === '>') {
        result += `&gt;`;
      }
    } else if (number) {
      result += `<span class="tok-number">${escapeHtml(number)}</span>`;
    } else if (ident) {
      if (KEYWORDS_JS.has(ident)) {
        result += `<span class="tok-keyword">${escapeHtml(ident)}</span>`;
      } else if (BUILTINS_JS.has(ident) || ident.startsWith('use') || ident.startsWith('$')) {
        result += `<span class="tok-builtin">${escapeHtml(ident)}</span>`;
      } else if (LITERALS_JS.has(ident)) {
        result += `<span class="tok-bool">${escapeHtml(ident)}</span>`;
      } else if (/^[A-Z][a-zA-Z0-9_$]*$/.test(ident)) {
        // Component / Class name
        result += `<span class="tok-type">${escapeHtml(ident)}</span>`;
      } else {
        // Look ahead for '(' to detect function call
        const rest = code.slice(lastIndex);
        if (/^\s*\(/.test(rest)) {
          result += `<span class="tok-function">${escapeHtml(ident)}</span>`;
        } else if (/^\s*=/.test(rest) && !/^\s*==/.test(rest) && !/^\s*=>/.test(rest)) {
          // Attribute or property assignment
          result += `<span class="tok-prop">${escapeHtml(ident)}</span>`;
        } else {
          result += `<span class="tok-var">${escapeHtml(ident)}</span>`;
        }
      }
    } else if (punct) {
      if (['=>', '===', '!==', '==', '!=', '<=', '>=', '&&', '||', '+', '-', '*', '/', '?', ':', '='].includes(punct)) {
        result += `<span class="tok-operator">${escapeHtml(punct)}</span>`;
      } else {
        result += `<span class="tok-punct">${escapeHtml(punct)}</span>`;
      }
    }
  }

  if (lastIndex < code.length) {
    result += escapeHtml(code.slice(lastIndex));
  }

  return result;
}

const sampleReact = `import { useState } from 'react';
export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount((c) => c + 1)} className="btn-primary">
      React 点击计数：{count}
    </button>
  );
}`;

console.log("REACT TSX OUTPUT:\n", highlightJsTsx(sampleReact));
