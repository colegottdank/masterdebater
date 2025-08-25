'use client';

import { AIDebateScore } from '@/lib/ai-scoring';
import { getCharacterAvatar, characters } from '@/lib/characters';
import { Character } from '@/lib/claude';

interface RoastCardProps {
  score: AIDebateScore;
  characterId: Character;
  userName: string;
  topic: string;
  debateId: string;
  onShare: () => void;
}

export function RoastCard({ score, characterId, userName, topic, debateId, onShare }: RoastCardProps) {
  const character = characters.find(c => c.id === characterId)!;
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/debate/${debateId}`;
  const userAvatar = typeof window !== 'undefined' ? 
    localStorage.getItem('userAvatar') || 'https://img.clerk.com/preview.png?size=144&seed=anonymous&initials=AN&isSquare=true&bgType=marble&bgColor=6B46C1&fgType=silhouette&fgColor=FFFFFF' 
    : '';
  
  const getBackgroundGradient = () => {
    switch (score.roastLevel) {
      case 'destroyed':
        return 'bg-gradient-to-br from-red-600 to-red-900';
      case 'roasted':
        return 'bg-gradient-to-br from-orange-600 to-red-700';
      case 'held_own':
        return 'bg-gradient-to-br from-yellow-600 to-orange-600';
      case 'dominated':
        return 'bg-gradient-to-br from-green-600 to-green-900';
    }
  };
  
  const shareToTwitter = () => {
    const text = score.roastLevel === 'dominated' 
      ? `I just BEAT ${character.name} in a debate about "${topic}"! 🔥 Think you can do better?`
      : `I just got ${score.verdict.toLowerCase()} by ${character.name} in a debate about "${topic}" 😭 Can you do better?`;
    
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
  };
  
  const copyShareText = () => {
    const text = score.roastLevel === 'dominated'
      ? `I just BEAT ${character.name} in a debate about "${topic}"! 🔥\n\nThink you can do better?\n${shareUrl}`
      : `I just got ${score.verdict.toLowerCase()} by ${character.name} in a debate about "${topic}" 😭\n\nCan you do better?\n${shareUrl}`;
    
    navigator.clipboard.writeText(text);
    onShare();
  };
  
  return (
    <div className={`${getBackgroundGradient()} p-4 sm:p-6 rounded-2xl border-3 border-black shadow-2xl max-w-lg mx-auto transform -rotate-1 relative overflow-hidden`}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)"></div>
      </div>
      
      {/* "DEBATE RESULTS" stamp */}
      <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded transform rotate-12 border-2 border-black font-black text-xs">
        DEBATE RESULTS
      </div>
      
      <div className="relative z-10">
        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-4 transform rotate-1 south-park-title">
          {score.verdict.toUpperCase()}
        </h2>
        
        {/* VS Section - Better aligned */}
        <div className="flex items-center justify-between mb-6 px-4">
          <div className="text-center flex-1">
            <div className="text-white font-bold text-sm mb-1">{userName}</div>
            <div className="text-3xl sm:text-4xl font-black text-yellow-300">{score.userScore}</div>
            {userAvatar && (
              <div className="mt-2 flex justify-center">
                <img src={userAvatar} alt={userName} className="w-12 h-12 rounded-full border-2 border-yellow-400" />
              </div>
            )}
          </div>
          
          <div className="text-4xl mx-4">⚔️</div>
          
          <div className="text-center flex-1">
            <div className="text-white font-bold text-sm mb-1">{character.name}</div>
            <div className="text-3xl sm:text-4xl font-black text-yellow-300">{score.aiScore}</div>
            <div className="mt-2 flex justify-center">{getCharacterAvatar(character, 'md')}</div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="bg-black/30 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-2 gap-2 text-white text-sm">
            <div>
              <span className="font-bold">Survived:</span> {score.survivedRounds} rounds
            </div>
            <div>
              <span className="font-bold">Topic:</span> {topic}
            </div>
          </div>
        </div>
        
        {/* Best Burn */}
        <div className="bg-white/90 rounded-lg p-3 mb-4 border-2 border-black transform rotate-1">
          <h3 className="font-black text-black text-sm mb-1">
            🔥 BEST BURN ({score.bestBurnBy === 'ai' ? character.name : userName}):
          </h3>
          <p className="text-black font-bold italic text-xs">&quot;{score.bestBurn}&quot;</p>
        </div>
        
        {/* Share Buttons */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={shareToTwitter}
            className="bg-blue-500 hover:bg-blue-600 text-white font-black py-2 px-4 rounded-lg border-2 border-black transform hover:rotate-2 transition-all hover:scale-105 cursor-pointer text-sm"
          >
            🐦 SHARE
          </button>
          
          <button
            onClick={copyShareText}
            className="bg-green-600 hover:bg-green-700 text-white font-black py-2 px-4 rounded-lg border-2 border-black transform hover:-rotate-2 transition-all hover:scale-105 cursor-pointer text-sm"
          >
            📋 COPY
          </button>
        </div>
        
        {/* Challenge Text */}
        <div className="text-center mt-4">
          <p className="text-white font-bold text-sm">
            Think you can do better? Share and challenge your friends!
          </p>
        </div>
      </div>
    </div>
  );
}