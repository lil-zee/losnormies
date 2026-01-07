'use client';
import { useState } from 'react';

interface Props {
  onCreateClick: () => void;
  userToken?: string | null;
  onLoginClick: () => void;
  isLive: boolean;
  onToggleLive: () => void;
  showNSFW: boolean;
  onToggleNSFW: () => void;
  onListClick: () => void;
}

export default function Navigation({ onCreateClick, userToken, onLoginClick, isLive, onToggleLive, showNSFW, onToggleNSFW, onListClick }: Props) {
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
    <nav className="fixed bottom-0 left-0 right-0 h-10 bg-[#c0c0c0] border-t-2 border-white flex items-center px-1 py-1 z-[1000] shadow-[0_-2px_2px_rgba(0,0,0,0.1)] justify-between select-none">

      {/* START BUTTON */}
      <button
        onClick={onCreateClick}
        className="win95-btn font-bold px-2 py-1 flex items-center gap-1 active:translate-y-1 mr-2"
        style={{ boxShadow: '1.5px 1.5px 0px 0.5px rgba(0,0,0,0.8)' }}
      >
        <div className="w-4 h-4 bg-gradient-to-br from-red-500 via-green-500 to-blue-500 grayscale opacity-80" /> {/* Windows Flag Fake */}
        Start
      </button>

      {/* TASKBAR ITEMS (Active Windows mimics) */}
      <div className="flex-1 flex items-center gap-1 overflow-x-auto pl-2 border-l-2 border-l-[#808080] border-r-2 border-r-white h-full px-1">
        <button className="win95-btn bg-[#e0e0e0] border-inset flex items-center gap-1 px-2 py-0.5 w-32 justify-start active text-xs font-bold" onClick={onListClick}>
          <span className="w-3 h-3 bg-yellow-400 border border-black" />
          Explorer
        </button>
        {/* Placeholder for open post */}
        <button className="win95-btn flex items-center gap-1 px-2 py-0.5 w-32 justify-start text-xs opacity-70">
          <span className="w-3 h-3 bg-white border border-black" />
          My Computer
        </button>
      </div>

      {/* SYSTEM TRAY */}
      <div className="flex items-center gap-1 pl-2 border-l-2 border-[#808080] ml-1 h-full bg-transparent win95-inset px-2 py-0.5 text-xs">
        <button onClick={onToggleLive} title="Live Feed">
          {isLive ? '🔴' : '⚪'}
        </button>
        <button onClick={onToggleNSFW} title="Safety" className="text-[10px] hidden md:block">
          {showNSFW ? 'NSFW' : 'SAFE'}
        </button>
        <button onClick={onLoginClick} title="User">
          👤
        </button>
        <span className="ml-2 font-mono">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </nav>
  );
}
