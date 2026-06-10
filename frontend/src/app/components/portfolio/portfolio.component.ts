import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

interface Project {
  title: string;
  category: string;
  description: string;
  metric: string;
  metricLabel: string;
  metricColor: string;
  techStack: string[];
  flowDiagramSteps: string[];
  inputPayload: string;
  outputPayload: string;
}

interface WorkflowTemplate {
  name: string;
  icon: string;
  platform: 'make' | 'n8n' | 'both';
  complexity: 'Starter' | 'Advanced' | 'Enterprise';
  category: string;
  triggers: string;
  actions: number;
}

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, ScrollAnimateDirective],
  template: `
    <section class="section portfolio-section page-fade-in">
      <div class="glow-orb glow-primary" style="top: 15%; right: 5%;"></div>
      <div class="glow-orb glow-accent" style="bottom: 15%; left: 5%;"></div>
      
      <div class="container">
        <!-- Section 1: Metrics Bar -->
        <div class="metrics-bar" appScrollAnimate>
          <div class="metric-pill" *ngFor="let m of globalMetrics">
            <span class="mpill-val" [style.color]="m.color">{{ m.value }}</span>
            <span class="mpill-lbl">{{ m.label }}</span>
          </div>
        </div>

        <!-- Section 2: Case Studies -->
        <div class="section-header" appScrollAnimate>
          <span class="badge">Case Studies</span>
          <h2>Our Work in Action</h2>
          <p>Architectural visualizations and real data transformation pipelines from enterprise B2B automation projects we have deployed.</p>
        </div>

        <div class="portfolio-grid">
          <div *ngFor="let project of projects; let i = index" 
               class="card project-card" 
               appScrollAnimate 
               [ngClass]="i % 2 === 0 ? 'delay-100' : 'delay-200'">
            <div class="project-header">
              <span class="project-category">{{ project.category }}</span>
              <div class="project-metric-pill" [style.--met-color]="project.metricColor">
                <span class="metric-num">{{ project.metric }}</span>
                <span class="metric-lbl">{{ project.metricLabel }}</span>
              </div>
            </div>
            
            <h3>{{ project.title }}</h3>
            <p class="project-desc">{{ project.description }}</p>

            <div class="flow-visualization">
              <div class="vis-header">Pipeline Architecture Flow</div>
              <div class="vis-flow">
                <ng-container *ngFor="let step of project.flowDiagramSteps; let i = index; let last = last">
                  <div class="flow-step">
                    <span class="step-icon">◆</span>
                    <span class="step-name">{{ step }}</span>
                  </div>
                  <div *ngIf="!last" class="flow-arrow">➔</div>
                </ng-container>
              </div>
            </div>

            <!-- Payload schema mocks with syntax highlighting -->
            <div class="payload-visualizer">
              <div class="payload-box">
                <div class="payload-title-row">
                  <span class="payload-title">Source JSON Input</span>
                  <span class="payload-badge raw-payload-badge">RAW</span>
                </div>
                <pre class="payload-code" [innerHTML]="highlightJson(project.inputPayload)"></pre>
              </div>
              <div class="payload-arrow-col">
                <div class="payload-arrow">⟹</div>
                <div class="payload-arrow-label">Transform</div>
              </div>
              <div class="payload-box">
                <div class="payload-title-row">
                  <span class="payload-title">Normalized Output</span>
                  <span class="payload-badge out-payload-badge">CLEAN</span>
                </div>
                <pre class="payload-code output-code" [innerHTML]="highlightJson(project.outputPayload)"></pre>
              </div>
            </div>

            <div class="tech-tags">
              <span *ngFor="let tech of project.techStack" class="tech-tag">{{ tech }}</span>
            </div>
          </div>
        </div>

        <!-- Section 3: Workflow Template Catalog -->
        <div class="scenarios-wrapper">
          <div class="section-header" appScrollAnimate>
            <span class="badge">Workflow Catalog</span>
            <h2>Automation Templates We Build</h2>
            <p>A selection of production-ready automation workflows we architect for enterprise clients using Make.com and n8n.</p>
          </div>

          <div class="workflow-catalog" appScrollAnimate>
            <div *ngFor="let wf of workflowTemplates" class="wf-card" [attr.data-platform]="wf.platform">
              <div class="wf-header">
                <span class="wf-icon">{{ wf.icon }}</span>
                <div class="wf-badges">
                  <span class="wf-platform-badge" [ngClass]="wf.platform + '-badge'">
                    {{ wf.platform === 'make' ? 'Make.com' : wf.platform === 'n8n' ? 'n8n' : 'Make + n8n' }}
                  </span>
                  <span class="wf-complexity-badge" [ngClass]="wf.complexity.toLowerCase() + '-complexity'">{{ wf.complexity }}</span>
                </div>
              </div>
              <div class="wf-name">{{ wf.name }}</div>
              <div class="wf-category">{{ wf.category }}</div>
              <div class="wf-meta">
                <span class="wf-trigger">↻ {{ wf.triggers }}</span>
                <span class="wf-actions">{{ wf.actions }} modules</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section 4: Technical Scenarios -->
        <div class="section-header" style="margin-top: 5rem;" appScrollAnimate>
          <span class="badge">Technical Specs</span>
          <h2>Engineering Challenges We Solve</h2>
          <p>Complex logic architectures and data engineering problems we tackle across enterprise B2B integration layers.</p>
        </div>

        <div class="grid grid-cols-2">
          <div *ngFor="let scenario of scenarios; let i = index" 
               class="card scenario-card" 
               appScrollAnimate 
               [ngClass]="i % 2 === 0 ? 'delay-100' : 'delay-200'">
            <div class="scenario-header">
              <span class="scenario-icon">⚙</span>
              <span class="scenario-badge">{{ scenario.badge }}</span>
            </div>
            <h3>{{ scenario.title }}</h3>
            <p class="scenario-desc">{{ scenario.description }}</p>
            
            <div class="scenario-details">
              <div class="detail-block challenge-block">
                <div class="detail-label">⚠ THE CHALLENGE</div>
                <span>{{ scenario.challenge }}</span>
              </div>
              <div class="detail-block solution-block">
                <div class="detail-label">✓ OUR SOLUTION</div>
                <span>{{ scenario.solution }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .portfolio-section {
      background: radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.01) 0%, transparent 60%);
    }

    /* ── Global Metrics Bar ── */
    .metrics-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 5rem;
      padding: 1.5rem;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
    }
    .metric-pill {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem 2rem;
      gap: 0.15rem;
    }
    .mpill-val {
      font-family: var(--font-display);
      font-size: 2rem;
      font-weight: 900;
      line-height: 1.1;
    }
    .mpill-lbl {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--text-muted);
    }

    /* ── Project Cards ── */
    .portfolio-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3rem;
      margin-bottom: 6rem;
    }
    @media (min-width: 992px) {
      .portfolio-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .project-card {
      display: flex;
      flex-direction: column;
      border-color: rgba(255, 255, 255, 0.08) !important;
      background: var(--bg-card);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }
    .project-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .project-category {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-family: var(--font-mono);
    }
    .project-metric-pill {
      background: color-mix(in srgb, var(--met-color, #10B981) 10%, transparent);
      border: 1px solid color-mix(in srgb, var(--met-color, #10B981) 25%, transparent);
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .metric-num {
      color: var(--met-color, #10B981);
      font-weight: bold;
      font-size: 0.9rem;
      font-family: var(--font-display);
    }
    .metric-lbl {
      color: color-mix(in srgb, var(--met-color, #10B981) 70%, transparent);
      font-size: 0.75rem;
    }
    .project-card h3 {
      font-size: 1.4rem;
      margin-bottom: 0.75rem;
      color: var(--text-primary);
    }
    .project-desc {
      color: var(--text-secondary);
      font-size: 0.92rem;
      margin-bottom: 1.75rem;
      line-height: 1.65;
    }
    .flow-visualization {
      background: rgba(3, 7, 18, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .vis-header {
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--text-muted);
      margin-bottom: 0.85rem;
      font-weight: 600;
      font-family: var(--font-mono);
    }
    .vis-flow {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.4rem 0.6rem;
      font-family: var(--font-mono);
      font-size: 0.75rem;
    }
    .flow-step {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      background: rgba(15, 23, 42, 0.6);
      padding: 0.25rem 0.6rem;
      border-radius: 5px;
      color: var(--text-primary);
      border: 1px solid rgba(255, 255, 255, 0.08);
      white-space: nowrap;
    }
    .step-icon { color: var(--primary); font-size: 0.6rem; }
    .flow-arrow { color: var(--text-muted); }

    /* ── Payload Visualizer ── */
    .payload-visualizer {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
      margin-bottom: 1.75rem;
    }
    @media (min-width: 576px) {
      .payload-visualizer { grid-template-columns: 1fr auto 1fr; align-items: stretch; }
    }
    .payload-box { display: flex; flex-direction: column; }
    .payload-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.35rem;
    }
    .payload-title {
      font-size: 0.62rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      font-weight: 700;
      font-family: var(--font-mono);
    }
    .payload-badge {
      font-family: var(--font-mono);
      font-size: 0.55rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      padding: 0.1rem 0.35rem;
      border-radius: 3px;
    }
    .raw-payload-badge { background: rgba(239,68,68,0.12); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
    .out-payload-badge  { background: rgba(16,185,129,0.12); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
    .payload-code {
      background: #020a14;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      font-family: var(--font-mono);
      font-size: 0.68rem;
      overflow-x: auto;
      min-height: 130px;
      border: 1px solid rgba(255,255,255,0.07);
      line-height: 1.65;
      margin: 0;
      flex: 1;
    }
    .output-code { border-color: rgba(16,185,129,0.15); }
    .payload-arrow-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.2rem;
      padding: 0 0.5rem;
    }
    .payload-arrow {
      font-size: 1.2rem;
      color: var(--violet);
      animation: arrow-pulse 2s ease-in-out infinite;
    }
    .payload-arrow-label {
      font-family: var(--font-mono);
      font-size: 0.58rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    @keyframes arrow-pulse {
      0%,100% { filter: drop-shadow(0 0 3px rgba(139,92,246,0.3)); }
      50% { filter: drop-shadow(0 0 10px rgba(139,92,246,0.8)); }
    }
    .tech-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: auto;
    }
    .tech-tag {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      padding: 0.2rem 0.65rem;
      border-radius: 6px;
      font-size: 0.75rem;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }

    /* ── Workflow Catalog ── */
    .scenarios-wrapper {
      margin-top: 5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding-top: 5rem;
    }
    .workflow-catalog {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
      margin-bottom: 0;
    }
    @media (min-width: 640px)  { .workflow-catalog { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .workflow-catalog { grid-template-columns: repeat(4, 1fr); } }

    .wf-card {
      background: rgba(255,255,255,0.025);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 14px;
      padding: 1.25rem;
      transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
      cursor: default;
    }
    .wf-card:hover {
      background: rgba(255,255,255,0.04);
      border-color: rgba(100,160,255,0.2);
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    }
    .wf-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.85rem;
    }
    .wf-icon { font-size: 1.5rem; }
    .wf-badges { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; }
    .wf-platform-badge, .wf-complexity-badge {
      font-family: var(--font-mono);
      font-size: 0.58rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      padding: 0.12rem 0.4rem;
      border-radius: 4px;
    }
    .make-badge    { background: rgba(106,103,206,0.15); color: #a5b4fc; border: 1px solid rgba(106,103,206,0.25); }
    .n8n-badge     { background: rgba(234,75,113,0.15);  color: #fb7185; border: 1px solid rgba(234,75,113,0.25); }
    .both-badge    { background: rgba(20,184,166,0.12);  color: #5eead4; border: 1px solid rgba(20,184,166,0.25); }
    .starter-complexity    { background: rgba(16,185,129,0.1); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
    .advanced-complexity   { background: rgba(251,191,36,0.1); color: #fcd34d; border: 1px solid rgba(251,191,36,0.2); }
    .enterprise-complexity { background: rgba(239,68,68,0.1);  color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
    .wf-name {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 0.2rem;
      line-height: 1.3;
    }
    .wf-category {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }
    .wf-meta {
      display: flex;
      justify-content: space-between;
      font-family: var(--font-mono);
      font-size: 0.62rem;
      color: var(--text-muted);
      border-top: 1px solid rgba(255,255,255,0.05);
      padding-top: 0.65rem;
    }
    .wf-trigger { color: var(--primary); }
    .wf-actions { color: var(--text-muted); }

    /* ── Scenario Cards ── */
    .scenario-card {
      background: var(--bg-card);
      border-color: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: flex;
      flex-direction: column;
    }
    .scenario-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }
    .scenario-icon { font-size: 1.5rem; color: var(--primary); }
    .scenario-badge {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      text-transform: uppercase;
      background: rgba(37, 99, 235, 0.1);
      border: 1px solid rgba(37, 99, 235, 0.2);
      color: var(--primary);
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-weight: 700;
      letter-spacing: 0.05em;
    }
    .scenario-card h3 { font-size: 1.25rem; margin-bottom: 0.75rem; }
    .scenario-desc {
      color: var(--text-secondary);
      font-size: 0.9rem;
      line-height: 1.65;
      margin-bottom: 1.5rem;
    }
    .scenario-details {
      margin-top: auto;
      border-top: 1px solid rgba(255, 255, 255, 0.07);
      padding-top: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .detail-block { display: flex; flex-direction: column; gap: 0.3rem; }
    .detail-label {
      font-family: var(--font-mono);
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .challenge-block .detail-label { color: #fcd34d; }
    .solution-block  .detail-label { color: #34d399; }
    .detail-block span { color: var(--text-secondary); font-size: 0.83rem; line-height: 1.55; }
  `]
})
export class PortfolioComponent {
  globalMetrics = [
    { value: '5M+',  label: 'Records Synced Monthly', color: '#3b82f6'  },
    { value: '400+', label: 'Scenarios Deployed',     color: '#8b5cf6'  },
    { value: '99.7%',label: 'Pipeline Reliability',   color: '#10b981'  },
    { value: '50+',  label: 'Data Transform Rules',   color: '#f59e0b'  },
    { value: '<2s',  label: 'Average Execution Time', color: '#ef4444'  },
  ];

