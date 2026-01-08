'use client';
import { useState, useEffect } from 'react';
import Navigation from './Navigation';
import CreatePostModal from './CreatePostModal';
import ThreadModal from './ThreadModal';
import IdentityModal from './IdentityModal';
import ListViewModal from './ListViewModal';
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
  const [isLive, setIsLive] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [showNSFW, setShowNSFW] = useState(false);
  const [showListModal, setShowListModal] = useState(false);

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

  return (
    <>
      <div className="min-h-screen pb-16 pt-4 px-2 md:px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl glow font-bold tracking-wider">BOARD</h1>
            <p className="text-dim text-xs mt-1">{sortedPosts.length} posts</p>
          </div>

          {/* Grid de Posts */}
          {sortedPosts.length === 0 ? (
            <div className="terminal-box text-center py-8">
              <p className="text-dim mb-4">No posts yet.</p>
              <button onClick={() => { playOpen(); setShowCreateModal(true); }} className="btn-bracket glow">NEW POST</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
              {sortedPosts.map((post) => (
                <div
                  key={post.id}
                  className="post-card cursor-pointer group"
                  onClick={() => { playOpen(); setSelectedPost(post); }}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-black border border-[var(--border-color)] overflow-hidden relative">
                    {post.imageUrl ? (
                      <img 
                        src={post.imageUrl} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2">
                        <p className="text-xs text-dim text-center line-clamp-4 break-words">
                          {post.text ? post.text.slice(0, 100) : 'No content'}
                        </p>
                      </div>
                    )}
                    {/* NSFW overlay */}
                    {post.isNSFW && !showNSFW && (
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                        <span className="text-red-500 text-xs font-bold">NSFW</span>
                      </div>
                    )}
                    {/* Reply count badge */}
                    {post.replyCount > 0 && (
                      <div className="absolute bottom-1 right-1 bg-black/80 border border-[var(--matrix-green)] px-1 text-[10px]">
                        {post.replyCount}
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="bg-[var(--bg-dark)] border border-t-0 border-[var(--border-color)] px-2 py-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[var(--matrix-green-bright)] font-bold">{post.shortId}</span>
                      <span className="text-dim">{relativeTime(post.createdAt)}</span>
                    </div>
                    {post.text && (
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">{post.text.slice(0, 50)}</p>
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
        onCreateClick={() => {
          if (!userToken) { playOpen(); setShowIdentityModal(true); return; }
          playOpen();
          setShowCreateModal(true);
        }}
        onListClick={() => setShowListModal(true)}
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
          onRequestIdentity={() => { playOpen(); setShowIdentityModal(true); }}
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

      <ListViewModal
        isOpen={showListModal}
        onClose={() => setShowListModal(false)}
        posts={filteredPosts}
        onSelectPost={(post) => { playOpen(); setSelectedPost(post); setShowListModal(false); }}
      />
    </>
  );
}
