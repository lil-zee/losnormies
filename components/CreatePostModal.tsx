'use client';
import { useState, useRef } from 'react';
import { compressImage } from '@/utils/imageCompression';
import MarkdownContent from './MarkdownContent';

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
    if (!text && !imageFile) {
      setError('Please add text or image');
      return;
    }

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
        headers: {
          'Content-Type': 'application/json',
          ...(userToken ? { 'x-user-token': userToken } : {})
        },
        body: JSON.stringify({ x, y, text: text || undefined, imageUrl, isNSFW }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDeleteToken(data.deleteToken);
      if (onPostCreated) onPostCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  if (deleteToken) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto bg-black/20 backdrop-blur-[2px]">
        <div className="win95-window w-80 shadow-xl">
          <div className="win95-title-bar mb-2">
            <span>Success</span>
            <button onClick={onClose} className="win95-btn leading-none p-0 w-4 h-4">X</button>
          </div>
          <div className="p-2 text-center text-sm">
            <div className="flex items-center gap-2 mb-4 justify-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-serif italic text-xl flex items-center justify-center border-2 border-white shadow-md">i</div>
              <p>Post created successfully.</p>
            </div>

            <p className="mb-1 text-xs text-gray-600">Delete Token (Save this):</p>
            <div className="win95-inset bg-white p-1 select-all font-mono text-xs mb-4">
              {deleteToken}
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => { onClose(); setDeleteToken(null); setText(''); setImageFile(null); setImagePreview(null); }}
                className="win95-btn px-4 py-1 font-bold"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-teal-800/20 backdrop-blur-[1px]">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div className="win95-window w-full max-w-md relative shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Title Bar */}
        <div className="win95-title-bar mb-1">
          <div className="flex items-center gap-1">
            <img src="/floppy.png" className="w-4 h-4" alt="" />
            <span>New Post</span>
          </div>
          <button onClick={onClose} className="win95-btn w-4 h-4 p-0 leading-none">X</button>
        </div>

        {/* Menu Bar */}
        <div className="flex gap-3 text-xs px-2 mb-2">
          <span className="underline">F</span>ile
          <span className="underline">E</span>dit
          <span className="underline">O</span>ptions
        </div>

        <form onSubmit={handleSubmit} className="p-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full h-32 win95-inset p-2 text-sm font-sans resize-none focus:outline-none mb-2 bg-white text-black"
          />

          <div className="grid grid-cols-[auto_1fr] gap-4 mb-4">
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="win95-btn px-3 py-1 text-xs"
              >
                Attach Image...
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

              <label className="flex items-center gap-1 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isNSFW}
                  onChange={e => setIsNSFW(e.target.checked)}
                  className="accent-black"
                />
                <span>NSFW</span>
              </label>
            </div>

            <div className="win95-inset bg-white p-1 h-20 flex items-center justify-center bg-gray-100">
              {imagePreview ? (
                <div className="relative h-full w-full group">
                  <img src={imagePreview} className="h-full w-full object-contain" />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-0 right-0 bg-red-600 text-white w-4 h-4 leading-none flex items-center justify-center text-xs"
                  >
                    x
                  </button>
                </div>
              ) : (
                <span className="text-gray-400 text-xs italic">No image selected</span>
              )}
            </div>
          </div>

          {error && <div className="text-red-600 text-xs mb-2 text-center bg-red-100 border border-red-300 p-1">{error}</div>}

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-400">
            <button
              type="button"
              onClick={onClose}
              className="win95-btn px-4 py-1 min-w-[80px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (!text && !imageFile)}
              className="win95-btn px-4 py-1 font-bold min-w-[80px] disabled:text-gray-500"
            >
              {isLoading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
