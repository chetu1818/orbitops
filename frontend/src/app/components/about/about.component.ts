import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, ScrollAnimateDirective],
  template: `
    <section class="section about-section page-fade-in">
      <div class="glow-orb glow-violet" style="top:20%; left:-10%; opacity:0.12;"></div>
      <div class="glow-orb glow-accent" style="bottom:10%; right:-10%; opacity:0.1;"></div>

      <div class="container">
        <!-- Header -->
        <div class="section-header" appScrollAnimate>
          <span class="badge">Our Mission</span>
          <h2>Built for Enterprise Automation</h2>
          <p>We are a specialized B2B integration team focused on visual scenario architecture, database synchronization, and custom API engineering — turning complex operational chaos into reliable, auditable data flows.</p>
        </div>

        <!-- Mission Stats -->
        <div class="mission-stats" appScrollAnimate>
          <div class="mstat-item" *ngFor="let stat of missionStats">
            <div class="mstat-value" [style.color]="stat.color">{{ stat.value }}</div>
            <div class="mstat-label">{{ stat.label }}</div>
            <div class="mstat-desc">{{ stat.desc }}</div>
          </div>
        </div>

        <!-- Expertise Cards -->
        <div class="expertise-section">
          <h3 class="sub-heading" appScrollAnimate>Team Expertise</h3>
          <div class="expertise-grid">
            <div *ngFor="let expert of experts; let i = index" 
                 class="card expert-card" 
                 appScrollAnimate
                 [ngClass]="'delay-' + ((i+1) * 100)">
              <div class="expert-icon-wrap" [style.--exp-color]="expert.color">
                <i class="bi" [class]="expert.icon" style="font-size: 1.4rem;"></i>
              </div>
              <div class="expert-content">
                <div class="expert-title">{{ expert.title }}</div>
                <div class="expert-role">{{ expert.role }}</div>
                <p class="expert-desc">{{ expert.description }}</p>
                <div class="expert-skills">
                  <span *ngFor="let skill of expert.skills" class="expert-skill-tag">{{ skill }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Values Grid -->
        <div class="values-section">
          <h3 class="sub-heading" appScrollAnimate>Our Operating Principles</h3>
          <div class="grid grid-cols-2 values-grid">
            <div *ngFor="let val of values; let i = index" 
                 class="value-card"
                 appScrollAnimate
                 [ngClass]="'delay-' + ((i % 4 + 1) * 100)">
              <div class="val-icon" [style.color]="val.color">
                <i class="bi" [class]="val.icon"></i>
              </div>
              <div class="val-content">
                <strong>{{ val.title }}</strong>
                <p>{{ val.description }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tech Stack Banner -->
        <div class="tech-banner" appScrollAnimate>
          <div class="tech-banner-label">TECHNOLOGIES WE WORK WITH DAILY</div>
          <div class="tech-banner-items">
            <div *ngFor="let tech of techStack" class="tech-banner-item">
              <span class="tech-logo"><i class="bi" [class]="tech.icon"></i></span>
              <span class="tech-name">{{ tech.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .about-section {
      background: var(--bg-secondary);
    }

    /* ── Mission Stats ── */
    .mission-stats {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 5rem;
      padding: 2rem;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 20px;
    }
    @media (min-width: 768px) {
      .mission-stats { grid-template-columns: repeat(4, 1fr); }
    }
    .mstat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1rem;
      border-right: 1px solid rgba(255,255,255,0.06);
    }
    .mstat-item:last-child { border-right: none; }
    .mstat-value {
      font-family: var(--font-display);
      font-size: 2.2rem;
      font-weight: 900;
      line-height: 1.1;
      margin-bottom: 0.25rem;
    }
    .mstat-label {
      font-weight: 700;
      font-size: 0.85rem;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }
    .mstat-desc {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      color: var(--text-muted);
      text-align: center;
    }

    /* ── Sub Headings ── */
    .sub-heading {
      font-size: 1.5rem;
      font-weight: 800;
      margin-bottom: 1.75rem;
      background: linear-gradient(135deg, var(--primary), var(--violet));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* ── Expertise Cards ── */
    .expertise-section {
      margin-bottom: 5rem;
    }
    .expertise-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }
    @media (min-width: 640px)  { .expertise-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .expertise-grid { grid-template-columns: repeat(4, 1fr); } }

    .expert-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      border-color: rgba(255,255,255,0.06) !important;
      transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
    }
    .expert-card:hover {
      border-color: color-mix(in srgb, var(--exp-color, #3b82f6) 35%, transparent) !important;
      box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 0 20px color-mix(in srgb, var(--exp-color, #3b82f6) 10%, transparent);
    }
    .expert-icon-wrap {
      width: 52px; height: 52px;
      border-radius: 14px;
      background: color-mix(in srgb, var(--exp-color, #3b82f6) 12%, transparent);
      border: 1px solid color-mix(in srgb, var(--exp-color, #3b82f6) 25%, transparent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
    }
    .expert-title {
      font-size: 1rem;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 0.1rem;
    }
    .expert-role {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      color: color-mix(in srgb, var(--exp-color, #3b82f6) 70%, white);
      text-transform: uppercase;
      letter-spacing: 0.07em;
      margin-bottom: 0.5rem;
    }
    .expert-desc {
      font-size: 0.82rem;
      color: var(--text-secondary);
      line-height: 1.65;
      margin-bottom: 0.85rem;
    }
    .expert-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-top: auto;
    }
    .expert-skill-tag {
      font-family: var(--font-mono);
      font-size: 0.62rem;
      padding: 0.18rem 0.5rem;
      border-radius: 4px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      color: var(--text-muted);
    }

    /* ── Values ── */
    .values-section { margin-bottom: 4rem; }
    .values-grid { gap: 1rem !important; }
    .value-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 14px;
      transition: all 0.22s;
    }
    .value-card:hover {
      background: rgba(255,255,255,0.04);
      border-color: rgba(100,160,255,0.15);
      transform: translateY(-2px);
    }
    .val-icon { font-size: 1.5rem; flex-shrink: 0; margin-top: 2px; }
    .val-content strong {
      display: block;
      font-size: 0.92rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.3rem;
    }
    .val-content p {
      font-size: 0.8rem;
      color: var(--text-secondary);
      line-height: 1.6;
      margin: 0;
    }

    /* ── Tech Banner ── */
    .tech-banner {
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 2.5rem;
    }
    .tech-banner-label {
      font-family: var(--font-mono);
      font-size: 0.62rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
      text-align: center;
    }
    .tech-banner-items {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
    }
    .tech-banner-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 1rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 8px;
      font-size: 0.8rem;
      color: var(--text-secondary);
      transition: all 0.2s;
    }
    .tech-banner-item:hover {
      background: rgba(255,255,255,0.06);
      border-color: rgba(100,160,255,0.15);
      color: var(--text-primary);
    }
    .tech-logo { font-size: 0.85rem; }
    .tech-name { font-family: var(--font-mono); font-size: 0.75rem; }
  `]
})
export class AboutComponent {
  missionStats = [
    { value: '3+',    label: 'Years Building',      desc: 'Enterprise integrations',        color: '#3b82f6' },
    { value: '400+',  label: 'Automations Live',    desc: 'Running in production today',    color: '#8b5cf6' },
    { value: '12',    label: 'Enterprise Clients',  desc: 'Across UK, EU, US markets',      color: '#10b981' },
    { value: '99.7%', label: 'SLA Delivered',       desc: 'Across all active pipelines',    color: '#f59e0b' },
  ];

