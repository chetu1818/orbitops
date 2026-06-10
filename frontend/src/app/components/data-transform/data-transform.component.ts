import { Component, signal, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

interface Source {
  id: string;
  name: string;
  icon: string;
  color: string;
  rawData: string;
  normalizedData: string;
  transformSteps: string[];
}

@Component({
  selector: 'app-data-transform',
  standalone: true,
  imports: [CommonModule, ScrollAnimateDirective],
  template: `
    <section class="section data-transform-section">
      <div class="glow-orb glow-violet" style="top:10%; right:-10%; opacity:0.15;"></div>
      <div class="glow-orb glow-primary" style="bottom:10%; left:-10%; opacity:0.12;"></div>

      <div class="container">
        <div class="section-header" appScrollAnimate>
          <span class="badge">Data Intelligence</span>
          <h2>Raw Data → Normalized Output</h2>
          <p>Every HR and payroll platform delivers data in a different format. We parse, clean, and transform messy source records into structured, standardized payloads your systems can actually use.</p>
        </div>

        <!-- Source Selector -->
        <div class="source-selector" appScrollAnimate>
          <div class="selector-label">SELECT SOURCE SYSTEM</div>
          <div class="source-tabs">
            <button
              *ngFor="let src of sources"
              class="source-tab"
              [class.active]="activeSource() === src.id"
              [style.--src-color]="src.color"
              (click)="selectSource(src.id)"
            >
              <span class="src-icon">{{ src.icon }}</span>
              {{ src.name }}
            </button>
          </div>
        </div>

        <!-- Transform Panel -->
        <div class="transform-panel" appScrollAnimate *ngIf="currentSource()">
          <div class="transform-steps-bar">
            <div *ngFor="let step of currentSource()!.transformSteps; let i = index; let last = last" class="ts-item">
              <div class="ts-num">{{ i + 1 }}</div>
              <span>{{ step }}</span>
              <div *ngIf="!last" class="ts-arrow">→</div>
            </div>
          </div>

          <div class="json-panels">
            <!-- Raw Input -->
            <div class="json-box raw-box">
              <div class="json-box-header">
                <div class="json-header-left">
                  <span class="jbox-dot red"></span>
                  <span class="jbox-dot yellow"></span>
                  <span class="jbox-dot green"></span>
                </div>
                <div class="json-box-title">
                  <span class="src-badge raw-badge">RAW INPUT</span>
                  <span class="src-name-label">{{ currentSource()!.name }}</span>
                </div>
              </div>
              <pre class="json-content raw-json" [innerHTML]="highlightJson(currentSource()!.rawData)"></pre>
              <div class="json-box-footer">
                <span class="footer-warn">⚠ Inconsistent format detected</span>
              </div>
            </div>

            <!-- Arrow -->
            <div class="transform-arrow">
              <div class="arrow-track">
                <div class="arrow-particle ap1"></div>
                <div class="arrow-particle ap2"></div>
                <div class="arrow-particle ap3"></div>
              </div>
              <div class="arrow-label">OrbitOps<br>Transform</div>
              <div class="arrow-symbol">⚡</div>
            </div>

            <!-- Normalized Output -->
            <div class="json-box output-box">
              <div class="json-box-header">
                <div class="json-header-left">
                  <span class="jbox-dot red"></span>
                  <span class="jbox-dot yellow"></span>
                  <span class="jbox-dot green"></span>
                </div>
                <div class="json-box-title">
                  <span class="src-badge out-badge">NORMALIZED OUTPUT</span>
                  <span class="src-name-label">Unified Schema</span>
                </div>
              </div>
              <pre class="json-content output-json" [innerHTML]="highlightJson(currentSource()!.normalizedData)"></pre>
              <div class="json-box-footer">
                <span class="footer-ok">✓ Production-ready payload</span>
              </div>
            </div>
          </div>

          <!-- Transformation Rules Applied -->
          <div class="rules-applied">
            <div class="rules-title">TRANSFORMATION RULES APPLIED</div>
            <div class="rules-grid">
              <div class="rule-item" *ngFor="let rule of getActiveRules()">
                <span class="rule-icon">✓</span>
                <span>{{ rule }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .data-transform-section {
      background:
        radial-gradient(ellipse 70% 50% at 20% 30%, rgba(139,92,246,0.04) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 80% 70%, rgba(37,99,235,0.04) 0%, transparent 60%);
    }

    /* ── Source Selector ── */
    .source-selector {
      margin-bottom: 2.5rem;
    }
    .selector-label {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.85rem;
    }
    .source-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }
    .source-tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1.1rem;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
      color: var(--text-secondary);
      font-family: var(--font-sans);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.22s cubic-bezier(0.16,1,0.3,1);
    }
    .source-tab:hover {
      background: rgba(255,255,255,0.07);
      color: var(--text-primary);
      border-color: rgba(255,255,255,0.15);
    }
    .source-tab.active {
      background: color-mix(in srgb, var(--src-color, #3b82f6) 12%, transparent);
      border-color: color-mix(in srgb, var(--src-color, #3b82f6) 40%, transparent);
      color: var(--text-primary);
      box-shadow: 0 0 16px color-mix(in srgb, var(--src-color, #3b82f6) 15%, transparent);
    }
    .src-icon { font-size: 1rem; }

    /* ── Transform Steps Bar ── */
    .transform-steps-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1.75rem;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 10px;
      padding: 0.85rem 1.25rem;
    }
    .ts-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--text-secondary);
    }
    .ts-num {
      width: 20px; height: 20px;
      border-radius: 50%;
      background: rgba(59,130,246,0.15);
      border: 1px solid rgba(59,130,246,0.3);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.62rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .ts-arrow { color: var(--text-muted); }

    /* ── JSON Panels ── */
    .json-panels {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
      align-items: stretch;
    }
    @media (min-width: 768px) {
      .json-panels {
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
      }
    }
    .json-box {
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(5,10,20,0.8);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .raw-box   { border-color: rgba(239,68,68,0.25); }
    .output-box { border-color: rgba(16,185,129,0.25); }

    .json-box-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.65rem 1rem;
      background: rgba(255,255,255,0.03);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .json-header-left { display: flex; gap: 5px; align-items: center; }
    .jbox-dot { width: 10px; height: 10px; border-radius: 50%; }
    .jbox-dot.red    { background: #ff5f57; }
    .jbox-dot.yellow { background: #febc2e; }
    .jbox-dot.green  { background: #28c840; }

    .json-box-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .src-badge {
      font-family: var(--font-mono);
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }
    .raw-badge { background: rgba(239,68,68,0.15); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
    .out-badge { background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }
    .src-name-label { font-family: var(--font-mono); font-size: 0.67rem; color: var(--text-muted); }

    .json-content {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      line-height: 1.7;
      padding: 1.1rem 1.25rem;
      flex: 1;
      overflow-x: auto;
      margin: 0;
    }
    .json-box-footer {
      padding: 0.5rem 1rem;
      border-top: 1px solid rgba(255,255,255,0.04);
      font-family: var(--font-mono);
      font-size: 0.65rem;
    }
    .footer-warn { color: #fbbf24; }
    .footer-ok   { color: #34d399; }

    /* ── Transform Arrow ── */
    .transform-arrow {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
      padding: 0.75rem 0.5rem;
    }
    @media (max-width: 767px) {
      .transform-arrow {
        flex-direction: row;
        padding: 0;
      }
    }
    .arrow-track {
      width: 4px;
      height: 60px;
      background: rgba(139,92,246,0.1);
      border-radius: 2px;
      position: relative;
      overflow: visible;
    }
    @media (max-width: 767px) {
      .arrow-track { width: 60px; height: 4px; }
    }
    .arrow-particle {
      position: absolute;
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--violet);
      box-shadow: 0 0 8px var(--violet);
      left: 50%; transform: translateX(-50%);
    }
    @media (max-width: 767px) {
      .arrow-particle { top: 50%; transform: translateY(-50%); left: auto; }
    }
    .ap1 { animation: apkt-v 1.8s ease-in-out infinite; }
    .ap2 { animation: apkt-v 1.8s ease-in-out 0.6s infinite; opacity: 0.6; }
    .ap3 { animation: apkt-v 1.8s ease-in-out 1.2s infinite; opacity: 0.3; }
    @keyframes apkt-v {
      0% { top: -4px; opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { top: calc(100% + 4px); opacity: 0; }
    }
    .arrow-label {
      font-family: var(--font-mono);
      font-size: 0.6rem;
      text-transform: uppercase;
      color: var(--text-muted);
      text-align: center;
      line-height: 1.4;
    }
    .arrow-symbol {
      font-size: 1.2rem;
      animation: engine-pulse 2s ease-in-out infinite;
    }
    @keyframes engine-pulse {
      0%,100% { filter: drop-shadow(0 0 4px rgba(139,92,246,0.3)); }
      50%      { filter: drop-shadow(0 0 14px rgba(139,92,246,0.8)); }
    }

    /* ── Rules Applied ── */
    .rules-applied {
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
    }
    .rules-title {
      font-family: var(--font-mono);
      font-size: 0.62rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 0.85rem;
    }
    .rules-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
    @media (min-width: 640px) { .rules-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1024px) { .rules-grid { grid-template-columns: repeat(3, 1fr); } }
    .rule-item {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--text-secondary);
    }
    .rule-icon { color: #34d399; flex-shrink: 0; }
  `]
})
export class DataTransformComponent {
  private platformId = inject(PLATFORM_ID);

