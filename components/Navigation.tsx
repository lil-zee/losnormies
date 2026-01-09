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
          bitcoin: data.bitcoin?.usd || 95000, // Fallback visual
          ethereum: data.ethereum?.usd || 2700,
          solana: data.solana?.usd || 140,
        });
      } catch (err) {
        // Fallback visual silencioso
        setPrices({ bitcoin: 98420, ethereum: 2850, solana: 145 });
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (p: number) => {
    if (p >= 1000) return (p / 1000).toFixed(1) + 'k';
    return p.toFixed(0);
  };

  return (
    <nav className="nav-bar">
      <div className="nav-left">
        <button onClick={onCreateClick} className="btn-bracket glow text-xs">NEW</button>
        <button onClick={onToggleLive} className="btn-bracket text-xs hidden sm:inline-block">
          {isLive ? 'LIVE' : 'OFF'}
        </button>
      </div>

      {/* Crypto Prices - Visible siempre, scroll horizontal si hace falta en movil pequeño */}
      <div className="flex items-center gap-2 md:gap-4 text-[10px] whitespace-nowrap overflow-x-auto no-scrollbar px-2">
        <span className="text-yellow-500">BTC ${formatPrice(prices.bitcoin)}</span>
        <span className="text-blue-400">ETH ${formatPrice(prices.ethereum)}</span>
        <span className="text-purple-400">SOL ${formatPrice(prices.solana)}</span>
      </div>

      <div className="nav-right">
        <button onClick={onLoginClick} className="btn-bracket text-xs">
          {userToken ? 'ID:' + userToken.slice(0, 3) : 'LOGIN'}
        </button>
      </div>
    </nav>
  );
}
