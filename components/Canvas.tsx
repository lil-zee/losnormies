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
      <div className="min-h-screen pb-20 pt-4 px-1 md:px-2">
        {/* Header Centrado */}
        <div className="flex flex-col items-center justify-center mb-6 relative">
             <h1 className="text-3xl md:text-5xl glow font-bold tracking-widest text-center">LOS NORMIES</h1>
             <div className="absolute right-0 top-1 hidden md:block">
                 <button onClick={handleNewPost} className="btn-bracket text-sm">NEW THREAD</button>
             </div>
             {/* Mobile New Button debajo por si acaso */}
             <div className="mt-4 md:hidden">
                 <button onClick={handleNewPost} className="btn-bracket text-sm">Create New Post</button>
             </div>
        </div>

        {/* Grid de Posts */}
        <div className="max-w-[1800px] mx-auto">
          {sortedPosts.length === 0 ? (
            <div className="terminal-box text-center py-12 mx-4">
              <p className="text-dim mb-4">No normies detected yet.</p>
              <button onClick={handleNewPost} className="btn-bracket glow">START THREAD</button>
            </div>
          ) : (
             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-0.5 md:gap-1">
              {sortedPosts.map((post) => (
                <div
                  key={post.id}
                  className="post-card cursor-pointer group relative bg-black border border-[var(--border-color)] hover:border-[var(--matrix-green)] transition-colors"
                  onClick={() => { playOpen(); setSelectedPost(post); }}
                >
                  {/* Thumbnail Ratio 1:1 estricto */}
                  <div className="aspect-square overflow-hidden relative">
                    {post.imageUrl ? (
                      <img 
                        src={post.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2 bg-[var(--bg-dark)]">
                         <span className="text-[var(--matrix-green-dim)] text-xs text-center break-all font-mono leading-tight opacity-50 select-none">
                           {post.text?.slice(0,40) || 'TEXT'}
                         </span>
                      </div>
                    )}
                    
                    {/* Overlays */}
                    {post.isNSFW && (
                      <div className="absolute inset-0 bg-black/95 flex items-center justify-center pointer-events-none">
                        <span className="text-red-600 text-[10px] font-bold border border-red-600 px-1">NSFW</span>
                      </div>
                    )}
                    
                    {/* Stats overlay bottom */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-1 pt-4 flex justify-between items-end">
                       <span className="text-[9px] text-white/50">{post.replyCount > 0 ? R: : ''}</span>
                    </div>
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
