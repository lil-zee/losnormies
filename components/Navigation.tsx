'use client';
import { useState, useEffect } from 'react';

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

interface CryptoPrices {
  bitcoin: number;
  ethereum: number;
  solana: number;
}

export default function Navigation({ onCreateClick, userToken, onLoginClick, isLive, onToggleLive, showNSFW, onToggleNSFW, onListClick }: Props) {
  const [prices, setPrices] = useState<CryptoPrices | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');
        const data = await res.json();
        setPrices({
          bitcoin: data.bitcoin?.usd || 0,
          ethereum: data.ethereum?.usd || 0,
          solana: data.solana?.usd || 0,
        });
      } catch (err) {
        console.error('Failed to fetch crypto prices', err);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (p: number) => {
    if (p >= 1000) return (p / 1000).toFixed(1) + 'k';
    return p.toFixed(0);
  };

  return (
    <nav className="nav-bar">
      <div className="nav-left">
        <button onClick={onCreateClick} className="btn-bracket glow">NEW</button>
        <button onClick={onToggleLive} className="btn-bracket text-xs">
          {isLive ? 'LIVE' : 'OFF'}
        </button>
        <button onClick={onToggleNSFW} className="btn-bracket text-xs hidden sm:inline-block">
          {showNSFW ? 'NSFW' : 'SFW'}
        </button>
      </div>

      {/* Crypto Prices */}
      <div className="hidden md:flex items-center gap-3 text-[10px]">
        {prices ? (
          <>
            <span className="text-yellow-500">BTC </span>
            <span className="text-blue-400">ETH </span>
            <span className="text-purple-400">SOL </span>
          </>
        ) : (
          <span className="text-dim">Loading...</span>
        )}
      </div>

      <div className="nav-right">
        <button onClick={onLoginClick} className="btn-bracket">
          {userToken ? 'ID:' + userToken.slice(0,4) : 'LOGIN'}
        </button>
        <span className="text-dim text-xs">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </nav>
  );
}
