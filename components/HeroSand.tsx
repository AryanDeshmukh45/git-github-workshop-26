'use client';

import { useEffect, useRef } from 'react';

type Grain = { x: number; y: number; originX: number; originY: number; vx: number; vy: number; life: number };

export default function HeroSand() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const area = canvas?.parentElement;
    if (!canvas || !ctx || !area) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const grains: Grain[] = [];
    let width = 0;
    let height = 0;
    let visible = false;
    let frame = 0;

    const resize = () => {
      const rect = area.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      frame = 0;
      ctx.clearRect(0, 0, width, height);
      for (let i = grains.length - 1; i >= 0; i--) {
        const grain = grains[i];
        grain.vy += 0.14;
        grain.x += grain.vx;
        grain.y += grain.vy;
        if (grain.y >= height - 3) {
          grain.y = height - 3;
          grain.vx *= 0.9;
          grain.vy = 0;
          grain.life -= 0.012;
        }
        ctx.globalAlpha = grain.life * 0.75;
        ctx.fillStyle = '#030405';
        ctx.beginPath();
        ctx.arc(grain.originX, grain.originY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = grain.life;
        ctx.fillStyle = '#d9b98a';
        ctx.fillRect(grain.x, grain.y, 2, 2);
        if (grain.life <= 0) grains.splice(i, 1);
      }
      ctx.globalAlpha = 1;
      if (grains.length && visible && !reduceMotion.matches) frame = requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!visible || reduceMotion.matches || event.pointerType === 'touch') return;
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
      for (let i = 0; i < 4; i++) {
        const grainX = x + (Math.random() - 0.5) * 16;
        grains.push({ x: grainX, y, originX: grainX, originY: y, vx: (Math.random() - 0.5) * 1.2, vy: Math.random() * 1.5, life: 1 });
      }
      if (grains.length > 600) grains.splice(0, grains.length - 600);
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const onMotionChange = () => {
      if (reduceMotion.matches) {
        grains.length = 0;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        ctx.clearRect(0, 0, width, height);
      }
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        grains.length = 0;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        ctx.clearRect(0, 0, width, height);
      }
    });
    const resizeObserver = new ResizeObserver(resize);
    observer.observe(area);
    resizeObserver.observe(area);
    area.addEventListener('pointermove', onPointerMove, { passive: true });
    reduceMotion.addEventListener('change', onMotionChange);
    resize();

    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
      area.removeEventListener('pointermove', onPointerMove);
      reduceMotion.removeEventListener('change', onMotionChange);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 1, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}
