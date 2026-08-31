// test-highlighter.cjs
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

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

function highlightBash(code) {
  const lines = code.split('\n');
  return lines.map(line => {
    // Comment
    if (/^\s*#/.test(line)) {
      return `<span class="tok-comment">${escapeHtml(line)}</span>`;
    }

    let result = '';
    // Regex tokenizer for bash tokens
    const tokenRegex = /(#[^\n]*)|("[^"\\]*(?:\\.[^"\\]*)*"|'[^'\\]*(?:\\.[^'\\]*)*')|(\$[a-zA-Z_0-9{}-]+)|(--?[a-zA-Z0-9_-]+(?:=[^\s"']*)?)|(@[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+|[a-zA-Z0-9_.-]+(?=\s|$))|(\|{1,2}|&&|>>?|<|2>&1|\\|;)|(\s+)|([^\s]+)/g;

    let match;
    let isCommandPosition = true;
    let isSubcommandPosition = false;

    while ((match = tokenRegex.exec(line)) !== null) {
      const [full, comment, string, variable, flag, word, operator, space, other] = match;

      if (comment) {
        result += `<span class="tok-comment">${escapeHtml(comment)}</span>`;
      } else if (string) {
        result += `<span class="tok-string">${escapeHtml(string)}</span>`;
        isCommandPosition = false;
      } else if (variable) {
        result += `<span class="tok-var">${escapeHtml(variable)}</span>`;
        isCommandPosition = false;
      } else if (flag) {
        result += `<span class="tok-flag">${escapeHtml(flag)}</span>`;
        isCommandPosition = false;
      } else if (operator) {
        result += `<span class="tok-operator">${escapeHtml(operator)}</span>`;
        if (operator === '|' || operator === '||' || operator === '&&' || operator === ';') {
          isCommandPosition = true;
          isSubcommandPosition = false;
        }
      } else if (space) {
        result += space;
      } else if (word) {
        if (isCommandPosition) {
          result += `<span class="tok-cmd">${escapeHtml(word)}</span>`;
          isCommandPosition = false;
          if (['pnpm', 'npm', 'yarn', 'bun', 'git', 'docker', 'npx', 'wrangler', 'astro', 'cargo', 'go', 'pip'].includes(word.toLowerCase())) {
            isSubcommandPosition = true;
          }
        } else if (isSubcommandPosition) {
          if (['add', 'install', 'i', 'run', 'build', 'dev', 'start', 'preview', 'init', 'create', 'commit', 'push', 'pull', 'checkout', 'branch', 'merge', 'rebase', 'status', 'log', 'diff', 'config', 'set', 'get', 'remove', 'uninstall', 'update', 'upgrade', 'test', 'clean', 'pages', 'deploy', 'migrate', 'exec', 'ps', 'up', 'down', 'logs'].includes(word.toLowerCase())) {
            result += `<span class="tok-subcmd">${escapeHtml(word)}</span>`;
          } else if (word.startsWith('@') || word.includes('/')) {
            result += `<span class="tok-pkg">${escapeHtml(word)}</span>`;
          } else {
            result += `<span class="tok-pkg">${escapeHtml(word)}</span>`;
          }
          isSubcommandPosition = false;
        } else if (word.startsWith('@') || ['remark-math', 'rehype-katex', 'katex', 'mermaid', 'react', 'react-dom', 'lucide-react', 'tailwindcss', 'clsx', 'tailwind-merge', 'opencc-js', 'qrcode', 'maxmind'].includes(word)) {
          result += `<span class="tok-pkg">${escapeHtml(word)}</span>`;
        } else if (/^\d+$/.test(word)) {
          result += `<span class="tok-number">${escapeHtml(word)}</span>`;
        } else {
          result += `<span class="tok-arg">${escapeHtml(word)}</span>`;
        }
      } else if (other) {
        result += escapeHtml(other);
      }
    }
    return result;
  }).join('\n');
}

const bashSample = 'pnpm add @astrojs/mdx remark-math rehype-katex katex mermaid';
console.log("BASH OUTPUT:\n", highlightBash(bashSample));
