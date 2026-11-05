import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { BUBBLE_SIZE, DOCK_SAFE_MARGIN, PLAYER_STORAGE_KEYS } from '../config';
import { clamp } from '../lib/audio';
import { readStoredJson, writeStoredJson } from '../lib/storage';

type Point = { x: number; y: number };

function isPoint(value: unknown): value is Point {
  if (!value || typeof value !== 'object') return false;
  const point = value as Partial<Point>;
  return typeof point.x === 'number' && typeof point.y === 'number';
}

function clampToViewport(point: Point): Point {
  if (typeof window === 'undefined') return point;
  const maxX = Math.max(12, window.innerWidth - BUBBLE_SIZE - 12);
  const maxY = Math.max(12, window.innerHeight - BUBBLE_SIZE - 12);
  return {
    x: clamp(point.x, 12, maxX),
    y: clamp(point.y, 12, maxY),
  };
}

function avoidDock(point: Point): Point {
  if (typeof window === 'undefined') return point;

  const next = clampToViewport(point);
  const dock = document.getElementById('rightside');
  if (!dock) return next;

  const rect = dock.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return next;

  const padding = DOCK_SAFE_MARGIN;
  const overlapsX = next.x + BUBBLE_SIZE > rect.left - padding && next.x < rect.right + padding;
  const overlapsY = next.y + BUBBLE_SIZE > rect.top - padding && next.y < rect.bottom + padding;

  if (overlapsX && overlapsY) {
    next.x = Math.max(12, rect.left - BUBBLE_SIZE - padding);
  }

  return next;
}

function readInitialPosition(): Point | null {
  const stored = readStoredJson<unknown>(PLAYER_STORAGE_KEYS.position, null);
  return isPoint(stored) ? clampToViewport(stored) : null;
}

export function useFloatingPosition() {
  const [position, setPosition] = useState<Point | null>(readInitialPosition);
  const [dragging, setDragging] = useState(false);
  const suppressClickRef = useRef(false);
  const releaseTimerRef = useRef<number | null>(null);
  const latestRef = useRef<Point | null>(null);
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => (current ? avoidDock(current) : current));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (releaseTimerRef.current !== null) {
        window.clearTimeout(releaseTimerRef.current);
      }
    };
  }, []);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;

    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      startY: event.clientY,
      originX: rect.left,
      originY: rect.top,
    };
    latestRef.current = { x: rect.left, y: rect.top };

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is a progressive enhancement.
    }
  }, []);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.active) return;

    const dx = event.clientX - dragRef.current.startX;
    const dy = event.clientY - dragRef.current.startY;
    if (!dragRef.current.moved && Math.hypot(dx, dy) <= 4) return;

    dragRef.current.moved = true;
    setDragging(true);

    const next = avoidDock({
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy,
    });
    latestRef.current = next;
    setPosition(next);
  }, []);

  const finishDrag = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current.active) return;

    if (dragRef.current.moved && latestRef.current) {
      writeStoredJson(PLAYER_STORAGE_KEYS.position, latestRef.current);
      suppressClickRef.current = true;
      if (releaseTimerRef.current !== null) window.clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 180);
    }

    dragRef.current.active = false;
    dragRef.current.moved = false;
    setDragging(false);

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already have been released by the browser.
    }
  }, []);

  return {
    position,
    dragging,
    suppressClickRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp: finishDrag,
    handlePointerCancel: finishDrag,
  };
}
