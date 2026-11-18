import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Undo2 } from 'lucide-react';
import { formatMonthDay, type GestureNode } from '../../../lib/gesture-client';

interface Props {
  content: RefObject<HTMLElement | null>;
  floors: GestureNode[];
  page: number;
  latest: string;
  origin: number | null;
  fading: boolean;
  onJump: (floor: number) => void;
  onReturn: () => void;
}

export function GestureTimelineScroller({ content, floors, page, latest, origin, fading, onJump, onReturn }: Props) {
  const [current, setCurrent] = useState(1);
  const [preview, setPreview] = useState<number | null>(null);
  const [input, setInput] = useState('');
  const rail = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const main = content.current;
    if (!main) return;
    const elements = Array.from(main.querySelectorAll<HTMLElement>('[data-floor-index]'));
    let frame = 0;
    function update() {
      frame = 0;
      const anchor = matchMedia('(max-width: 760px)').matches ? 150 : 112;
      let lo = 0, hi = elements.length;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (elements[mid].getBoundingClientRect().top <= anchor) lo = mid + 1;
        else hi = mid;
      }
      setCurrent(Number(elements[Math.max(0, lo - 1)]?.dataset.floorIndex || 1));
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const resize = new ResizeObserver(schedule);
    resize.observe(main);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    update();
    return () => { resize.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [page, floors, content]);
  const total = floors.length;
  const active = Math.min(preview ?? current, total);
  const date = floors[active - 1]?.createdAt;
  const percent = total > 1 ? 100 * (active - 1) / (total - 1) : 0;
  function pointerFloor(e: React.PointerEvent) {
    const rect = rail.current!.getBoundingClientRect();
    const fraction = rect.width > rect.height ? (e.clientX - rect.left) / rect.width : (e.clientY - rect.top) / rect.height;
    return Math.round(Math.max(0, Math.min(1, fraction)) * (total - 1)) + 1;
  }
  return <aside className="gd-timeline-aside" aria-label="楼层时间轴">
    <time className="gd-tl-start" dateTime={floors[0]?.createdAt} title="话题开始">{formatMonthDay(floors[0]?.createdAt)}</time>
    <div className="gd-tl-rail" ref={rail} tabIndex={0} role="slider" aria-label="跳转楼层" aria-valuemin={1} aria-valuemax={total} aria-valuenow={active}
      onPointerDown={e => { if (e.button === 0) { e.currentTarget.setPointerCapture(e.pointerId); setPreview(pointerFloor(e)); } }}
      onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) setPreview(pointerFloor(e)); }}
      onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) { e.currentTarget.releasePointerCapture(e.pointerId); onJump(pointerFloor(e)); } setPreview(null); }}
      onPointerCancel={() => setPreview(null)}
      onKeyDown={e => {
        const targets: Record<string,number> = { Home: 1, End: total, ArrowDown: active+1, ArrowRight: active+1, ArrowUp: active-1, ArrowLeft: active-1, PageDown: active+40, PageUp: active-40 };
        if (e.key in targets) { e.preventDefault(); onJump(Math.min(total, Math.max(1, targets[e.key]))); }
      }} style={{ '--progress': percent + '%' } as React.CSSProperties}>
      <span className="gd-tl-thumb" />
    </div>
    <div className="gd-tl-readout"><details><summary aria-label="输入楼层跳转">{active} / {total}</summary>
      <form onSubmit={e => { e.preventDefault(); const n = Number(input); if (n >= 1 && n <= total) { e.currentTarget.closest('details')!.open = false; setInput(''); onJump(n); } }}>
        <input type="number" aria-label="目标楼层" min={1} max={total} required value={input} onChange={e => setInput(e.target.value)} /><button>跳转</button>
      </form></details><time dateTime={date}>{formatMonthDay(date)}</time></div>
    <time className="gd-tl-latest" dateTime={latest} title="最后活动时间">最近活动<br />{formatMonthDay(latest)}</time>
    {origin !== null && <button className={'gd-return' + (fading ? ' is-fading' : '')} onClick={onReturn}><Undo2 size={13} />返回 {origin} 楼</button>}
  </aside>;
}
