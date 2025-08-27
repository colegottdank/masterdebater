'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import UpgradeModal from './UpgradeModal';

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'debate' | 'message';
  current: number;
  limit: number;
  message?: string;
}

export default function RateLimitModal({ 
  isOpen, 
  onClose, 
  type, 
  current, 
  limit,
  message 
}: RateLimitModalProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!isOpen) return null;

  const isDebateLimit = type === 'debate';
  const emoji = isDebateLimit ? '🚫' : '🔒';
  const title = isDebateLimit ? 'DEBATE LIMIT REACHED!' : 'MESSAGE LIMIT REACHED!';
  
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-gradient-to-br from-red-600 to-red-900 p-4 sm:p-6 rounded-2xl border-3 border-black shadow-2xl max-w-lg mx-auto transform -rotate-1 relative overflow-hidden animate-bounce-in">
        {/* "RATE LIMIT" stamp */}
        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded transform rotate-12 border-2 border-black font-black text-xs">
          RATE LIMIT
        </div>
        
        <div className="relative z-10">
          {/* Header */}
          <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-4 transform rotate-1 south-park-title">
            {title}
          </h2>

          {/* Message */}
          <div className="bg-black/30 rounded-lg p-3 mb-4">
            <div className="grid grid-cols-2 gap-2 text-white text-sm">
              <div>
                <span className="font-bold">Used:</span> {current}/{limit} {isDebateLimit ? 'debates' : 'messages'}
              </div>
              <div>
                <span className="font-bold">Status:</span> LIMIT REACHED
              </div>
            </div>
          </div>

          {/* Cartman Quote - styled like Best Burn */}
          <div className="bg-white/90 rounded-lg p-3 mb-4 border-2 border-black transform rotate-1">
            <h3 className="font-black text-black text-sm mb-1">
              💰 CARTMAN SAYS:
            </h3>
            <p className="text-black font-bold italic text-xs">&quot;Respect my authoritah! Pay up or get out!&quot;</p>
          </div>

          {/* Action Buttons - styled like share buttons */}
          <div className="flex gap-2 justify-center mb-4">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-black py-2 px-4 rounded-lg border-2 border-black cursor-pointer hover:scale-105 transform transition-all text-sm"
            >
              💰 UPGRADE
            </button>
            
            <Link href="/history">
              <button 
                onClick={onClose}
                className="bg-blue-500 hover:bg-blue-600 text-white font-black py-2 px-4 rounded-lg border-2 border-black transform hover:rotate-2 transition-all hover:scale-105 cursor-pointer text-sm"
              >
                📚 HISTORY
              </button>
            </Link>
            
            <button
              onClick={onClose}
              className="bg-green-600 hover:bg-green-700 text-white font-black py-2 px-4 rounded-lg border-2 border-black transform hover:-rotate-2 transition-all hover:scale-105 cursor-pointer text-sm"
            >
              ✓ OK
            </button>
          </div>
          
          {/* Challenge Text */}
          <div className="text-center">
            <p className="text-white font-bold text-sm">
              Get unlimited debates and messages for just $4.99/month!
            </p>
          </div>
        </div>
      </div>
      
      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          onClose(); // Also close the rate limit modal
        }}
        trigger="rate-limit"
      />
    </div>
  );
}