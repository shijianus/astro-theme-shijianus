import { BOOST_LIMIT, boostLength, validBoost } from '../../../lib/gesture-text';
import React, { useEffect, useRef, useState } from 'react';
import { Send, Zap } from 'lucide-react';
import type { GestureBoost } from '../../../lib/gesture-client';

interface GestureBoostSectionProps {
  gestureId: string;
  boosts: GestureBoost[];
  composerOpen: boolean;
  onComposerOpenChange: (open: boolean) => void;
  onAddBoost: (gestureId: string, content: string) => Promise<boolean>;
}

export function GestureBoostSection({
  gestureId,
  boosts,
  composerOpen,
  onComposerOpenChange,
  onAddBoost,
}: GestureBoostSectionProps) {
  const [draft, setDraft] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (composerOpen) {
      inputRef.current?.focus();
    }
  }, [composerOpen]);

  const length = boostLength(draft);
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = draft.trim();
    if (!validBoost(draft) || submitting) return;
    setSubmitting(true);
    const ok = await onAddBoost(gestureId, trimmed);
    setSubmitting(false);
    if (ok) {
      setDraft('');
      onComposerOpenChange(false);
    }
  };

  if (boosts.length === 0 && !composerOpen) {
    return null;
  }

  return (
    <div className="gd-zone3-boost" aria-label="Boost 短评列表">
      {boosts.length > 0 && <div className="gd-boost-op-pills" tabIndex={0} aria-label="横向浏览 Boost">
        {boosts.map((b) => (
          <span key={b.id} className="gd-boost-op-pill">
            <span className="gd-boost-op-pill-author">{b.authorName}</span>
            <span className="gd-boost-op-pill-sep">·</span>
            <span className="gd-boost-op-pill-content">{b.content}</span>
          </span>
        ))}

      </div>}

      {composerOpen && (
        <form className="gd-boost-inline-form is-slide-in" onSubmit={handleSubmit}>
          <Zap className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (!draft.trim()) {
                onComposerOpenChange(false);
              }
            }}
            aria-label="Boost 短评"
            aria-invalid={length > BOOST_LIMIT}
            placeholder={`短评 Boost（${BOOST_LIMIT}字以内）...`}
            className="gd-boost-inline-input"
          />
          <span className="gd-boost-char-hint">{length}/{BOOST_LIMIT} · {length > BOOST_LIMIT ? '超出' : '余'} {Math.abs(BOOST_LIMIT - length)}</span>
          <button
            type="submit"
            disabled={!validBoost(draft) || submitting}
            onMouseDown={(e) => e.preventDefault()}
            className="gd-boost-inline-submit"
            title="发送 Boost"
          >
            <Send className="w-3 h-3" />
          </button>
        </form>
      )}
    </div>
  );
}
