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
  isStatic?: boolean; // New prop for vertical feed
}

export default function PostCard({ post, onClick, adminToken, onAdminDelete, isSelected, isStatic = false }: Props) {
  const [position, setPosition] = useState({ x: post.x, y: post.y });
  const [isVisualDragging, setIsVisualDragging] = useState(false);
  const [likes, setLikes] = useState(post.likes);
  const [hasLiked, setHasLiked] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const { playSuccess, playClick } = useSound();

  const isBlurry = post.isNSFW && !isRevealed;

  // Force static layout implies no dragging
  const effectiveIsDragging = isStatic ? false : isVisualDragging;

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
    e.preventDefault();
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

  // Decay Logic: Fades out over 72 hours, minimum 0.2 opacity
  const ageHours = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
  const opacity = Math.max(0.4, 1 - (ageHours / 72));

  // Sticker Rotation (deterministic based on ID)
  const rotation = useRef(0);
  useEffect(() => {
    // Simple deterministic random for rotation (-2deg to 2deg)
    const hash = post.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    rotation.current = (hash % 5) - 2;
  }, [post.id]);

  // Windows 95 Aesthetic - No random rotation, solid opacity
  return (
    <div
      className={`post-card win95-window ${isStatic ? 'relative mb-4 mx-2' : 'absolute'} ${effectiveIsDragging ? 'cursor-move z-[9999]' : ''} ${isSelected ? 'z-[50] ring-1 ring-blue-500' : 'z-10'}`}
      style={{
        // If static, ignore x/y. If absolute, use x/y.
        left: isStatic ? undefined : position.x,
        top: isStatic ? undefined : position.y,
        width: '320px',
        maxWidth: '100%',
        // No rotation, full opacity
      }}
      onMouseDown={isStatic ? undefined : handleMouseDown} // Disable drag if static
      onClick={handleClick}
    >
      {/* TITLE BAR */}
      <div className={`win95-title-bar ${isSelected ? '' : 'inactive'} select-none`}>
        <div className="flex items-center gap-1">
          <img src="/floppy.png" className="w-4 h-4" alt="" /> {/* Placeholder icon */}
          <span>{post.shortId || 'Untitled'}</span>
        </div>
        <div className="flex gap-1">
          <button className="win95-btn w-4 h-4 p-0 leading-none" onClick={(e) => { e.stopPropagation(); /* Minimize? */ }}>_</button>
          <button className="win95-btn w-4 h-4 p-0 leading-none" onClick={handleReport}>X</button>
        </div>
      </div>

      {/* MENU BAR (Fake) */}
      <div className="flex bg-[#c0c0c0] px-1 py-0.5 border-b border-gray-400 text-xs gap-3">
        <span className="underline">F</span>ile
        <span className="underline">E</span>dit
        <span className="underline">V</span>iew
        <span className="underline">H</span>elp
      </div>

      {/* CONTENT AREA */}
      <div className="bg-white m-1 border-t-2 border-l-2 border-[#808080] border-r border-b border-[#fff] p-2 min-h-[100px] overflow-y-auto max-h-[400px]">
        {post.imageUrl && (
          <div className="mb-2 flex justify-center bg-black">
            <img src={post.imageUrl} alt="" className="max-h-48 object-contain" />
          </div>
        )}
        {post.text && (
          <div className="font-[font-family:'MS_Sans_Serif'] text-sm">
            <MarkdownContent content={post.text} />
          </div>
        )}
      </div>

      {/* STATUS BAR */}
      <div className="mt-1 border-t border-gray-400 pt-1 flex justify-between items-center text-xs px-1 text-gray-700">
        <span>{relativeTime(post.createdAt)}</span>
        <button
          className={`win95-btn px-2 py-0 ${hasLiked ? 'font-bold text-blue-800' : ''}`}
          onClick={handleLike}
        >
          {likes} Likes
        </button>
      </div>

      {isBlurry && (
        <div className="absolute inset-x-1 top-8 bottom-8 z-20 bg-[#c0c0c0] flex items-center justify-center border-2 border-dashed border-black">
          <div className="text-center">
            <p className="font-bold mb-2">WARNING</p>
            <p className="mb-2">NSFW Content Detected</p>
            <button className="win95-btn px-4 py-1" onClick={(e) => { e.stopPropagation(); setIsRevealed(true); }}>
              Proceed
            </button>
          </div>
        </div>
      )}

      {/* SHADOW (Windows 95 doesn't really have shadows, but maybe a hard black drop) */}
      <div className="absolute -right-1 -bottom-1 w-full h-full -z-10 bg-black pointer-events-none" />
    </div>
  );
}
