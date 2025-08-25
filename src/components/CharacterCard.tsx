import React from 'react';
import { getCharacterAvatar, Character } from '@/lib/characters';

interface CharacterData {
  id: Character;
  name: string;
  color: string;
  description: string;
  quote: string;
  wins: string;
  specialty: string;
  avatarColor: string;
  avatarInitials: string;
  headImage: string;
}

interface CharacterCardProps {
  character: CharacterData;
  isSelected?: boolean;
  onSelect?: (characterId: Character) => void;
  showCrown?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  isSelected = false,
  onSelect,
  showCrown = false,
  size = 'medium'
}) => {
  const sizeClasses = {
    small: 'p-3 sm:p-4',
    medium: 'p-3 sm:p-6',
    large: 'p-6 sm:p-8'
  };

  const handleClick = () => {
    if (onSelect) {
      onSelect(character.id);
    }
  };

  return (
    <div className="relative">
      {onSelect ? (
        <button
          onClick={handleClick}
          className={`character-card ${character.color} ${sizeClasses[size]} rounded-2xl text-center cursor-pointer group w-full transition-all relative ${
            isSelected 
              ? 'ring-8 ring-yellow-400 shadow-2xl scale-125 rotate-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 animate-pulse' 
              : ''
          }`}
        >
          {/* Crown for Cartman */}
          {showCrown && character.name === 'Cartman' && (
            <div className="absolute -top-6 -right-4 text-4xl animate-bounce z-20">👑</div>
          )}
          
          {/* Selected Badge */}
          {isSelected && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black text-xs font-black px-3 py-1 rounded-full border-2 border-black animate-bounce z-30">
              ⚡ SELECTED ⚡
            </div>
          )}
          
          <div className="mb-3 group-hover:scale-110 transition-transform flex justify-center">
            {getCharacterAvatar(character, 'xl')}
          </div>
          <div className="font-black text-sm sm:text-xl mb-2">{character.name}</div>
          <div className="text-xs sm:text-sm opacity-90 mb-2 hidden sm:block">{character.specialty}</div>
          <div className="text-xs font-bold bg-black/30 rounded px-1 sm:px-2 py-1">
            W-L: {character.wins}
          </div>
          
          {/* Speech Bubble on Hover */}
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none">
            <div className="bg-white text-black text-sm font-bold p-3 rounded-lg border-2 border-black whitespace-nowrap">
              {character.quote}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-black"></div>
                <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white absolute -top-[2px] left-1/2 transform -translate-x-1/2"></div>
              </div>
            </div>
          </div>
        </button>
      ) : (
        <div className={`character-card ${character.color} ${sizeClasses[size]} rounded-2xl text-center group relative z-10`}>
          {/* Crown for Cartman */}
          {showCrown && character.name === 'Cartman' && (
            <div className="absolute -top-6 -right-4 text-4xl animate-bounce z-20">👑</div>
          )}
          
          <div className="mb-3 group-hover:scale-110 transition-transform flex justify-center">
            {getCharacterAvatar(character, 'xl')}
          </div>
          <div className="font-black text-sm sm:text-xl mb-2">{character.name}</div>
          <div className="text-xs sm:text-sm opacity-90 mb-2 hidden sm:block">{character.specialty}</div>
          <div className="text-xs font-bold bg-black/30 rounded px-1 sm:px-2 py-1">
            W-L: {character.wins}
          </div>
          
          {/* Speech Bubble on Hover */}
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none">
            <div className="bg-white text-black text-sm font-bold p-3 rounded-lg border-2 border-black whitespace-nowrap">
              {character.quote}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-black"></div>
                <div className="w-0 h-0 border-l-6 border-r-6 border-t-6 border-transparent border-t-white absolute -top-[2px] left-1/2 transform -translate-x-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterCard;