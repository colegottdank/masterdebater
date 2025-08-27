import React, { useState, useEffect } from 'react';

export const DEBATE_TOPICS = [
  "Should moms knock before entering bedrooms?",
  "Is editing out smart replies cheating?",
  "Are college girls prepared for real debates?",
  "Is Casa Bonita better than Disneyland?",
  "Should 8-year-olds be allowed to podcast?",
  "Is making your nut worth selling out?",
  "Are participation trophies destroying America?",
  "Should bedtime exist for master debaters?",
  "Is Kyle's mom really that bad?",
  "Can you trust anyone named Clyde?",
  "Are sponsors more important than principles?",
  "Is cheesy poofs a complete meal?",
  "Should podcasts require fact-checking?",
  "Is respect earned or demanded?",
  "Are bathroom debates more authentic?"
];

interface TopicSelectorProps {
  selectedTopic: string;
  customTopic: string;
  onTopicSelect: (topic: string) => void;
  onCustomTopicChange: (topic: string) => void;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
  selectedTopic,
  customTopic,
  onTopicSelect,
  onCustomTopicChange
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningTopics, setSpinningTopics] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [showWinner, setShowWinner] = useState(false);

  const startSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setShowWinner(false);
    setHighlightedIndex(null);
    onCustomTopicChange('');
    
    // Pick a random target topic
    const targetIndex = Math.floor(Math.random() * DEBATE_TOPICS.length);
    
    // Create rapid cycling effect
    let currentIndex = 0;
    let speed = 40;
    let iterations = 0;
    const minSpins = 20; // Minimum spins before we can stop
    const extraSpins = Math.floor(Math.random() * 10) + 5; // Random extra spins
    
    const spin = () => {
      currentIndex = (currentIndex + 1) % DEBATE_TOPICS.length;
      setHighlightedIndex(currentIndex);
      iterations++;
      
      // Gradually slow down
      if (iterations < 10) {
        // Keep fast speed for first 10 spins
        speed = 40;
      } else if (iterations < minSpins) {
        // Start slowing slightly
        speed += 3;
      } else if (iterations < minSpins + extraSpins) {
        // Slow down more noticeably
        speed += 10;
      } else {
        // Calculate remaining spins to target
        const remainingToTarget = (targetIndex - currentIndex + DEBATE_TOPICS.length) % DEBATE_TOPICS.length;
        
        if (remainingToTarget <= 5 && remainingToTarget > 0) {
          // Final few spins - really slow
          speed += 50;
          
          if (remainingToTarget === 1) {
            // Last spin - dramatic pause
            speed = 400;
          }
        } else if (remainingToTarget === 0) {
          // We've reached the target!
          const finalTopic = DEBATE_TOPICS[targetIndex];
          onTopicSelect(finalTopic);
          setShowWinner(true);
          setTimeout(() => {
            setIsSpinning(false);
          }, 500);
          return; // Stop the recursion
        } else {
          // Keep spinning at moderate speed
          speed += 15;
        }
      }
      
      // Continue spinning
      setTimeout(spin, speed);
    };
    
    // Start the spin
    spin();
  };

  return (
    <div className="relative max-w-5xl mx-auto mb-8">
      <div className={`bg-gradient-to-br from-amber-900/40 to-red-900/40 p-4 sm:p-6 rounded-3xl border-4 border-yellow-400 debate-glow ${isSpinning ? 'wheel-active' : ''}`}>
        {/* Sponsors */}
        <div className="absolute top-2 right-4 bg-yellow-400 text-black px-2 py-1 rounded transform rotate-2 border-2 border-black text-xs font-bold z-20">
          SPONSOR: CASA BONITA
        </div>
        <div className="absolute bottom-2 left-6 bg-green-500 text-white px-2 py-1 rounded transform -rotate-1 border-2 border-black text-xs font-bold">
          MOM APPROVED
        </div>

        <div className="relative z-10">
          <h2 className="text-2xl sm:text-3xl font-black text-yellow-300 mb-4 transform -rotate-1">
            CARTMAN&apos;S APPROVED TOPICS
          </h2>
          
          {/* Spin Button */}
          <div className="text-center mb-4">
            <button
              onClick={startSpin}
              disabled={isSpinning}
              className={`relative inline-block px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-lg font-black rounded-xl transform transition-all ${
                isSpinning 
                  ? 'bg-gray-600 cursor-not-allowed scale-95' 
                  : 'bg-gradient-to-r from-red-600 to-yellow-500 hover:scale-110 hover:rotate-2 animate-pulse'
              } text-white border-4 border-black shadow-2xl`}
            >
              {isSpinning ? (
                <>
                  <span className="animate-spin inline-block mr-2">🎰</span>
                  <span className="hidden sm:inline">SPINNING THE WHEEL OF TRUTH...</span>
                  <span className="sm:hidden">SPINNING...</span>
                  <span className="animate-spin inline-block ml-2">🎰</span>
                </>
              ) : (
                <>
                  <span className="mr-2">🎲</span>
                  SPIN FOR RANDOM TOPIC!
                  <span className="ml-2">🎲</span>
                </>
              )}
            </button>
            
            {showWinner && (
              <div className="mt-2 animate-bounce">
                <div className="inline-block bg-yellow-400 text-black px-4 py-1 rounded-lg border-2 border-black font-black text-sm transform rotate-2">
                  🎉 TOPIC LOCKED IN! 🎉
                </div>
              </div>
            )}
          </div>

          <p className="text-sm sm:text-base text-gray-200 mb-4 text-center">
            Pick a topic, spin for chaos, or dare with your own!
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 mb-4">
            {DEBATE_TOPICS.map((topic, idx) => (
              <button
                key={topic}
                onClick={() => {
                  if (!isSpinning) {
                    onTopicSelect(topic);
                    onCustomTopicChange('');
                    setHighlightedIndex(null);
                    setShowWinner(false);
                  }
                }}
                className={`p-2 sm:p-3 rounded-lg border-2 sm:border-4 transition-all transform text-sm sm:text-base ${
                  isSpinning && highlightedIndex === idx
                    ? 'border-yellow-400 bg-yellow-400/50 scale-110 rotate-3 shadow-2xl animate-pulse'
                    : selectedTopic === topic && !customTopic && !isSpinning
                    ? 'border-yellow-400 bg-yellow-400/30 scale-105 rotate-2'
                    : 'border-white bg-black/30 hover:border-yellow-400/70 hover:rotate-1'
                } ${isSpinning && highlightedIndex !== idx ? 'opacity-40 blur-[1px]' : ''}`}
                style={{ 
                  '--rotation': `${(idx % 5 - 2) * 0.5}deg`,
                  transition: isSpinning ? 'all 0.1s' : 'all 0.3s'
                } as React.CSSProperties}
              >
                <div className="font-bold text-white">{topic}</div>
              </button>
            ))}
          </div>

          <div className="bg-black/50 p-3 rounded-xl border-2 border-yellow-400 transform rotate-1">
            <h3 className="text-base sm:text-lg font-bold text-yellow-400 mb-2 text-center">
              💀 CUSTOM DEATH TOPIC 💀
            </h3>
            <input
              type="text"
              placeholder="Type your own topic if you're brave enough..."
              value={customTopic}
              onChange={(e) => {
                onCustomTopicChange(e.target.value);
                onTopicSelect('');
              }}
              className="w-full p-2 sm:p-3 rounded-lg bg-black/70 border-2 border-gray-600 focus:border-yellow-400 focus:outline-none text-white font-bold text-sm sm:text-base transform hover:rotate-1 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicSelector;