'use client';
import { useMemo } from 'react';

export function useViewport(zoom: number, pan: { x: number; y: number }) {
  return useMemo(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1080;
    // Add a huge buffer (3x screen size) to ensure smooth panning
    const bufferX = width * 3;
    const bufferY = height * 3;

    return {
      minX: (-pan.x / zoom - width / (2 * zoom)) - bufferX,
      maxX: (-pan.x / zoom + width / (2 * zoom)) + bufferX,
      minY: (-pan.y / zoom - height / (2 * zoom)) - bufferY,
      maxY: (-pan.y / zoom + height / (2 * zoom)) + bufferY,
    };
  }, [zoom, pan]);
}