  projects: Project[] = [
    {
      title: 'Automated Employee Onboarding Engine',
      category: 'HR Operations',
      description: 'Synchronized recruitment triggers to auto-provision accounts, log payroll structures, and dispatch Slack notifications — reducing HR setup time from 4 hours to under 3 minutes per employee.',
      metric: '98%',
      metricLabel: 'Time Saved',
      metricColor: '#10B981',
      techStack: ['n8n', 'Greenhouse ATS', 'ADP Payroll', 'Slack API', 'AWS Lambda'],
      flowDiagramSteps: ['Greenhouse Hire Trigger', 'ADP Record Create', 'Okta Account Provision', 'Slack Notify'],
      inputPayload: `{
  "event": "candidate_hired",
  "candidate": {
    "first_name": "jane",
    "last_name": "DOE",
    "email": "jane@acme.com",
    "start_date": "01/20/2026"
  }
}`,
      outputPayload: `{
  "adp_sync": true,
  "employee_id": "EMP_ADP_890",
  "provisioned": [
    "google_workspace",
    "slack_user",
    "okta_sso"
  ],
  "start_date_iso": "2026-01-20",
  "name": "Jane Doe"
}`
    },
    {
      title: 'Stripe-to-NetSuite Reconciliation Pipeline',
      category: 'Finance Automation',
      description: 'Monitored multi-currency transaction webhooks, translated charge payload differences across currencies, and populated NetSuite journal entries automatically — eliminating manual bookkeeping.',
      metric: '100%',
      metricLabel: 'Accuracy',
      metricColor: '#6772E5',
      techStack: ['Make.com', 'Stripe API', 'NetSuite ERP', 'PostgreSQL', 'Data Mapper'],
      flowDiagramSteps: ['Stripe Webhook', 'Transaction Filter', 'Currency Normalize', 'Journal Entry Push'],
      inputPayload: `{
  "id": "ch_987A1",
  "amount": 250000,
  "currency": "usd",
  "status": "succeeded",
  "created": 1717920000
}`,
      outputPayload: `{
  "journal_entry": {
    "account": "1100-Stripe",
    "debit_gbp": 198.43,
    "reconciled": true,
    "created_iso": "2024-06-09T12:00:00Z"
  }
}`
    },
    {
      title: 'Multi-Region BambooHR → ADP Live Bridge',
      category: 'HR Payroll Sync',
      description: 'Real-time, bi-directional sync between BambooHR records and ADP payroll engine across 3 regional offices — handling status codes, date formats, currency, and encoding differences.',
      metric: '12k+',
      metricLabel: 'Records/Day',
      metricColor: '#73D67A',
      techStack: ['Make.com', 'BambooHR API', 'ADP v2 API', '.NET Proxy', 'Redis Cache'],
      flowDiagramSteps: ['BambooHR Delta Fetch', 'Status Code Map', 'Date Normalize', 'ADP Push', 'Conflict Resolve'],
      inputPayload: `{
  "id": 8821,
  "status": "1",
  "hireDate": "15/01/2024",
  "dept": "eng",
  "salary": "85000.00"
}`,
      outputPayload: `{
  "associateOID": "ADP_8821",
  "workerStatus": "Active",
  "originalHireDate": "2024-01-15",
  "department": "Engineering",
  "annualSalary": 85000.00
}`
    },
    {
      title: 'Payslip Secure Processing Engine',
      category: 'Data Privacy',
      description: 'Extracting, routing and distributing highly sensitive employee payslip PDFs across HR portals with end-to-end encryption — zero persistent storage, full audit trail.',
      metric: '0 bytes',
      metricLabel: 'Stored on Disk',
      metricColor: '#F59E0B',
      techStack: ['n8n', 'ADP Payroll', 'Azure Blob', 'AES-256', 'PGP Signing'],
      flowDiagramSteps: ['ADP PDF Fetch', 'In-Memory Buffer', 'PGP Encrypt', 'Secure Route', 'Delivery Receipt'],
      inputPayload: `{
  "payslip_id": "PS_2026_04_8821",
  "employee_id": "EMP_8821",
  "format": "application/pdf",
  "period": "2026-04"
}`,
      outputPayload: `{
  "delivered": true,
  "recipient": "jane.doe@acme.com",
  "pgp_signed": true,
  "bytes_in_memory": 204800,
  "disk_writes": 0,
  "audit_ref": "AUDIT_PS_8821_0406"
}`
    },
  ];

