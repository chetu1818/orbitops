import { Component } from '@angular/core';

@Component({
  selector: 'app-loader',
  standalone: true,
  template: `
    <div class="loader-container">
      <svg viewBox="0 0 100 100" class="logo-loader-svg">
        <defs>
          <!-- Sphere Radial Gradient for a 3D volume effect -->
          <radialGradient id="sphereGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#60a5fa" />
            <stop offset="40%" stop-color="#2563eb" />
            <stop offset="100%" stop-color="#1d4ed8" />
          </radialGradient>
          
          <!-- Outer glow for the central sphere -->
          <filter id="globeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <!-- Central Globe with subtle pulse -->
        <circle cx="50" cy="50" r="18" fill="url(#sphereGrad)" class="loader-globe" filter="url(#globeGlow)" />

        <!-- Orbit Ring 1 (Teal, dashed for visual detail) -->
        <g class="orbit-teal">
          <ellipse cx="50" cy="50" rx="32" ry="9" fill="none" stroke="#0d9488" stroke-width="2.5" stroke-dasharray="6 4" transform="rotate(35 50 50)" />
        </g>

        <!-- Orbit Ring 2 (Purple, solid) -->
        <g class="orbit-purple">
          <ellipse cx="50" cy="50" rx="32" ry="9" fill="none" stroke="#7c3aed" stroke-width="2.5" transform="rotate(-35 50 50)" />
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
    .loader-globe {
      transform-origin: 50px 50px;
      animation: pulse-globe 1.8s ease-in-out infinite alternate;
    }
    .orbit-teal {
      transform-origin: 50px 50px;
      animation: spin-clockwise 2.2s linear infinite;
    }
    .orbit-purple {
      transform-origin: 50px 50px;
      animation: spin-counterclockwise 2.6s linear infinite;
    }

    @keyframes spin-clockwise {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes spin-counterclockwise {
      from { transform: rotate(0deg); }
      to { transform: rotate(-360deg); }
    }
    @keyframes pulse-globe {
      from { transform: scale(0.95); }
      to { transform: scale(1.05); }
    }
  `]
})
export class LoaderComponent {}
