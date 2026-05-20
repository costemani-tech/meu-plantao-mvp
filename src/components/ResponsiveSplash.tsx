import React from 'react';

export default function ResponsiveSplash() {
  return (
    <div className="splash-overlay">
      <div className="splash-video-container">
        <video
          src="/icons/capa.mp4"
          poster="/icons/capa.jpeg"
          autoPlay
          muted
          loop
          playsInline
          className="splash-video"
        />
      </div>
    </div>
  );
}