  experts = [
    {
      icon: 'bi-lightning-charge-fill',
      title: 'Make.com Expert',
      role: 'VISUAL AUTOMATION',
      color: '#6A67CE',
      description: 'Designs complex multi-route scenario blueprints with error queues, custom routers, data mappers, and HTTP modules for enterprise-grade Make.com workflows.',
      skills: ['Scenario Design', 'Router Modules', 'Error Handlers', 'HTTP Webhooks', 'Data Mappers'],
    },
    {
      icon: 'bi-gear-wide-connected',
      title: 'n8n Pipeline Engineer',
      role: 'NODE AUTOMATION',
      color: '#EA4B71',
      description: 'Architects self-hosted n8n workflows with JavaScript code nodes, database triggers, and complex conditional logic for privacy-critical enterprise data.',
      skills: ['Node Chains', 'Code Nodes (JS)', 'Postgres Triggers', 'Self-Hosted VPN', 'Batch Processing'],
    },
    {
      icon: 'bi-braces-asterisk',
      title: '.NET API Architect',
      role: 'CUSTOM MIDDLEWARE',
      color: '#512BD4',
      description: 'Builds lightweight proxy APIs, secure webhook receivers, and authentication middleware for platforms without native integration endpoints.',
      skills: ['.NET 8 Core', 'REST API Design', 'JWT Auth', 'Webhook Listeners', 'Rate Limiting'],
    },
    {
      icon: 'bi-database-fill-gear',
      title: 'Data Architect',
      role: 'SCHEMA ENGINEERING',
      color: '#F59E0B',
      description: 'Designs 50+ rule data transformation engines that normalize, validate and deduplicate records across HR, payroll, CRM, and ERP system schemas.',
      skills: ['JSON Schema', 'Data Mapping', 'ETL Design', 'SQL Optimization', 'Delta Sync'],
    },
  ];