  sources: Source[] = [
    {
      id: 'bamboohr',
      name: 'BambooHR',
      icon: '🌿',
      color: '#73D67A',
      rawData: `{
  "id": 8821,
  "status": "1",
  "hireDate": "01/15/2024",
  "dept": "eng",
  "salary": "85000.00",
  "firstName": "jane",
  "lastName": "DOE",
  "mobilePhone": "07700900123"
}`,
      normalizedData: `{
  "employee_id": "EMP_8821",
  "status": "Active",
  "hire_date": "2024-01-15",
  "department": "Engineering",
  "annual_salary": 85000.00,
  "full_name": "Jane Doe",
  "phone_e164": "+447700900123",
  "source_system": "bamboohr",
  "synced_at": "2026-06-09T05:14:00Z"
}`,
      transformSteps: ['Fetch via API', 'Status code map (1→Active)', 'Date reformat (MM/DD → ISO)', 'Name titlecase', 'Phone E.164 normalize', 'Output schema'],
    },
    {
      id: 'adp',
      name: 'ADP',
      icon: '💼',
      color: '#E84B3A',
      rawData: `{
  "associateOID": "G3349P8",
  "workerStatus": {
    "statusCode": { "codeValue": "Active" },
    "effectiveDate": "2024-01-10"
  },
  "baseRemuneration": {
    "payPeriodAmount": {
      "amountValue": 3461.54,
      "currencyCode": "GBP"
    }
  },
  "workerDates": {
    "originalHireDate": "2024-01-10"
  }
}`,
      normalizedData: `{
  "employee_id": "ADP_G3349P8",
  "status": "Active",
  "hire_date": "2024-01-10",
  "monthly_salary": 7500.00,
  "annual_salary": 90000.00,
  "currency": "GBP",
  "pay_frequency": "bi-weekly",
  "source_system": "adp",
  "synced_at": "2026-06-09T05:14:00Z"
}`,
      transformSteps: ['Fetch ADP v2 API', 'Extract nested statusCode', 'Convert bi-weekly → annual', 'Flatten structure', 'Currency validation', 'Output schema'],
    },
    {
      id: 'hibob',
      name: 'HiBob',
      icon: '👤',
      color: '#5B67FF',
      rawData: `{
  "id": "hb-a981-bc",
  "work": {
    "startDate": "2024-02-01",
    "title": "senior developer",
    "department": { "name": "r&d" }
  },
  "humanReadable": {
    "status": "Employed",
    "salaryPayType": "Monthly"
  },
  "internal": {
    "terminationDate": null,
    "noticePeriodEndDate": null
  }
}`,
      normalizedData: `{
  "employee_id": "BOB_hb-a981-bc",
  "status": "Active",
  "hire_date": "2024-02-01",
  "job_title": "Senior Developer",
  "department": "R&D",
  "pay_type": "monthly",
  "termination_date": null,
  "source_system": "hibob",
  "synced_at": "2026-06-09T05:14:00Z"
}`,
      transformSteps: ['HiBob REST API', 'Status "Employed"→"Active"', 'Title & dept titlecase', 'Flatten nested objects', 'Null handling', 'Output schema'],
    },
    {
      id: 'stripe',
      name: 'Stripe',
      icon: '💳',
      color: '#6772E5',
      rawData: `{
  "id": "ch_3PaXBR2eZvKYlo2C",
  "object": "charge",
  "amount": 250000,
  "currency": "usd",
  "status": "succeeded",
  "created": 1717920000,
  "customer": "cus_QK5sP7Xwm",
  "metadata": {
    "invoice_ref": "INV-2026-0044"
  }
}`,
      normalizedData: `{
  "transaction_id": "TXN_ch_3PaXBR2eZvKYlo2C",
  "amount_usd": 2500.00,
  "currency": "USD",
  "status": "Completed",
  "created_iso": "2024-06-09T12:00:00Z",
  "customer_id": "cus_QK5sP7Xwm",
  "invoice_ref": "INV-2026-0044",
  "journal_account": "1100-Stripe-Revenue",
  "source_system": "stripe",
  "synced_at": "2026-06-09T05:14:00Z"
}`,
      transformSteps: ['Stripe Webhook', 'Amount ÷100 (pence→pounds)', 'Unix→ISO timestamp', 'Status map (succeeded→Completed)', 'ERP account lookup', 'NetSuite push'],
    },
  ];

