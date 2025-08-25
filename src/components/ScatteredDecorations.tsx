import React from 'react';

type DecorationType = 'bedroom' | 'studio' | 'minimal';

interface Decoration {
  emoji: string;
  className: string;
  hideOnMobile?: string;
}

interface ScatteredDecorationsProps {
  type?: DecorationType;
  hideOnMobile?: boolean;
}

const decorationSets: Record<DecorationType, Decoration[]> = {
  bedroom: [
    { emoji: '🧸', className: 'top-20 left-8 text-3xl opacity-10 rotate-12' },
    { emoji: '⚡', className: 'top-32 right-12 text-2xl opacity-15 -rotate-15' },
    { emoji: '🌮', className: 'top-1/3 left-16 text-xl opacity-20 rotate-45', hideOnMobile: 'lg' },
    { emoji: '🎲', className: 'bottom-32 left-20 text-2xl opacity-10 -rotate-30' },
    { emoji: '🍔', className: 'bottom-40 right-24 text-xl opacity-15 rotate-25', hideOnMobile: 'lg' },
    { emoji: '📺', className: 'top-1/2 right-8 text-lg opacity-25 -rotate-8', hideOnMobile: 'md' },
  ],
  studio: [
    { emoji: '🎙️', className: 'top-20 left-8 text-3xl opacity-10 rotate-12' },
    { emoji: '📻', className: 'top-32 right-12 text-2xl opacity-15 -rotate-15' },
    { emoji: '🎧', className: 'top-1/3 left-16 text-xl opacity-20 rotate-45' },
    { emoji: '📺', className: 'bottom-32 left-20 text-2xl opacity-10 -rotate-30' },
    { emoji: '🍟', className: 'bottom-40 right-24 text-xl opacity-15 rotate-25' },
    { emoji: '🥤', className: 'top-1/2 right-8 text-lg opacity-25 -rotate-8' },
    { emoji: '🍕', className: 'top-1/4 left-32 text-lg opacity-20 rotate-30' },
    { emoji: '🎮', className: 'bottom-1/4 right-32 text-xl opacity-15 -rotate-20' },
  ],
  minimal: [
    { emoji: '📻', className: 'top-4 left-4 text-2xl opacity-30 -rotate-12' },
    { emoji: '🎧', className: 'top-8 right-8 text-xl opacity-40 rotate-12' },
  ],
};

const ScatteredDecorations: React.FC<ScatteredDecorationsProps> = ({ 
  type = 'bedroom', 
  hideOnMobile = true 
}) => {
  const decorations = decorationSets[type] || decorationSets.bedroom;

  return (
    <>
      {decorations.map((decoration, index) => {
        const hideClass = hideOnMobile && decoration.hideOnMobile 
          ? `hidden ${decoration.hideOnMobile}:block` 
          : hideOnMobile 
          ? 'hidden sm:block' 
          : '';
        
        return (
          <div
            key={`${decoration.emoji}-${index}`}
            className={`absolute transform z-0 ${decoration.className} ${hideClass}`}
          >
            {decoration.emoji}
          </div>
        );
      })}
    </>
  );
};

export default ScatteredDecorations;