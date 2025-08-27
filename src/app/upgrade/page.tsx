'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/useTestUser';
import Link from 'next/link';
import { SignedOut, SignInButton } from '@clerk/nextjs';

export default function UpgradePage() {
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);

  useEffect(() => {
    // Check subscription status from API
    const checkSubscription = async () => {
      if (user) {
        try {
          const response = await fetch('/api/subscription');
          if (response.ok) {
            const data = await response.json();
            setIsSubscribed(data.isSubscribed);
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
        }
      }
      setIsCheckingSubscription(false);
    };
    
    checkSubscription();
  }, [user]);

  const handleUpgrade = async () => {
    if (!user) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else if (data.hasSubscription) {
        // User already has subscription, refresh the status
        setIsSubscribed(true);
        setIsLoading(false);
        console.log('User already has an active subscription');
      } else {
        console.error('Failed to create checkout session:', data.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative chaos-scatter bedroom-mess cartman-room-bg">
      {/* Navigation */}
      <div className="absolute top-4 left-4 z-20">
        <Link href="/debate" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-xl transition-all transform hover:rotate-1 border-4 border-black shadow-lg">
          ← Back to Arena
        </Link>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-black south-park-title mb-4">
              <span className="text-yellow-400">GET</span>
              <span className="text-red-500"> PREMIUM</span>
            </h1>
            <p className="text-2xl text-white font-bold">
              BECOME THE ULTIMATE MASTER DEBATER!
            </p>
          </div>

          {/* Pricing Card */}
          <div className="bg-gradient-to-br from-yellow-500 to-red-600 p-8 rounded-3xl border-4 border-black shadow-2xl transform -rotate-1">
            {isCheckingSubscription ? (
              <div className="text-center">
                <div className="text-6xl mb-4 animate-pulse">⏳</div>
                <h2 className="text-3xl font-black text-white">Checking subscription status...</h2>
              </div>
            ) : isSubscribed ? (
              <div className="text-center">
                <div className="text-6xl mb-4">👑</div>
                <h2 className="text-4xl font-black text-white mb-4">YOU'RE ALREADY PREMIUM!</h2>
                <p className="text-xl text-white mb-8">
                  You have unlimited debates and messages, you master debater!
                </p>
                <Link href="/debate">
                  <button className="bg-white text-red-600 font-black text-xl py-4 px-10 rounded-2xl hover:scale-110 transition-all transform hover:rotate-2 shadow-xl border-4 border-black cursor-pointer">
                    GO DEBATE!
                  </button>
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="text-6xl font-black text-white mb-2">$4.99</div>
                  <div className="text-2xl text-yellow-300 font-bold">PER MONTH</div>
                </div>

                {/* Features */}
                <div className="bg-black/30 rounded-2xl p-6 mb-8">
                  <h3 className="text-2xl font-black text-yellow-300 mb-4">PREMIUM FEATURES:</h3>
                  <ul className="space-y-3 text-white text-lg font-bold">
                    <li className="flex items-center">
                      <span className="text-2xl mr-3">✅</span>
                      UNLIMITED DEBATES (Free: 3 debates)
                    </li>
                    <li className="flex items-center">
                      <span className="text-2xl mr-3">✅</span>
                      UNLIMITED MESSAGES (Free: 3 per debate)
                    </li>
                    <li className="flex items-center">
                      <span className="text-2xl mr-3">✅</span>
                      PRIORITY ROASTING
                    </li>
                    <li className="flex items-center">
                      <span className="text-2xl mr-3">✅</span>
                      EXCLUSIVE CARTMAN RESPECT
                    </li>
                    <li className="flex items-center">
                      <span className="text-2xl mr-3">✅</span>
                      CHARLIE KIRK AWARD ELIGIBILITY
                    </li>
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="text-center">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="bg-white text-red-600 font-black text-xl py-4 px-10 rounded-2xl hover:scale-110 transition-all transform hover:rotate-2 shadow-xl border-4 border-black cursor-pointer">
                        SIGN IN TO UPGRADE
                      </button>
                    </SignInButton>
                  </SignedOut>
                  
                  {user && (
                    <button
                      onClick={handleUpgrade}
                      disabled={isLoading}
                      className={`bg-white text-red-600 font-black text-xl py-4 px-10 rounded-2xl ${!isLoading ? 'hover:scale-110' : ''} transition-all transform ${!isLoading ? 'hover:rotate-2' : ''} shadow-xl border-4 border-black ${isLoading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                    >
                      {isLoading ? '⏳ LOADING...' : '💰 GET PREMIUM NOW'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Cartman Quote */}
          <div className="mt-12 text-center">
            <div className="bg-black/70 inline-block p-6 rounded-2xl border-2 border-yellow-400 transform rotate-2">
              <p className="text-yellow-400 text-xl font-bold">
                "Only premium members get to be REAL master debaters!"
              </p>
              <p className="text-white text-lg mt-2">
                - Eric Cartman, Master Debater
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}