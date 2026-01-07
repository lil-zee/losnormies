'use client';
import { useEffect, useRef } from 'react';

interface Props {
  posts: { id: string; x: number; y: number }[];
  pan: { x: number; y: number };
  zoom: number;
}

export default function Minimap({ posts, pan, zoom }: Props) {
  return null;
}
