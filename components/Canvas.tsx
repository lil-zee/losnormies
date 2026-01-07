'use client';
import { useState, useEffect, useRef } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useViewport } from '@/hooks/useViewport';
import PostCard from './PostCard';
import Navigation from './Navigation';
import CreatePostModal from './CreatePostModal';
import ThreadModal from './ThreadModal';
import IdentityModal from './IdentityModal';
import Sidebar from './Sidebar';
import Minimap from './Minimap';
import ListViewModal from './ListViewModal';
import { useSound } from '@/hooks/useSound';

interface Post {
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
}

export default function Canvas() {
  const { zoom, pan, isDragging, setIsDragging, handleZoom, handlePan, centerOn, resetView } = useCanvas();
  const viewport = useViewport(zoom, pan);
  const { playOpen, playSuccess } = useSound();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPosition, setCreatePosition] = useState({ x: 0, y: 0 });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showNSFW, setShowNSFW] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

  // Touch States
  const lastTouchRef = useRef<{ x: number, y: number } | null>(null);
  const lastDistRef = useRef<number | null>(null);

  useEffect(() => {
    // Check for tokens
    const token = localStorage.getItem('adminToken');
    if (token) setAdminToken(token);

    const uToken = localStorage.getItem('userToken');
    if (uToken) setUserToken(uToken);

    // Center canvas initially (Fallback if no fetch)
    // Removed strict timeout centerOn(0,0) to prefer smart center

    // MOBILE FIRST: Open List View automatically
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setShowListModal(true);
    }
  }, []);

  const fetchPosts = async () => {
    const params = new URLSearchParams({
      minX: viewport.minX.toString(),
      maxX: viewport.maxX.toString(),
      minY: viewport.minY.toString(),
      maxY: viewport.maxY.toString(),
    });
    try {
      const res = await fetch(`/api/posts?${params}`);
      const data = await res.json();
      const loadedPosts = data.posts || [];
      setPosts(loadedPosts);

      // Smart Center on First Load
      if (!initialLoadDone && loadedPosts.length > 0) {
        const avgX = loadedPosts.reduce((sum: number, p: Post) => sum + p.x, 0) / loadedPosts.length;
        const avgY = loadedPosts.reduce((sum: number, p: Post) => sum + p.y, 0) / loadedPosts.length;
        // Small delay to ensure render
        setTimeout(() => {
          centerOn(avgX, avgY);
          handleZoom(-0.2);
        }, 100);
        setInitialLoadDone(true);
      } else if (!initialLoadDone) {
        // No posts, center 0,0
        setTimeout(() => { centerOn(0, 0); handleZoom(-0.2); }, 100);
        setInitialLoadDone(true);
      }

    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts();
    }, 600);
    return () => clearTimeout(timer);
  }, [viewport.minX, viewport.maxX, viewport.minY, viewport.maxY]);

  // Live Poll
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/posts');
        const data = await res.json();
        if (data.posts) {
          setPosts(prev => {
            if (data.posts.length > prev.length) {
              playSuccess();
              setToastMsg(`SIGNAL DETECTED: +${data.posts.length - prev.length} POSTS`);
              setTimeout(() => setToastMsg(null), 3000);
            }
            return data.posts;
          });
        }
      } catch (e) {
        console.error('Poll failed', e);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive, playSuccess]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    handleZoom(delta);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      handlePan(dx, dy);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // TOUCH HANDLERS
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent native scroll

    if (e.touches.length === 1 && lastTouchRef.current) {
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      handlePan(dx, dy);
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && lastDistRef.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (dist - lastDistRef.current) * 0.005; // Sensitivity
      handleZoom(delta);
      lastDistRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    lastTouchRef.current = null;
    lastDistRef.current = null;
  };

  const handleCanvasRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const canvasX = (e.clientX - pan.x) / zoom;
    const canvasY = (e.clientY - pan.y) / zoom;

    if (!userToken) {
      playOpen();
      setShowIdentityModal(true);
      return;
    }

    playOpen();
    setCreatePosition({ x: canvasX, y: canvasY });
    setShowCreateModal(true);
  };

  const handleDeletePost = async (postId: string) => {
    if (!adminToken) return;
    if (!confirm('ADMIN DELETE: Are you sure?')) return;

    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken }
      });
      if (res.ok) {
        setPosts(posts.filter(p => p.id !== postId));
        setSelectedPost(null);
      } else {
        alert('Failed to delete');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <Navigation
        onCreateClick={() => {
          if (!userToken) { playOpen(); setShowIdentityModal(true); return; }
          playOpen();
          // Create at center of current view
          const centerX = (window.innerWidth / 2 - pan.x) / zoom;
          const centerY = (window.innerHeight / 2 - pan.y) / zoom;
          setCreatePosition({ x: centerX, y: centerY });
          setShowCreateModal(true);
        }}
        currentZoom={zoom}
        onZoomChange={handleZoom}
        userToken={userToken}
        onLoginClick={() => { playOpen(); setShowIdentityModal(true); }}
        isLive={isLive}
        onToggleLive={() => setIsLive(!isLive)}
        showNSFW={showNSFW}
        onToggleNSFW={() => setShowNSFW(!showNSFW)}
        onListClick={() => setShowListModal(true)}
      />

      <div
        className={`canvas-container ${isDragging ? 'grabbing' : ''}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleCanvasRightClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ paddingTop: '60px', touchAction: 'none' }}
      >
        <div
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: '0 0',
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        >
          {posts.filter(p => showNSFW || !p.isNSFW).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onClick={() => { playOpen(); setSelectedPost(post); }}
              adminToken={adminToken}
              onAdminDelete={() => handleDeletePost(post.id)}
              isSelected={selectedPost?.id === post.id}
            />
          ))}
        </div>

        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-40 opacity-70 hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleZoom(0.1)}
            className="bg-black hover:bg-green-900 text-green-500 w-10 h-10 border border-green-500 font-mono text-xl shadow-[2px_2px_0px_#003300]"
          >
            +
          </button>
          <button
            onClick={() => handleZoom(-0.1)}
            className="bg-black hover:bg-green-900 text-green-500 w-10 h-10 border border-green-500 font-mono text-xl shadow-[2px_2px_0px_#003300]"
          >
            -
          </button>
          <div className="text-xs text-center text-green-400 bg-black border border-green-900 px-2 py-1 font-mono">{Math.round(zoom * 100)}%</div>
        </div>
      </div>

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        x={createPosition.x}
        y={createPosition.y}
        onPostCreated={() => { setShowCreateModal(false); fetchPosts(); }}
        userToken={userToken}
      />

      {selectedPost && (
        <ThreadModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          adminToken={adminToken}
          onAdminDelete={() => handleDeletePost(selectedPost.id)}
          userToken={userToken}
          onRequestIdentity={() => setShowIdentityModal(true)}
        />
      )}

      <IdentityModal
        isOpen={showIdentityModal}
        onClose={() => setShowIdentityModal(false)}
        onLogin={(token) => {
          setUserToken(token);
          localStorage.setItem('userToken', token);
          setShowIdentityModal(false);
        }}
      />

      <Sidebar
        posts={posts.filter(p => showNSFW || !p.isNSFW)}
        onSelect={(post) => {
          playOpen();
          centerOn(post.x, post.y);
          setSelectedPost(post);
        }}
      />

      <ListViewModal
        isOpen={showListModal}
        onClose={() => setShowListModal(false)}
        posts={posts.filter(p => showNSFW || !p.isNSFW)}
        onSelectPost={(post) => {
          playOpen();
          // Center closely on the post
          centerOn(post.x, post.y);
          // Open it
          setSelectedPost(post);
        }}
      />

      {/* Minimap Removed as requested */}
      {/* <Minimap posts={posts} pan={pan} zoom={zoom} /> */}

      {toastMsg && (
        <div className="fixed top-20 right-4 bg-green-500 text-black px-4 py-2 font-mono font-bold animate-enter border-2 border-white shadow-[4px_4px_0_black] z-50 md:top-24 md:right-8">
          {toastMsg}
        </div>
      )}
    </>
  );
}
