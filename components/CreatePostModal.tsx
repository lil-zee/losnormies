'use client';
import { useState, useRef } from 'react';
import { compressImage } from '@/utils/imageCompression';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  x: number; // Legacy prop, can be ignored or defaulted
  y: number; // Legacy prop
  onPostCreated?: () => void;
  userToken?: string | null;
}

export default function CreatePostModal({ isOpen, onClose, onPostCreated, userToken }: Props) {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNSFW, setIsNSFW] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const compressed = await compressImage(file);
      setImageFile(compressed);
      setImagePreview(URL.createObjectURL(compressed));
    } catch (err) {
      console.error("Compression failed", err);
      // Fallback to original file if compression fails
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!text && !imageFile) { 
      setError('You must provide either text or an image to start a thread.'); 
      return; 
    }

    setIsLoading(true);

    try {
      let imageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        
        const uploadRes = await fetch('/api/upload', { 
          method: 'POST', 
          body: formData 
        });
        
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Image upload failed');
        imageUrl = uploadData.url;
      }

      // We default x/y to 0 since the canvas concept is deprecated for the grid view
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(userToken ? { 'x-user-token': userToken } : {}) 
        },
        body: JSON.stringify({ 
          x: 0, 
          y: 0, 
          text: text.trim() || undefined, 
          imageUrl, 
          isNSFW 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create thread');

      // Success
      if (onPostCreated) onPostCreated();
      onClose(); // Auto close on success

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[3000] flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-black border border-[var(--matrix-green)] w-full max-w-md shadow-[0_0_30px_rgba(0,255,65,0.15)] flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between p-3 border-b border-[var(--matrix-green-dim)] bg-[var(--bg-dark)]">
          <h2 className="text-[var(--matrix-green-bright)] font-bold tracking-wider">NEW THREAD</h2>
          <button onClick={onClose} className="btn-bracket text-xs hover:text-white">CLOSE [X]</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          
          {/* IMAGE UPLOAD AREA */}
          <div 
            className={'border-2 border-dashed p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--bg-dark)] transition-colors min-h-[120px] ' + (imagePreview ? 'border-[var(--matrix-green)]' : 'border-[var(--border-color)]')}
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <div className="relative w-full flex justify-center">
                <img src={imagePreview} alt="Preview" className="max-h-48 object-contain" />
                <div className="absolute top-0 right-0 bg-black/80 text-xs px-2 py-1 text-white">CHANGE</div>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-[var(--matrix-green)] text-2xl mb-2 block">+</span>
                <span className="text-dim text-sm">Click to upload Image</span>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>

          {/* TEXT AREA */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Thread content / commentary..."
            className="w-full h-32 bg-black border border-[var(--border-color)] p-3 text-sm focus:border-[var(--matrix-green)] outline-none resize-none font-mono text-gray-300"
          />

          {/* OPTIONS */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={isNSFW} 
                onChange={e => setIsNSFW(e.target.checked)} 
                className="accent-[var(--matrix-green)]"
              />
              <span className={'text-xs ' + (isNSFW ? 'text-red-500 font-bold' : 'text-dim')}>Mark as NSFW (18+)</span>
            </label>
          </div>

          {/* ERROR DISPLAY */}
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 p-2 text-red-400 text-xs items-center justify-center flex">
              {error}
            </div>
          )}

          {/* FOOTER ACTIONS */}
          <div className="flex justify-end pt-2 border-t border-[var(--border-color)] mt-2">
             <button type="button" onClick={onClose} className="btn-bracket mr-2 text-xs">CANCEL</button>
             <button 
               type="submit" 
               disabled={isLoading || (!text && !imageFile)} 
               className="btn-bracket glow px-6 py-2 font-bold text-sm"
             >
               {isLoading ? 'POSTING...' : 'START THREAD'}
             </button>
          </div>

        </form>
      </div>
    </div>
  );
}
