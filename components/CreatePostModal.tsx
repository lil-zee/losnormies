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
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-black p-6 w-full max-w-md border-2 border-green-600 shadow-[8px_8px_0px_#003300]">
          <h3 className="text-xl font-bold text-green-500 mb-4 font-mono uppercase tracking-widest">POST CREATED</h3>
          <p className="text-green-800 mb-2 font-mono text-sm">SAVE THIS TOKEN TO DELETE LATER:</p>
          <div className="bg-green-900/10 p-3 border border-green-500 mb-4 font-mono text-sm break-all text-green-300 select-all">
            {deleteToken}
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(deleteToken); }}
            className="bg-black hover:bg-green-900 text-green-500 border border-green-500 px-4 py-2 w-full mb-2 font-mono uppercase"
          >
            [ COPY TOKEN ]
          </button>
          <button
            onClick={() => { onClose(); setDeleteToken(null); setText(''); setImageFile(null); setImagePreview(null); }}
            className="bg-green-600 hover:bg-green-500 text-black border-2 border-green-600 px-4 py-2 w-full font-bold font-mono uppercase shadow-[4px_4px_0px_white]"
          >
            CLOSE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-0 md:p-4" onClick={onClose}>
      <div
        className="bg-black w-full h-full md:h-auto md:max-w-md border-2 border-green-600 shadow-none md:shadow-[8px_8px_0px_#003300] flex flex-col md:max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-3 border-b-2 border-green-600 flex justify-between items-center bg-gray-900">
          <h2 className="text-base font-bold text-green-500 font-mono tracking-wider">NEW POST</h2>
          <button onClick={onClose} className="text-green-500 hover:text-white font-mono">[X]</button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4 overflow-y-auto">
          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="WRITE SOMETHING..."
              className="w-full h-24 bg-black border border-green-600 p-2 text-green-400 focus:outline-none focus:border-green-400 font-mono placeholder-green-900 resize-none text-sm"
            />
            <div className="text-[10px] text-green-800 mt-1 font-mono text-right">MARKDOWN SUPPORTED</div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1 bg-black border border-green-500 text-green-500 hover:bg-green-900 font-mono text-xs"
              >
                [ UPLOAD IMAGE ]
              </button>
              <span className="text-[10px] text-green-700 font-mono">MAX 1MB</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            {imagePreview && (
              <div className="relative mt-2 border border-green-800 bg-gray-900 w-fit max-w-full group">
                <img src={imagePreview} alt="Preview" className="max-h-32 max-w-[200px] object-contain block" />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="absolute -top-2 -right-2 bg-red-600 text-black border border-white w-6 h-6 flex items-center justify-center text-xs font-bold shadow-[2px_2px_0_black] z-10"
                >
                  X
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border border-red-900/50 p-2 bg-red-900/10">
            <input
              type="checkbox"
              id="nsfw-check"
              checked={isNSFW}
              onChange={e => setIsNSFW(e.target.checked)}
              className="accent-red-500 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="nsfw-check" className="text-red-500 font-mono text-xs cursor-pointer select-none font-bold">
              MARK AS NSFW / SPOILER
            </label>
          </div>


          {error && <div className="text-red-500 text-sm font-mono border border-red-900 p-2 bg-red-900/10">ERROR: {error}</div>}

          {deleteToken && (
            <div className="bg-green-900/20 border border-green-600 p-3">
              <p className="text-green-400 text-xs font-mono mb-1">SAVE THIS TOKEN TO DELETE LATER:</p>
              <code className="block bg-black p-1 text-green-300 font-mono text-sm select-all border border-green-900">{deleteToken}</code>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-green-900">
            {!deleteToken ? (
              <button
                type="submit"
                disabled={isLoading || (!text && !imageFile)}
                className="bg-green-600 text-black font-bold px-6 py-2 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed font-mono uppercase shadow-[4px_4px_0px_#003300]"
              >
                {isLoading ? 'UPLOADING...' : 'POST IT'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onPostCreated}
                className="bg-blue-600 text-white font-bold px-6 py-2 hover:bg-blue-500 font-mono uppercase border-2 border-white shadow-[4px_4px_0px_white]"
              >
                DONE
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