  workflowTemplates: WorkflowTemplate[] = [
    { name: 'Employee Onboarding Dispatch',   icon: '👤', platform: 'n8n',  complexity: 'Advanced',    category: 'HR Ops',       triggers: 'ATS hire event',    actions: 8  },
    { name: 'Payroll Delta Sync Engine',      icon: '💰', platform: 'make', complexity: 'Enterprise',  category: 'Payroll',      triggers: 'Scheduled cron',    actions: 12 },
    { name: 'Lead CRM Qualification',         icon: '📋', platform: 'make', complexity: 'Starter',     category: 'Sales Ops',    triggers: 'Webhook POST',      actions: 5  },
    { name: 'Invoice → ERP Reconciliation',   icon: '🧾', platform: 'both', complexity: 'Enterprise',  category: 'Finance',      triggers: 'Stripe webhook',    actions: 14 },
    { name: 'Timesheet Normalization',        icon: '⏱️', platform: 'n8n',  complexity: 'Advanced',    category: 'HR Data',      triggers: 'DB row insert',     actions: 6  },
    { name: 'Slack Ops Alerting Bot',         icon: '🔔', platform: 'make', complexity: 'Starter',     category: 'DevOps',       triggers: 'Monitoring hook',   actions: 4  },
    { name: 'Multi-Region Payslip Router',    icon: '📄', platform: 'n8n',  complexity: 'Enterprise',  category: 'Compliance',   triggers: 'Payroll cycle end', actions: 10 },
    { name: 'HiBob → Xero Salary Push',       icon: '📊', platform: 'make', complexity: 'Advanced',    category: 'Finance',      triggers: 'HR record change',  actions: 7  },
  ];

