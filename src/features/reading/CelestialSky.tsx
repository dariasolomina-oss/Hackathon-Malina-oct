"use client";

import { useEffect, useRef, useState } from "react";

type Star = { x: number; y: number; radius: number; alpha: number; phase: number; speed: number; milkyWay?: boolean };

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function CelestialSky() {
  const skyRef = useRef<HTMLCanvasElement>(null);
  const [grain, setGrain] = useState("");
  const [time, setTime] = useState("--:--");

  useEffect(() => {
    const grainCanvas = document.createElement("canvas");
    grainCanvas.width = 160;
    grainCanvas.height = 160;
    const grainContext = grainCanvas.getContext("2d");
    if (grainContext) {
      const image = grainContext.createImageData(160, 160);
      for (let index = 0; index < image.data.length; index += 4) {
        const value = Math.random() > 0.5 ? 255 : 0;
        image.data[index] = value;
        image.data[index + 1] = value;
        image.data[index + 2] = value;
        image.data[index + 3] = Math.round(randomBetween(18, 62));
      }
      grainContext.putImageData(image, 0, 0);
      setGrain(`url(${grainCanvas.toDataURL("image/png")})`);
    }

    const updateTime = () => setTime(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()));
    updateTime();
    const minuteTimer = window.setInterval(updateTime, 60_000);

    const canvas = skyRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return () => window.clearInterval(minuteTimer);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animationFrame = 0;
    let width = 0;
    let height = 0;
    let stars: Star[] = [];

    const draw = (timestamp = 0) => {
      if (!canvas || !context) return;
      const dpr = Math.min(1.25, Math.max(1, window.devicePixelRatio || 1));
      const nextWidth = Math.max(1, window.innerWidth);
      const nextHeight = Math.max(1, window.innerHeight);
      if (nextWidth !== width || nextHeight !== height) {
        width = nextWidth;
        height = nextHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        stars = Array.from({ length: 1600 }, () => ({
          x: Math.random(),
          y: Math.random() ** 1.5 * 0.72,
          radius: Math.random() < 0.94 ? randomBetween(0.2, 0.75) : randomBetween(0.8, 1.4),
          alpha: randomBetween(0.25, 0.95),
          phase: randomBetween(0, Math.PI * 2),
          speed: randomBetween(0.00015, 0.00045),
        }));
        for (let index = 0; index < 800; index += 1) {
          const along = Math.random();
          const spread = (Math.random() + Math.random() + Math.random() - 1.5) * 0.09;
          stars.push({
            x: 0.08 + along * 0.68,
            y: 0.08 + along * 0.39 + spread,
            radius: randomBetween(0.15, 0.45),
            alpha: randomBetween(0.1, 0.35),
            phase: randomBetween(0, Math.PI * 2),
            speed: randomBetween(0.0001, 0.0003),
            milkyWay: true,
          });
        }
      }

      context.clearRect(0, 0, width, height);
      stars.forEach((star, index) => {
        const verticalFade = Math.max(0, Math.min(1, (0.6 - star.y) / 0.35));
        const twinkle = index % 5 === 0 && !reducedMotion.matches
          ? 0.65 + 0.35 * ((Math.sin(timestamp * star.speed + star.phase) + 1) / 2)
          : 1;
        context.beginPath();
        context.fillStyle = `rgba(245,241,234,${star.alpha * verticalFade * twinkle})`;
        context.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
        context.fill();
      });

      // Orion's four corner stars and three-star belt, connected like a quiet atlas mark.
      const orion = [
        [0.42, 0.19], // Betelgeuse
        [0.25, 0.21], // Bellatrix
        [0.29, 0.31], // Mintaka
        [0.32, 0.32], // Alnilam
        [0.34, 0.33], // Alnitak
        [0.38, 0.45], // Saiph
        [0.19, 0.43], // Rigel
      ] as const;
      const links = [[0, 4], [1, 2], [2, 3], [3, 4], [4, 5], [2, 6]];
      context.save();
      context.strokeStyle = "rgba(245,241,234,.14)";
      context.lineWidth = 0.65;
      links.forEach(([from, to]) => {
        context.beginPath();
        context.moveTo(orion[from][0] * width, orion[from][1] * height);
        context.lineTo(orion[to][0] * width, orion[to][1] * height);
        context.stroke();
      });
      orion.forEach(([x, y], index) => {
        context.beginPath();
        context.fillStyle = index === 0 ? "rgba(224,174,85,.9)" : index === 6 ? "rgba(220,232,245,.95)" : "rgba(245,241,234,.86)";
        context.arc(x * width, y * height, index === 0 || index === 6 ? 1.5 : 1, 0, Math.PI * 2);
        context.fill();
      });
      context.restore();

      const venusX = width * 0.72;
      const venusY = height * 0.6;
      const pulse = reducedMotion.matches ? 1 : 0.94 + 0.06 * Math.sin(timestamp * 0.0007);
      const halo = context.createRadialGradient(venusX, venusY, 0, venusX, venusY, 18 * pulse);
      halo.addColorStop(0, "rgba(255,246,236,.32)");
      halo.addColorStop(1, "rgba(255,246,236,0)");
      context.fillStyle = halo;
      context.beginPath();
      context.arc(venusX, venusY, 18 * pulse, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#FFF6EC";
      context.beginPath();
      context.arc(venusX, venusY, 2.6, 0, Math.PI * 2);
      context.fill();

      if (!reducedMotion.matches) animationFrame = window.requestAnimationFrame(draw);
    };

    const render = () => {
      window.cancelAnimationFrame(animationFrame);
      draw();
    };
    const onMotionChange = () => render();
    const onResize = () => render();
    reducedMotion.addEventListener("change", onMotionChange);
    window.addEventListener("resize", onResize);
    draw();

    return () => {
      window.clearInterval(minuteTimer);
      window.cancelAnimationFrame(animationFrame);
      reducedMotion.removeEventListener("change", onMotionChange);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <div className="celestial-sky">
    <canvas className="star-canvas" ref={skyRef} aria-hidden="true" />
    <div className="film-grain" style={{ backgroundImage: grain }} aria-hidden="true" />
    <time className="sky-time" aria-label="Local time">{time}</time>
  </div>;
}
