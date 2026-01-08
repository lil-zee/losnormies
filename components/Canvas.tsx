'use client';
import { useState, useEffect } from 'react';
import Navigation from './Navigation';
import CreatePostModal from './CreatePostModal';
import ThreadModal from './ThreadModal';
import IdentityModal from './IdentityModal';
import { useSound } from '@/hooks/useSound';
import { relativeTime } from '@/utils/relativeTime';

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
  const { playOpen, playSuccess } = useSound();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [showNSFW, setShowNSFW] = useState(false);

  useEffect(() => {
    const uToken = localStorage.getItem('userToken');
    if (uToken) setUserToken(uToken);
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(fetchPosts, 5000);
    return () => clearInterval(interval);
  }, [isLive]);

  const filteredPosts = posts.filter(p => showNSFW || !p.isNSFW);
  const sortedPosts = [...filteredPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleNewPost = () => {
    if (!userToken) {
      setShowIdentityModal(true);
      return;
    }
    playOpen();
    setShowCreateModal(true);
  };

  return (
    <>
      <div className="min-h-screen pb-20 pt-2 px-1 md:px-2">
        {/* Header con boton NEW prominente */}
        <div className="max-w-7xl mx-auto flex items-center justify-between mb-3 px-2">
          <h1 className="text-lg md:text-xl glow font-bold">BOARD</h1>
          <button onClick={handleNewPost} className="btn-bracket glow text-sm">NEW POST</button>
        </div>

        {/* Grid de Posts - MAS COLUMNAS */}
        <div className="max-w-7xl mx-auto">
          {sortedPosts.length === 0 ? (
            <div className="terminal-box text-center py-8 mx-2">
              <p className="text-dim mb-4">No posts yet.</p>
              <button onClick={handleNewPost} className="btn-bracket glow">CREATE FIRST POST</button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-1 md:gap-2">
              {sortedPosts.map((post) => (
                <div
                  key={post.id}
                  className="post-card cursor-pointer group"
                  onClick={() => { playOpen(); setSelectedPost(post); }}
                >
                  {/* Thumbnail cuadrado pequeño */}
                  <div className="aspect-square bg-black border border-[var(--border-color)] overflow-hidden relative">
                    {post.imageUrl ? (
                      <img 
                        src={post.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-1 bg-[var(--bg-dark)]">
                        <p className="text-[9px] text-dim text-center line-clamp-3 break-words">
                          {post.text ? post.text.slice(0, 60) : '...'}
                        </p>
                      </div>
                    )}
                    {post.isNSFW && (
                      <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
                        <span className="text-red-500 text-[10px] font-bold">18+</span>
                      </div>
                    )}
                    {post.replyCount > 0 && (
                      <div className="absolute bottom-0 right-0 bg-black/90 border-l border-t border-[var(--matrix-green)] px-1 text-[9px]">
                        {post.replyCount}
                      </div>
                    )}
                  </div>
                  {/* Info minima */}
                  <div className="bg-[var(--bg-dark)] border border-t-0 border-[var(--border-color)] px-1 py-0.5 text-[9px] flex justify-between">
                    <span className="text-[var(--matrix-green-bright)]">{post.shortId}</span>
                    <span className="text-dim">{relativeTime(post.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Navigation
        onToggleLive={() => setIsLive(!isLive)}
        isLive={isLive}
        showNSFW={showNSFW}
        onToggleNSFW={() => setShowNSFW(prev => !prev)}
        onLoginClick={() => setShowIdentityModal(true)}
        onCreateClick={handleNewPost}
        onListClick={() => {}}
        userToken={userToken}
      />

      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        x={0}
        y={0}
        onPostCreated={() => { playSuccess(); fetchPosts(); setShowCreateModal(false); }}
        userToken={userToken}
      />

      {selectedPost && (
        <ThreadModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          adminToken={userToken}
          userToken={userToken}
          onAdminDelete={() => { fetchPosts(); setSelectedPost(null); }}
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
