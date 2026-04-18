import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MacCodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export function MacCodeBlock({ code, language, title }: MacCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = code;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed', error);
    }
  };

  return (
    <section className="theme-card overflow-hidden p-0 code-window">
      <div className="code-window__toolbar">
        <div className="code-window__lights" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="code-window__meta">
          {title && <span>{title}</span>}
          {language && <span className="code-window__lang">{language}</span>}
        </div>

        <button onClick={copyToClipboard} className="theme-icon-button" aria-label="Copy code">
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      <div className="code-window__body">
        <pre>
          <code>{code}</code>
        </pre>
      </div>
    </section>
  );
}
