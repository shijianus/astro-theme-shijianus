import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface MacCodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export const MacCodeBlock: React.FC<MacCodeBlockProps> = ({ code, language, title }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed', error);
    }
  };

  return (
    <section className="surface-panel overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface-muted)] px-4 py-3">
        <div className="flex gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--signal)]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--lime)]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--teal)]" />
        </div>
        <div className="flex items-center gap-4">
          {title && <span className="text-xs text-[var(--text-muted)]">{title}</span>}
          {language && (
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-muted)]">
              {language}
            </span>
          )}
          <button
            onClick={copyToClipboard}
            className="group inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs text-[var(--text-soft)] transition-colors hover:border-[var(--signal)] hover:text-[var(--text-strong)]"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-[var(--teal)]" />
            ) : (
              <Copy className="h-3.5 w-3.5 transition-transform group-active:scale-90" />
            )}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto p-4">
        <pre className="text-sm leading-6 text-[var(--text-soft)]">
          <code>{code}</code>
        </pre>
      </div>
    </section>
  );
};
