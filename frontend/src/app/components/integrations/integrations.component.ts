import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-integrations',
  standalone: true,
  imports: [CommonModule, ScrollAnimateDirective],
  template: `
    <section class="section integrations-section">
      <div class="glow-orb glow-primary" style="top:20%; right:-15%; opacity:0.12;"></div>

      <div class="container">
        <div class="section-header" appScrollAnimate>
          <span class="badge">Ecosystem</span>
          <h2>Supported Integrations</h2>
          <p>We build native connectors and custom API bridges across every major HR, payroll, CRM, ERP, and messaging platform your enterprise relies on.</p>
        </div>

        <!-- Category Groups -->
        <div class="int-categories" appScrollAnimate>

          <!-- HR Systems -->
          <div class="int-category">
            <div class="category-header">
              <span class="cat-icon"><i class="bi bi-people-fill"></i></span>
              <h4>HR Management</h4>
              <span class="cat-count">{{ hrSystems.length }} platforms</span>
            </div>
            <div class="int-grid">
              <div *ngFor="let p of hrSystems" class="int-card" [style.--brand-color]="p.color">
                <div class="int-logo-wrap" [innerHTML]="p.logo"></div>
                <div class="int-info">
                  <div class="int-name">{{ p.name }}</div>
                  <div class="int-desc">{{ p.desc }}</div>
                </div>
                <div class="int-connector-dot"></div>
              </div>
            </div>
          </div>

          <!-- Finance & Payroll -->
          <div class="int-category">
            <div class="category-header">
              <span class="cat-icon"><i class="bi bi-credit-card-fill"></i></span>
              <h4>Finance & Payroll</h4>
              <span class="cat-count">{{ financeSystems.length }} platforms</span>
            </div>
            <div class="int-grid">
              <div *ngFor="let p of financeSystems" class="int-card" [style.--brand-color]="p.color">
                <div class="int-logo-wrap" [innerHTML]="p.logo"></div>
                <div class="int-info">
                  <div class="int-name">{{ p.name }}</div>
                  <div class="int-desc">{{ p.desc }}</div>
                </div>
                <div class="int-connector-dot"></div>
              </div>
            </div>
          </div>

          <!-- Automation Engines -->
          <div class="int-category">
            <div class="category-header">
              <span class="cat-icon"><i class="bi bi-lightning-charge-fill"></i></span>
              <h4>Automation Engines</h4>
              <span class="cat-count">{{ automationSystems.length }} platforms</span>
            </div>
            <div class="int-grid">
              <div *ngFor="let p of automationSystems" class="int-card" [style.--brand-color]="p.color">
                <div class="int-logo-wrap" [innerHTML]="p.logo"></div>
                <div class="int-info">
                  <div class="int-name">{{ p.name }}</div>
                  <div class="int-desc">{{ p.desc }}</div>
                </div>
                <div class="int-connector-dot"></div>
              </div>
            </div>
          </div>

          <!-- CRM & Messaging -->
          <div class="int-category">
            <div class="category-header">
              <span class="cat-icon"><i class="bi bi-chat-left-dots-fill"></i></span>
              <h4>CRM & Messaging</h4>
              <span class="cat-count">{{ crmSystems.length }} platforms</span>
            </div>
            <div class="int-grid">
              <div *ngFor="let p of crmSystems" class="int-card" [style.--brand-color]="p.color">
                <div class="int-logo-wrap" [innerHTML]="p.logo"></div>
                <div class="int-info">
                  <div class="int-name">{{ p.name }}</div>
                  <div class="int-desc">{{ p.desc }}</div>
                </div>
                <div class="int-connector-dot"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Scrolling Marquee Ticker -->
        <div class="marquee-wrapper" appScrollAnimate>
          <div class="marquee-label">ALSO CONNECTED WITH</div>
          <div class="marquee-track">
            <div class="marquee-content">
              <span *ngFor="let item of marqueeItems">{{ item }}</span>
            </div>
            <div class="marquee-content" aria-hidden="true">
              <span *ngFor="let item of marqueeItems">{{ item }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .integrations-section {
      background:
        radial-gradient(ellipse 80% 50% at 50% 0%, rgba(37,99,235,0.04) 0%, transparent 60%),
        var(--bg-secondary);
    }

    /* ── Category Groups ── */
    .int-categories {
      display: flex;
      flex-direction: column;
      gap: 3rem;
      margin-bottom: 4rem;
    }
    .int-category {}
    .category-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .cat-icon { font-size: 1.1rem; color: var(--accent); }
    .category-header h4 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .cat-count {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      color: var(--text-muted);
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      padding: 0.15rem 0.5rem;
      border-radius: 20px;
      margin-left: auto;
    }

    /* ── Integration Cards ── */
    .int-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }
    @media (min-width: 640px)  { .int-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 1024px) { .int-grid { grid-template-columns: repeat(4, 1fr); } }

    .int-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border-radius: 12px;
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(255,255,255,0.06);
      transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
      cursor: default;
      position: relative;
      overflow: hidden;
    }
    .int-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: color-mix(in srgb, var(--brand-color, #3b82f6) 6%, transparent);
      opacity: 0;
      transition: opacity 0.25s;
    }
    .int-card:hover {
      border-color: color-mix(in srgb, var(--brand-color, #3b82f6) 35%, transparent);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.25), 0 0 12px color-mix(in srgb, var(--brand-color, #3b82f6) 12%, transparent);
    }
    .int-card:hover::before { opacity: 1; }

    .int-logo-wrap {
      width: 36px; height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      flex-shrink: 0;
      overflow: hidden;
    }
    .int-logo-wrap svg {
      width: 20px;
      height: 20px;
    }
    .int-symbol { font-size: 1.1rem; font-weight: 800; font-family: var(--font-display); }
    .int-info { flex: 1; min-width: 0; }
    .int-name {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .int-desc {
      font-family: var(--font-mono);
      font-size: 0.62rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .int-connector-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: color-mix(in srgb, var(--brand-color, #3b82f6) 60%, transparent);
      box-shadow: 0 0 6px var(--brand-color, #3b82f6);
      flex-shrink: 0;
      animation: idot 2.5s ease-in-out infinite;
    }
    @keyframes idot {
      0%,100% { opacity: 0.4; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1.1); }
    }

    /* ── Marquee ── */
    .marquee-wrapper {
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 2rem;
    }
    .marquee-label {
      font-family: var(--font-mono);
      font-size: 0.62rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 1rem;
      text-align: center;
    }
    .marquee-track {
      display: flex;
      overflow: hidden;
      mask-image: linear-gradient(90deg, transparent, black 15%, black 85%, transparent);
      -webkit-mask-image: linear-gradient(90deg, transparent, black 15%, black 85%, transparent);
    }
    .marquee-content {
      display: flex;
      gap: 0;
      animation: marquee 28s linear infinite;
      flex-shrink: 0;
    }
    .marquee-content span {
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: var(--text-muted);
      padding: 0 1.5rem;
      white-space: nowrap;
      position: relative;
    }
    .marquee-content span::after {
      content: '·';
      position: absolute;
      right: 0;
      color: rgba(255,255,255,0.15);
    }
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-100%); }
    }
    .marquee-track:hover .marquee-content { animation-play-state: paused; }
  `]
})
export class IntegrationsComponent {
  hrSystems = [
    { 
      name: 'BambooHR', 
      desc: 'Core HR & ATS', 
      color: '#73D67A', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 8a5 5 0 0 0-5-5 5 5 0 0 0-5 5c0 4 5 13 5 13s5-9 5-13zM12 13.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" fill="#73D67A"/></svg>' 
    },
    { 
      name: 'HiBob', 
      desc: 'HR Information System', 
      color: '#5B67FF', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="#5B67FF"/><text x="12" y="15.5" font-size="9.5" font-family="sans-serif" font-weight="bold" fill="white" text-anchor="middle">bob</text></svg>' 
    },
    { 
      name: 'Personio', 
      desc: 'Recruitment & Attendance', 
      color: '#2C6CF6', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="4" fill="#2C6CF6"/><text x="12" y="16.5" font-size="13" font-family="sans-serif" font-weight="900" fill="white" text-anchor="middle">P</text></svg>' 
    },
    { 
      name: 'Workday', 
      desc: 'Enterprise HCM', 
      color: '#F5A623', 
      logo: '<svg viewBox="0 0 24 24" fill="none" stroke="#F5A623" stroke-width="2.5"><path d="M12 4a8 8 0 0 1 8 8v1a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1a8 8 0 0 1 8-8z"/><circle cx="12" cy="12" r="2.5" fill="#F5A623"/></svg>' 
    },
    { 
      name: 'Greenhouse',
      desc: 'Talent Acquisition', 
      color: '#3DAA6D', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 9v11h20V9L12 2zm3 16H9v-5h6v5z" fill="#3DAA6D"/></svg>' 
    },
    { 
      name: 'Rippling', 
      desc: 'HR & IT Automation', 
      color: '#E8645A', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="9" fill="none" stroke="#E8645A" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="#E8645A" stroke-width="2"/><circle cx="12" cy="12" r="1.5" fill="#E8645A"/></svg>' 
    },
  ];

