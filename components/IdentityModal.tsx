'use client';
import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (token: string) => void;
}

export default function IdentityModal({ isOpen, onClose, onLogin }: Props) {
  const [mode, setMode] = useState<'anon' | 'custom'>('anon');
  const [customId, setCustomId] = useState('');

  if (!isOpen) return null;

  const handleAnon = () => {
    const anonToken = 'anon_' + Math.random().toString(36).slice(2, 10);
    onLogin(anonToken);
  };

  const handleCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customId.trim().length < 3) return;
    onLogin(customId.trim());
  };

  return (
    <div className="modal-overlay animate-fadeIn" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>IDENTITY</h2>
          <button onClick={onClose} className="btn-bracket">X</button>
        </div>
        <div className="modal-body">
          <p className="text-dim text-xs mb-4">Choose how to identify yourself:</p>
          
          <div className="space-y-4">
            {/* Opcion Anonima */}
            <div className="terminal-box">
              <p className="text-sm mb-2">Anonymous</p>
              <p className="text-dim text-xs mb-3">Get a random ID. No registration needed.</p>
              <button onClick={handleAnon} className="btn-bracket glow">GO ANON</button>
            </div>

            {/* Opcion Custom */}
            <div className="terminal-box">
              <p className="text-sm mb-2">Custom ID</p>
              <p className="text-dim text-xs mb-3">Use your own identifier (min 3 chars).</p>
              <form onSubmit={handleCustom} className="flex gap-2">
                <input
                  type="text"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  placeholder="your_id"
                  className="flex-1 text-sm"
                  minLength={3}
                />
                <button type="submit" className="btn-bracket">SET</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
