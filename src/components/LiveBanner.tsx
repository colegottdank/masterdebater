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
      <span className="font-black text-white text-sm tracking-wider">
        {text}
      </span>
      {showOnAir && (
        <div className="absolute top-2 right-6 z-10">
          <div className="on-air-sign text-sm">{onAirText}</div>
        </div>
      )}
    </div>
  );
};

export default LiveBanner;