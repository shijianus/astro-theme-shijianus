// test-multi-highlighter.cjs
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
  const tokenRegex = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(<\/?(?:[A-Za-z0-9_.-]+)|(?:\/>|>))|(\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b)|([a-zA-Z_$][a-zA-Z0-9_$]*)|(=>|===|!==|==|!=|<=|>=|&&|\|\||\+\+|--|\+|-|\*|\/|%|\?|:|\.\.\.|\.|,|;|\{|\}|\(|\)|\[|\]|=|<|>)/g;

  let lastIndex = 0;
  let match;

  while ((match = tokenRegex.exec(code)) !== null) {
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
        result += `<span class="tok-type">${escapeHtml(ident)}</span>`;
      } else {
        const rest = code.slice(lastIndex);
        if (/^\s*\(/.test(rest)) {
          result += `<span class="tok-function">${escapeHtml(ident)}</span>`;
        } else if (/^\s*=/.test(rest) && !/^\s*==/.test(rest) && !/^\s*=>/.test(rest)) {
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

function highlightHtmlVueAstro(code) {
  let result = '';
  // Check for Astro frontmatter
  if (code.startsWith('---')) {
    const secondFence = code.indexOf('---', 3);
    if (secondFence !== -1) {
      const frontmatter = code.slice(3, secondFence);
      result += `<span class="tok-keyword">---</span>\n${highlightJsTsx(frontmatter.trim())}\n<span class="tok-keyword">---</span>\n`;
      code = code.slice(secondFence + 3).trimStart();
    }
  }

  // HTML / Template Tokenizer
  const tagRegex = /(<!--[\s\S]*?-->)|(<script[^>]*>)([\s\S]*?)(<\/script>)|(<\/?[a-zA-Z0-9_:-]+)((?:\s+[a-zA-Z0-9_:@#.-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*)(\/?>)|(\{\{[\s\S]*?\}\}|\{[a-zA-Z0-9_$.]+\})/g;

  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(code)) !== null) {
    if (match.index > lastIndex) {
      result += escapeHtml(code.slice(lastIndex, match.index));
    }
    lastIndex = tagRegex.lastIndex;

    const [full, comment, scriptOpen, scriptBody, scriptClose, tagOpen, tagAttrs, tagClose, expr] = match;

    if (comment) {
      result += `<span class="tok-comment">${escapeHtml(comment)}</span>`;
    } else if (scriptOpen) {
      result += highlightTag(scriptOpen) + highlightJsTsx(scriptBody) + highlightTag(scriptClose);
    } else if (tagOpen) {
      result += highlightTag(tagOpen + (tagAttrs || '') + (tagClose || ''));
    } else if (expr) {
      result += `<span class="tok-expr">${highlightJsTsx(expr)}</span>`;
    }
  }

  if (lastIndex < code.length) {
    result += escapeHtml(code.slice(lastIndex));
  }

  return result;
}

function highlightTag(tagStr) {
  return tagStr.replace(/(<\/?)([a-zA-Z0-9_:-]+)((?:\s+[a-zA-Z0-9_:@#.-]+(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s*)(\/?>)/g, (_, open, tag, attrs, close) => {
    let highlightedAttrs = '';
    if (attrs) {
      highlightedAttrs = attrs.replace(/([a-zA-Z0-9_:@#.-]+)(?:(=)("[^"]*"|'[^']*'|[^\s>]+))?/g, (m, attrName, eq, attrVal) => {
        let attrHtml = `<span class="tok-attr">${escapeHtml(attrName)}</span>`;
        if (eq) {
          attrHtml += `<span class="tok-operator">=</span>`;
        }
        if (attrVal) {
          attrHtml += `<span class="tok-string">${escapeHtml(attrVal)}</span>`;
        }
        return attrHtml;
      });
    }
    return `&lt;${open.includes('/') ? '/' : ''}<span class="tok-tag">${escapeHtml(tag)}</span>${highlightedAttrs}${close.includes('/') ? '/' : ''}&gt;`;
  });
}

console.log("VUE OUTPUT:\n", highlightHtmlVueAstro(`<script setup lang="ts">\nimport { ref } from 'vue';\nconst count = ref(0);\n</script>\n<template>\n  <button @click="count++">Count: {{ count }}</button>\n</template>`));
console.log("\nASTRO OUTPUT:\n", highlightHtmlVueAstro(`---\nconst { label = "Astro 静态组件" } = Astro.props;\n---\n<div class="astro-card">\n  <h3>{label}</h3>\n</div>`));
console.log("\nSVELTE OUTPUT:\n", highlightHtmlVueAstro(`<script lang="ts">\n  let count = $state(0);\n</script>\n<button onclick={() => count++}>Count: {count}</button>`));
