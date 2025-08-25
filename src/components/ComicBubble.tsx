import React from 'react';

interface ComicBubbleProps {
  children: React.ReactNode;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const ComicBubble: React.FC<ComicBubbleProps> = ({ 
  children, 
  className = '',
  size = 'medium' 
}) => {
  const sizeClasses = {
    small: 'max-w-xs p-3',
    medium: 'max-w-xs sm:max-w-xl md:max-w-2xl p-4 sm:p-6',
    large: 'max-w-2xl p-6 sm:p-8'
  };

  return (
    <div className={`comic-bubble ${sizeClasses[size]} mx-auto mb-6 ${className}`}>
      <div className="text-sm sm:text-lg md:text-xl font-bold text-black">
        {children}
      </div>
    </div>
  );
};

export default ComicBubble;