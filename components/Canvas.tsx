'use client';
import { useState, useEffect } from 'react';
import { useCanvas } from '@/hooks/useCanvas';
import { useViewport } from '@/hooks/useViewport';
import PostCard from './PostCard';
import Navigation from './Navigation';
import CreatePostModal from './CreatePostModal';
import ThreadModal from './ThreadModal';
import IdentityModal from './IdentityModal';

interface Post {
  id: string;
  shortId: string;
  x: number;
  y: number;
  text?: string;
  imageUrl?: string;
  createdAt: string;
  replyCount: number;
}

export default function Canvas() {
  const { zoom, pan, isDragging, setIsDragging, handleZoom, handlePan } = useCanvas();
  const viewport = useViewport(zoom, pan);
  const [posts, setPosts] = useState<Post[]>([]);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createPosition, setCreatePosition] = useState({ x: 0, y: 0 });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);

  useEffect(() => {
    // Check for tokens
    const token = localStorage.getItem('adminToken');
    if (token) setAdminToken(token);

    const uToken = localStorage.getItem('userToken');
    if (uToken) setUserToken(uToken);
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
      setPosts(data.posts || []);
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

  const handleCanvasRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const canvasX = (e.clientX - pan.x) / zoom;
    const canvasY = (e.clientY - pan.y) / zoom;

    if (!userToken) {
      setShowIdentityModal(true);
      return;
    }

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
          if (!userToken) { setShowIdentityModal(true); return; }
          setCreatePosition({ x: 0, y: 0 });
          setShowCreateModal(true);
        }}
        currentZoom={zoom}
        onZoomChange={handleZoom}
        userToken={userToken}
        onLoginClick={() => setShowIdentityModal(true)}
      />

      <div
        className={`canvas-container ${isDragging ? 'grabbing' : ''}`}
        style={{ paddingTop: '60px' }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleCanvasRightClick}
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
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onClick={() => setSelectedPost(post)}
              adminToken={adminToken}
              onAdminDelete={() => handleDeletePost(post.id)}
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
    </>
  );
}
