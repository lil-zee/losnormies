'use client';
import { useState, useRef, useEffect } from 'react';
import { compressImage } from '@/utils/imageCompression';
import MarkdownContent from './MarkdownContent';
import { relativeTime } from '@/utils/relativeTime';

interface Reply { id: string; text?: string; imageUrl?: string; createdAt: string; }
interface Post { id: string; shortId: string; text?: string; imageUrl?: string; createdAt: string; replies?: Reply[]; likes?: number; }
interface Props {
  post: Post;
  onClose: () => void;
  adminToken?: string | null;
  userToken?: string | null;
  onAdminDelete?: () => void;
  onRequestIdentity?: () => void;
}

export default function ThreadModal({ post, onClose, adminToken, userToken, onAdminDelete, onRequestIdentity }: Props) {
  const [thread, setThread] = useState<Post | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadThread = () => {
    fetch('/api/posts/' + post.id).then(r => r.json()).then(d => setThread(d)).catch(console.error);
  };

  useEffect(() => { loadThread(); }, [post.id]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setReplyImage(compressed);
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!replyText.trim() && !replyImage) { setError('Add text or image'); return; }
    if (!userToken) { onRequestIdentity?.(); return; }
    
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (replyImage) {
        const formData = new FormData();
        formData.append('file', replyImage);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error);
        imageUrl = uploadData.url;
      }
      const res = await fetch('/api/posts/' + post.id + '/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': userToken },
        body: JSON.stringify({ text: replyText.trim() || undefined, imageUrl }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed');
      }
      setReplyText('');
      setReplyImage(null);
      loadThread();
    } catch (err: any) { 
      setError(err.message || 'Error'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (!thread) {
    return (
      <div className="modal-overlay animate-fadeIn" onClick={onClose}>
        <div className="modal-box" onClick={e => e.stopPropagation()}>
          <div className="modal-body text-center py-8">
            <span className="text-dim">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '700px', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>#{thread.shortId}</h2>
          <div className="flex gap-2">
            <span className="text-dim text-xs">{relativeTime(thread.createdAt)}</span>
            <button onClick={onClose} className="btn-bracket">X</button>
          </div>
        </div>
        
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {/* OP Post */}
          <div className="mb-4 pb-4 border-b border-[var(--border-color)]">
            {thread.imageUrl && (
              <div className="mb-3">
                <img src={thread.imageUrl} alt="" className="max-w-full max-h-64 border border-[var(--matrix-green-dim)]" />
              </div>
            )}
            {thread.text && (
              <div className="text-sm text-gray-300">
                <MarkdownContent content={thread.text} />
              </div>
            )}
          </div>

          {/* Replies */}
          <div className="text-dim text-xs mb-3">-- {thread.replies?.length || 0} REPLIES --</div>
          <div className="space-y-3">
            {thread.replies?.map((r) => (
              <div key={r.id} className="terminal-box text-sm">
                <div className="flex justify-between mb-2 text-xs">
                  <span style={{ color: '#' + r.id.slice(0,6) }}>{r.id.slice(0,8)}</span>
                  <span className="text-dim">{relativeTime(r.createdAt)}</span>
                </div>
                {r.imageUrl && <img src={r.imageUrl} alt="" className="max-h-32 mb-2 border border-[var(--matrix-green-dim)]" />}
                {r.text && <div className="text-gray-300"><MarkdownContent content={r.text} /></div>}
              </div>
            ))}
            {(!thread.replies || thread.replies.length === 0) && (
              <p className="text-dim text-xs text-center py-4">No replies yet. Be the first!</p>
            )}
          </div>
        </div>

        {/* Reply Form */}
        <div className="modal-footer flex-col gap-2">
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <form onSubmit={handleSubmitReply} className="flex gap-2 items-center w-full">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-bracket text-xs">
              {replyImage ? 'IMG OK' : 'IMG'}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={userToken ? 'Write a reply...' : 'Login first to reply'}
              className="flex-1 text-sm"
              disabled={!userToken}
            />
            <button type="submit" disabled={isSubmitting || !userToken} className="btn-bracket glow">
              {isSubmitting ? '...' : 'SEND'}
            </button>
          </form>
          {!userToken && (
            <button onClick={onRequestIdentity} className="btn-bracket text-xs w-full">LOGIN TO REPLY</button>
          )}
        </div>
      </div>
    </div>
  );
}
