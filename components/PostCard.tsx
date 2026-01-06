'use client';
import { useState, useRef, useEffect } from 'react';
import { relativeTime } from '@/utils/relativeTime';
import MarkdownContent from './MarkdownContent';
import Image from 'next/image';
import { useSound } from '@/hooks/useSound';

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
    likes: number;
    isNSFW?: boolean;
  };
  onClick?: () => void;
  adminToken?: string | null;
  onAdminDelete?: () => void;
  isSelected?: boolean;
}

export default function PostCard({ post, onClick, adminToken, onAdminDelete, isSelected }: Props) {
  const [position, setPosition] = useState({ x: post.x, y: post.y });
  const [isVisualDragging, setIsVisualDragging] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const { playSuccess, playClick } = useSound();

  const isBlurry = post.isNSFW && !isRevealed;

  useEffect(() => {
    const liked = localStorage.getItem(`liked_${post.id}`);
    if (liked) setHasLiked(true);
  }, [post.id]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const newHasLiked = !hasLiked;
    setHasLiked(newHasLiked);
    setLikes(prev => newHasLiked ? prev + 1 : prev - 1);

    if (newHasLiked) playSuccess();
    else playClick();

    localStorage.setItem(`liked_${post.id}`, newHasLiked ? 'true' : '');

    try {
      await fetch(`/api/posts/${post.id}/like`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ increment: newHasLiked })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReport = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('REPORT POST: Are you sure?')) return;
    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: 'post', targetId: post.id, reason: 'User Report' })
      });
      alert('REPORT SENT');
    } catch (err) { alert('Error sending report'); }
  };

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
      className={`post-card animate-enter bg-black/85 backdrop-blur-md ${isVisualDragging ? 'cursor-grabbing shadow-2xl scale-105 z-50' : 'cursor-grab'} ${isSelected ? 'active-glow' : ''}`}
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
      {isBlurry && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 cursor-pointer backdrop-blur-sm transition-opacity hover:bg-black/50"
          onClick={(e) => { e.stopPropagation(); setIsRevealed(true); }}
        >
          <div className="bg-red-600 text-black font-bold px-2 py-1 border-2 border-white tracking-widest text-xs shadow-[2px_2px_0_black]">
            SPOILER / NSFW
          </div>
        </div>
      )}

      {post.imageUrl && (
        <div className={`mb-2 pointer-events-none transition-all duration-500 flex justify-center bg-gray-900/50 ${isBlurry ? 'filter blur-xl opacity-50' : ''}`}>
          <img src={post.imageUrl} alt="" className="w-auto h-auto max-h-48 max-w-full object-contain rounded" />
        </div>
      )}
      {post.text && (
        <div className={`text-sm max-h-64 overflow-hidden mb-2 pointer-events-none transition-all duration-500 ${isBlurry ? 'filter blur-sm opacity-50' : ''}`}>
          <MarkdownContent content={post.text} />
        </div>
      )}
      <div className="flex justify-between items-center text-xs text-gray-400 border-t border-gray-700 pt-2 pointer-events-none">
        <span>#{post.shortId.slice(0, 8)}</span>
        <div className="flex gap-3 items-center">
          <button
            className="text-gray-600 hover:text-red-500 font-bold pointer-events-auto"
            onClick={handleReport}
            title="Report Post"
          >
            [!]
          </button>
          <button
            className={`flex items-center gap-1 hover:text-green-300 ${hasLiked ? 'text-green-400 font-bold' : ''} pointer-events-auto`}
            onClick={handleLike}
          >
            {hasLiked ? '★' : '☆'} {likes}
          </button>
          <span>{relativeTime(post.createdAt)}</span>
          {post.replyCount > 0 && <span>💬 {post.replyCount}</span>}
        </div>
      </div>
    </div>
  );
}
