import { GesturePopover } from './GesturePopover';
import React, { useRef, useState } from 'react';
import {
  Bold,
  Code,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  MessageSquare,
  Quote,
  Send,
  Smile,
  X,
} from 'lucide-react';
import { uploadCommentImage } from '../../../lib/comment-client';
import { renderGestureMarkdown } from '../../../lib/gesture-markdown';
import type { GestureNode, GestureQuote } from '../../../lib/gesture-client';

const COMPACT_EMOJI_LIST = [
  '😀', '😄', '😅', '😊', '🤔', '🥳', '😎', '👍', '❤️',
  '🚀', '💡', '🔥', '✨', '🎉', '👏', '☕', '💻', '🌟',
];

interface GestureInlineReplyComposerProps {
  replyTarget: GestureNode | null;
  quoteTarget: GestureQuote | null;
  onClearReplyTarget: () => void;
  onClearQuoteTarget: () => void;
  onSubmit: (payload: {
    message: string;
    replyToId: string | null;
    quoteId: string | null;
    quote: GestureQuote | null;
  }) => Promise<boolean>;
  onToast: (msg: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function GestureInlineReplyComposer({
  replyTarget,
  quoteTarget,
  onClearReplyTarget,
  onClearQuoteTarget,
  onSubmit,
  onToast,
  textareaRef,
}: GestureInlineReplyComposerProps) {
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [previewTab, setPreviewTab] = useState<'write' | 'preview'>('write');
  const [showEmoji, setShowEmoji] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const emojiButton = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertMarkdown = (prefix: string, suffix = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const val = el.value;
    const selected = val.substring(start, end);
    const next = val.substring(0, start) + prefix + selected + suffix + val.substring(end);
    setMessage(next);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 30);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await uploadCommentImage(file);
      if (res.ok && res.url) {
        setImages((prev) => [...prev, res.url!]);
        onToast('🖼️ 图片上传成功');
      } else {
        onToast(res.error || '图片上传失败');
      }
    } catch (err: any) {
      onToast(err?.message || '上传失败');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let body = message.trim();
    if (!body) {
      onToast('⚠️ 请输入回复内容');
      return;
    }
    if (images.length > 0) {
      body += images.map((src) => `\n![image](${src})`).join('');
    }
    setSubmitting(true);
    const ok = await onSubmit({
      message: body,
      replyToId: replyTarget?.id || null,
      quoteId: quoteTarget?.id || null,
      quote: quoteTarget || null,
    });
    setSubmitting(false);
    if (ok) {
      setMessage('');
      setImages([]);
      setPreviewTab('write');
    }
  };

  return (
    <section id="detail-reply-composer" className="gd-reply-composer">
      <div className="gd-reply-composer__head">
        <span className="gd-reply-composer__title">
          <MessageSquare className="w-4 h-4 text-sky-400" />
          <span>参与讨论回复</span>
        </span>

        <div className="gd-reply-composer__targets">
          {replyTarget && (
            <span className="gd-composer-chip">
              <span>回复 @{replyTarget.authorName}</span>
              <button type="button" onClick={onClearReplyTarget} aria-label="取消回复对象">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {quoteTarget && (
            <span className="gd-composer-chip is-quote">
              <span>引用 @{quoteTarget.authorName}</span>
              <button type="button" onClick={onClearQuoteTarget} aria-label="取消引用">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleFormSubmit}>
        <div className="gd-md-toolbar">
          <button type="button" title="粗体" onClick={() => insertMarkdown('**', '**')}>
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button type="button" title="斜体" onClick={() => insertMarkdown('*', '*')}>
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button type="button" title="代码块" onClick={() => insertMarkdown('\n```\n', '\n```\n')}>
            <Code className="w-3.5 h-3.5" />
          </button>
          <button type="button" title="引用" onClick={() => insertMarkdown('\n> ', '\n')}>
            <Quote className="w-3.5 h-3.5" />
          </button>
          <button type="button" title="列表" onClick={() => insertMarkdown('\n- ', '\n')}>
            <List className="w-3.5 h-3.5" />
          </button>
          <button type="button" title="超链接" onClick={() => insertMarkdown('[说明](', ')')}>
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          <span className="gd-toolbar-sep" />

          <button ref={emojiButton} aria-expanded={showEmoji} type="button" title="表情" onClick={() => setShowEmoji((p) => !p)}>
            <Smile className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title={uploading ? '上传中...' : '上传图片'}
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleImageUpload}
          />

          <div className="gd-composer-tabs">
            <button
              type="button"
              className={previewTab === 'write' ? 'is-active' : ''}
              onClick={() => setPreviewTab('write')}
            >
              编辑
            </button>
            <button
              type="button"
              className={previewTab === 'preview' ? 'is-active' : ''}
              onClick={() => setPreviewTab('preview')}
            >
              预览
            </button>
          </div>
        </div>

        {showEmoji && (
          <GesturePopover anchor={emojiButton} label="回复表情" onClose={() => setShowEmoji(false)}><div className="gd-emoji-grid">
            {COMPACT_EMOJI_LIST.map((em) => (
              <button
                key={em}
                type="button"
                className="gd-emoji-item"
                onClick={() => {
                  insertMarkdown(em);
                  setShowEmoji(false);
                }}
              >
                {em}
              </button>
            ))}
          </div></GesturePopover>
        )}

        {previewTab === 'write' ? (
          <textarea
            ref={textareaRef}
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              replyTarget
                ? `回复 @${replyTarget.authorName}...（支持 Markdown，可用 # / ## 排版）`
                : '写下你的回复...（支持 Markdown，可用 # / ## 排版）'
            }
            className="gd-reply-textarea"
          />
        ) : (
          <div className="gd-reply-preview">
            {message.trim() ? (
              <div
                className="gd-markdown-body"
                dangerouslySetInnerHTML={{ __html: renderGestureMarkdown(message) }}
              />
            ) : (
              <span className="gd-preview-empty">暂无预览内容</span>
            )}
          </div>
        )}

        {images.length > 0 && (
          <div className="gd-attached-thumbs">
            {images.map((src, i) => (
              <div key={i} className="gd-thumb-item">
                <img src={src} alt="附件" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="gd-reply-composer__foot">
          <span className="gd-char-count">字数: {message.length}</span>
          <button
            type="submit"
            disabled={submitting || !message.trim()}
            className="gd-submit-reply-btn"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? '发表中...' : '发表回复'}</span>
          </button>
        </div>
      </form>
    </section>
  );
}
