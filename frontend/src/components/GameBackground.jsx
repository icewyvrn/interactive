import React from 'react';
// Import the image directly
import backgroundImage from '../assets/GameBackground.jpg';

const GameBackground = ({ children }) => {
  return (
    <div className="playful-background min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0 pointer-events-none opacity-100"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      >
        {/* Optional overlay to ensure content readability */}
        <div className="absolute inset-0"></div>
      </div>

      {/* Content overlay with subtle background */}
      <div className="relative z-10 min-h-screen">{children}</div>
    </div>
  );
};

export default GameBackground;
