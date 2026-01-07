'use client';
import { useState } from 'react';

interface Props {
  onCreateClick: () => void;
  currentZoom: number;
  onZoomChange: (delta: number) => void;
  userToken?: string | null;
  onLoginClick: () => void;
  isLive: boolean;
  onToggleLive: () => void;
  showNSFW: boolean;
  onToggleNSFW: () => void;
  onListClick: () => void;
}

export default function Navigation({ onCreateClick, currentZoom, onZoomChange, userToken, onLoginClick, isLive, onToggleLive, showNSFW, onToggleNSFW, onListClick }: Props) {
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
    <nav className="fixed top-0 left-0 right-0 h-14 bg-black/90 backdrop-blur-md border-b border-green-900/50 z-[100] px-4 flex items-center gap-3 shadow-[0_2px_20px_rgba(0,255,65,0.1)] justify-between relative">
      <div className="flex items-center gap-4">
        {/* Title centered absolutely with retro font */}
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl md:text-4xl font-bold tracking-tighter font-mono uppercase select-none pointer-events-none whitespace-nowrap"
          style={{
            color: '#fff',
            textShadow: '0 0 10px #00ff41, 0 0 20px #00ff41, 0 0 40px #00ff41'
          }}>
          LOS NORMIES
        </h1>

        <form onSubmit={handleSearch} className="flex-1 max-w-xs relative z-10 hidden md:block">
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
          onClick={onToggleNSFW}
          className={`retro-button px-3 py-1.5 text-sm transition-all duration-300 ${showNSFW ? 'bg-red-900 text-red-400 glow-sm' : 'text-gray-600 border-gray-700 hover:border-red-900'}`}
          title="Toggle NSFW Content"
        >
          <span className="hidden md:inline">[ NSFW: {showNSFW ? 'ON' : 'OFF'} ]</span>
          <span className="md:hidden">{showNSFW ? '[!]' : '[safe]'}</span>
        </button>
        <button
          onClick={onToggleLive}
          className={`px-2 py-1 transition-all duration-300 hover:scale-110 ${isLive ? 'opacity-100 drop-shadow-[0_0_8px_#00ff41]' : 'opacity-40 grayscale'}`}
          title={isLive ? "LIVE FEED: ON" : "LIVE FEED: OFF"}
        >
          <img src="/eye.png" alt="Live Feed" className="w-10 h-6 object-contain" />
        </button>
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
          onClick={onLoginClick}
          className="retro-button px-2 py-1 text-sm bg-black text-blue-500 border-blue-900 hover:text-blue-400 hover:border-blue-500"
          title="Identity"
        >
          {userToken ? (
            <>
              <span className="hidden md:inline">[ID:{userToken.substring(0, 6)}]</span>
              <span className="md:hidden">[ID]</span>
            </>
          ) : '[LOGIN]'}
        </button>
        <button
          onClick={onListClick}
          className="px-2 py-1 hover:scale-110 transition-transform duration-200"
          title="Archive List"
        >
          <img src="/folder.png" alt="List View" className="w-8 h-8 object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" />
        </button>
        <button
          onClick={onCreateClick}
          className="px-2 py-1 hover:scale-110 hover:-rotate-6 transition-all duration-200 group relative"
          title="New Post"
        >
          <div className="absolute -inset-2 bg-green-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          <img src="/floppy.png" alt="New Post" className="w-9 h-9 object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] relative z-10" />
        </button>
      </div>
    </nav>
  );
}