  values = [
    { icon: 'bi-shield-fill-check', color: '#3b82f6', title: 'Security First',         description: 'AES-256 encryption, Zero-Trust architecture, and SOC2-aligned processes on every integration we build.' },
    { icon: 'bi-lightning-fill', color: '#8b5cf6', title: 'Zero Manual Operations', description: 'Every process we design eliminates a human bottleneck. No spreadsheets, no copy-paste, no delays.' },
    { icon: 'bi-building-fill-gear', color: '#10b981', title: 'Enterprise Grade',       description: 'Production-ready pipelines with error handling, retry logic, dead-letter queues, and full audit trails.' },
    { icon: 'bi-rocket-takeoff-fill', color: '#f59e0b', title: 'Rapid Delivery',         description: 'We move fast. Most automation scenarios are designed, tested, and deployed within 2–5 business days.' },
    { icon: 'bi-eye-fill', color: '#ef4444', title: 'Transparent Process',    description: 'Full visibility into every integration. We document every scenario, rule, and data flow we build for you.' },
    { icon: 'bi-arrow-repeat', color: '#6A67CE', title: 'Self-Healing Design',    description: 'Our workflows include automatic retry logic, error alerts, and fallback routes — they fix themselves.' },
    { icon: 'bi-graph-up-arrow', color: '#EA4B71', title: 'Scalable Architecture',  description: 'From 100 to 100,000+ records per day — our pipelines scale horizontally without redesign.' },
    { icon: 'bi-people-fill', color: '#00BCD4', title: 'Long-Term Partnership',  description: 'We maintain, monitor, and evolve every workflow we build. Your integration success is our success.' },
  ];

  techStack = [
    { icon: 'bi-lightning-fill', name: 'Make.com'    },
    { icon: 'bi-gear-wide-connected',  name: 'n8n'         },
    { icon: 'bi-braces',  name: '.NET 9 Core' },
    { icon: 'bi-code-slash',  name: 'Node.js'     },
    { icon: 'bi-database-fill',  name: 'PostgreSQL'  },
    { icon: 'bi-clock-history',  name: 'Redis'       },
    { icon: 'bi-wallet2',  name: 'ADP API'     },
    { icon: 'bi-people',  name: 'BambooHR'    },
    { icon: 'bi-credit-card-fill',  name: 'Stripe'      },
    { icon: 'bi-chat-quote',  name: 'HubSpot'     },
    { icon: 'bi-clouds-fill',  name: 'NetSuite'    },
    { icon: 'bi-key-fill',  name: 'JWT Auth'    },
  ];
}
