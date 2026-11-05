import { useEffect, useRef, useState } from 'react';

type MarqueeProps = {
  text: string;
  className?: string;
  title?: string;
};

/**
 * Single-line marquee. The second copy is only rendered when the first copy
 * actually overflows, and is hidden from assistive technology.
 */
export function Marquee({ text, className = '', title }: MarqueeProps) {
  const containerRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useEffect(() => {
    const check = () => {
      const container = containerRef.current;
      const node = textRef.current;
      if (!container || !node) return;
      setOverflowing(node.scrollWidth > container.clientWidth + 1);
    };

    check();
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(check);
    if (containerRef.current) observer.observe(containerRef.current);
    if (textRef.current) observer.observe(textRef.current);
    return () => observer.disconnect();
  }, [text]);

  return (
    <span
      ref={containerRef}
      className={`mp-marquee ${overflowing ? 'is-overflowing' : ''} ${className}`.trim()}
      title={title ?? text}
      data-overflowing={overflowing ? 'true' : 'false'}
    >
      <span className="mp-marquee__track">
        <span ref={textRef} className="mp-marquee__text">
          {text}
        </span>
        {overflowing && (
          <span className="mp-marquee__text" aria-hidden="true">
            {text}
          </span>
        )}
      </span>
    </span>
  );
}
