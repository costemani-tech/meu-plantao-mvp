import React from 'react';

export default function ResponsiveSplash() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 9999,
      overflow: 'hidden',
    }}>
      {/* ─── Mobile: vídeo ocupa tela toda, sem alteração ─── */}
      <div className="block md:hidden w-full h-full bg-[#050816]">
        <video
          src="/icons/capa.mp4"
          poster="/icons/capa.jpeg"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* ─── Desktop/Tablet: SaaS Premium — só o vídeo, protagonista ─── */}
      <div className="hidden md:flex desktop-loader">
        <div className="desktop-loader-card">
          <div className="desktop-loader-video-wrapper">
            <video
              src="/icons/capa.mp4"
              poster="/icons/capa.jpeg"
              autoPlay
              muted
              loop
              playsInline
              className="desktop-loader-video"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
