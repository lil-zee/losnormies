'use client';
import { useEffect, useRef } from 'react';

interface Props {
  posts: { id: string; x: number; y: number }[];
  pan: { x: number; y: number };
  zoom: number;
}

export default function Minimap({ posts, pan, zoom }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = '#003300';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    if (posts.length === 0) return;

    // Calculate bounds
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    posts.forEach(p => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
    });

    // Add padding
    const padding = 2000;
    minX -= padding; maxX += padding;
    minY -= padding; maxY += padding;

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;

    // Scale to fit canvas
    // Keep aspect ratio?
    const scaleX = canvas.width / rangeX;
    const scaleY = canvas.height / rangeY;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (canvas.width - rangeX * scale) / 2;
    const offsetY = (canvas.height - rangeY * scale) / 2;

    const toMini = (wx: number, wy: number) => ({
        x: (wx - minX) * scale + offsetX,
        y: (wy - minY) * scale + offsetY
    });

    // Draw Posts
    ctx.fillStyle = '#00ff41';
    posts.forEach(p => {
        const { x, y } = toMini(p.x, p.y);
        ctx.fillRect(x - 1, y - 1, 2, 2);
    });

    // Draw Viewport
    const vw = window.innerWidth / zoom;
    const vh = window.innerHeight / zoom;
    const vx = -pan.x / zoom;
    const vy = -pan.y / zoom;

    const p1 = toMini(vx, vy);
    const p2 = toMini(vx + vw, vy + vh);
    
    ctx.strokeStyle = 'rgba(0, 255, 65, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);

  }, [posts, pan, zoom]);

  return (
    <div className="fixed bottom-4 left-4 z-40 border border-green-800 bg-black shadow-[0_0_10px_#003300] hidden md:block">
        <canvas ref={canvasRef} width={150} height={150} className="block" />
        <div className="absolute top-0 right-0 bg-black text-[8px] text-green-700 px-1 border-b border-l border-green-900 font-mono">RADAR</div>
    </div>
  );
}
