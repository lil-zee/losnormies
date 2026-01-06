'use client';
import { useState, useCallback } from 'react';

export function useCanvas() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleZoom = useCallback((delta: number, mouseX?: number, mouseY?: number) => {
    setZoom(prev => Math.min(Math.max(0.1, prev + delta), 3));
  }, []);

  const handlePan = useCallback((dx: number, dy: number) => {
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const centerOn = useCallback((x: number, y: number) => {
    setPan({ x: -x * zoom + window.innerWidth / 2, y: -y * zoom + window.innerHeight / 2 });
  }, [zoom]);

  return { zoom, pan, isDragging, setIsDragging, handleZoom, handlePan, resetView, centerOn };
}