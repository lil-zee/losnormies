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
  const [prices, setPrices] = useState<CryptoPrices>({ bitcoin: 0, ethereum: 0, solana: 0 });

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        setPrices({
          bitcoin: data.bitcoin?.usd || 0,
          ethereum: data.ethereum?.usd || 0,
          solana: data.solana?.usd || 0,
        });
      } catch (err) {
        // Silent fail
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); 
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (p: number) => {
    if (p === 0) return '...';
    return p.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <nav className="nav-bar h-14 border-t border-[var(--matrix-green)] bg-black z-50 flex justify-between items-center px-2 md:px-6 fixed bottom-0 left-0 right-0 text-xs font-mono shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
      <div className="flex items-center gap-2 md:gap-6">
        <button onClick={onCreateClick} className="btn-bracket text-[var(--matrix-green-bright)] font-bold animate-pulse hover:scale-105 transition-transform">
          + NEW THREAD
        </button>
        <button onClick={onToggleLive} className="btn-bracket text-xs hidden sm:inline-block">
          {isLive ? 'LIVE:ON' : 'LIVE:OFF'}
        </button>
      </div>

      {/* Crypto Ticker - Estilo Bolsa Espaciado */}
      <div className="flex items-center gap-px bg-[var(--bg-dark)] border border-[var(--border-color)] px-4 py-2 mx-2 hidden md:flex rounded-sm">
        <div className="flex items-center gap-2 border-r border-[var(--border-color)] pr-6 mr-6">
          <span className="text-yellow-500 font-bold tracking-wider">BTC</span>
          <span className="text-white font-medium">{formatPrice(prices.bitcoin)}</span>
        </div>
        <div className="flex items-center gap-2 border-r border-[var(--border-color)] pr-6 mr-6">
          <span className="text-blue-400 font-bold tracking-wider">ETH</span>
          <span className="text-white font-medium">{formatPrice(prices.ethereum)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-purple-400 font-bold tracking-wider">SOL</span>
          <span className="text-white font-medium">{formatPrice(prices.solana)}</span>
        </div>
      </div>
      
      {/* Mobile Crypto (Solo BTC/ETH) */}
      <div className="flex md:hidden gap-3 text-[10px] items-center text-dim bg-[var(--bg-dark)] px-2 py-1 border border-[var(--border-color)]">
        <span className="text-yellow-500">BTC {formatPrice(prices.bitcoin).replace('$','')}</span>
      </div>

      <div className="flex items-center gap-4">
        <button onClick={onLoginClick} className="btn-bracket text-[var(--matrix-green)] font-bold tracking-wide">
          {userToken ? ('ID:' + userToken.slice(0,4)) : 'LOGIN'}
        </button>
      </div>
    </nav>
  );
}
