'use client';
import { useEffect, useState } from 'react';

export default function CRTOverlay() {
  const [isOn, setIsOn] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Start "Turn On" sequence
    // 1. Line expands
    // 2. Screen brightens
    const timer1 = setTimeout(() => setIsOn(true), 100);
    const timer2 = setTimeout(() => setShowContent(true), 1500); 
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  return (
    <>
      {/* TURN ON ANIMATION EFFECT LAYER */}
      {!showContent && (
        <div className="fixed inset-0 bg-black z-[99999] flex items-center justify-center transition-opacity duration-1000">
             <div 
                className={`bg-white shadow-[0_0_50px_white] transition-all duration-700 ease-out ${isOn ? 'w-full h-[2px] opacity-100' : 'w-0 h-[2px] opacity-0'}`}
                style={{
                    transform: isOn ? 'scaleX(1)' : 'scaleX(0)',
                    animation: isOn ? 'expandVert 0.5s ease-out 0.8s forwards' : 'none'
                }}
             />
             <style jsx>{`
                @keyframes expandVert {
                    0% { height: 2px; opacity: 1; }
                    100% { height: 100vh; opacity: 0; }
                }
             `}</style>
        </div>
      )}

      {/* BEZEL OVERLAY */}
      <div className="fixed inset-0 z-[9000] pointer-events-none flex items-stretch justify-stretch">
        <img 
            src="/bezel.png" 
            alt="CRT Bezel" 
            className="w-full h-full absolute inset-0 object-stretch mix-blend-multiply opacity-90"
        />
        {/* VIGNETTE FALLBACK/ENHANCER */}
        <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.9)] rounded-[20px]"></div>
      </div>

       {/* SCANLINES & STATIC */}
       <div className="fixed inset-0 z-[50] pointer-events-none opacity-[0.15] mix-blend-overlay">
            <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
       </div>
    </>
  );
}
