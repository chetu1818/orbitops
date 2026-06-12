import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-container">
      <svg viewBox="0 0 100 100" class="logo-loader-svg">
        <defs>
          <!-- Core Radial Gradient -->
          <radialGradient id="loaderCoreGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#c084fc" /> <!-- Bright Purple -->
            <stop offset="40%" stop-color="#3b82f6" /> <!-- Cyber Blue -->
            <stop offset="100%" stop-color="#1d4ed8" /> <!-- Deep Blue -->
          </radialGradient>
          
          <!-- Ring Gradients for fading tails -->
          <linearGradient id="tealRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#10b981" stop-opacity="1" />
            <stop offset="60%" stop-color="#059669" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#047857" stop-opacity="0" />
          </linearGradient>
          
          <linearGradient id="purpleRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#8b5cf6" stop-opacity="1" />
            <stop offset="60%" stop-color="#6d28d9" stop-opacity="0.3" />
            <stop offset="100%" stop-color="#4c1d95" stop-opacity="0" />
          </linearGradient>

          <!-- Glow Filter -->
          <filter id="premiumGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- Orbit Background Guides -->
        <g class="orbit-bg-guides" opacity="0.2">
          <ellipse cx="50" cy="50" rx="34" ry="11" fill="none" stroke="#ffffff" stroke-width="0.8" transform="rotate(35 50 50)" />
          <ellipse cx="50" cy="50" rx="34" ry="11" fill="none" stroke="#ffffff" stroke-width="0.8" transform="rotate(-35 50 50)" />
        </g>

        <!-- Orbit Ring 1 (Teal) with rotating dot -->
        <g class="orbit-group-1">
          <ellipse cx="50" cy="50" rx="34" ry="11" fill="none" stroke="url(#tealRingGrad)" stroke-width="2.2" stroke-linecap="round" transform="rotate(35 50 50)" />
          <g transform="rotate(35 50 50)">
            <circle cx="84" cy="50" r="3.2" fill="#10b981" filter="url(#premiumGlow)" class="orbiting-dot-1" />
          </g>
        </g>

        <!-- Orbit Ring 2 (Purple) with rotating dot -->
        <g class="orbit-group-2">
          <ellipse cx="50" cy="50" rx="34" ry="11" fill="none" stroke="url(#purpleRingGrad)" stroke-width="2.2" stroke-linecap="round" transform="rotate(-35 50 50)" />
          <g transform="rotate(-35 50 50)">
            <circle cx="16" cy="50" r="3.2" fill="#8b5cf6" filter="url(#premiumGlow)" class="orbiting-dot-2" />
          </g>
        </g>

        <!-- Central Globe with glow -->
        <circle cx="50" cy="50" r="19" fill="url(#loaderCoreGrad)" filter="url(#premiumGlow)" class="loader-core-globe" />
        
        <!-- Tech detail lines on the globe -->
        <g class="globe-details" opacity="0.45" stroke="#ffffff" stroke-width="0.8" fill="none">
          <circle cx="50" cy="50" r="13" stroke-dasharray="6 5" />
          <circle cx="50" cy="50" r="7" stroke-dasharray="2 3" />
          <line x1="50" y1="31" x2="50" y2="69" />
          <line x1="31" y1="50" x2="69" y2="50" />
        </g>

        <!-- Twinkling Sparkles (tech nodes) -->
        <g class="tech-nodes">
          <circle cx="28" cy="34" r="1.5" fill="#ffffff" filter="url(#premiumGlow)" class="node-sparkle-1" />
          <circle cx="72" cy="66" r="1.5" fill="#ffffff" filter="url(#premiumGlow)" class="node-sparkle-2" />
          <circle cx="69" cy="28" r="2" fill="#10b981" filter="url(#premiumGlow)" class="node-sparkle-3" />
          <circle cx="31" cy="72" r="2" fill="#8b5cf6" filter="url(#premiumGlow)" class="node-sparkle-4" />
        </g>
      </svg>
    </div>
  `,
  styles: [`
    .loader-container {
      width: 100%;
      height: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .logo-loader-svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .loader-core-globe {
      transform-origin: 50px 50px;
      animation: corePulse 1.6s ease-in-out infinite alternate;
    }
    .globe-details {
      transform-origin: 50px 50px;
      animation: detailsRotate 3.5s linear infinite;
    }
    
    .orbit-group-1 {
      transform-origin: 50px 50px;
      animation: groupRotate1 3.5s linear infinite;
    }
    .orbiting-dot-1 {
      animation: dotPulse 1.4s ease-in-out infinite alternate;
    }
    
    .orbit-group-2 {
      transform-origin: 50px 50px;
      animation: groupRotate2 3s linear infinite;
    }
    .orbiting-dot-2 {
      animation: dotPulse 1.1s ease-in-out infinite alternate;
    }

    .node-sparkle-1 { animation: twinkle 0.8s ease-in-out infinite alternate; }
    .node-sparkle-2 { animation: twinkle 1.2s ease-in-out infinite alternate 0.2s; }
    .node-sparkle-3 { animation: twinkle 1.5s ease-in-out infinite alternate 0.4s; }
    .node-sparkle-4 { animation: twinkle 1s ease-in-out infinite alternate 0.6s; }

    @keyframes corePulse {
      from { 
        transform: scale(0.92); 
        filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.4)) url(#premiumGlow); 
      }
      to { 
        transform: scale(1.03); 
        filter: drop-shadow(0 0 9px rgba(59, 130, 246, 0.75)) url(#premiumGlow); 
      }
    }
    @keyframes detailsRotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes groupRotate1 {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes groupRotate2 {
      from { transform: rotate(360deg); }
      to { transform: rotate(0deg); }
    }
    @keyframes dotPulse {
      from { r: 2.2; opacity: 0.6; }
      to { r: 4.2; opacity: 1; }
    }
    @keyframes twinkle {
      0% { opacity: 0.15; transform: scale(0.6); }
      100% { opacity: 1; transform: scale(1.25); }
    }
  `]
})
export class LoaderComponent {}
