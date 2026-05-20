import React from 'react';

interface ResponsiveSplashProps {
  subtitle?: React.ReactNode;
}

export default function ResponsiveSplash({ 
  subtitle = <>Organize seus plantões.<br />Tenha tudo sob controle.</> 
}: ResponsiveSplashProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 9999,
      background: '#020617',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {/* Mobile Splash Layout */}
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

      {/* Desktop/Tablet SaaS Premium Splash Layout */}
      <div className="hidden md:flex desktop-splash">
        <div className="desktop-splash-card">
          <video 
            src="/icons/capa.mp4" 
            poster="/icons/capa.jpeg"
            autoPlay 
            muted 
            loop 
            playsInline 
            className="loader-video" 
          />
          <h1 className="desktop-splash-title">
            Meu <span>Plantão</span>
          </h1>
          <p className="desktop-splash-subtitle">
            {subtitle}
          </p>
          <div className="splash-loader-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
