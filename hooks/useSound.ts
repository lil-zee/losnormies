'use client';
import { useCallback } from 'react';

export function useSound() {
  const playTone = useCallback((freq: number, type: OscillatorType, duration: number, vol: number = 0.05) => {
    if (typeof window === 'undefined') return;
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + duration);
  }, []);

  const playHover = useCallback(() => playTone(1000, 'sine', 0.03, 0.02), [playTone]);
  const playClick = useCallback(() => playTone(600, 'square', 0.08, 0.05), [playTone]);
  const playOpen = useCallback(() => playTone(200, 'sawtooth', 0.2, 0.05), [playTone]);
  const playSuccess = useCallback(() => {
     playTone(880, 'square', 0.1, 0.05);
     setTimeout(() => playTone(1760, 'square', 0.2, 0.05), 100);
  }, [playTone]);

  return { playHover, playClick, playOpen, playSuccess };
}
