import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  anchor: RefObject<HTMLElement | null>;
  label: string;
  onClose: () => void;
  onEnter?: () => void;
  onLeave?: () => void;
  children: ReactNode;
}

export function GesturePopover({ anchor, label, onClose, onEnter, onLeave, children }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useLayoutEffect(() => {
    const trigger = anchor.current;
    const el = host.current;
    if (!trigger || !el) return;
    const panel = el.firstElementChild as HTMLElement;
    if (trigger.getBoundingClientRect().top < 190) trigger.scrollIntoView({ block: 'center', behavior: 'instant' });
    const position = () => {
      const rect = trigger.getBoundingClientRect();
      const maxWidth = Math.min(324, document.documentElement.clientWidth - 24);
      panel.style.maxWidth = maxWidth + 'px';
      panel.style.width = 'max-content';
      const measured = Math.ceil(panel.getBoundingClientRect().width) || 240;
      const width = Math.min(maxWidth, Math.max(216, measured));
      panel.style.width = '';
      el.style.width = width + 'px';
      el.style.left = Math.max(12, Math.min(rect.left, document.documentElement.clientWidth - width - 12)) + 'px';
      el.style.top = rect.top + 'px';
      panel.style.maxHeight = Math.max(48, rect.top - 70) + 'px';
    };
    const outside = (event: PointerEvent) => {
      if (!el.contains(event.target as Node) && !trigger.contains(event.target as Node)) close.current();
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { close.current(); trigger.focus({ preventScroll: true }); }
      if (event.key === 'Tab' && panel.contains(document.activeElement)) {
        const buttons = panel.querySelectorAll<HTMLElement>('button:not(:disabled)');
        if ((event.shiftKey && document.activeElement === buttons[0]) || (!event.shiftKey && document.activeElement === buttons[buttons.length - 1])) {
          close.current(); trigger.focus({ preventScroll: true });
        }
      }
    };
    position();
    if (trigger.matches(':focus-visible')) panel.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
    const observer = new ResizeObserver(position);
    observer.observe(trigger);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', key);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', key);
    };
  }, [anchor]);
  return createPortal(<div className="gb-popover-anchor" ref={host} onPointerEnter={onEnter} onPointerLeave={onLeave}>
    <div className="gb-popover-panel" role="dialog" aria-label={label}>{children}</div>
  </div>, document.body);
}
