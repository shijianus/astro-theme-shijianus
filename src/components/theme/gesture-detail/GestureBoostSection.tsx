import React, { useEffect, useRef, useState } from 'react';
import { Send, Zap } from 'lucide-react';
import type { GestureBoost } from '../../../lib/gesture-client';

interface GestureBoostSectionProps {
  gestureId: string;
  isOp: boolean;
  boosts: GestureBoost[];
  composerOpen: boolean;
  onComposerOpenChange: (open: boolean) => void;
  onAddBoost: (gestureId: string, content: string) => Promise<boolean>;
}

export const MAX_BOOST_CHARS = 16;

/**
 * Scoped Boost Flow (rendered below ZONE 4 action bar, aligned on 56px content axis).
 * - Hard 16-char cap (`maxLength={16}`).
 * - Horizontal wrapping borderless micro-pills (`gap: 6px`).
 * - OP includes trailing `[⚡ + Boost]` trigger button; SubGesture has zero footprint when empty.
 */
export function GestureBoostSection({
  gestureId,
  isOp,
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed || trimmed.length > MAX_BOOST_CHARS || submitting) return;
    setSubmitting(true);
    const ok = await onAddBoost(gestureId, trimmed);
    setSubmitting(false);
    if (ok) {
      setDraft('');
      onComposerOpenChange(false);
    }
  };

  if (!isOp && boosts.length === 0 && !composerOpen) {
    return null;
  }

  return (
    <div className="gd-zone3-boost" aria-label="Boost 短评列表">
      <div className="gd-boost-op-pills">
        {boosts.map((b) => (
          <span key={b.id} className="gd-boost-op-pill">
            <span className="gd-boost-op-pill-author">{b.authorName}</span>
            <span className="gd-boost-op-pill-sep">·</span>
            <span className="gd-boost-op-pill-content">{b.content}</span>
          </span>
        ))}

        {isOp && !composerOpen && (
          <button
            type="button"
            className="gd-boost-add-trigger"
            onClick={() => onComposerOpenChange(true)}
            title="添加短评 Boost（16字以内）"
          >
            <Zap className="w-3 h-3" />
            <span>+ Boost</span>
          </button>
        )}
      </div>

      {composerOpen && (
        <form className="gd-boost-inline-form is-slide-in" onSubmit={handleSubmit}>
          <Zap className="w-3.5 h-3.5 text-amber-400/80 flex-shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            maxLength={MAX_BOOST_CHARS}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_BOOST_CHARS))}
            onBlur={() => {
              if (!draft.trim()) {
                onComposerOpenChange(false);
              }
            }}
            placeholder={`短评 Boost（${MAX_BOOST_CHARS}字以内）...`}
            className="gd-boost-inline-input"
          />
          <span className="gd-boost-char-hint">{draft.trim().length}/{MAX_BOOST_CHARS}</span>
          <button
            type="submit"
            disabled={!draft.trim() || submitting}
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
