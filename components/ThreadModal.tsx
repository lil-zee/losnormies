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
            <span className="text-dim">Loading thread...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '900px', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <h2>Thread #{thread.shortId}</h2>
            <span className="text-dim text-xs">{thread.replies?.length || 0} replies</span>
          </div>
          <button onClick={onClose} className="btn-bracket">CLOSE</button>
        </div>
        
        {/* Thread Content */}
        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          {/* OP Post */}
          <div className="mb-6 pb-4 border-b-2 border-[var(--matrix-green-dim)]">
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-[var(--matrix-green-bright)] font-bold">#{thread.shortId}</span>
              <span className="text-dim text-xs">{new Date(thread.createdAt).toLocaleString()}</span>
              <span className="text-dim text-xs">(OP)</span>
            </div>
            
            {thread.imageUrl && (
              <div className="mb-4">
                <img 
                  src={thread.imageUrl} 
                  alt="" 
                  className="max-w-full max-h-96 border border-[var(--matrix-green)]"
                />
              </div>
            )}
            
            {thread.text && (
              <div className="text-sm text-gray-200 font-mono">
                <MarkdownContent content={thread.text} />
              </div>
            )}
          </div>

          {/* Replies */}
          {thread.replies && thread.replies.length > 0 ? (
            <div className="space-y-4">
              {thread.replies.map((reply, idx) => (
                <div key={reply.id} className="border-l-2 border-[var(--matrix-green-dim)] pl-4 hover:border-[var(--matrix-green)] transition-colors">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-[var(--matrix-green-bright)] text-sm font-bold">
                      Anonymous
                    </span>
                    <span className="text-dim text-xs">{relativeTime(reply.createdAt)}</span>
                    <span className="text-dim text-xs">No.{idx + 1}</span>
                  </div>
                  
                  {reply.imageUrl && (
                    <img 
                      src={reply.imageUrl} 
                      alt="" 
                      className="max-h-48 mb-2 border border-[var(--matrix-green-dim)]"
                    />
                  )}
                  
                  {reply.text && (
                    <div className="text-sm text-gray-300 font-mono">
                      <MarkdownContent content={reply.text} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-dim text-sm text-center py-8 border border-dashed border-[var(--border-color)]">
              No replies yet. Be the first to reply!
            </p>
          )}
        </div>

        {/* Reply Form */}
        <div className="modal-footer flex-col gap-3 border-t-2 border-[var(--matrix-green-dim)]">
          {!userToken && (
            <div className="w-full text-center">
              <button onClick={onRequestIdentity} className="btn-bracket glow">
                LOGIN TO REPLY
              </button>
            </div>
          )}
          
          {error && <p className="text-red-500 text-xs w-full">{error}</p>}
          
          <form onSubmit={handleSubmitReply} className="w-full space-y-2">
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="btn-bracket text-xs flex-shrink-0"
                disabled={!userToken}
              >
                {replyImage ? 'IMG ✓' : 'ADD IMG'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={userToken ? 'Write your reply...' : 'Login first to reply'}
                className="flex-1 text-sm resize-none h-20"
                disabled={!userToken}
              />
            </div>
            
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={isSubmitting || !userToken || (!replyText.trim() && !replyImage)} 
                className="btn-bracket glow"
              >
                {isSubmitting ? 'POSTING...' : 'POST REPLY'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
