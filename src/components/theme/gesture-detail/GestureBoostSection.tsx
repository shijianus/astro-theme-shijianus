import React, { useEffect, useRef, useState } from 'react';
import { Send, Zap } from 'lucide-react';
import type { GestureBoost } from '../../../lib/gesture-client';
import { GestureAvatar } from './GestureAvatar';

interface GestureBoostSectionProps {
  gestureId: string;
  isOp: boolean;
  boosts: GestureBoost[];
  composerOpen: boolean;
  onComposerOpenChange: (open: boolean) => void;
  onAddBoost: (gestureId: string, content: string) => Promise<boolean>;
}

const MAX_BOOST_CHARS = 60;

/**
 * Scoped Boost List (rendered below ZONE 4 action bar).
 * - No redundant outer border/wrapper or "Boost (N)" explanation header.
 * - Each Boost renders as an individual .gd-boost-op-pill stacked in its own vertical column.
 * - Triggered via [⚡] icon in the action bar; inline input auto-collapses on blur when empty.
 */
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

  if (boosts.length === 0 && !composerOpen) {
    return null;
  }

  return (
    <div className="gd-zone3-boost" aria-label="Boost 短评列表">
      {boosts.length > 0 && (
        <div className="gd-boost-op-pills">
          {boosts.map((b) => (
            <div key={b.id} className="gd-boost-op-pill">
              <GestureAvatar name={b.authorName} avatar={b.authorAvatar} size={20} />
              <span className="gd-boost-op-pill-author">{b.authorName}:</span>
              <span className="gd-boost-op-pill-content">{b.content}</span>
            </div>
          ))}
        </div>
      )}

      {composerOpen && (
        <form className="gd-boost-inline-form is-slide-in" onSubmit={handleSubmit}>
          <Zap className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            maxLength={MAX_BOOST_CHARS}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (!draft.trim()) {
                onComposerOpenChange(false);
              }
            }}
            placeholder="发送一条短评 Boost（60字以内）..."
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
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}
