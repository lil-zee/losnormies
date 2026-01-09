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

  // Load Full Thread Data
  const loadThread = async () => {
    try {
      const res = await fetch('/api/posts/' + post.id);
      if (!res.ok) throw new Error('Failed to load thread');
      const data = await res.json();
      setThread(data);
    } catch (e) {
      console.error(e);
      // Fallback to prop data if fetch fails
      setThread(post);
    }
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
    if (!replyText.trim() && !replyImage) { setError('Text or image needed'); return; }
    if (!userToken) { onRequestIdentity?.(); return; }
    
    setIsSubmitting(true);
    try {
      let imageUrl = null;
      if (replyImage) {
        const formData = new FormData();
        formData.append('file', replyImage);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
        imageUrl = uploadData.url;
      }
      
      const res = await fetch('/api/posts/' + post.id + '/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': userToken },
        body: JSON.stringify({ text: replyText.trim() || undefined, imageUrl }),
      });
      
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Reply failed');
      }
      
      setReplyText('');
      setReplyImage(null);
      loadThread(); // Reload to show new reply
    } catch (err: any) { 
      setError(err.message || 'Error posting reply'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  if (!thread) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[2000] flex items-center justify-center p-4 md:p-8 animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-black border border-[var(--matrix-green)] w-full max-w-6xl h-[85vh] flex flex-col md:flex-row overflow-hidden shadow-[0_0_20px_rgba(0,255,65,0.2)]" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* LEFT COLUMN: Image & OP (Desktop) */}
        <div className="hidden md:flex flex-col w-1/2 border-r border-[var(--matrix-green-dim)] bg-[var(--bg-dark)] p-4 overflow-y-auto">
           {thread.imageUrl ? (
             <div className="mb-4">
               <a href={thread.imageUrl} target="_blank" rel="noreferrer">
                 <img src={thread.imageUrl} alt="" className="w-full object-contain max-h-[60vh] border border-[var(--border-color)]" />
               </a>
             </div>
           ) : (
             <div className="w-full h-64 flex items-center justify-center border border-dashed border-[var(--border-color)] mb-4">
               <span className="text-dim">NO IMAGE</span>
             </div>
           )}
           <div className="mt-2">
             <div className="flex items-baseline gap-2 mb-2">
               <span className="text-[var(--matrix-green-bright)] text-lg font-bold">#{thread.shortId}</span>
               <span className="text-dim text-sm">{new Date(thread.createdAt).toLocaleString()}</span>
             </div>
             {thread.text && (
               <div className="text-base text-gray-200 font-mono whitespace-pre-wrap">
                 <MarkdownContent content={thread.text} />
               </div>
             )}
           </div>
        </div>

        {/* RIGHT COLUMN: Replies & Mobile View */}
        <div className="flex-1 flex flex-col h-full bg-black">
          
          {/* Header Mobile Only */}
          <div className="md:hidden p-2 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-dark)]">
             <span className="text-[var(--matrix-green-bright)] font-bold">#{thread.shortId}</span>
             <button onClick={onClose} className="btn-bracket text-xs">CLOSE</button>
          </div>

          {/* Header Desktop */}
          <div className="hidden md:flex p-3 border-b border-[var(--border-color)] justify-between items-center bg-[var(--bg-dark)]">
            <h3 className="text-[var(--matrix-green)] font-bold">REPLIES ({thread.replies?.length || 0})</h3>
            <button onClick={onClose} className="btn-bracket hover:text-white">CLOSE [X]</button>
          </div>

          {/* Mobile OP View (Scrollable with replies) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* OP Content for Mobile */}
            <div className="md:hidden mb-6 pb-4 border-b border-[var(--matrix-green-dim)]">
              {thread.imageUrl && <img src={thread.imageUrl} className="w-full mb-2 border border-[var(--border-color)]" />}
              {thread.text && <div className="text-sm font-mono"><MarkdownContent content={thread.text} /></div>}
            </div>

            {/* Replies List */}
            {thread.replies?.map((reply, idx) => (
              <div key={reply.id} className="bg-[var(--bg-dark)] border border-[var(--border-color)] p-3 hover:border-[var(--matrix-green-dim)] transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 text-xs">
                    <span className="text-[var(--matrix-green-bright)] font-bold">Anom</span>
                    <span className="text-dim">{relativeTime(reply.createdAt)}</span>
                    <span className="text-dim">No.{idx + 1}</span>
                  </div>
                  <span className="text-[10px] text-dim font-mono">ID:{reply.id.slice(0,6)}</span>
                </div>
                
                {reply.imageUrl && (
                  <div className="mb-2">
                    <a href={reply.imageUrl} target="_blank" rel="noreferrer">
                      <img src={reply.imageUrl} className="max-h-32 object-contain border border-[var(--border-color)]" />
                    </a>
                  </div>
                )}
                
                {reply.text && (
                  <div className="text-sm text-gray-300 font-mono break-words">
                    <MarkdownContent content={reply.text} />
                  </div>
                )}
              </div>
            ))}
            
            {(!thread.replies || thread.replies.length === 0) && (
              <div className="text-center py-8 text-dim text-sm italic">
                No replies yet.
              </div>
            )}
          </div>

          {/* Reply Form (Fixed at bottom) */}
          <div className="p-3 border-t border-[var(--matrix-green)] bg-[var(--bg-dark)]">
            {error && <div className="text-red-500 text-xs mb-2 bg-black/50 p-1">{error}</div>}
            
            {!userToken ? (
              <button onClick={onRequestIdentity} className="w-full btn-bracket glow py-2 text-center">
                LOGIN TO REPLY
              </button>
            ) : (
              <form onSubmit={handleSubmitReply} className="flex gap-2">
                 <button 
                   type="button" 
                   onClick={() => fileInputRef.current?.click()} 
                   className={tn-bracket text-xs px-2 }
                 >
                   {replyImage ? 'IMG!' : 'IMG'}
                 </button>
                 <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                 
                 <input
                   type="text"
                   value={replyText}
                   onChange={(e) => setReplyText(e.target.value)}
                   placeholder="Reply to thread..."
                   className="flex-1 bg-black border border-[var(--border-color)] px-2 py-1 text-sm focus:border-[var(--matrix-green)] outline-none"
                   disabled={isSubmitting}
                 />
                 
                 <button 
                   type="submit" 
                   disabled={isSubmitting || (!replyText && !replyImage)}
                   className="btn-bracket glow px-4 text-sm font-bold"
                 >
                   {isSubmitting ? '...' : '>>'}
                 </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
