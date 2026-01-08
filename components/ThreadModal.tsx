'use client';
import { useState, useRef, useEffect } from 'react';
import { compressImage } from '@/utils/imageCompression';
import MarkdownContent from './MarkdownContent';

interface Reply { id: string; text?: string; imageUrl?: string; createdAt: string; }
interface Post { id: string; shortId: string; text?: string; imageUrl?: string; createdAt: string; replies?: Reply[]; }
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
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/posts/' + post.id).then(r => r.json()).then(d => setThread(d)).catch(console.error);
  }, [post.id]);

  const formatTime = (d: string) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setReplyImage(compressed);
    setReplyImagePreview(URL.createObjectURL(compressed));
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText && !replyImage) return;
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
      await fetch('/api/posts/' + post.id + '/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': userToken },
        body: JSON.stringify({ text: replyText || undefined, imageUrl }),
      });
      setReplyText('');
      setReplyImage(null);
      setReplyImagePreview(null);
      const refreshed = await fetch('/api/posts/' + post.id).then(r => r.json());
      setThread(refreshed);
    } catch (err) { console.error(err); }
    finally { setIsSubmitting(false); }
  };

  if (!thread) return null;

  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>THREAD: {thread.shortId}</h2>
          <button onClick={onClose} className="btn-bracket">X</button>
        </div>
        <div className="modal-body">
          <div className="irc-message mb-4 pb-4 border-b border-[var(--border-color)]">
            <span className="irc-timestamp">{formatTime(thread.createdAt)}</span>
            <span className="irc-user">{thread.shortId}</span>
            <div className="irc-content">
              {thread.text && <MarkdownContent content={thread.text} />}
              {thread.imageUrl && <img src={thread.imageUrl} className="max-h-48 mt-2 border border-[var(--matrix-green-dim)]" />}
            </div>
          </div>
          <div className="text-dim text-xs mb-2">-- REPLIES ({thread.replies?.length || 0}) --</div>
          {thread.replies?.map((r) => (
            <div key={r.id} className="irc-message">
              <span className="irc-timestamp">{formatTime(r.createdAt)}</span>
              <span className="irc-user" style={{ color: '#' + r.id.slice(0,6) }}>{r.id.slice(0,8)}</span>
              <div className="irc-content">
                {r.text && <MarkdownContent content={r.text} />}
                {r.imageUrl && <img src={r.imageUrl} className="max-h-24 mt-1 border border-[var(--matrix-green-dim)]" />}
              </div>
            </div>
          ))}
          {(!thread.replies || thread.replies.length === 0) && <div className="text-dim text-xs py-2">No replies yet.</div>}
        </div>
        <div className="modal-footer flex-col items-stretch gap-2">
          <form onSubmit={handleSubmitReply} className="flex gap-2 items-center">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-bracket">IMG</button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Reply..."
              className="flex-1"
            />
            <button type="submit" disabled={isSubmitting} className="btn-bracket glow">{isSubmitting ? '...' : 'SEND'}</button>
          </form>
          {replyImagePreview && <div className="text-dim text-xs">Image attached <button onClick={() => { setReplyImage(null); setReplyImagePreview(null); }} className="text-red-500">[X]</button></div>}
        </div>
      </div>
    </div>
  );
}
