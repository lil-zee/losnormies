'use client';
import { useState, useEffect, useRef } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useViewport } from '@/hooks/useViewport';
import PostCard from './PostCard';
import Navigation from './Navigation';
import CreatePostModal from './CreatePostModal';
import ThreadModal from './ThreadModal';
import IdentityModal from './IdentityModal';
import Minimap from './Minimap';
import ListViewModal from './ListViewModal';
import { useSound } from '@/hooks/useSound';
import CRTOverlay from './CRTOverlay';

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

  // Vertical Scroll Layout (Win95 Feed)
  return (
    <>
      <CRTOverlay />

      {/* BACKGROUND (Fixed) */}
      <div className="fixed inset-0 z-0 bg-[#008080] pointer-events-none">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      </div>

      {/* MAIN CONTENT FEED */}
      <div
        className="relative z-10 min-h-screen w-full overflow-y-auto overflow-x-hidden pt-4 pb-20 px-4"
        style={{ touchAction: 'pan-y' }}
      >
        <div className="max-w-[1600px] mx-auto flex flex-wrap gap-6 justify-center content-start items-start pb-20">
          {posts.map((post) => (
            <div key={post.id} className="relative group">
              <PostCard
                post={post}
                onClick={() => {
                  playOpen();
                  setSelectedPost(post);
                }}
                adminToken={userToken}
                onAdminDelete={() => handleDeletePost(post.id)}
                isSelected={selectedPost?.id === post.id}
                isStatic={true}
              />
            </div>
          ))}

          {/* Empty State */}
          {posts.length === 0 && (
            <div className="win95-window p-8 text-center mt-20 bg-white">
              <h2 className="font-bold text-xl mb-2">Welcome to Your Desktop</h2>
              <p className="mb-4">No content found. Start by creating a new post.</p>
              <button onClick={() => { playOpen(); setShowCreateModal(true); }} className="win95-btn px-4 py-2 font-bold">
                Start
              </button>
            </div>
          )}
        </div>
      </div>

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        x={0}
        y={0}
        onPostCreated={() => {
          playSuccess();
          fetchPosts(); // Reload posts
        }}
        userToken={userToken}
      />

      {selectedPost && (
        <ThreadModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          adminToken={userToken}
          userToken={userToken}
          onAdminDelete={() => {
            fetchPosts();
            setSelectedPost(null);
          }}
          onRequestIdentity={() => { playOpen(); setShowIdentityModal(true); }}
        />
      )}

      {/* Navigation / Taskbar */}
      <Navigation
        postsCount={posts.length}
        onlineCount={1}
        onToggleLive={() => setIsLive(!isLive)}
        isLive={isLive}
        showNSFW={showNSFW}
        onToggleNSFW={() => setShowNSFW(prev => !prev)}
        onLoginClick={() => { playOpen(); setShowIdentityModal(true); }}
        onCreateClick={() => {
          if (!userToken) { playOpen(); setShowIdentityModal(true); return; }
          playOpen();
          setCreatePosition({ x: 0, y: 0 });
          setShowCreateModal(true);
        }}
        onListClick={() => setShowListModal(true)}
        userToken={userToken}
        searchTerm="" // Unused
      />

      <IdentityModal
        isOpen={showIdentityModal}
        onClose={() => setShowIdentityModal(false)}
        onLogin={(token) => {
          setUserToken(token);
          localStorage.setItem('userToken', token);
          setShowIdentityModal(false);
        }}
      />

      <ListViewModal
        isOpen={showListModal}
        onClose={() => setShowListModal(false)}
        posts={posts.filter(p => showNSFW || !p.isNSFW)}
        onSelect={(post) => {
          playOpen();
          centerOn(post.x, post.y);
          setSelectedPost(post);
          setShowListModal(false);
        }}
        isLoading={false}
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
