'use client';
import { useState, useRef } from 'react';
import { compressImage } from '@/utils/imageCompression';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  x: number;
  y: number;
  onPostCreated?: () => void;
  userToken?: string | null;
}

export default function CreatePostModal({ isOpen, onClose, x, y, onPostCreated, userToken }: Props) {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleteToken, setDeleteToken] = useState<string | null>(null);
  const [isNSFW, setIsNSFW] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setImageFile(compressed);
    setImagePreview(URL.createObjectURL(compressed));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text && !imageFile) { setError('Add text or image'); return; }
    setIsLoading(true);
    setError('');
    try {
      let imageUrl = null;
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error);
        imageUrl = uploadData.url;
      }
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(userToken ? { 'x-user-token': userToken } : {}) },
        body: JSON.stringify({ x, y, text: text || undefined, imageUrl, isNSFW }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeleteToken(data.deleteToken);
      if (onPostCreated) onPostCreated();
    } catch (err: any) {
      setError(err.message || 'Failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (deleteToken) {
    return (
      <div className="modal-overlay animate-fadeIn" onClick={onClose}>
        <div className="modal-box" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>POST CREATED</h2>
            <button onClick={onClose} className="btn-bracket">X</button>
          </div>
          <div className="modal-body">
            <p className="text-dim mb-2">Delete token (save this):</p>
            <div className="terminal-box text-xs break-all select-all mb-4">{deleteToken}</div>
          </div>
          <div className="modal-footer">
            <button onClick={() => { onClose(); setDeleteToken(null); setText(''); setImageFile(null); setImagePreview(null); }} className="btn-bracket glow">OK</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>NEW POST</h2>
          <button onClick={onClose} className="btn-bracket">X</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              className="w-full h-24 resize-none mb-3"
            />
            <div className="flex gap-4 items-center mb-3">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-bracket">ATTACH</button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              {imagePreview && <span className="text-dim text-xs">Image attached</span>}
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={isNSFW} onChange={e => setIsNSFW(e.target.checked)} />
                NSFW
              </label>
            </div>
            {imagePreview && <img src={imagePreview} className="max-h-24 border border-[var(--matrix-green-dim)] mb-3" />}
            {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn-bracket">CANCEL</button>
            <button type="submit" disabled={isLoading || (!text && !imageFile)} className="btn-bracket glow">
              {isLoading ? 'SENDING...' : 'POST'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