  activeSource = signal<string>('bamboohr');

  currentSource() {
    return this.sources.find(s => s.id === this.activeSource()) ?? null;
  }

  selectSource(id: string) {
    this.activeSource.set(id);
  }

  getActiveRules(): string[] {
    const rules: Record<string, string[]> = {
      bamboohr: [
        'Status integer → human-readable string (1→Active, 2→Notice, 3→Leaver)',
        'Date format: MM/DD/YYYY → ISO 8601 (YYYY-MM-DD)',
        'Name casing: uppercase/lowercase → Title Case normalization',
        'Phone E.164 international format conversion',
        'Department code expansion (eng → Engineering)',
        'Salary string → float precision rounding',
      ],
      adp: [
        'Nested statusCode object flattening',
        'Pay period conversion: bi-weekly × 26 → annual salary',
        'OID prefix mapping for employee ID uniqueness',
        'Currency code validation (ISO 4217)',
        'Nested workerDates extraction',
        'ADP v2 pagination handling for bulk exports',
      ],
      hibob: [
        'Work status normalization (Employed → Active)',
        'Job title titlecase formatting',
        'Department & division uppercase flattening',
        'Pay type standardization (Monthly/Weekly → enum)',
        'Null termination date safe handling',
        'Notice period date extraction from nested object',
      ],
      stripe: [
        'Amount conversion: integer pence → decimal pounds (÷100)',
        'Unix timestamp → ISO 8601 datetime string',
        'Status map: succeeded/failed/pending → Completed/Failed/Pending',
        'Metadata.invoice_ref extraction for ERP reference',
        'Journal account lookup by merchant category',
        'NetSuite journal entry auto-population',
      ],
    };
    return rules[this.activeSource()] ?? [];
  }

  highlightJson(raw: string): string {
    return raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"([^"]+)":/g, '<span class="jk">"$1"</span>:')
      .replace(/: "([^"]*)"(,?)/g, ': <span class="js">"$1"</span>$2')
      .replace(/: (true|false|null)/g, ': <span class="jb">$1</span>')
      .replace(/: (-?\d+\.?\d*)(,?)/g, ': <span class="jn">$1</span>$2');
  }
}
