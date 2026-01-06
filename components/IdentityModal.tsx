'use client';
import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (token: string) => void;
}

export default function IdentityModal({ isOpen, onClose, onLogin }: Props) {
  const [inputToken, setInputToken] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputToken.trim()) return;
    onLogin(inputToken.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4">
      <div className="bg-black border-2 border-green-600 p-6 w-full max-w-sm shadow-[8px_8px_0px_#003300]">
        <h2 className="text-xl font-bold text-green-500 mb-4 font-mono uppercase tracking-widest text-center">
          SYSTEM ACCESS
        </h2>
        <div className="mb-6 text-green-800 font-mono text-xs text-center">
          ENTER YOUR IDENTITY TOKEN TO PROCEED.
          <br />
          (ANY STRING WILL WORK AS A NEW ID)
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            value={inputToken}
            onChange={(e) => setInputToken(e.target.value)}
            placeholder="CODENAME / TOKEN"
            className="bg-black border border-green-600 p-3 text-green-400 focus:outline-none focus:border-green-400 font-mono text-center uppercase tracking-widest"
            autoFocus
          />
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-black text-green-600 border border-green-600 py-2 font-mono hover:bg-green-900"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex-1 bg-green-600 text-black font-bold py-2 font-mono hover:bg-green-500 shadow-[4px_4px_0px_white]"
            >
              LOGIN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
