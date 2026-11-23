import { BOOST_LIMIT, boostLength, validBoost } from '../../../lib/gesture-text';
import React, { useEffect, useRef, useState } from 'react';
import { Send, Zap } from 'lucide-react';
import type { GestureBoost } from '../../../lib/gesture-detail-client';

export function useHorizontalOverflowFade(ref: React.RefObject<HTMLDivElement | null>, depKey: unknown) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => {
      const canLeft = el.scrollLeft > 2;
      const canRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
      el.dataset.fadeLeft = canLeft ? 'true' : 'false';
      el.dataset.fadeRight = canRight ? 'true' : 'false';
    };
    sync();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null;
    ro?.observe(el);
    el.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    return () => {
      ro?.disconnect();
      el.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
    };
  }, [ref, depKey]);
}

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
      {boosts.length > 0 && <div className="gd-boost-op-pills" aria-label="Boost 短评">
        {boosts.map((b) => (
          <span key={b.id} className="gd-boost-op-pill" title={b.authorName}>
            <span className="gd-boost-op-pill-author">{b.authorName}</span>
            <span className="gd-boost-op-pill-sep">·</span>
            <span className="gd-boost-op-pill-content">{b.content}</span>
          </span>
        ))}
        <button type="button" className="gd-boost-add" onClick={() => onComposerOpenChange(!composerOpen)} aria-expanded={composerOpen}><Zap size={12} />+ Boost</button>
      </div>}

      {composerOpen && (
        <form className="gd-boost-inline-form is-slide-in" onSubmit={handleSubmit}>
          <Zap size={14} className="shrink-0" />
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
          <span className={`gd-boost-char-hint ${length > BOOST_LIMIT ? 'is-over-limit' : ''}`}>{length}/{BOOST_LIMIT}</span>
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
