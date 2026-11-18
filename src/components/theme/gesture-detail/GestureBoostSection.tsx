import React, { useEffect, useRef, useState } from 'react';
import { Plus, Send, Zap, ChevronDown, ChevronUp } from 'lucide-react';
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
 * ZONE 3: Scoped Boost Zone (naturally terminates the sticky avatar track above it).
 * - OP Gesture: Always expanded compact card with ⚡ Boost (N) + pill stream + [+ 发送一条 Boost...]
 * - SubGesture: Progressive disclosure:
 *     - When boosts.length === 0 and !composerOpen: ZERO footprint (renders null).
 *     - Triggered via [⚡] icon in ZONE 4 -> slides open inline input (auto-collapses on blur if empty).
 *     - When boosts.length > 0: renders ~32px compact strip expandable to view/add all.
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
  const [expandedAll, setExpandedAll] = useState(false);
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
      if (!isOp) {
        onComposerOpenChange(false);
      } else {
        onComposerOpenChange(false);
      }
    }
  };

  // SubGesture with 0 boosts & closed composer -> strict zero footprint
  if (!isOp && boosts.length === 0 && !composerOpen) {
    return null;
  }

  // SubGesture compact strip mode (~32px) when boosts > 0
  if (!isOp) {
    const visibleBoosts = expandedAll ? boosts : boosts.slice(0, 2);

    return (
      <div className="gd-zone3-boost is-subgesture">
        {boosts.length > 0 && (
          <div className="gd-boost-compact-strip">
            <span className="gd-boost-compact-badge">
              <Zap className="w-3 h-3" />
              <span>{boosts.length}</span>
            </span>
            <span className="gd-boost-compact-sep" aria-hidden="true">│</span>
            <div className="gd-boost-compact-pills">
              {visibleBoosts.map((b) => (
                <span key={b.id} className="gd-boost-mini-pill">
                  <GestureAvatar name={b.authorName} avatar={b.authorAvatar} size={18} />
                  <span className="gd-boost-mini-text">{b.content}</span>
                </span>
              ))}
            </div>
            <div className="gd-boost-compact-actions">
              {boosts.length > 2 && (
                <button
                  type="button"
                  className="gd-boost-tiny-btn"
                  onClick={() => setExpandedAll((prev) => !prev)}
                  title={expandedAll ? '收起 Boost' : `查看全部 ${boosts.length} 条 Boost`}
                >
                  {expandedAll ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
              <button
                type="button"
                className="gd-boost-tiny-btn"
                onClick={() => onComposerOpenChange(!composerOpen)}
                title="追加一条 Boost"
                aria-label="追加一条 Boost"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
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

  // OP Gesture: Always-expanded compact micro-card
  return (
    <section className="gd-zone3-boost is-op" aria-label="主贴文 Boost 短评区">
      <div className="gd-boost-op-head">
        <div className="gd-boost-op-title">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Boost ({boosts.length})</span>
        </div>

        {!composerOpen && (
          <button
            type="button"
            className="gd-boost-trigger-chip"
            onClick={() => onComposerOpenChange(true)}
          >
            <Plus className="w-3 h-3" />
            <span>发送一条 Boost...</span>
          </button>
        )}
      </div>

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
            type="text"
            maxLength={MAX_BOOST_CHARS}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (!draft.trim()) {
                onComposerOpenChange(false);
              }
            }}
            placeholder="写下针对主贴文的即时观点短评（60字以内）..."
            className="gd-boost-inline-input"
          />
          <span className="gd-boost-char-hint">{draft.trim().length}/{MAX_BOOST_CHARS}</span>
          <button
            type="submit"
            disabled={!draft.trim() || submitting}
            className="gd-boost-inline-submit"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      )}
    </section>
  );
}
