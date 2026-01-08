'use client';

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
  return (
    <nav className="nav-bar">
      <div className="nav-left">
        <button onClick={onCreateClick} className="btn-bracket glow">NEW</button>
        <button onClick={onListClick} className="btn-bracket">LIST</button>
      </div>
      <div className="nav-right">
        <button onClick={onToggleLive} className="btn-bracket">
          {isLive ? 'LIVE ON' : 'LIVE OFF'}
        </button>
        <button onClick={onToggleNSFW} className="btn-bracket">
          {showNSFW ? 'NSFW' : 'SAFE'}
        </button>
        <button onClick={onLoginClick} className="btn-bracket">
          {userToken ? 'USER' : 'LOGIN'}
        </button>
        <span className="text-dim">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </nav>
  );
}
