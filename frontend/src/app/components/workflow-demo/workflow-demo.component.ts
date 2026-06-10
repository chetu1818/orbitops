import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-workflow-demo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="workflow-demo-wrapper">
      <!-- Platform Toggle Tabs -->
      <div class="platform-tabs">
        <button class="ptab" [class.active]="activeTab() === 'make'" (click)="activeTab.set('make')">
          <span class="ptab-dot make-dot"></span>
          Make.com Scenario
        </button>
        <button class="ptab" [class.active]="activeTab() === 'n8n'" (click)="activeTab.set('n8n')">
          <span class="ptab-dot n8n-dot"></span>
          n8n Pipeline
        </button>
      </div>

      <!-- Make.com Panel -->
      <div class="workflow-panel card" *ngIf="activeTab() === 'make'">
        <div class="panel-header">
          <div class="panel-header-left">
            <span class="platform-badge make-badge">MAKE.COM SCENARIO</span>
            <h4>HR Lead Onboarding Dispatch</h4>
            <p class="panel-sub">6 modules · Multi-route conditional router · Real-time webhook trigger</p>
          </div>
          <div class="panel-stats">
            <div class="pstat"><span class="pstat-val">2.3s</span><span class="pstat-lbl">Avg exec time</span></div>
            <div class="pstat"><span class="pstat-val">100%</span><span class="pstat-lbl">Success rate</span></div>
          </div>
        </div>

        <!-- Make.com Canvas -->
        <div class="canvas-container">
          <div class="canvas-bg">
            <!-- Animated grid -->
            <div class="canvas-grid"></div>
            
            <!-- Flow layout -->
            <div class="make-flow">
              <!-- Module 1: Webhook -->
              <div class="make-module trigger-module">
                <div class="module-icon">🔗</div>
                <div class="module-body">
                  <div class="module-name">Webhooks</div>
                  <div class="module-action">Custom webhook</div>
                </div>
                <div class="module-run-dot"></div>
              </div>

              <!-- Connector 1→2 -->
              <div class="make-connector">
                <div class="connector-line"></div>
                <div class="data-packet pkt-a"></div>
                <div class="data-packet pkt-b"></div>
              </div>

              <!-- Module 2: Filter -->
              <div class="make-module filter-module">
                <div class="module-icon">⚙️</div>
                <div class="module-body">
                  <div class="module-name">Filter</div>
                  <div class="module-action">Corporate domain?</div>
                </div>
              </div>

              <!-- Connector 2→Router (split) -->
              <div class="make-connector">
                <div class="connector-line"></div>
                <div class="data-packet pkt-c"></div>
              </div>

              <!-- Router -->
              <div class="make-module router-module">
                <div class="module-icon">🔀</div>
                <div class="module-body">
                  <div class="module-name">Router</div>
                  <div class="module-action">2 routes</div>
                </div>
              </div>
            </div>

            <!-- Split Routes -->
            <div class="split-routes">
              <!-- Route A -->
              <div class="route-branch route-a">
                <div class="branch-line"></div>
                <div class="make-module crm-module">
                  <div class="module-icon">🏷️</div>
                  <div class="module-body">
                    <div class="module-name">HubSpot CRM</div>
                    <div class="module-action">Create contact</div>
                  </div>
                  <div class="module-run-dot success"></div>
                </div>
                <div class="route-label route-label-a">Route A: Enterprise lead</div>
              </div>

              <!-- Route B -->
              <div class="route-branch route-b">
                <div class="branch-line branch-line-b"></div>
                <div class="make-module slack-module">
                  <div class="module-icon">💬</div>
                  <div class="module-body">
                    <div class="module-name">Slack</div>
                    <div class="module-action">Block Kit notify</div>
                  </div>
                  <div class="module-run-dot success"></div>
                </div>
                <div class="route-label route-label-b">Route B: Notify team</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Blueprint Steps -->
        <div class="blueprint-section">
          <div class="blueprint-title">SCENARIO BLUEPRINT</div>
          <div class="blueprint-steps-grid">
            <div class="bp-step">
              <div class="bp-num">01</div>
              <div class="bp-content">
                <strong>Webhook Trigger</strong>
                <span>Captures POST payloads: <code>name</code>, <code>email</code>, <code>company</code>, <code>message</code></span>
              </div>
            </div>
            <div class="bp-step">
              <div class="bp-num">02</div>
              <div class="bp-content">
                <strong>Domain Filter</strong>
                <span>Regex: rejects <code>gmail|yahoo|hotmail</code> — only corporate domains proceed</span>
              </div>
            </div>
            <div class="bp-step">
              <div class="bp-num">03</div>
              <div class="bp-content">
                <strong>Router Split</strong>
                <span>Route A → HubSpot deal creation. Route B → Slack Block Kit alert to #sales channel</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- n8n Panel -->
      <div class="workflow-panel card" *ngIf="activeTab() === 'n8n'">
        <div class="panel-header">
          <div class="panel-header-left">
            <span class="platform-badge n8n-badge">N8N PIPELINE</span>
            <h4>Timesheet Normalization Node Chain</h4>
            <p class="panel-sub">Self-hosted · Postgres trigger · JavaScript transform · 4 downstream targets</p>
          </div>
          <div class="panel-stats">
            <div class="pstat"><span class="pstat-val">5,200</span><span class="pstat-lbl">rows/run</span></div>
            <div class="pstat"><span class="pstat-val">0ms</span><span class="pstat-lbl">API latency</span></div>
          </div>
        </div>

        <!-- n8n Canvas -->
        <div class="canvas-container">
          <div class="canvas-bg">
            <div class="canvas-grid n8n-grid"></div>
            <div class="n8n-flow">
              <!-- Trigger -->
              <div class="n8n-node trigger-n8n">
                <div class="n8n-icon">⚡</div>
                <div class="n8n-label">Postgres<br>Trigger</div>
                <div class="n8n-pulse"></div>
              </div>
              <!-- Connectors -->
              <div class="n8n-connector">
                <div class="n8n-wire"></div>
                <div class="n8n-packet npkt-a"></div>
              </div>
              <div class="n8n-node code-n8n">
                <div class="n8n-icon">&#123;&#125;</div>
                <div class="n8n-label">Code<br>Transform</div>
              </div>
              <div class="n8n-connector">
                <div class="n8n-wire n8n-wire-out"></div>
                <div class="n8n-packet npkt-b"></div>
              </div>
              <div class="n8n-node split-n8n">
                <div class="n8n-icon">⊕</div>
                <div class="n8n-label">Split In<br>Batches</div>
              </div>
            </div>
            <!-- Downstream targets -->
            <div class="n8n-targets">
              <div class="n8n-target-node">
                <div class="n8n-icon small">📊</div>
                <div class="n8n-label">ADP Push</div>
              </div>
              <div class="n8n-target-node">
                <div class="n8n-icon small">📁</div>
                <div class="n8n-label">CSV Export</div>
              </div>
              <div class="n8n-target-node">
                <div class="n8n-icon small">📨</div>
                <div class="n8n-label">Email Report</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Code Snippet -->
        <div class="blueprint-section">
          <div class="blueprint-title">TRANSFORM NODE — JAVASCRIPT</div>
          <pre class="code-block" [innerHTML]="n8nCodeSnippet"></pre>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .workflow-demo-wrapper {
      margin-top: 1.5rem;
    }

    /* ── Platform Tabs ── */
    .platform-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .ptab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1.2rem;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03);
      color: var(--text-secondary);
      font-family: var(--font-mono);
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
    }
    .ptab:hover { background: rgba(255,255,255,0.07); color: var(--text-primary); }
    .ptab.active { background: rgba(59,130,246,0.12); border-color: rgba(59,130,246,0.35); color: var(--primary); }
    .ptab-dot { width: 8px; height: 8px; border-radius: 50%; }
    .make-dot { background: var(--primary); box-shadow: 0 0 6px var(--primary); }
    .n8n-dot  { background: var(--violet);  box-shadow: 0 0 6px var(--violet); }

    /* ── Panel ── */
    .workflow-panel {
      padding: 0 !important;
      overflow: hidden;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.5rem 1.75rem;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-wrap: wrap;
      gap: 1rem;
    }
    .platform-badge {
      display: inline-block;
      font-family: var(--font-mono);
      font-size: 0.62rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }
    .make-badge { background: rgba(59,130,246,0.12); color: #93c5fd; border: 1px solid rgba(59,130,246,0.2); }
    .n8n-badge  { background: rgba(139,92,246,0.12); color: #c4b5fd; border: 1px solid rgba(139,92,246,0.2); }
    .panel-header h4 {
      font-size: 1.15rem;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 0.25rem;
    }
    .panel-sub {
      font-size: 0.78rem;
      color: var(--text-muted);
      font-family: var(--font-mono);
    }
    .panel-stats {
      display: flex;
      gap: 1.25rem;
    }
    .pstat { display: flex; flex-direction: column; align-items: flex-end; }
    .pstat-val { font-family: var(--font-display); font-weight: 900; font-size: 1.3rem; color: var(--accent); }
    .pstat-lbl { font-family: var(--font-mono); font-size: 0.62rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }

    /* ── Canvas ── */
    .canvas-container {
      padding: 1.5rem;
      background: rgba(3,7,18,0.5);
    }
    .canvas-bg {
      background: rgba(5,10,25,0.8);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 12px;
      padding: 1.5rem;
      min-height: 200px;
      position: relative;
      overflow: hidden;
    }
    .canvas-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(100,160,255,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(100,160,255,0.04) 1px, transparent 1px);
      background-size: 28px 28px;
      pointer-events: none;
    }
    .n8n-grid { background-image:
      linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px);
      background-size: 28px 28px;
    }

    /* ── Make.com Module Styles ── */
    .make-flow {
      display: flex;
      align-items: center;
      gap: 0;
      position: relative;
      z-index: 1;
      flex-wrap: nowrap;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }
    .make-module {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: rgba(15,23,42,0.9);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 0.6rem 0.9rem;
      min-width: 130px;
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;
      flex-shrink: 0;
    }
    .make-module:hover { transform: translateY(-2px); }
    .trigger-module  { border-color: rgba(59,130,246,0.35); box-shadow: 0 0 14px rgba(59,130,246,0.15); }
    .filter-module   { border-color: rgba(251,191,36,0.3);  box-shadow: 0 0 14px rgba(251,191,36,0.10); }
    .router-module   { border-color: rgba(139,92,246,0.35); box-shadow: 0 0 14px rgba(139,92,246,0.15); }
    .crm-module      { border-color: rgba(16,185,129,0.35); box-shadow: 0 0 14px rgba(16,185,129,0.15); }
    .slack-module    { border-color: rgba(52,211,153,0.35); box-shadow: 0 0 14px rgba(52,211,153,0.12); }
    .module-icon { font-size: 1rem; }
    .module-body { display: flex; flex-direction: column; gap: 1px; }
    .module-name   { font-family: var(--font-display); font-size: 0.78rem; font-weight: 700; color: var(--text-primary); }
    .module-action { font-family: var(--font-mono); font-size: 0.62rem; color: var(--text-muted); }
    .module-run-dot {
      position: absolute;
      top: 6px; right: 6px;
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--primary);
      animation: run-pulse 1.8s ease-in-out infinite;
    }
    .module-run-dot.success { background: #10B981; }
    @keyframes run-pulse {
      0%,100% { opacity: 0.5; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1.2); box-shadow: 0 0 6px currentColor; }
    }

    /* Connectors between Make.com modules */
    .make-connector {
      height: 2px;
      width: 36px;
      background: rgba(255,255,255,0.08);
      position: relative;
      flex-shrink: 0;
      overflow: visible;
    }
    .connector-line {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent);
      background-size: 200% 100%;
      animation: cline 1.8s linear infinite;
    }
    @keyframes cline {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    .data-packet {
      position: absolute;
      top: 50%; transform: translateY(-50%);
      width: 5px; height: 5px;
      border-radius: 50%;
      background: var(--primary);
      box-shadow: 0 0 6px var(--primary);
    }
    .pkt-a { animation: dpkt 1.6s ease-in-out infinite; }
    .pkt-b { animation: dpkt 1.6s ease-in-out 0.8s infinite; opacity: 0.6; }
    .pkt-c { animation: dpkt 1.6s ease-in-out 0.4s infinite; background: var(--violet); }
    @keyframes dpkt {
      0% { left: 0; opacity: 0; }
      15% { opacity: 1; }
      85% { opacity: 1; }
      100% { left: 100%; opacity: 0; }
    }

    /* Split Routes */
    .split-routes {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.75rem;
      padding-left: 2rem;
      position: relative;
      z-index: 1;
    }
    .route-branch {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .branch-line {
      width: 40px; height: 2px;
      background: rgba(16,185,129,0.4);
      position: relative;
    }
    .branch-line::before {
      content: '';
      position: absolute;
      top: -8px; left: 0;
      width: 2px; height: 8px;
      background: rgba(255,255,255,0.08);
    }
    .branch-line-b { background: rgba(139,92,246,0.4); }
    .route-label {
      font-family: var(--font-mono);
      font-size: 0.6rem;
      color: var(--text-muted);
      white-space: nowrap;
    }
    .route-label-a { color: rgba(16,185,129,0.7); }
    .route-label-b { color: rgba(139,92,246,0.7); }

    /* ── n8n Node Styles ── */
    .n8n-flow {
      display: flex;
      align-items: center;
      gap: 0;
      position: relative;
      z-index: 1;
      overflow-x: auto;
    }
    .n8n-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      background: rgba(15,23,42,0.9);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 0.75rem 1rem;
      min-width: 90px;
      position: relative;
      flex-shrink: 0;
    }
    .trigger-n8n { border-color: rgba(59,130,246,0.4); }
    .code-n8n    { border-color: rgba(139,92,246,0.4); background: rgba(139,92,246,0.08); }
    .split-n8n   { border-color: rgba(20,184,166,0.4); }
    .n8n-icon {
      font-family: var(--font-mono);
      font-size: 1rem;
      color: var(--text-primary);
    }
    .n8n-icon.small { font-size: 0.9rem; }
    .n8n-label {
      font-family: var(--font-mono);
      font-size: 0.62rem;
      color: var(--text-secondary);
      text-align: center;
      line-height: 1.3;
    }
    .n8n-pulse {
      position: absolute;
      top: 4px; right: 4px;
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--primary);
      animation: run-pulse 1.8s ease-in-out infinite;
    }
    .n8n-connector {
      height: 2px;
      width: 32px;
      background: rgba(255,255,255,0.06);
      position: relative;
      flex-shrink: 0;
      overflow: visible;
    }
    .n8n-wire {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent);
      background-size: 200% 100%;
      animation: cline 2s linear infinite;
    }
    .n8n-wire-out {
      background: linear-gradient(90deg, transparent, rgba(20,184,166,0.6), transparent);
      background-size: 200% 100%;
    }
    .n8n-packet {
      position: absolute;
      top: 50%; transform: translateY(-50%);
      width: 5px; height: 5px;
      border-radius: 50%;
      background: var(--violet);
      box-shadow: 0 0 5px var(--violet);
    }
    .npkt-a { animation: dpkt 2s ease-in-out infinite; }
    .npkt-b { animation: dpkt 2s ease-in-out 1s infinite; background: var(--accent); }

    /* n8n downstream targets */
    .n8n-targets {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-left: 2rem;
      position: relative;
      z-index: 1;
    }
    .n8n-target-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      background: rgba(15,23,42,0.7);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
    }

    /* ── Blueprint Section ── */
    .blueprint-section {
      padding: 1.25rem 1.75rem;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .blueprint-title {
      font-family: var(--font-mono);
      font-size: 0.62rem;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }
    .blueprint-steps-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.85rem;
    }
    @media (min-width: 640px) {
      .blueprint-steps-grid { grid-template-columns: repeat(3, 1fr); }
    }
    .bp-step {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }
    .bp-num {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--primary);
      opacity: 0.7;
      flex-shrink: 0;
      margin-top: 2px;
    }
    .bp-content {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .bp-content strong {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .bp-content span {
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
    .bp-content code {
      font-family: var(--font-mono);
      background: rgba(255,255,255,0.06);
      color: #93c5fd;
      padding: 0.05rem 0.3rem;
      border-radius: 3px;
      font-size: 0.7rem;
    }

    /* Code block */
    .code-block {
      background: #020a14;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 1.25rem 1.5rem;
      font-family: var(--font-mono);
      font-size: 0.78rem;
      line-height: 1.75;
      overflow-x: auto;
      color: #e2e8f0;
    }
    .c-kw      { color: #c084fc; }
    .c-fn      { color: #38bdf8; }
    .c-str     { color: #86efac; }
    .c-comment { color: #4d6080; font-style: italic; }
  `]
})
export class WorkflowDemoComponent {
  activeTab = signal<'make' | 'n8n'>('make');

  readonly n8nCodeSnippet = `<code><span class="c-kw">for</span> (<span class="c-kw">const</span> row <span class="c-kw">of</span> <span class="c-fn">$input</span>.all()) {
  <span class="c-comment">// Normalize date format: 20240101 &rarr; 2024-01-01</span>
  row.json.iso_date = <span class="c-kw">new</span> <span class="c-fn">Date</span>(row.json.stamp).toISOString();
  <span class="c-comment">// Calculate billing cost at &pound;120/hr rate</span>
  row.json.cost = <span class="c-fn">parseFloat</span>(row.json.hours) * 120;
  <span class="c-comment">// Map status code: 1=Active, 2=Notice, 3=Leaver</span>
  row.json.status = {<span class="c-str">1</span>:<span class="c-str">'Active'</span>, <span class="c-str">2</span>:<span class="c-str">'Notice Period'</span>, <span class="c-str">3</span>:<span class="c-str">'Leaver'</span>}[row.json.status_code];
}
<span class="c-kw">return</span> <span class="c-fn">$input</span>.all();</code>`;
}

