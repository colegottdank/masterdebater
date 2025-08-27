'use client';

import React, { useState, useEffect } from 'react';
import { SignedOut, SignInButton } from '@clerk/nextjs';
import { useUser } from '@/lib/useTestUser';
import Link from 'next/link';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: 'rate-limit-debate' | 'rate-limit-message' | 'feature' | 'button';
  limitData?: {
    current: number;
    limit: number;
  };
}

export default function UpgradeModal({ 
  isOpen, 
  onClose,
  trigger = 'button',
  limitData
}: UpgradeModalProps) {
  const { user } = useUser();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [price, setPrice] = useState<{
    formatted: string;
    interval: string;
    isFallback: boolean;
  }>({ formatted: '$4.99', interval: 'month', isFallback: true });
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);

  useEffect(() => {
    // Fetch current price from Stripe
    const fetchPrice = async () => {
      try {
        const response = await fetch('/api/stripe/price');
        if (response.ok) {
          const data = await response.json();
          setPrice(data);
        }
      } catch (error) {
        console.error('Error fetching price:', error);
      } finally {
        setIsLoadingPrice(false);
      }
    };
    
    if (isOpen) {
      fetchPrice();
    }
  }, [isOpen]);

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else if (data.hasSubscription) {
        alert('You already have an active subscription!');
        onClose();
      } else {
        console.error('Checkout error:', data);
        alert(data.error || 'Failed to start checkout. Please try again.');
        setIsUpgrading(false);
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Connection error. Please check your internet and try again.');
      setIsUpgrading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setIsUpgrading(true);
      const response = await fetch('/api/stripe/manage', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Portal error:', data);
        alert('Failed to open billing portal. Please try again.');
        setIsUpgrading(false);
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      alert('Connection error. Please try again.');
      setIsUpgrading(false);
    }
  };

  if (!isOpen) return null;

  // Configure modal based on trigger
  const isRateLimit = trigger?.startsWith('rate-limit');
  const isDebateLimit = trigger === 'rate-limit-debate';
  const isMessageLimit = trigger === 'rate-limit-message';

  const getModalConfig = () => {
    if (isDebateLimit) {
      return {
        title: 'DEBATE LIMIT REACHED!',
        subtitle: "You've used all your free debates!",
        emoji: '🚫',
        stamp: 'DEBATE LIMIT',
        bgGradient: 'from-red-600 to-red-900'
      };
    }
    if (isMessageLimit) {
      return {
        title: 'MESSAGE LIMIT REACHED!',
        subtitle: "You've sent all your free messages!",
        emoji: '🔒',
        stamp: 'MESSAGE LIMIT',
        bgGradient: 'from-red-600 to-red-900'
      };
    }
    if (trigger === 'feature') {
      return {
        title: 'PREMIUM FEATURE',
        subtitle: 'Unlock all features!',
        emoji: '👑',
        stamp: 'PREMIUM',
        bgGradient: 'from-yellow-500 to-red-600'
      };
    }
    return {
      title: 'GET PREMIUM',
      subtitle: 'Become the ultimate master debater!',
      emoji: '💰',
      stamp: 'UPGRADE',
      bgGradient: 'from-yellow-500 to-red-600'
    };
  };

  const config = getModalConfig();

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className={`bg-gradient-to-br ${config.bgGradient} p-6 sm:p-8 rounded-3xl border-4 border-black shadow-2xl max-w-md w-full transform -rotate-1 relative overflow-hidden animate-bounce-in`}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white hover:text-yellow-300 text-3xl font-black transform hover:rotate-12 transition-all z-20"
        >
          ×
        </button>
        
        {/* Status stamp */}
        <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full transform -rotate-12 border-2 border-black font-black text-xs">
          {config.stamp}
        </div>
        
        <div className="relative z-10 mt-8">
          {/* Header */}
          <h2 className="text-3xl sm:text-4xl font-black text-white text-center mb-2 transform rotate-1 south-park-title">
            {config.title}
          </h2>
          <p className="text-xl text-yellow-300 font-bold text-center mb-6">
            {config.subtitle}
          </p>

          {/* Show usage if rate limited */}
          {isRateLimit && limitData && (
            <div className="bg-black/30 rounded-lg p-3 mb-4">
              <div className="grid grid-cols-2 gap-2 text-white text-sm">
                <div>
                  <span className="font-bold">Used:</span> {limitData.current}/{limitData.limit} {isDebateLimit ? 'debates' : 'messages'}
                </div>
                <div>
                  <span className="font-bold">Status:</span> LIMIT REACHED
                </div>
              </div>
            </div>
          )}

          {/* Price */}
          <div className="text-center mb-6">
            {isLoadingPrice ? (
              <div className="text-5xl font-black text-white animate-pulse">...</div>
            ) : (
              <>
                <div className="text-5xl font-black text-white mb-1">
                  {price.formatted}
                </div>
                <div className="text-xl text-yellow-300 font-bold">
                  PER {price.interval.toUpperCase()}
                </div>
                {price.isFallback && (
                  <div className="text-xs text-white/70 mt-1">
                    * Price may vary
                  </div>
                )}
              </>
            )}
          </div>

          {/* Features */}
          <div className="bg-black/30 rounded-xl p-4 mb-6">
            <h3 className="text-lg font-black text-yellow-300 mb-3">
              {isRateLimit ? 'UNLOCK WITH PREMIUM:' : 'PREMIUM FEATURES:'}
            </h3>
            <ul className="space-y-2 text-white text-sm font-bold">
              <li className="flex items-center">
                <span className="text-lg mr-2">✅</span>
                UNLIMITED DEBATES (Free: 3)
              </li>
              <li className="flex items-center">
                <span className="text-lg mr-2">✅</span>
                UNLIMITED MESSAGES (Free: 3 per debate)
              </li>
              <li className="flex items-center">
                <span className="text-lg mr-2">✅</span>
                PRIORITY ROASTING
              </li>
              <li className="flex items-center">
                <span className="text-lg mr-2">✅</span>
                CHARLIE KIRK AWARD ACCESS
              </li>
            </ul>
          </div>

          {/* Cartman Quote */}
          <div className="bg-white/90 rounded-lg p-3 mb-6 border-2 border-black transform rotate-1">
            <h3 className="font-black text-black text-sm mb-1">
              💰 CARTMAN SAYS:
            </h3>
            <p className="text-black font-bold italic text-sm">
              {isRateLimit 
                ? "Respect my authoritah! Pay up or get out!"
                : "Only premium members are real master debaters!"}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center flex-wrap">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-white text-red-600 font-black py-3 px-6 rounded-xl hover:scale-105 transition-all transform hover:rotate-2 shadow-xl border-3 border-black cursor-pointer">
                  SIGN IN TO UPGRADE
                </button>
              </SignInButton>
            </SignedOut>
            
            {user && (
              <>
                <button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  className={`bg-yellow-500 text-black font-black py-3 px-6 rounded-xl ${!isUpgrading ? 'hover:scale-105 hover:bg-yellow-600' : ''} transition-all transform ${!isUpgrading ? 'hover:rotate-2' : ''} shadow-xl border-3 border-black ${isUpgrading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                >
                  {isUpgrading ? '⏳ LOADING...' : '💰 UPGRADE NOW'}
                </button>
                
                {isRateLimit && (
                  <Link href="/history">
                    <button 
                      onClick={onClose}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-black py-3 px-6 rounded-xl transform hover:rotate-2 transition-all hover:scale-105 cursor-pointer shadow-xl border-3 border-black"
                    >
                      📚 HISTORY
                    </button>
                  </Link>
                )}
                
                <button
                  onClick={onClose}
                  className="bg-gray-700 text-white font-black py-3 px-6 rounded-xl hover:scale-105 transition-all transform hover:rotate-2 shadow-xl border-3 border-black cursor-pointer"
                >
                  {isRateLimit ? '✓ OK' : 'LATER'}
                </button>
              </>
            )}
          </div>

          {/* Manage subscription link for existing customers */}
          {user && (
            <div className="text-center mt-4">
              <button
                onClick={handleManageSubscription}
                className="text-white/80 hover:text-white text-sm underline font-bold"
              >
                Already subscribed? Manage billing
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}