  financeSystems = [
    { 
      name: 'ADP', 
      desc: 'Global Payroll Engine', 
      color: '#E84B3A', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="5" width="20" height="14" rx="3" fill="#E84B3A"/><text x="12" y="15" font-size="9" font-family="sans-serif" font-weight="900" fill="white" text-anchor="middle">ADP</text></svg>' 
    },
    { 
      name: 'Stripe', 
      desc: 'Payment Processing', 
      color: '#6772E5', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.9 11.2c-1.2-.5-1.7-.8-1.7-1.4 0-.5.5-.9 1.4-.9 1 0 1.9.3 2.7.8l.8-2.2c-.8-.4-2-.8-3.4-.8-2.7 0-4.5 1.5-4.5 3.9 0 2.5 2.1 3.5 3.9 4.3 1.3.6 1.8.9 1.8 1.5 0 .6-.6 1-1.6 1-1.3 0-2.4-.4-3.3-1 l-.9 2.2c1.1.6 2.5.9 4.1.9 2.8 0 4.7-1.4 4.7-4.1-.1-2.4-1.9-3.4-4.1-4.2z" fill="#6772E5"/></svg>' 
    },
    { 
      name: 'NetSuite', 
      desc: 'Cloud ERP & Accounting', 
      color: '#009FDA', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="4" fill="#009FDA"/><text x="12" y="15.5" font-size="9.5" font-family="sans-serif" font-weight="900" fill="white" text-anchor="middle">NS</text></svg>' 
    },
    { 
      name: 'Xero', 
      desc: 'SME Accounting', 
      color: '#13B5EA', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="#13B5EA"/><text x="12" y="16.5" font-size="13" font-family="sans-serif" font-weight="bold" fill="white" text-anchor="middle">x</text></svg>' 
    },
    { 
      name: 'QuickBooks',
      desc: 'Financial Management', 
      color: '#2CA01C', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="4" fill="#2CA01C"/><text x="12" y="16.5" font-size="11" font-family="sans-serif" font-weight="900" fill="white" text-anchor="middle">qb</text></svg>' 
    },
  ];

