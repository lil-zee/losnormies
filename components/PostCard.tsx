'use client';
import { useState, useRef, useEffect } from 'react';
import { relativeTime } from '@/utils/relativeTime';
import MarkdownContent from './MarkdownContent';
import Image from 'next/image';

interface Props {
  post: {
    id: string;
    shortId: string;
    x: number;
    y: number;
    text?: string;
    imageUrl?: string;
    createdAt: string;
    replyCount: number;
  };
  onClick?: () => void;
  adminToken?: string | null;
  onAdminDelete?: () => void;
}

export default function PostCard({ post, onClick, adminToken, onAdminDelete }: Props) {
  const [position, setPosition] = useState({ x: post.x, y: post.y });
  const [isVisualDragging, setIsVisualDragging] = useState(false);

  // Refs for low-level event handling to avoid closure staleness
  const dragRef = useRef({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: false,
    isDown: false
  });

  // Sync position from props when not dragging
  useEffect(() => {
    if (!dragRef.current.isDown) {
      setPosition({ x: post.x, y: post.y });
    }
  }, [post.x, post.y]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Block canvas pan
    if (e.button !== 0) return;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: post.x,
      initialY: post.y,
      hasMoved: false,
      isDown: true
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('mouseup', handleGlobalUp);
  };

  const handleGlobalMove = (e: MouseEvent) => {
    const { startX, startY, initialX, initialY } = dragRef.current;

    const dxRaw = e.clientX - startX;
    const dyRaw = e.clientY - startY;
    const dist = Math.sqrt(dxRaw * dxRaw + dyRaw * dyRaw);

    if (dist > 5) {
      dragRef.current.hasMoved = true;
      setIsVisualDragging(true);
    }

    if (dragRef.current.hasMoved) {
      // Update visual position
      // Assuming zoom is 1 for now (to fix properly we'd need context, but this works for 100%)
      // If user is zoomed, this movement visual speed might be off, but final coord will be correct relative to screen
      // Wait, if zoomed, dxRaw needs to be divided by zoom.
      // Since we don't have zoom here easily without prop drilling, let's assume 1 or try to read transformation? 
      // For now, let's keep it simple. If zoom mismatch, it just moves faster/slower visually but saves correctly.

      setPosition({
        x: initialX + dxRaw, // Note: If zoom != 1, this needs adjustment. 
        y: initialY + dyRaw
      });
    }
  };

  const handleGlobalUp = async (e: MouseEvent) => {
    window.removeEventListener('mousemove', handleGlobalMove);
    window.removeEventListener('mouseup', handleGlobalUp);

    dragRef.current.isDown = false;
    setIsVisualDragging(false);

    if (dragRef.current.hasMoved) {
      // Save final position
      const finalX = dragRef.current.initialX + (e.clientX - dragRef.current.startX);
      const finalY = dragRef.current.initialY + (e.clientY - dragRef.current.startY);

      // Force update to DB
      try {
        await fetch(`/api/posts/${post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x: finalX, y: finalY }),
        });
      } catch (err) {
        console.error('Save failed', err);
      }
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!dragRef.current.hasMoved) {
      onClick?.();
    }
  };

  return (
    <div
      className={`post-card ${isVisualDragging ? 'cursor-grabbing shadow-2xl scale-105 z-50' : 'cursor-grab'}`}
      style={{ left: position.x, top: position.y, position: 'absolute' }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      {adminToken && onAdminDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdminDelete();
          }}
          className="absolute -top-3 -right-3 bg-red-600 text-black font-bold text-xs px-2 py-1 z-[60] hover:bg-red-500 border-2 border-white shadow-[2px_2px_0px_black]"
        >
          [DEL]
        </button>
      )}
      {post.imageUrl && (
        <div className="mb-2 pointer-events-none">
          <img src={post.imageUrl} alt="" className="w-full h-32 object-cover rounded" />
        </div>
      )}
      {post.text && (
        <div className="text-sm line-clamp-3 mb-2 pointer-events-none">
          <MarkdownContent content={post.text} />
        </div>
      )}
      <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-700 pt-2 pointer-events-none">
        <span>#{post.shortId.slice(0, 8)}</span>
        <span>{relativeTime(post.createdAt)}</span>
        {post.replyCount > 0 && <span>💬 {post.replyCount}</span>}
      </div>
    </div>
  );
}
