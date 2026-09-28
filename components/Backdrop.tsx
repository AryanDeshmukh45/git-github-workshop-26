'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const ShapeWaves = dynamic(() => import('./ShapeWaves'), { ssr: false });
const Dither = dynamic(() => import('./Dither'), { ssr: false });

function HeroSuits() {
  return (
    <div className="hero-suits" aria-hidden="true"><span>♠</span><span>♣</span><span>♦</span><span>♥</span></div>
  );
}

// ShapeWaves needs WebGPU. Where that's missing (or fails), Dither (WebGL) is used instead.
export function HeroBackdrop({ text, fontFamily }: { text: string; fontFamily: string }) {
  const [webgpu, setWebgpu] = useState<boolean | null>(null);
  useEffect(() => setWebgpu('gpu' in navigator), []);
  if (webgpu === null) return null;
  if (!webgpu) {
    return (
      <>
        <Dither waveColor={[0.32, 0.32, 0.32]} colorNum={4} pixelSize={3} waveSpeed={0.03} mouseRadius={0.35} />
        <HeroSuits />
        <div className="hero-wordmark" aria-hidden="true">{text}</div>
      </>
    );
  }
  return (
    <>
      <ShapeWaves
        text={text}
        fontFamily={fontFamily}
        fontWeight={700}
        textSize={0.36}
        cellSize={7}
        dotSize={0.72}
        color="#ff7180"
        hoverColor="#73e8f2"
        glow={0.6}
        fade={0.04}
        interactive
        introDuration={1.8}
        onError={(error: Error) => {
          console.error('ShapeWaves failed, falling back to Dither:', error);
          setWebgpu(false);
        }}
      />
      <HeroSuits />
    </>
  );
}

// Only mounts Dither while it's on screen, so it isn't rendering frames nobody can see.
export function LazyDither(props: React.ComponentProps<typeof Dither>) {
  const ref = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { rootMargin: '200px' });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} style={{ position: 'absolute', inset: 0 }}>{onScreen && <Dither {...props} />}</div>;
}

// The contributor count drawn into the dot field. The intro replays every time it changes.
export function LiveCounter({ count, fontFamily }: { count: number; fontFamily: string }) {
  const [webgpu, setWebgpu] = useState<boolean | null>(null);
  useEffect(() => setWebgpu('gpu' in navigator), []);
  if (webgpu !== true) return <div className="live-counter-fallback">{count}</div>;
  return (
    <>
      <ShapeWaves
        text={String(count)}
        fontFamily={fontFamily}
        fontWeight={800}
        textSize={0.9}
        cellSize={7}
        dotSize={0.72}
        shapes="circles"
        color="#ff7180"
        hoverColor="#73e8f2"
        glow={0.5}
        fade={0.04}
        introKey={count}
        interactive
        onError={(error: Error) => {
          console.error('ShapeWaves failed, showing a plain counter:', error);
          setWebgpu(false);
        }}
      />
    </>
  );
}
