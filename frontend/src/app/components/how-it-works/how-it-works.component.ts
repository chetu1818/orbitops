import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-how-it-works',
  standalone: true,
  imports: [CommonModule, ScrollAnimateDirective],
  template: `
    <section class="section timeline-section">
      <div class="glow-orb glow-primary" style="bottom: 10%; left: 30%;"></div>
      
      <div class="container">
        <div class="section-header" appScrollAnimate>
          <span class="badge">The Roadmap</span>
          <h2>Our Operations Method</h2>
          <p>From mapping manual systems to automated, self-healing deployments in three clean phases.</p>
        </div>

        <div class="timeline-container" appScrollAnimate class="delay-200">
          <div class="timeline-line"></div>
          
          <div class="grid grid-cols-3">
            <!-- Step 1 -->
            <div class="timeline-step">
              <div class="step-badge-wrapper">
                <div class="step-number">01</div>
                <div class="step-pulse"></div>
              </div>
              <h3>Process Audit</h3>
              <p class="step-desc">
                We sit down with your teams to map out existing manual database queries, spreadsheets, 
                and operations. We identify latency bottlenecks and calculate automation ROI.
              </p>
            </div>

            <!-- Step 2 -->
            <div class="timeline-step">
              <div class="step-badge-wrapper">
                <div class="step-number">02</div>
                <div class="step-pulse"></div>
              </div>
              <h3>Custom Build</h3>
              <p class="step-desc">
                We build n8n scenarios, Make scenarios, and custom proxy REST controllers. We handle 
                data mappings and execute sandbox dry-runs with comprehensive test boundary payloads.
              </p>
            </div>

            <!-- Step 3 -->
            <div class="timeline-step">
              <div class="step-badge-wrapper">
                <div class="step-number">03</div>
                <div class="step-pulse"></div>
              </div>
              <h3>Deployment & Monitoring</h3>
              <p class="step-desc">
                We push pipelines to production with logging listeners, alerts for exceptions, and 
                health probes. We provide training walkthrough documentation and hand off operational controls.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .timeline-section {
      background:
        radial-gradient(ellipse 70% 50% at 50% 50%, rgba(37,99,235,0.04) 0%, transparent 70%),
        var(--bg-secondary);
      position: relative;
    }
    .timeline-container {
      position: relative;
      margin-top: 2rem;
    }
    /* Animated gradient connecting line */
    .timeline-line {
      position: absolute;
      top: 40px;
      left: 10%; right: 10%;
      height: 2px;
      background: linear-gradient(90deg,
        transparent,
        rgba(59,130,246,0.6) 20%,
        rgba(139,92,246,0.7) 50%,
        rgba(20,184,166,0.6) 80%,
        transparent);
      background-size: 200% 100%;
      animation: line-flow 4s linear infinite;
      display: none;
      box-shadow: 0 0 12px rgba(139,92,246,0.3);
    }
    @keyframes line-flow {
      0%   { background-position: 200% center; }
      100% { background-position: -200% center; }
    }
    @media (min-width: 768px) { .timeline-line { display: block; } }

    .timeline-step {
      text-align: center;
      padding: 0 1rem;
      position: relative;
      z-index: 2;
      transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
    }
    .timeline-step:hover { transform: translateY(-6px); }

    .step-badge-wrapper {
      position: relative;
      width: 88px; height: 88px;
      margin: 0 auto 2rem auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .step-number {
      width: 72px; height: 72px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(37,99,235,0.15), rgba(139,92,246,0.15));
      border: 1.5px solid rgba(100,160,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-size: 1.5rem;
      font-weight: 900;
      background-clip: padding-box;
      background: linear-gradient(135deg, var(--primary) 0%, var(--violet) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      position: relative;
      z-index: 2;
      transition: all 0.35s cubic-bezier(0.16,1,0.3,1);
    }
    /* Circular gradient border around step number */
    .step-number::before {
      content: '';
      position: absolute;
      inset: -2px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(59,130,246,0.6), rgba(139,92,246,0.6));
      z-index: -1;
      transition: opacity 0.3s;
    }
    .step-number::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: var(--bg-secondary);
      z-index: -1;
    }
    .timeline-step:hover .step-number::before {
      background: linear-gradient(135deg, rgba(59,130,246,1), rgba(139,92,246,1));
    }
    .step-pulse {
      position: absolute;
      width: 88px; height: 88px;
      border-radius: 50%;
      border: 1px solid rgba(59,130,246,0.4);
      z-index: 1;
      animation: step-ring 3s ease-out infinite;
    }
    @keyframes step-ring {
      0%   { transform: scale(0.85); opacity: 0.8; }
      100% { transform: scale(1.5);  opacity: 0.0; }
    }
    .timeline-step h3 {
      font-size: 1.3rem;
      font-weight: 800;
      margin-bottom: 1rem;
      color: var(--text-primary);
    }
    .step-desc {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.7;
    }
  `]
})
export class HowItWorksComponent {}
