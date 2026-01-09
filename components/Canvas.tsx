'use client';
import { useState, useEffect } from 'react';
import Navigation from './Navigation';
import CreatePostModal from './CreatePostModal';
import ThreadModal from './ThreadModal';
import IdentityModal from './IdentityModal';
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
      playOpen();
      setShowIdentityModal(true);
      return;
    }
    playOpen();
    setShowCreateModal(true);
  };

  return (
    <>
      <div className="min-h-screen pb-16 pt-3 px-2">
        <div className="max-w-7xl mx-auto mb-4 flex items-center justify-between">
          <h1 className="text-xl md:text-3xl glow font-bold tracking-widest">LOS NORMIES</h1>
          <button onClick={handleNewPost} className="btn-bracket text-xs md:text-sm">NEW</button>
        </div>

        <div className="max-w-7xl mx-auto">
          {sortedPosts.length === 0 ? (
            <div className="terminal-box text-center py-8">
              <p className="text-dim mb-3 text-sm">No threads yet.</p>
              <button onClick={handleNewPost} className="btn-bracket glow text-sm">START FIRST THREAD</button>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-1">
              {sortedPosts.map((post) => (
                <div
                  key={post.id}
                  className="relative cursor-pointer group border border-[var(--border-color)] hover:border-[var(--matrix-green)] transition-colors bg-black"
                  onClick={() => { playOpen(); setSelectedPost(post); }}
                >
                  <div className="aspect-square overflow-hidden relative">
                    {post.imageUrl ? (
                      <img 
                        src={post.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-dark)] p-1">
                        <span className="text-[8px] text-dim text-center break-all leading-tight">
                          {post.text ? post.text.slice(0, 30) : 'TEXT'}
                        </span>
                      </div>
                    )}
                    {post.isNSFW && (
                      <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
                        <span className="text-red-600 text-[8px] font-bold">18+</span>
                      </div>
                    )}
                    {post.replyCount > 0 && (
                      <div className="absolute bottom-0 right-0 bg-black/80 px-1 text-[8px] text-white border-l border-t border-[var(--matrix-green)]">
                        {post.replyCount}
                      </div>
                    )}
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
        onLoginClick={() => { playOpen(); setShowIdentityModal(true); }}
        onCreateClick={handleNewPost}
        onListClick={() => {}}
        userToken={userToken}
      />

      {showCreateModal && (
        <CreatePostModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          x={0}
          y={0}
          onPostCreated={() => { 
            playSuccess(); 
            fetchPosts(); 
            setShowCreateModal(false); 
          }}
          userToken={userToken}
        />
      )}

      {selectedPost && (
        <ThreadModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          adminToken={userToken}
          userToken={userToken}
          onAdminDelete={() => { fetchPosts(); setSelectedPost(null); }}
          onRequestIdentity={() => { playOpen(); setShowIdentityModal(true); }}
        />
      )}

      {showIdentityModal && (
        <IdentityModal
          isOpen={showIdentityModal}
          onClose={() => setShowIdentityModal(false)}
          onLogin={(token) => {
            setUserToken(token);
            localStorage.setItem('userToken', token);
            setShowIdentityModal(false);
            playSuccess();
          }}
        />
      )}
    </>
  );
}
