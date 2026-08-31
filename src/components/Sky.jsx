import { useEffect, useRef } from "react";

export default function Sky() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const mouse = { x: 0.5, y: 0.5 };
    const stars = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random() * 3 + 0.25,
      r: Math.random() * 1.3 + 0.2,
      tw: Math.random() * Math.PI * 2,
    }));

    let raf = 0;
    let running = true;

    function size() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    }

    function draw(ts) {
      if (!running) return;
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      const ox = (mouse.x - 0.5) * 40;
      const oy = (mouse.y - 0.5) * 24;
      for (const star of stars) {
        const twinkle = 0.45 + Math.sin(ts / 900 + star.tw) * 0.25;
        ctx.globalAlpha = twinkle * (0.35 + star.z * 0.18);
        ctx.fillStyle = "#f3ead8";
        ctx.beginPath();
        ctx.arc(
          star.x * w + ox * star.z,
          star.y * h + oy * star.z,
          star.r * (window.devicePixelRatio || 1),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    function onMove(event) {
      mouse.x = event.clientX / window.innerWidth;
      mouse.y = event.clientY / window.innerHeight;
    }

    size();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", size);
    window.addEventListener("pointermove", onMove);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} className="sky" aria-hidden="true" />;
}
