import React from 'react';

interface LiveBannerProps {
  text: string;
  showOnAir?: boolean;
  onAirText?: string;
}

const LiveBanner: React.FC<LiveBannerProps> = ({ 
  text, 
  showOnAir = true, 
  onAirText = 'ON AIR' 
}) => {
  return (
    <div className="messy-banner p-2 text-center relative">
      <div className="overflow-hidden">
        <span className="font-black text-white text-xs sm:text-sm tracking-wider block truncate px-2">
          {text}
        </span>
      </div>
      {showOnAir && (
        <div className="absolute top-2 right-2 sm:right-20 z-10">
          <div className="on-air-sign text-sm">{onAirText}</div>
        </div>
      )}
    </div>
  );
};

export default LiveBanner;