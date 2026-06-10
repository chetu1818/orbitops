import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowDemoComponent } from '../workflow-demo/workflow-demo.component';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, WorkflowDemoComponent, ScrollAnimateDirective],
  template: `
    <section class="section services-section">
      <div class="glow-orb glow-accent" style="top: 20%; left: -20%;"></div>
      
      <div class="container">
        <div class="section-header" appScrollAnimate>
          <span class="badge">Our Capabilities</span>
          <h2>Intelligent Integration Engine</h2>
          <p>We eliminate operational bottlenecks by linking platforms, bridging databases, and scheduling repetitive actions.</p>
        </div>

        <div class="grid grid-cols-2">
          <!-- Service 1 -->
          <div class="card service-card" appScrollAnimate class="delay-100">
            <div class="service-icon-wrapper make-theme">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <h3>Make.com Workflows</h3>
            <p class="service-desc">
              Rapidly connect thousands of cloud apps. We design complex scenario diagrams, 
              handle multi-route conditional routing, error queues, and data filters to build robust visual pipelines.
            </p>
            <ul class="feature-list">
              <li>Multi-route conditional branching</li>
              <li>Custom error-handler modules</li>
              <li>JSON mapping and iteration handling</li>
            </ul>
          </div>

          <!-- Service 2 -->
          <div class="card service-card" appScrollAnimate class="delay-200">
            <div class="service-icon-wrapper n8n-theme">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0"/>
                <line x1="12" y1="2" x2="12" y2="12"/>
              </svg>
            </div>
            <h3>n8n Pipelines</h3>
            <p class="service-desc">
              Deploy self-hosted, node-based automation structures for privacy-critical enterprise data. 
              Ideal for running workflows behind VPNs or working with private database servers.
            </p>
            <ul class="feature-list">
              <li>Self-hosted and containerized pipelines</li>
              <li>Javascript code nodes for custom logic</li>
              <li>On-premise secure database integrations</li>
            </ul>
          </div>

          <!-- Service 3 -->
          <div class="card service-card" appScrollAnimate class="delay-300">
            <div class="service-icon-wrapper api-theme">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                <polyline points="2 17 12 22 22 17"/>
                <polyline points="2 12 12 17 22 12"/>
              </svg>
            </div>
            <h3>Custom API Architectures</h3>
            <p class="service-desc">
              For tools that lack native webhook endpoints or pre-built integrations. We code custom, 
              lightweight proxy APIs, webhook receivers, and web controllers using .NET Core and Node.js.
            </p>
            <ul class="feature-list">
              <li>RESTful API proxy development</li>
              <li>Secure token-based auth middleware</li>
              <li>High-throughput Webhook listeners</li>
            </ul>
          </div>

          <!-- Service 4 -->
          <div class="card service-card" appScrollAnimate class="delay-400">
            <div class="service-icon-wrapper normal-theme">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="15" y1="3" x2="15" y2="21"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
              </svg>
            </div>
            <h3>Data Normalization</h3>
            <p class="service-desc">
              Harmonize data structures across HR, payroll, operational logs, and CRM platforms. 
              We resolve character formatting discrepancies, address mismatch mappings, and sanitize payloads automatically.
            </p>
            <ul class="feature-list">
              <li>Cross-platform database matching</li>
              <li>Automated CSV/JSON schema sanitizers</li>
              <li>Scheduled delta synchronization cronjobs</li>
            </ul>
          </div>
        </div>

        <!-- Animated SVG workflow demonstration -->
        <div class="visualization-wrapper" appScrollAnimate>
          <div class="vis-section-header">
            <h3>Visualizing Data Flow</h3>
            <p>Our automation diagrams execute logic routes sequentially, preventing manual delays.</p>
          </div>
          <app-workflow-demo></app-workflow-demo>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .services-section {
      background:
        radial-gradient(ellipse 80% 50% at 10% 40%, rgba(37,99,235,0.05) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 90% 60%, rgba(139,92,246,0.05) 0%, transparent 60%);
    }
    .service-card {
      display: flex;
      flex-direction: column;
      transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s;
    }
    .service-card:hover {
      transform: translateY(-8px);
    }

    /* Icon container — dark glassmorphic */
    .service-icon-wrapper {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.6rem;
      border: 1px solid;
      position: relative;
      overflow: hidden;
      transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s;
    }
    .service-icon-wrapper::before {
      content: '';
      position: absolute;
      inset: 0;
      background: inherit;
      opacity: 0;
      transition: opacity 0.3s;
      border-radius: inherit;
    }
    .service-card:hover .service-icon-wrapper {
      transform: scale(1.1) rotate(-5deg);
    }
    .make-theme {
      background: rgba(37,99,235,0.12);
      border-color: rgba(37,99,235,0.30);
      color: #93c5fd;
      box-shadow: 0 0 24px rgba(37,99,235,0.15);
    }
    .make-theme:hover { box-shadow: 0 0 36px rgba(37,99,235,0.30); }
    .n8n-theme {
      background: rgba(139,92,246,0.12);
      border-color: rgba(139,92,246,0.30);
      color: #c4b5fd;
      box-shadow: 0 0 24px rgba(139,92,246,0.15);
    }
    .api-theme {
      background: rgba(20,184,166,0.12);
      border-color: rgba(20,184,166,0.30);
      color: #5eead4;
      box-shadow: 0 0 24px rgba(20,184,166,0.15);
    }
    .normal-theme {
      background: rgba(251,191,36,0.10);
      border-color: rgba(251,191,36,0.25);
      color: #fcd34d;
      box-shadow: 0 0 24px rgba(251,191,36,0.10);
    }
    .service-card h3 {
      font-size: 1.4rem;
      font-weight: 800;
      margin-bottom: 0.85rem;
      color: var(--text-primary);
    }
    .service-desc {
      color: var(--text-secondary);
      font-size: 0.93rem;
      line-height: 1.75;
      margin-bottom: 1.6rem;
      flex-grow: 1;
    }
    .feature-list {
      list-style: none;
      padding: 0;
      border-top: 1px solid rgba(100,160,255,0.10);
      padding-top: 1.2rem;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .feature-list li {
      font-size: 0.86rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 0.6rem;
      transition: color 0.2s;
    }
    .feature-list li:hover { color: var(--text-primary); }
    .feature-list li::before {
      content: '';
      width: 16px; height: 16px;
      border-radius: 50%;
      border: 1.5px solid rgba(59,130,246,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(59,130,246,0.08);
      flex-shrink: 0;
      /* Checkmark via clip-path trick */
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2393c5fd' stroke-width='3' stroke-linecap='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");
      background-size: 10px;
      background-repeat: no-repeat;
      background-position: center;
    }
    .visualization-wrapper {
      margin-top: 5.5rem;
      border-top: 1px solid rgba(100,160,255,0.10);
      padding-top: 4rem;
    }
    .vis-section-header {
      margin-bottom: 2.5rem;
      text-align: center;
    }
    .vis-section-header h3 {
      font-size: 1.85rem;
      font-weight: 800;
      margin-bottom: 0.6rem;
      background: linear-gradient(135deg, var(--primary), var(--violet));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .vis-section-header p {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }
  `]
})
export class ServicesComponent {}
