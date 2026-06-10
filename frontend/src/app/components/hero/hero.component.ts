import { Component, inject, OnInit, AfterViewInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';
import { HomeHeader3dComponent } from '../home-header-3d/home-header-3d.component';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, ScrollAnimateDirective, HomeHeader3dComponent],
  template: `
    <section class="hero-section">
      <!-- Animated dot grid -->
      <div class="dot-grid"></div>
      <!-- 3D Space Background Layer -->
      <div class="hero-bg-3d">
        <app-home-header-3d></app-home-header-3d>
      </div>

      <div class="glow-orb glow-primary animate-float" style="z-index: 0;"></div>
      <div class="glow-orb glow-accent" style="top: 35%; right: -5%; z-index: 0;"></div>
      <div class="glow-orb glow-violet" style="bottom: -10%; left: 20%; z-index: 0; animation-delay: -3s;"></div>
      
      <div class="container hero-container">
        <div class="hero-content">
          <span class="badge" appScrollAnimate>Enterprise Integration Core</span>
          <h1 appScrollAnimate class="delay-100">
            <span class="rgb-text" id="hero-type-target"></span><span id="hero-type-cursor" class="hero-type-cursor">-</span>
          </h1>
          <p class="hero-description" appScrollAnimate>
            OrbitOps architects intelligent, low-code workflows on <strong>Make.com</strong> and <strong>n8n</strong>, 
            and custom .NET APIs. We bridge HR platforms, payroll systems, ERP layers, and operational databases 
            into a <em>self-healing integration matrix</em> â€” so your team never touches a spreadsheet again.
          </p>
          <div class="hero-actions" appScrollAnimate>
            <button (click)="navigateTo('contact')" class="btn btn-primary">Book a Consultation</button>
            <button (click)="navigateTo('portfolio')" class="btn btn-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              See Our Work
            </button>
          </div>

          <!-- Animated Platform Pipeline -->
          <div class="pipeline-strip" appScrollAnimate>
            <div class="pipeline-label">LIVE DATA FLOW</div>
            <div class="pipeline-nodes">
              <!-- Source -->
              <div class="pipe-node source-node">
                <div class="pipe-node-icon"><i class="bi bi-building"></i></div>
                <span>BambooHR</span>
              </div>
              <div class="pipe-connector">
                <div class="pipe-flow"></div>
                <div class="pipe-packet p1"></div>
                <div class="pipe-packet p2"></div>
              </div>
              <!-- Engine -->
              <div class="pipe-node engine-node">
                <div class="pipe-node-icon engine-icon"><i class="bi bi-lightning-charge-fill"></i></div>
                <span>Make.com</span>
              </div>
              <div class="pipe-connector">
                <div class="pipe-flow flow-right"></div>
                <div class="pipe-packet p3"></div>
                <div class="pipe-packet p4"></div>
              </div>
              <!-- Target -->
              <div class="pipe-node target-node">
                <div class="pipe-node-icon"><i class="bi bi-briefcase"></i></div>
                <span>ADP Payroll</span>
              </div>
            </div>
            <div class="pipeline-status">
              <span class="status-dot"></span>
              <span>Syncing 1,247 employee records · Last run: 2 min ago</span>
            </div>
          </div>

          <!-- Stats Ticker -->
          <div class="stats-ticker" appScrollAnimate>
            <div class="stat-item">
              <span class="stat-num">400<span class="stat-plus">+</span></span>
              <span class="stat-lbl">Scenarios Built</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num">98<span class="stat-plus">%</span></span>
              <span class="stat-lbl">Uptime SLA</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num">50<span class="stat-plus">+</span></span>
              <span class="stat-lbl">Data Rules Engine</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-num">12</span>
              <span class="stat-lbl">Enterprise Clients</span>
            </div>
          </div>

          <!-- Security spec list -->
          <div class="security-specs card" appScrollAnimate>
            <div class="spec-header">
              <i class="bi bi-shield-lock-fill spec-icon" style="margin-right: 0.5rem; font-size: 1rem;"></i>
              <strong>Security Protocol Compliant</strong>
            </div>
            <div class="spec-items">
              <span class="spec-tag">AES-256 Transit</span>
              <span class="spec-tag">Zero-Trust Architecture</span>
              <span class="spec-tag">SOC2 Alignment</span>
              <span class="spec-tag">IPsec VPN Tunnels</span>
            </div>
          </div>
          </div>
        </div>
      </section>
  `,
  styles: [`
    .hero-section {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      padding: 9rem 0 5rem 0;
      overflow: hidden;
    }
    .hero-bg-3d {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      z-index: 1;
      pointer-events: none;
      overflow: hidden;
      opacity: 0.88;
    }
    .hero-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      position: relative;
      z-index: 2;
    }
    .hero-content {
      max-width: 860px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .hero-content h1 {
      font-size: clamp(2.3rem, 5.5vw, 4.1rem);
      font-weight: 900;
      line-height: 1.15;
      letter-spacing: -0.03em;
      margin-bottom: 1.6rem;
      min-height: 5.5rem;
      text-shadow: 0 0 80px rgba(59,130,246,0.25);
    }
    .hero-type-cursor {
      color: #00F0FF;
      animation: blink 0.8s step-end infinite;
      display: inline;
      margin-left: 2px;
    }
    @keyframes blink { 50% { opacity: 0; } }
    .hero-description {
      font-size: 1.1rem;
      color: var(--text-secondary);
      margin-bottom: 2.5rem;
      line-height: 1.8;
      max-width: 680px;
    }
    .hero-description strong { color: var(--text-primary); font-weight: 700; }
    .hero-description em { color: var(--accent); font-style: normal; font-weight: 600; }
    .hero-actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
      margin-bottom: 2.5rem;
    }

    /* â”€â”€ Pipeline Strip â”€â”€ */
    .pipeline-strip {
      width: 100%;
      max-width: 640px;
      background: rgba(8,15,35,0.7);
      border: 1px solid rgba(100,160,255,0.12);
      border-radius: 16px;
      padding: 1.25rem 1.5rem;
      backdrop-filter: blur(12px);
      margin-bottom: 2rem;
    }
    .pipeline-label {
      font-family: var(--font-mono);
      font-size: 0.62rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    .pipeline-nodes {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      margin-bottom: 0.85rem;
    }
    .pipe-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      min-width: 80px;
    }
    .pipe-node-icon {
      width: 44px; height: 44px;
      border-radius: 12px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      transition: transform 0.3s;
    }
    .source-node .pipe-node-icon { border-color: rgba(100,160,255,0.3); background: rgba(37,99,235,0.12); }
    .target-node .pipe-node-icon { border-color: rgba(16,185,129,0.3); background: rgba(16,185,129,0.12); }
    .engine-node .pipe-node-icon {
      border-color: rgba(139,92,246,0.4);
      background: rgba(139,92,246,0.15);
      animation: engine-pulse 2.5s ease-in-out infinite;
    }
    @keyframes engine-pulse {
      0%,100% { box-shadow: 0 0 8px rgba(139,92,246,0.3); }
      50% { box-shadow: 0 0 24px rgba(139,92,246,0.65); }
    }
    .pipe-node span {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      color: var(--text-secondary);
    }
    .pipe-connector {
      flex: 1;
      height: 2px;
      background: rgba(100,160,255,0.08);
      position: relative;
      max-width: 100px;
      overflow: visible;
    }
    .pipe-flow {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(59,130,246,0.5), transparent);
      background-size: 200% 100%;
      animation: flow-scan 2s linear infinite;
    }
    .flow-right { animation-delay: 0.5s; }
    @keyframes flow-scan {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    .pipe-packet {
      position: absolute;
      top: 50%; transform: translateY(-50%);
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--primary);
      box-shadow: 0 0 8px var(--primary);
    }
    .p1 { animation: packet-move 2.4s ease-in-out infinite; }
    .p2 { animation: packet-move 2.4s ease-in-out 1.2s infinite; background: var(--accent); box-shadow: 0 0 8px var(--accent); }
    .p3 { animation: packet-move 2.4s ease-in-out 0.3s infinite; }
    .p4 { animation: packet-move 2.4s ease-in-out 1.5s infinite; background: var(--violet); box-shadow: 0 0 8px var(--violet); }
    @keyframes packet-move {
      0% { left: -4px; opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { left: calc(100% + 4px); opacity: 0; }
    }
    .pipeline-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-family: var(--font-mono);
      font-size: 0.67rem;
      color: var(--text-muted);
      justify-content: center;
    }
    .status-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: #10B981;
      box-shadow: 0 0 8px #10B981;
      animation: blink 1.5s ease-in-out infinite;
    }

    /* â”€â”€ Stats Ticker â”€â”€ */
    .stats-ticker {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      flex-wrap: wrap;
      margin-bottom: 2rem;
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px;
      padding: 1rem 1.5rem;
      width: 100%;
      max-width: 640px;
    }
    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.25rem 1.5rem;
      gap: 0.15rem;
    }
    .stat-num {
      font-family: var(--font-display);
      font-size: 1.7rem;
      font-weight: 900;
      background: linear-gradient(135deg, var(--primary), var(--violet));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1.1;
    }
    .stat-plus {
      font-size: 1.2rem;
    }
    .stat-lbl {
      font-family: var(--font-mono);
      font-size: 0.62rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
    }
    .stat-divider {
      width: 1px;
      height: 36px;
      background: rgba(255,255,255,0.07);
    }

    /* Security Specs Card */
    .security-specs {
      padding: 1.1rem 1.6rem !important;
      background: rgba(8,15,35,0.75);
      border: 1px solid rgba(100,160,255,0.14);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      box-shadow: 0 4px 30px rgba(0,0,0,0.35), 0 0 0 1px rgba(59,130,246,0.04) inset;
      width: 100%;
      max-width: 560px;
      margin: 0 auto;
      position: relative;
      overflow: hidden;
    }
    .security-specs::after {
      content: '';
      position: absolute;
      top: 0; left: -100%;
      width: 50%; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(100,180,255,0.55), transparent);
      animation: shimmer-card 3.5s ease-in-out infinite;
    }
    @keyframes shimmer-card {
      0%   { left: -100%; }
      100% { left: 200%; }
    }
    .spec-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      font-family: var(--font-mono);
      color: #93c5fd;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 0.8rem;
    }
    .spec-items {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: center;
    }
    @media (max-width: 640px) {
      .pipeline-nodes { gap: 0; }
      .pipe-node { min-width: 60px; }
      .pipe-node span { font-size: 0.58rem; }
      .stat-item { padding: 0.25rem 0.85rem; }
      .stat-num { font-size: 1.3rem; }
    }
    @media (min-width: 992px) {
      .hero-container {
        align-items: flex-start;
        text-align: left;
      }
      .hero-content {
        max-width: 780px;
        margin: 0;
        align-items: flex-start;
      }
      .hero-actions { justify-content: flex-start; }
      .security-specs { margin: 0 !important; }
      .spec-header    { justify-content: flex-start; }
      .spec-items     { justify-content: flex-start; }
      .pipeline-strip { margin-left: 0; }
      .pipeline-label { text-align: left; }
      .pipeline-nodes { justify-content: flex-start; }
      .pipeline-status { justify-content: flex-start; }
      .stats-ticker { justify-content: flex-start; }
    }
  `]
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private typeTimeoutId: any = null;

  navigateTo(route: string) {
    this.router.navigate(['/'], { fragment: route });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.startTypewriter();
    }
  }

  ngOnDestroy() {
    if (this.typeTimeoutId) {
      clearTimeout(this.typeTimeoutId);
    }
  }

  private startTypewriter() {
    const target = document.getElementById('hero-type-target');
    const cursor = document.getElementById('hero-type-cursor');
    if (!target) return;

    const text = 'Automate Manual Operations & Repetitive Workflows';
    let index = 0;
    target.textContent = '';
    if (cursor) {
      cursor.textContent = '-';
      cursor.style.display = 'inline';
    }

    const type = () => {
      if (index < text.length) {
        target.textContent += text.charAt(index);
        index++;
        this.typeTimeoutId = setTimeout(type, 50 + Math.random() * 40);
      } else {
        target.textContent += '.';
        if (cursor) {
          cursor.style.display = 'none';
        }
      }
    };

    this.typeTimeoutId = setTimeout(type, 800);
  }
}
