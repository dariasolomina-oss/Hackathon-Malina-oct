"use client";

import { useEffect, useRef } from "react";

type Spark = {
  x: number;
  y: number;
  size: number;
  life: number;
  age: number;
  driftX: number;
  driftY: number;
  color: string;
  turn: number;
};

export function MagicTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!canvas || !context || reducedMotion.matches || !finePointer.matches) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let lastSpawn = 0;
    let lastPoint: { x: number; y: number } | null = null;
    let cursor: { x: number; y: number } | null = null;
    const sparks: Spark[] = [];
    const colors = ["#F5F1EA", "#E0AE55", "#CF6A4E"];

    function resize() {
      const dpr = Math.min(1.25, Math.max(1, window.devicePixelRatio || 1));
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      context!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function paint(now: number) {
      context!.clearRect(0, 0, width, height);
      for (let index = sparks.length - 1; index >= 0; index -= 1) {
        const spark = sparks[index];
        const elapsed = Math.max(0, now - spark.age);
        const progress = elapsed / spark.life;
        if (progress >= 1) {
          sparks.splice(index, 1);
          continue;
        }
        const alpha = Math.sin(progress * Math.PI) * (1 - progress * 0.35);
        const size = spark.size * (0.65 + (1 - progress) * 0.35);
        const x = spark.x + spark.driftX * elapsed;
        const y = spark.y + spark.driftY * elapsed;
        context!.save();
        context!.translate(x, y);
        context!.rotate(spark.turn + progress * 0.25);
        context!.globalAlpha = alpha;
        context!.fillStyle = spark.color;
        context!.beginPath();
        context!.moveTo(0, -size);
        context!.lineTo(size * 0.34, -size * 0.34);
        context!.lineTo(size, 0);
        context!.lineTo(size * 0.34, size * 0.34);
        context!.lineTo(0, size);
        context!.lineTo(-size * 0.34, size * 0.34);
        context!.lineTo(-size, 0);
        context!.lineTo(-size * 0.34, -size * 0.34);
        context!.closePath();
        context!.fill();
        context!.restore();
      }

      if (cursor && !reducedMotion.matches) {
        const orbiters = [
          { radius: 17, speed: 0.00115, phase: 0.1, size: 1.5, squash: 0.72 },
          { radius: 25, speed: -0.00082, phase: 2.2, size: 1.15, squash: 0.8 },
          { radius: 33, speed: 0.00058, phase: 4.1, size: 1.3, squash: 0.66 },
          { radius: 22, speed: -0.00094, phase: 5.2, size: 0.9, squash: 0.92 },
        ];
        orbiters.forEach((orbiter) => {
          const angle = now * orbiter.speed + orbiter.phase;
          const x = cursor!.x + Math.cos(angle) * orbiter.radius;
          const y = cursor!.y + Math.sin(angle) * orbiter.radius * orbiter.squash;
          const shimmer = 0.58 + (Math.sin(angle * 1.7) + 1) * 0.18;
          context!.save();
          context!.translate(x, y);
          context!.rotate(angle * 0.35);
          context!.globalAlpha = shimmer;
          context!.fillStyle = orbiter.size > 1.2 ? "#F5F1EA" : "#E0AE55";
          context!.beginPath();
          context!.moveTo(0, -orbiter.size);
          context!.lineTo(orbiter.size * 0.32, 0);
          context!.lineTo(0, orbiter.size);
          context!.lineTo(-orbiter.size * 0.32, 0);
          context!.closePath();
          context!.fill();
          context!.restore();
        });
      }

      if (sparks.length || cursor) frame = window.requestAnimationFrame(paint);
      else frame = 0;
    }

    function onPointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse" || reducedMotion.matches) return;
      const now = performance.now();
      if (now - lastSpawn < 24) return;
      lastSpawn = now;
      const point = { x: event.clientX, y: event.clientY };
      cursor = point;
      const distance = lastPoint ? Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y) : 0;
      const count = Math.min(3, Math.max(1, Math.ceil(distance / 22)));
      for (let index = 0; index < count && sparks.length < 48; index += 1) {
        const ratio = (index + 1) / count;
        sparks.push({
          x: lastPoint ? lastPoint.x + (point.x - lastPoint.x) * ratio : point.x,
          y: lastPoint ? lastPoint.y + (point.y - lastPoint.y) * ratio : point.y,
          size: 0.9 + Math.random() * 1.25,
          life: 520 + Math.random() * 420,
          age: now,
          driftX: (Math.random() - 0.5) * 0.025,
          driftY: -0.015 - Math.random() * 0.025,
          color: colors[Math.floor(Math.random() * colors.length)],
          turn: Math.random() * Math.PI,
        });
      }
      lastPoint = point;
      if (!frame) frame = window.requestAnimationFrame(paint);
    }

    function onPointerLeave() {
      cursor = null;
      lastPoint = null;
      if (!sparks.length && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
        context!.clearRect(0, 0, width, height);
      }
    }

    function onMotionChange() {
      if (!reducedMotion.matches) return;
      cursor = null;
      sparks.length = 0;
      window.cancelAnimationFrame(frame);
      frame = 0;
      context!.clearRect(0, 0, width, height);
    }

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave);
    reducedMotion.addEventListener("change", onMotionChange);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, []);

  return <canvas className="magic-trail" ref={canvasRef} aria-hidden="true" />;
}