  automationSystems = [
    { 
      name: 'Make.com', 
      desc: 'Visual Scenario Builder', 
      color: '#6A67CE', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="7" cy="7" r="3" fill="#6A67CE"/><circle cx="17" cy="7" r="3" fill="#6A67CE"/><circle cx="12" cy="17" r="3" fill="#6A67CE"/><line x1="7" y1="7" x2="17" y2="7" stroke="#6A67CE" stroke-width="2"/><line x1="7" y1="7" x2="12" y2="17" stroke="#6A67CE" stroke-width="2"/><line x1="17" y1="7" x2="12" y2="17" stroke="#6A67CE" stroke-width="2"/></svg>' 
    },
    { 
      name: 'n8n', 
      desc: 'Node-based Pipelines', 
      color: '#EA4B71', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" fill="#EA4B71"/><circle cx="8" cy="12" r="1.8" fill="white"/><circle cx="16" cy="12" r="1.8" fill="white"/><line x1="8" y1="12" x2="16" y2="12" stroke="white" stroke-width="1.8"/></svg>' 
    },
    { 
      name: '.NET Core', 
      desc: 'Custom API Middleware', 
      color: '#512BD4', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="4" fill="#512BD4"/><text x="12" y="16" font-size="10" font-family="sans-serif" font-weight="900" fill="white" text-anchor="middle">.NET</text></svg>' 
    },
    { 
      name: 'Node.js', 
      desc: 'Webhook Receivers', 
      color: '#68A063', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="18" height="18" rx="4" fill="#68A063"/><text x="12" y="16.5" font-size="12" font-family="sans-serif" font-weight="900" fill="white" text-anchor="middle">JS</text></svg>' 
    },
  ];

