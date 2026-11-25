import React, { useEffect, useRef, useState } from 'react';
import { Send, Zap } from 'lucide-react';
import {
  BOOST_LIMIT,
  boostLength,
  normalizeBoostDisplay,
  validBoost,
} from '../../../lib/gesture-text';
import type { GestureBoost } from '../../../lib/gesture-detail-client';
import { GestureAvatar } from './GestureAvatar';

interface GestureBoostSectionProps {
  gestureId: string;
  isOp: boolean;
  boosts: GestureBoost[];
  composerOpen: boolean;
  onComposerOpenChange: (open: boolean) => void;
  onAddBoost: (gestureId: string, content: string) => Promise<boolean>;
}

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

  // Zero footprint when there are no boosts and the inline composer is closed.
  if (boosts.length === 0 && !composerOpen) {
    return null;
  }

  return (
    <div className="gd-zone3-boost" aria-label="Boost 短评列表">
      {boosts.map((b) => {
        const displayText = normalizeBoostDisplay(b.content, b.id);
        return (
          <span key={b.id} className="gd-boost-pill" title={`${b.authorName}: ${displayText}`}>
            <GestureAvatar name={b.authorName} avatar={b.authorAvatar} size={20} />
            <span className="gd-boost-pill__content">{displayText}</span>
          </span>
        );
      })}

      {composerOpen && (
        <form className="gd-boost-inline-form is-slide-in" onSubmit={handleSubmit}>
          <Zap size={13} className="gd-boost-form-icon" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            maxLength={BOOST_LIMIT}
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
          <span className={`gd-boost-char-hint ${length > BOOST_LIMIT ? 'is-over-limit' : ''}`}>
            {length}/{BOOST_LIMIT}
          </span>
          <button
            type="submit"
            disabled={!validBoost(draft) || submitting}
            onMouseDown={(e) => e.preventDefault()}
            className="gd-boost-inline-submit"
            title="发送 Boost"
            aria-label="发送 Boost"
          >
            <Send size={13} />
          </button>
        </form>
      )}
    </div>
  );
}
