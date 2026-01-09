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
  const [thread, setThread] = useState<Post>(post); 
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [replyImage, setReplyImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadThread = async () => {
    try {
      const res = await fetch('/api/posts/' + post.id);
      if (!res.ok) throw new Error('Failed to load thread');
      const data = await res.json();
      setThread(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
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
    if (!replyText.trim() && !replyImage) return;
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
      
      await fetch('/api/posts/' + post.id + '/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-token': userToken },
        body: JSON.stringify({ text: replyText.trim() || undefined, imageUrl }),
      });
      
      setReplyText('');
      setReplyImage(null);
      loadThread(); 
    } catch (err) { 
      console.error(err);
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[2000] flex justify-center animate-fadeIn overflow-y-auto" onClick={onClose}>
      <div 
        className="w-full max-w-4xl min-h-screen bg-[var(--bg-dark)] border-x border-[var(--border-color)] flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,1)]" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* HEADER FIXED */}
        <div className="sticky top-0 z-50 bg-black/95 border-b-2 border-[var(--matrix-green)] p-3 flex justify-between items-center backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="text-[var(--matrix-green-bright)] text-xl font-bold">THREAD #{thread.shortId}</span>
            <span className="text-dim text-xs hidden sm:inline">{new Date(thread.createdAt).toLocaleString()}</span>
          </div>
          <button onClick={onClose} className="btn-bracket text-lg font-bold hover:text-red-500 transition-colors">
            CLOSE [X]
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 p-4 pb-32"> {/* pb-32 para dejar espacio al form fijo */}
          
          {/* --- OP POST MAIN SECTION --- */}
          <div className="mb-8 p-4 bg-black border border-[var(--matrix-green-dim)] relative">
            <div className="absolute -top-3 left-4 bg-black px-2 text-[var(--matrix-green-bright)] font-bold text-sm">
              OP (ORIGINAL POSTER)
            </div>
            
            {/* LARGE IMAGE VIEW */}
            {thread.imageUrl && (
              <div className="mb-4 flex justify-center bg-[#050505] border border-[var(--border-color)] p-1">
                 <img 
                   src={thread.imageUrl} 
                   alt="OP Image" 
                   className="max-h-[70vh] w-auto max-w-full object-contain"
                 />
              </div>
            )}
            
            {/* OP TEXT */}
            {thread.text && (
              <div className="text-lg text-gray-100 font-mono leading-relaxed whitespace-pre-wrap break-words border-l-4 border-[var(--matrix-green)] pl-4 py-2">
                <MarkdownContent content={thread.text} />
              </div>
            )}
          </div>
          {/* --------------------------- */}

          {/* REPLIES SECTION */}
          {thread.replies && thread.replies.length > 0 && (
             <div className="space-y-4">
               <div className="text-dim text-sm mb-2 border-b border-[var(--border-color)] pb-1">
                 REPLIES ({thread.replies.length})
               </div>
               
               {thread.replies.map((reply, idx) => (
                 <div key={reply.id} className="bg-[#0a0a0a] border border-[var(--border-color)] p-4 hover:border-[var(--matrix-green-dim)] transition-colors">
                    <div className="flex justify-between text-xs mb-2 text-dim">
                      <span className="text-[var(--matrix-green)] font-bold">Anonymous {idx + 1}</span>
                      <span>{relativeTime(reply.createdAt)}</span>
                    </div>

                    {reply.imageUrl && (
                      <div className="mb-2">
                        <img src={reply.imageUrl} className="max-h-60 border border-[var(--border-color)]" />
                      </div>
                    )}

                    {reply.text && (
                      <div className="text-sm font-mono text-gray-300 break-words">
                        <MarkdownContent content={reply.text} />
                      </div>
                    )}
                 </div>
               ))}
             </div>
          )}

          {(!thread.replies || thread.replies.length === 0) && !isLoading && (
            <div className="text-center py-12 border border-dashed border-[var(--border-color)] text-dim">
              No answers yet. Be the first to break the silence.
            </div>
          )}
        </div>

        {/* FOOTER REPLY FORM (FIXED) */}
        <div className="fixed bottom-0 left-0 right-0 md:relative md:bottom-auto w-full max-w-4xl mx-auto bg-black border-t-2 border-[var(--matrix-green)] p-3 shadow-lg z-50">
          {!userToken ? (
             <button onClick={onRequestIdentity} className="w-full btn-bracket glow py-3 font-bold text-center">
               [ LOGIN TO REPLY ]
             </button>
          ) : (
             <form onSubmit={handleSubmitReply} className="flex gap-2 items-end">
                <div className="flex flex-col gap-1">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()} 
                    className={'btn-bracket h-12 w-12 flex items-center justify-center ' + (replyImage ? 'text-[var(--matrix-green-bright)] border-[var(--matrix-green-bright)]' : '')}
                  >
                    {replyImage ? 'IMG' : '+'}
                  </button>
                </div>
                
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  className="flex-1 bg-[#111] border border-[var(--border-color)] p-2 h-12 text-sm focus:border-[var(--matrix-green)] outline-none resize-none font-mono"
                  disabled={isSubmitting}
                />
                
                <button 
                  type="submit" 
                  disabled={isSubmitting || (!replyText && !replyImage)}
                  className="btn-bracket glow h-12 px-6 font-bold text-sm"
                >
                  {isSubmitting ? '...' : 'SEND'}
                </button>
             </form>
          )}
          {/* Safe area for mobile navigation bars */}
          <div className="h-4 md:hidden"></div>
        </div>
      </div>
    </div>
  );
}