  crmSystems = [
    { 
      name: 'HubSpot', 
      desc: 'CRM & Marketing Hub', 
      color: '#FF7A59', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3.5" fill="#FF7A59"/><circle cx="12" cy="5" r="2.2" fill="#FF7A59"/><circle cx="19" cy="12" r="2.2" fill="#FF7A59"/><circle cx="12" cy="19" r="2.2" fill="#FF7A59"/><line x1="12" y1="5" x2="12" y2="19" stroke="#FF7A59" stroke-width="2"/><line x1="12" y1="12" x2="19" y2="12" stroke="#FF7A59" stroke-width="2"/></svg>' 
    },
    { 
      name: 'Salesforce', 
      desc: 'Enterprise CRM', 
      color: '#00A1E0', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.3 12.5c0-.1 0-.2-.1-.3.1-.4.1-.8.1-1.2 0-2.5-2-4.5-4.5-4.5-1.2 0-2.3.5-3.1 1.3C10.9 7.3 9.5 7 8 7 5.2 7 3 9.2 3 12c0 .4.1.8.2 1.2-.7.6-1.2 1.5-1.2 2.5 0 1.9 1.6 3.5 3.5 3.5h13c2.2 0 4-1.8 4-4 0-1.4-.7-2.6-1.7-3.2.3-.5.5-1.1.5-1.7z" fill="#00A1E0"/></svg>' 
    },
    { 
      name: 'Slack', 
      desc: 'Team Messaging', 
      color: '#4A154B', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="7.5" cy="7.5" r="2" fill="#36C5F0"/><circle cx="16.5" cy="7.5" r="2" fill="#2EB67D"/><circle cx="7.5" cy="16.5" r="2" fill="#ECB22E"/><circle cx="16.5" cy="16.5" r="2" fill="#E01E5A"/><rect x="8.5" y="5" width="1.5" height="4" rx="0.7" fill="#36C5F0"/><rect x="14" y="5" width="4" height="1.5" rx="0.7" fill="#2EB67D"/><rect x="5" y="14" width="4" height="1.5" rx="0.7" fill="#ECB22E"/><rect x="14" y="14" width="1.5" height="4" rx="0.7" fill="#E01E5A"/></svg>' 
    },
    { 
      name: 'Microsoft Teams', 
      desc: 'Collaboration Platform', 
      color: '#464EB8', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="4" width="12" height="16" rx="2" fill="#464EB8"/><text x="8" y="15" font-size="11" font-family="sans-serif" font-weight="bold" fill="white" text-anchor="middle">T</text><circle cx="18" cy="9" r="3" fill="#545FDE"/><path d="M14 16c0-2.2 1.8-4 4-4s4 1.8 4 4v4H14v-4z" fill="#545FDE"/></svg>' 
    },
    { 
      name: 'SendGrid', 
      desc: 'Transactional Email', 
      color: '#1A82E2', 
      logo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 2h9v9H2V2zm11 0h9v9h-9V2zM2 13h9v9H2v-9zm11 0h9v9h-9v-9z" fill="#1A82E2"/></svg>' 
    },
  ];

  marqueeItems = [
    'Okta SSO', 'AWS Lambda', 'Google Workspace', 'Zapier', 'Airtable',
    'Notion', 'Jira', 'GitHub Actions', 'Postgres', 'MySQL', 'MongoDB',
    'Redis', 'Typeform', 'DocuSign', 'Zendesk', 'Intercom', 'Mailchimp',
    'ActiveCampaign', 'Calendly', 'Zoom', 'Webflow', 'WooCommerce',
  ];
}
