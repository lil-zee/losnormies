'use client';
import { useState } from 'react';

interface Props {
  onCreateClick: () => void;
  currentZoom: number;
  onZoomChange: (delta: number) => void;
}

export default function Navigation({ onCreateClick, currentZoom, onZoomChange }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.startsWith('admin:')) {
      const token = searchTerm.split(':')[1];
      if (token) {
        localStorage.setItem('adminToken', token);
        alert('ADMIN MODE ACTIVATED');
        window.location.reload();
      }
      return;
    }
    if (searchTerm === 'logout') {
      localStorage.removeItem('adminToken');
      alert('LOGGED OUT');
      window.location.reload();
      return;
    }
    console.log('Search:', searchTerm);
    // TODO: Implement actual search filters
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-black border-b-2 border-green-500 flex items-center px-4 justify-between z-40 relative">
      <div className="flex items-center gap-4">
        {/* Title centered absolutely with retro font */}
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-bold tracking-tighter font-mono uppercase select-none pointer-events-none"
          style={{
            color: '#fff',
            textShadow: '0 0 10px #00ff41, 0 0 20px #00ff41, 0 0 40px #00ff41'
          }}>
          LOS NORMIES
        </h1>

        <form onSubmit={handleSearch} className="flex-1 max-w-xs relative z-10">
          <input
            type="text"
            placeholder="SEARCH..."
            className="w-full bg-black border-2 border-green-600 text-green-400 px-2 py-1 focus:outline-none focus:bg-green-900/20 font-mono text-sm placeholder-green-800"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </form>
      </div>
      <div className="flex gap-2 z-10">
        <button
          onClick={() => {
            const token = localStorage.getItem('adminToken');
            if (token) {
              localStorage.removeItem('adminToken');
              window.location.reload();
            } else {
              const secret = prompt('ENTER ADMIN SECRET:');
              if (secret) {
                localStorage.setItem('adminToken', secret);
                window.location.reload();
              }
            }
          }}
          className="retro-button px-2 py-1 text-sm bg-black text-green-700 border-green-800 hover:text-green-500 hover:border-green-500"
          title="Admin Mode"
        >
          {typeof window !== 'undefined' && localStorage.getItem('adminToken') ? '[LOGOUT]' : '[KEY]'}
        </button>
        <button
          onClick={onCreateClick}
          className="retro-button px-4 py-1 text-sm"
        >
          [ NEW POST ]
        </button>
      </div>
    </nav>
  );
}
