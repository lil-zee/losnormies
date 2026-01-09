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
      <div className="min-h-screen pb-20 pt-3 px-2">
        {/* Header */}
        <div className="max-w-5xl mx-auto mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl md:text-4xl glow font-bold tracking-widest select-none">LOS NORMIES</h1>
            <button onClick={handleNewPost} className="btn-bracket glow">NEW THREAD</button>
          </div>
          <div className="text-dim text-xs border-t border-[var(--border-color)] pt-2">
            Anonymous imageboard - {sortedPosts.length} active threads
          </div>
        </div>

        {/* Threads List - Imageboard Style */}
        <div className="max-w-5xl mx-auto space-y-2">
          {sortedPosts.length === 0 ? (
            <div className="terminal-box text-center py-12">
              <p className="text-dim mb-4">No threads yet.</p>
              <button onClick={handleNewPost} className="btn-bracket glow">START FIRST THREAD</button>
            </div>
          ) : (
            sortedPosts.map((post) => (
              <div
                key={post.id}
                className="thread-card border border-[var(--border-color)] bg-[var(--bg-dark)] hover:border-[var(--matrix-green)] transition-colors cursor-pointer"
                onClick={() => { playOpen(); setSelectedPost(post); }}
              >
                <div className="flex gap-3 p-2">
                  {/* Thumbnail */}
                  {post.imageUrl ? (
                    <div className="flex-shrink-0 relative">
                      <img 
                        src={post.imageUrl} 
                        alt="" 
                        className="w-24 h-24 md:w-32 md:h-32 object-cover border border-[var(--matrix-green-dim)]"
                        loading="lazy"
                      />
                      {post.isNSFW && (
                        <div className="absolute inset-0 bg-black/90 flex items-center justify-center">
                          <span className="text-red-600 text-xs font-bold">NSFW</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 bg-black border border-[var(--matrix-green-dim)] flex items-center justify-center">
                      <span className="text-dim text-xs">NO IMG</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-baseline gap-2 mb-1 flex-wrap">
                      <span className="text-[var(--matrix-green-bright)] font-bold text-sm">#{post.shortId}</span>
                      <span className="text-dim text-xs">{relativeTime(post.createdAt)}</span>
                      <span className="text-[var(--matrix-green)] text-xs">
                        [{post.replyCount} {post.replyCount === 1 ? 'reply' : 'replies'}]
                      </span>
                    </div>

                    {/* Text Preview */}
                    {post.text && (
                      <p className="text-sm text-gray-300 line-clamp-3 break-words font-mono">
                        {post.text.slice(0, 200)}
                        {post.text.length > 200 && '...'}
                      </p>
                    )}

                    {/* Footer */}
                    <div className="mt-2 text-xs text-dim">
                      <span className="hover:text-[var(--matrix-green)] transition-colors">
                        Click to view thread →
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
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
