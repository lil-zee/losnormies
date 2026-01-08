'use client';
import { useState, useEffect } from 'react';
import Navigation from './Navigation';
import CreatePostModal from './CreatePostModal';
import ThreadModal from './ThreadModal';
import IdentityModal from './IdentityModal';
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

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(fetchPosts, 5000);
    return () => clearInterval(interval);
  }, [isLive]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredPosts = posts.filter(p => showNSFW || !p.isNSFW);

  return (
    <>
      <div className="min-h-screen pb-16 pt-4 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="terminal-box mb-4">
            <div className="text-dim text-xs mb-2">-- BOARD FEED --</div>
            {filteredPosts.length === 0 && (
              <div className="text-dim py-4 text-center">No messages yet. Be the first.</div>
            )}
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="irc-message cursor-pointer"
                onClick={() => { playOpen(); setSelectedPost(post); }}
              >
                <span className="irc-timestamp">{formatTime(post.createdAt)}</span>
                <span className="irc-user">{post.shortId}</span>
                <span className="irc-content">
                  {post.text ? post.text.slice(0, 200) : ''}
                  {post.text && post.text.length > 200 && '...'}
                  {post.imageUrl && <span className="text-dim ml-2">[IMG]</span>}
                  {post.replyCount > 0 && <span className="text-dim ml-2">({post.replyCount})</span>}
                </span>
              </div>
            ))}
          </div>
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
        onPostCreated={() => { playSuccess(); fetchPosts(); }}
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
        onSelect={(post) => { playOpen(); setSelectedPost(post); setShowListModal(false); }}
        isLoading={false}
      />
    </>
  );
}
