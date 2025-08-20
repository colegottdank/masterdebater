export type Character = 'cartman' | 'kyle' | 'stan' | 'butters' | 'clyde';

export const characters = [
  { 
    id: 'cartman' as Character, 
    name: 'Cartman', 
    color: 'bg-red-600', 
    description: 'The self-proclaimed master debater. Uses dirty tactics and personal attacks.',
    quote: "I'm the MASTER debater!",
    wins: '999-0',
    specialty: 'Undefeated Champion',
    avatarColor: 'bg-orange-500',
    avatarInitials: 'EC',
    headImage: '/characters/cartman.webp'
  },
  { 
    id: 'kyle' as Character, 
    name: 'Kyle', 
    color: 'bg-green-600', 
    description: 'Logical and moral, but gets frustrated easily. Loves facts and reasoning.',
    quote: "Actually, that's wrong...",
    wins: '127-45',
    specialty: 'Logic Nerd',
    avatarColor: 'bg-green-500',
    avatarInitials: 'KB',
    headImage: '/characters/kyle.webp'
  },
  { 
    id: 'stan' as Character, 
    name: 'Stan', 
    color: 'bg-blue-600', 
    description: 'The voice of reason who tries to find middle ground. Often gives up.',
    quote: "This is messed up",
    wins: '89-34',
    specialty: 'Voice of Reason',
    avatarColor: 'bg-blue-500',
    avatarInitials: 'SM',
    headImage: '/characters/stan.webp'
  },
  { 
    id: 'butters' as Character, 
    name: 'Butters', 
    color: 'bg-cyan-500', 
    description: 'Sweet and naive, but surprisingly insightful. Always polite.',
    quote: "Oh hamburgers!",
    wins: '12-156',
    specialty: 'Sweet Summer Child',
    avatarColor: 'bg-yellow-400',
    avatarInitials: 'BS',
    headImage: '/characters/butters.webp'
  },
  { 
    id: 'clyde' as Character, 
    name: 'Clyde', 
    color: 'bg-orange-600', 
    description: 'The original master debater who started podcasting to make money. Bitter that Cartman stole his show.',
    quote: "I was here first!",
    wins: '25-8',
    specialty: 'Original Master Debater',
    avatarColor: 'bg-orange-400',
    avatarInitials: 'CD',
    headImage: '/characters/clyde.webp'
  },
];

export const getCharacterAvatar = (character: typeof characters[0], size: 'sm' | 'md' | 'lg' | 'xl' = 'md') => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  // Character-specific background colors
  const getBackgroundColor = (characterId: string) => {
    switch (characterId) {
      case 'cartman': return 'bg-orange-300';
      case 'kyle': return 'bg-green-300';
      case 'stan': return 'bg-blue-300';
      case 'butters': return 'bg-yellow-300';
      case 'clyde': return 'bg-orange-400';
      default: return 'bg-gray-300';
    }
  };
  
  return (
    <div className={`${sizeClasses[size]} rounded-full border-2 border-black overflow-hidden ${getBackgroundColor(character.id)} flex items-center justify-center`}>
      <img 
        src={character.headImage} 
        alt={character.name} 
        className="w-full h-full object-cover"
      />
    </div>
  );
};