import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { gestureTimestamp } from '../../../lib/gesture-text';
import { formatMonthDay, type GestureNode } from '../../../lib/gesture-detail-client';

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
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const latestActivity = useMemo(() => [latest, ...floors.flatMap(floor => [floor.createdAt, floor.updatedAt || floor.createdAt])]
    .map(gestureTimestamp).filter(date => Number.isFinite(Date.parse(date)))
    .reduce((last, date) => !last || Date.parse(date) > Date.parse(last) ? date : last, ''), [latest, floors]);
  const elapsed = Math.max(0, now - Date.parse(latestActivity || new Date(now).toISOString()));
  const relative = elapsed < 60_000 ? '刚刚' : elapsed < 3_600_000 ? `${Math.floor(elapsed / 60_000)}分钟前`
    : elapsed < 86_400_000 ? `${Math.floor(elapsed / 3_600_000)}小时前` : `${Math.floor(elapsed / 86_400_000)}天前`;
  useLayoutEffect(() => {
    const main = content.current;
    if (!main) return;
    const elements = Array.from(main.querySelectorAll<HTMLElement>('[data-floor-index]'));
    let frame = 0;
    function update() {
      frame = 0;
      const isMobile = matchMedia('(max-width: 760px)').matches;
      const aside = rail.current?.closest<HTMLElement>('.gd-timeline-aside');
      if (aside) aside.dataset.stuck = String(isMobile && aside.getBoundingClientRect().top <= 60.5);
      const anchor = isMobile ? 150 : 140;
      const headerBottom = isMobile ? 105 : 72;
      let lo = 0, hi = elements.length;
      while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (elements[mid].getBoundingClientRect().top <= anchor) lo = mid + 1;
        else hi = mid;
      }
      let idx = Math.max(0, lo - 1);
      while (idx + 1 < elements.length) {
        const curRect = elements[idx].getBoundingClientRect();
        const nextRect = elements[idx + 1].getBoundingClientRect();
        if (curRect.bottom <= headerBottom && nextRect.top < window.innerHeight * 0.85) idx++;
        else break;
      }
      const atDocBottom = window.scrollY > 80 && window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8;
      if (atDocBottom && elements.length > 0) {
        const lastRect = elements[elements.length - 1].getBoundingClientRect();
        if (lastRect.bottom <= window.innerHeight + 8 && lastRect.top < window.innerHeight * 0.75) {
          idx = elements.length - 1;
        }
      }
      setCurrent(Number(elements[idx]?.dataset.floorIndex || 1));
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
  const originPercent = origin !== null && total > 1 ? 100 * (origin - 1) / (total - 1) : 0;
  function pointerFloor(e: React.PointerEvent) {
    const rect = rail.current!.getBoundingClientRect();
    const fraction = (e.clientY - rect.top) / rect.height;
    return Math.round(Math.max(0, Math.min(1, fraction)) * (total - 1)) + 1;
  }
  const formatFull = (iso?: string) => iso ? new Date(gestureTimestamp(iso)).toLocaleString('zh-CN') : '';
  return <aside className="gd-timeline-aside" aria-label="楼层时间轴">
    <time className="gd-tl-start" dateTime={floors[0]?.createdAt} title={`话题开始 · ${formatFull(floors[0]?.createdAt)}`}>{formatMonthDay(floors[0]?.createdAt)}</time>
    <div className="gd-tl-track-wrap" data-return-near={origin !== null && Math.abs(originPercent - percent) < 16}
      style={{ '--progress': percent + '%', '--origin-progress': originPercent + '%', '--readout-shift': percent < 50 ? '28px' : '-28px' } as React.CSSProperties}>
      <div className="gd-tl-rail" ref={rail} tabIndex={0} role="slider" aria-label="跳转楼层" aria-valuemin={1} aria-valuemax={total} aria-valuenow={active}
        onPointerDown={e => { if (e.button === 0) { e.currentTarget.setPointerCapture(e.pointerId); setPreview(pointerFloor(e)); } }}
        onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) setPreview(pointerFloor(e)); }}
        onPointerUp={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) { e.currentTarget.releasePointerCapture(e.pointerId); onJump(pointerFloor(e)); } setPreview(null); }}
        onPointerCancel={() => setPreview(null)}
        onKeyDown={e => {
          const targets: Record<string,number> = { Home: 1, End: total, ArrowDown: active+1, ArrowRight: active+1, ArrowUp: active-1, ArrowLeft: active-1, PageDown: active+40, PageUp: active-40 };
          if (e.key in targets) { e.preventDefault(); onJump(Math.min(total, Math.max(1, targets[e.key]))); }
        }}>
        <span className="gd-tl-thumb" />
      </div>
      {origin !== null && <button type="button" className={'gd-return' + (fading ? ' is-fading' : '')} onClick={onReturn} title={`返回第 ${origin} 楼原阅读位置`} aria-label={`返回第 ${origin} 楼原阅读位置`}>返回</button>}
      <div className="gd-tl-readout"><details><summary aria-label="输入楼层跳转">{active} / {total}</summary>
        <form onSubmit={e => { e.preventDefault(); const n = Number(input); if (n >= 1 && n <= total) { e.currentTarget.closest('details')!.open = false; setInput(''); onJump(n); } }}>
          <input type="number" aria-label="目标楼层" min={1} max={total} required value={input} onChange={e => setInput(e.target.value)} /><button>跳转</button>
        </form></details><time dateTime={date}>{formatMonthDay(date)}</time></div>
    </div>
    <time className="gd-tl-latest" dateTime={latestActivity} title={`最后活动时间 · ${formatFull(latestActivity)}`}>{relative}</time>
    <div className="gd-tl-actions">
      <button type="button" aria-label="跳至主贴" title="跳至主贴" onClick={() => onJump(1)}><ArrowUp size={14} /></button>
      <button type="button" aria-label="跳至最新回复" title="跳至最新回复" onClick={() => onJump(total)}><ArrowDown size={14} /></button>
    </div>
  </aside>;
}