  scenarios = [
    {
      title: 'Enterprise HR to Payroll Synchronization',
      badge: 'HR_PAYROLL_SYNC',
      description: 'Seamlessly importing and normalizing employee data from BambooHR, HiBob, Personio, PeopleHR, and Workday directly into centralized payroll systems.',
      challenge: 'Disparate payroll formatting definitions across multi-regional offices causing daily data entry sync delays and payroll errors.',
      solution: 'Visual API mapping proxies converting XML/JSON feeds into single, standardized payroll schemas with delta-sync change detection.'
    },
    {
      title: 'Complex Data Normalization (50+ Rules)',
      badge: 'SCHEMA_NORMALIZATION',
      description: 'Handling intricate data mapping across 50+ unique transformation scenarios, including custom logic for parsing employee status codes, date formats, and encoding differences.',
      challenge: 'BambooHR output integers do not match target status fields (1=active, 2=notice, 3=leaver) and date strings vary by region (DD/MM vs MM/DD vs YYYY-MM-DD).',
      solution: 'Custom mapping algorithm translating status integers dynamically into correct human-resource log entries with regional date-format detection.'
    },
    {
      title: 'High-Volume API Pagination Bypass',
      badge: 'PAGINATION_BYPASS',
      description: 'Architecting robust workflows capable of bypassing strict platform record-limit restrictions using mathematical offset-loop formulas for complete dataset extraction.',
      challenge: 'Platform APIs block database extractions past a 500-record threshold, preventing full delta sync operations for clients with 10,000+ employees.',
      solution: 'Multi-threaded query offset loops executing sequential offset parameters to download full datasets within API rate-limit boundaries.'
    },
    {
      title: 'Secure Payslip In-Memory Processing',
      badge: 'PAYSLIP_ENCRYPTION',
      description: 'Safely extracting, routing, and delivering sensitive payslip PDFs with strict data privacy compliance — zero persistent storage, full PGP signing.',
      challenge: 'Exposure of payroll PDF data on external server file stores violating GDPR Article 5 data minimization principles and standard privacy regulations.',
      solution: 'AES-256 encrypted buffer stream processing handling PDFs directly in-memory via Node.js Buffer API, avoiding any disk write-out operations entirely.'
    }
  ];

  highlightJson(raw: string): string {
    return raw
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"([^"]+)":/g, '<span class="jk">"$1"</span>:')
      .replace(/: "([^"]*)"(,?)/g, ': <span class="js">"$1"</span>$2')
      .replace(/: (true|false|null)/g, ': <span class="jb">$1</span>')
      .replace(/: (-?\d+\.?\d*)(,?)/g, ': <span class="jn">$1</span>$2');
  }
}
