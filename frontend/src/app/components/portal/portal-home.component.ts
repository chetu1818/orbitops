import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { OrderService, Order } from '../../services/order.service';
@Component({
  selector: 'app-portal-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="portal-home" *ngIf="authService.currentUser() as user">
      <!-- ============================================================
           1. CLIENT & SUB-CLIENT DASHBOARD VIEW
           ============================================================ -->
      <ng-container *ngIf="user.role === 'Client' || user.role === 'SubClient'">
        <!-- Welcome Banner -->
        <div class="welcome-banner">
          <div>
            <h2>Welcome, {{ user.name }}</h2>
            <p>Your B2B automation console is active. Role: <strong>{{ user.role }}</strong> of {{ user.company }}.</p>
          </div>
          <button *ngIf="user.role === 'Client'" (click)="clientActiveTab.set('request')" class="btn btn-primary">
            <i class="bi bi-plus-circle"></i> Create New Integration
          </button>
        </div>
        <!-- Portal Sub-Navigation Tabs -->
        <div class="portal-sub-nav" style="display: flex; gap: 0.5rem; margin-top: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
          <button (click)="clientActiveTab.set('dashboard')" class="btn" [ngClass]="clientActiveTab() === 'dashboard' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-speedometer2"></i> Dashboard
          </button>
          <button (click)="clientActiveTab.set('catalog')" class="btn" [ngClass]="clientActiveTab() === 'catalog' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-grid"></i> Catalog
          </button>
          <button (click)="clientActiveTab.set('request')" class="btn" [ngClass]="clientActiveTab() === 'request' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-plus-circle"></i> Request Form
          </button>
          <button (click)="clientActiveTab.set('automations')" class="btn" [ngClass]="clientActiveTab() === 'automations' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-gear-wide-connected"></i> My Automations
          </button>
          <button (click)="clientActiveTab.set('analytics')" class="btn" [ngClass]="clientActiveTab() === 'analytics' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-bar-chart-line"></i> Analytics
          </button>
          <button (click)="clientActiveTab.set('billing')" class="btn" [ngClass]="clientActiveTab() === 'billing' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-credit-card"></i> Billing
          </button>
          <button (click)="clientActiveTab.set('support')" class="btn" [ngClass]="clientActiveTab() === 'support' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-headset"></i> Support
          </button>
          <button (click)="clientActiveTab.set('settings')" class="btn" [ngClass]="clientActiveTab() === 'settings' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-sliders"></i> Settings
          </button>
        </div>
        <!-- CLIENT TAB: DASHBOARD -->
        <div *ngIf="clientActiveTab() === 'dashboard'" style="display: flex; flex-direction: column; gap: 2rem;">
          <!-- Metrics -->
          <div class="metrics-grid">
            <div class="metric-card card">
              <div class="metric-icon primary-glow"><i class="bi bi-folder-fill"></i></div>
              <div class="metric-info">
                <span class="m-val">{{ getRequestedScenariosCount() }}</span>
                <span class="m-lbl">Active Automations</span>
              </div>
            </div>
            <div class="metric-card card">
              <div class="metric-icon accent-glow"><i class="bi bi-arrow-repeat"></i></div>
              <div class="metric-info">
                <span class="m-val">14,250</span>
                <span class="m-lbl">Runs This Month</span>
              </div>
            </div>
            <div class="metric-card card">
              <div class="metric-icon violet-glow"><i class="bi bi-hourglass-split"></i></div>
              <div class="metric-info">
                <span class="m-val">185 hrs</span>
                <span class="m-lbl">Time Saved</span>
              </div>
            </div>
            <div class="metric-card card" style="border-color: rgba(239, 68, 68, 0.2) !important;">
              <div class="metric-icon gold-glow" style="background: rgba(239,68,68,0.1); color: #f87171; border-color: rgba(239,68,68,0.2);"><i class="bi bi-exclamation-octagon"></i></div>
              <div class="metric-info">
                <span class="m-val" style="color: #f87171;">2</span>
                <span class="m-lbl">Quarantine Errors</span>
              </div>
            </div>
          </div>
          <!-- Progress and Alerts banner -->
          <div *ngIf="getPaymentRequiredOrders().length > 0" class="payment-alert-banner card">
            <div class="alert-content">
              <i class="bi bi-credit-card-2-back-fill alert-icon"></i>
              <div>
                <h4>Payment Approvals Pending</h4>
                <p>An architect cost estimation for your pipeline is ready. Pay costing to activate synchronization.</p>
              </div>
            </div>
            <div class="alert-actions">
              <button class="btn btn-primary btn-sm" (click)="clientActiveTab.set('automations')">
                View Billing &amp; Pay &rarr;
              </button>
            </div>
          </div>
          <!-- Pipeline Progress Bars -->
          <div *ngIf="getActivePipelines().length > 0" class="integrations-section card pipeline-progress-section">
            <div class="section-title" style="margin-bottom:1.25rem;">
              <h3><i class="bi bi-bar-chart-steps" style="margin-right:0.5rem; color:var(--accent);"></i>Pipeline Progress</h3>
              <p>Real-time stage tracking for your active automation workflows.</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <div *ngFor="let p of getActivePipelines()" class="pipeline-progress-card">
                <div class="pp-header">
                  <span class="pp-name">{{ p.name }}</span>
                  <span class="pp-pct">{{ p.pct }}%</span>
                </div>
                <div class="pp-bar-track">
                  <div class="pp-bar-fill" [style.width]="p.pct + '%'"></div>
                </div>
                <div class="pp-stages">
                  <span class="pp-stage" [ngClass]="{'active': p.stage === 'Setup', 'done': p.stageIdx > 0}">Setup</span>
                  <span class="pp-stage" [ngClass]="{'active': p.stage === 'Mapping', 'done': p.stageIdx > 1}">Mapping</span>
                  <span class="pp-stage" [ngClass]="{'active': p.stage === 'Testing', 'done': p.stageIdx > 2}">Testing</span>
                  <span class="pp-stage" [ngClass]="{'active': p.stage === 'Active', 'done': p.stageIdx > 3}">Active</span>
                  <span class="pp-stage" [ngClass]="{'active': p.stage === 'Done', 'done': false}">Done</span>
                </div>
              </div>
            </div>
          </div>
          <!-- Activity Timeline -->
          <div class="integrations-section card">
            <div class="section-title">
              <h3>Activity Timeline</h3>
              <p>Latest event updates and integration deployments on your console.</p>
            </div>
            <div *ngIf="getActivityTimeline().length > 0; else emptyTimeline">
              <div *ngFor="let ev of getActivityTimeline()" class="activity-feed-item">
                <div class="act-icon" [style.background]="ev.bg" [style.color]="ev.color">
                  <i class="bi" [ngClass]="ev.icon"></i>
                </div>
                <div class="act-body">
                  <div class="act-title">{{ ev.title }}</div>
                  <div class="act-meta">{{ ev.workflow }} &bull; {{ ev.time }}</div>
                </div>
                <span class="status-badge" [ngClass]="ev.status.toLowerCase().replace(' ','-')">{{ ev.status }}</span>
              </div>
            </div>
            <ng-template #emptyTimeline>
              <p class="no-creds-text">No activity recorded yet.</p>
            </ng-template>
          </div>
        </div>
        <!-- CLIENT TAB: CATALOG -->
        <div *ngIf="clientActiveTab() === 'catalog'" class="integrations-section card">
          <div class="section-title">
            <h3>Pre-Built Integrations Catalog</h3>
            <p>Select a pre-configured scenario to kick off automation setup quickly.</p>
          </div>
          <div class="grid grid-cols-2" style="margin-top: 1.5rem; gap: 1.5rem;">
            <div *ngFor="let item of catalogItems" class="card" style="padding: 1.5rem; border: 1px solid var(--border); display: flex; flex-direction: column; justify-content: space-between; gap: 1.25rem;">
              <div>
                <div style="font-size: 1.5rem; color: var(--accent); margin-bottom: 0.5rem;"><i class="bi" [ngClass]="item.icon"></i></div>
                <h4 style="font-size: 1rem; color: #fff; margin-bottom: 0.5rem;">{{ item.type }}</h4>
                <p style="font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4; margin-bottom: 1rem;">{{ item.description }}</p>
                <div style="display: flex; gap: 0.5rem; font-size: 0.72rem;">
                  <span class="sys-badge">{{ item.source }}</span>
                  <span class="sys-badge">&rarr;</span>
                  <span class="sys-badge">{{ item.dest }}</span>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.75rem;">
                <span style="font-family: var(--font-mono); font-weight: 700; color: var(--accent); font-size: 0.95rem;">\${{ item.price }} Est.</span>
                <button (click)="reqName=item.type; reqSource=item.source; reqDest=item.dest; reqBidPrice=item.price; clientActiveTab.set('request');" class="btn btn-secondary btn-xs" style="padding: 0.35rem 0.75rem;">
                  Request
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- CLIENT TAB: REQUEST FORM -->
        <div *ngIf="clientActiveTab() === 'request'" class="integrations-section card" style="max-width: 680px; margin-left: auto; margin-right: auto;">
          <div class="section-title">
            <h3>Submit Automation Request</h3>
            <p>Tell us about the systems you want to link. An architect will review your specification and bid pricing.</p>
          </div>
          <div *ngIf="reqSuccessMsg" class="success-alert" style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 0.75rem; border-radius: 8px; color: #34d399; margin-bottom: 1rem;">
            <p style="margin:0;">{{ reqSuccessMsg }}</p>
          </div>
          <div class="add-member-form" style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
            <div class="form-group">
              <label>Automation Project Name</label>
              <input type="text" [(ngModel)]="reqName" placeholder="E.g., Hubspot Lead Routing" class="form-control" />
            </div>
            <div class="grid grid-cols-2" style="gap: 1rem;">
              <div class="form-group">
                <label>Trigger / Source System</label>
                <input type="text" [(ngModel)]="reqSource" placeholder="E.g., HubSpot" class="form-control" />
              </div>
              <div class="form-group">
                <label>Desired Action / Destination System</label>
                <input type="text" [(ngModel)]="reqDest" placeholder="E.g., Slack" class="form-control" />
              </div>
            </div>
            <div class="form-group">
              <label>Your Price Bid (USD)</label>
              <input type="number" [(ngModel)]="reqBidPrice" placeholder="E.g., 299" class="form-control" />
            </div>
            <div class="form-group">
              <label>Special Instructions / Trigger Conditions</label>
              <textarea [(ngModel)]="reqInstructions" placeholder="Describe the trigger event, credentials, and actions expected..." rows="4" class="form-control"></textarea>
            </div>
            <button (click)="submitClientRequest()" class="btn btn-primary btn-block" style="margin-top: 0.5rem;" [disabled]="!reqSource || !reqDest">
              Submit Integration Bid
            </button>
          </div>
        </div>
        <!-- CLIENT TAB: MY AUTOMATIONS -->
        <div *ngIf="clientActiveTab() === 'automations'" class="integrations-section card">
          <div class="section-title">
            <h3>My Automation Pipelines</h3>
            <p>Toggle active workflows, review handover schedules, and inspect execution logs.</p>
          </div>
          <div class="table-container" *ngIf="orders().length > 0; else emptyState">
            <table class="portal-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Scenario / Workflow</th>
                  <th>Data Pipeline</th>
                  <th>Assigned Architect</th>
                  <th>Status</th>
                  <th>Toggle</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let order of orders()">
                  <td class="order-id"><code>{{ order.id }}</code></td>
                  <td><strong>{{ order.workflowType }}</strong></td>
                  <td>
                    <div class="pipe-cell">
                      <span class="sys-badge">{{ order.sourceSystem }}</span>
                      <i class="bi bi-arrow-right-short"></i>
                      <span class="sys-badge">{{ order.destinationSystem }}</span>
                    </div>
                  </td>
                  <td>{{ order.engineerName || 'Unassigned' }}</td>
                  <td>
                    <span class="status-badge" [ngClass]="order.status.toLowerCase().replace(' ', '-')">
                      {{ order.status }}
                    </span>
                  </td>
                  <td>
                    <!-- On/Off Switch -->
                    <div style="display: flex; align-items: center;">
                      <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 22px;">
                        <input type="checkbox" [checked]="!pausedAutomations()[order.id]" (change)="toggleAutomation(order)" style="opacity: 0; width: 0; height: 0;" />
                        <span class="slider round" [style.background-color]="pausedAutomations()[order.id] ? '#ef4444' : '#10b981'" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; transition: .4s; border-radius: 34px;"></span>
                      </label>
                      <span style="font-size:0.75rem; margin-left: 0.4rem; color:var(--text-secondary);">
                        {{ pausedAutomations()[order.id] ? 'Paused' : 'Active' }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style="display: flex; gap: 0.5rem; align-items: center;">
                      <button (click)="showAutomationLogs(order)" class="btn btn-secondary btn-xs">
                        <i class="bi bi-terminal"></i> View Logs
                      </button>
                      <button *ngIf="order.status === 'Awaiting Payment'" (click)="openCheckout(order)" class="btn btn-primary btn-xs">
                        Pay Costing
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #emptyState>
            <div class="empty-state" style="padding: 3rem; text-align: center;">
              <i class="bi bi-folder-x" style="font-size: 2.5rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
              <h4>No Integrations Requested</h4>
              <p>You haven't requested any integrations yet. Head to the Catalog or use the Request Form.</p>
            </div>
          </ng-template>
        </div>
        <!-- CLIENT TAB: ANALYTICS -->
        <div *ngIf="clientActiveTab() === 'analytics'" class="integrations-section card">
          <div class="section-title">
            <h3>Automation Analytics</h3>
            <p>Interactive tracking of automated runs and returned investment savings.</p>
          </div>
          <div class="grid grid-cols-2" style="margin-top: 1.5rem; gap: 2rem;">
            <!-- Chart 1 -->
            <div class="card" style="padding: 1.5rem;">
              <h4 style="font-size:0.85rem; text-transform:uppercase; font-family:var(--font-mono); color:var(--text-muted); margin-bottom: 1.25rem;">Tasks Automated (Monthly)</h4>
              <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 120px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.5rem;">
                <div style="display: flex; flex-direction: column; align-items: center; width: 14%;">
                  <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">120</span>
                  <div style="width: 100%; height: 35px; background: linear-gradient(to top, rgba(59,130,246,0.6), rgba(96,165,250,0.9)); border-radius: 4px;"></div>
                  <span style="font-size: 0.65rem; font-family: var(--font-mono); margin-top: 0.25rem;">Jan</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; width: 14%;">
                  <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">150</span>
                  <div style="width: 100%; height: 45px; background: linear-gradient(to top, rgba(59,130,246,0.6), rgba(96,165,250,0.9)); border-radius: 4px;"></div>
                  <span style="font-size: 0.65rem; font-family: var(--font-mono); margin-top: 0.25rem;">Feb</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; width: 14%;">
                  <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">180</span>
                  <div style="width: 100%; height: 55px; background: linear-gradient(to top, rgba(59,130,246,0.6), rgba(96,165,250,0.9)); border-radius: 4px;"></div>
                  <span style="font-size: 0.65rem; font-family: var(--font-mono); margin-top: 0.25rem;">Mar</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; width: 14%;">
                  <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">240</span>
                  <div style="width: 100%; height: 75px; background: linear-gradient(to top, rgba(59,130,246,0.6), rgba(96,165,250,0.9)); border-radius: 4px;"></div>
                  <span style="font-size: 0.65rem; font-family: var(--font-mono); margin-top: 0.25rem;">Apr</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; width: 14%;">
                  <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">310</span>
                  <div style="width: 100%; height: 95px; background: linear-gradient(to top, rgba(59,130,246,0.6), rgba(96,165,250,0.9)); border-radius: 4px;"></div>
                  <span style="font-size: 0.65rem; font-family: var(--font-mono); margin-top: 0.25rem;">May</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; width: 14%;">
                  <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">420</span>
                  <div style="width: 100%; height: 110px; background: linear-gradient(to top, rgba(59,130,246,0.6), rgba(96,165,250,0.9)); border-radius: 4px;"></div>
                  <span style="font-size: 0.65rem; font-family: var(--font-mono); margin-top: 0.25rem;">Jun</span>
                </div>
              </div>
            </div>
            <!-- Chart 2 -->
            <div class="card" style="padding: 1.5rem;">
              <h4 style="font-size:0.85rem; text-transform:uppercase; font-family:var(--font-mono); color:var(--text-muted); margin-bottom: 1.25rem;">Hours Returned (Saving)</h4>
              <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 120px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.5rem;">
                <div style="display: flex; flex-direction: column; align-items: center; width: 14%;">
                  <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">45h</span>
                  <div style="width: 100%; height: 28px; background: linear-gradient(to top, rgba(16,185,129,0.6), rgba(52,211,153,0.9)); border-radius: 4px;"></div>
                  <span style="font-size: 0.65rem; font-family: var(--font-mono); margin-top: 0.25rem;">Jan</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; width: 14%;">
                  <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">60h</span>
                  <div style="width: 100%; height: 38px; background: linear-gradient(to top, rgba(16,185,129,0.6), rgba(52,211,153,0.9)); border-radius: 4px;"></div>
                  <span style="font-size: 0.65rem; font-family: var(--font-mono); margin-top: 0.25rem;">Feb</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; width: 14%;">
                  <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">75h</span>
                  <div style="width: 100%; height: 48px; background: linear-gradient(to top, rgba(16,185,129,0.6), rgba(52,211,153,0.9)); border-radius: 4px;"></div>
                  <span style="font-size: 0.65rem; font-family: var(--font-mono); margin-top: 0.25rem;">Mar</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; width: 14%;">
                  <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">110h</span>
                  <div style="width: 100%; height: 70px; background: linear-gradient(to top, rgba(16,185,129,0.6), rgba(52,211,153,0.9)); border-radius: 4px;"></div>
                  <span style="font-size: 0.65rem; font-family: var(--font-mono); margin-top: 0.25rem;">Apr</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; width: 14%;">
                  <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">140h</span>
                  <div style="width: 100%; height: 90px; background: linear-gradient(to top, rgba(16,185,129,0.6), rgba(52,211,153,0.9)); border-radius: 4px;"></div>
                  <span style="font-size: 0.65rem; font-family: var(--font-mono); margin-top: 0.25rem;">May</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: center; width: 14%;">
                  <span style="font-size: 0.65rem; color: var(--text-muted); font-family: var(--font-mono);">185h</span>
                  <div style="width: 100%; height: 115px; background: linear-gradient(to top, rgba(16,185,129,0.6), rgba(52,211,153,0.9)); border-radius: 4px;"></div>
                  <span style="font-size: 0.65rem; font-family: var(--font-mono); margin-top: 0.25rem;">Jun</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- CLIENT TAB: BILLING -->
        <div *ngIf="clientActiveTab() === 'billing'" class="integrations-section card">
          <div class="section-title">
            <h3>Billing & Subscriptions</h3>
            <p>Manage subscription details, billing cycles, and invoice statements.</p>
          </div>
          <div class="grid grid-cols-2" style="margin-top: 1.5rem; gap: 2rem;">
            <!-- Plan card -->
            <div class="card" style="padding: 1.5rem;">
              <h5 style="color:var(--accent); font-size: 0.88rem; text-transform: uppercase; font-family:var(--font-mono); margin-bottom: 0.75rem;">Current Plan</h5>
              <h3 style="font-size: 1.4rem; color:#fff; margin-bottom: 0.5rem;">Enterprise Automation Plan</h3>
              <p style="font-size: 0.82rem; color:var(--text-secondary); margin-bottom: 1.5rem;">Unlimited webhook endpoints, advanced error isolation staging, and SLA architect logs review.</p>
              <div style="font-size: 1.5rem; font-weight: 700; color:#fff; font-family:var(--font-mono); margin-bottom: 1rem;">$499 <span style="font-size:0.85rem; font-weight:normal; color:var(--text-muted);">/ Month</span></div>
              <button class="btn btn-secondary btn-sm" style="width: 100%;">Update Plan Tiers</button>
            </div>
            <!-- Payment settings -->
            <div class="card" style="padding: 1.5rem;">
              <h5 style="color:var(--accent); font-size: 0.88rem; text-transform: uppercase; font-family:var(--font-mono); margin-bottom: 0.75rem;">Payment Method</h5>
              <div style="display: flex; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.06); padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
                <i class="bi bi-credit-card-2-front-fill" style="font-size: 1.75rem; color: var(--accent);"></i>
                <div>
                  <strong style="display: block; font-size: 0.88rem; color:#fff;">Visa ending in 4242</strong>
                  <span style="font-size:0.75rem; color:var(--text-muted);">Expires 12/28</span>
                </div>
              </div>
              <button class="btn btn-secondary btn-sm" style="width:100%;">Replace Card Details</button>
            </div>
          </div>
          <!-- Invoices list -->
          <div style="margin-top: 2rem;">
            <h4 style="font-size: 0.95rem; color: #fff; margin-bottom: 1rem;"><i class="bi bi-receipt"></i> Invoice Receipt History</h4>
            <div class="table-container">
              <table class="portal-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let inv of invoices">
                    <td><code>{{ inv.id }}</code></td>
                    <td>{{ inv.date }}</td>
                    <td>\${{ inv.amount }}</td>
                    <td><span class="status-badge completed">Paid</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <!-- CLIENT TAB: SUPPORT -->
        <div *ngIf="clientActiveTab() === 'support'" class="integrations-section card">
          <div class="section-title">
            <h3>Support & Ticket Center</h3>
            <p>Submit issues directly to architects, review tickets, and chat live with support assistants.</p>
          </div>
          <div class="grid grid-cols-2" style="margin-top: 1.5rem; gap: 2rem;">
            <!-- Ticket form -->
            <div class="card" style="padding: 1.5rem;">
              <h5 style="color:var(--accent); font-size: 0.88rem; text-transform: uppercase; font-family:var(--font-mono); margin-bottom: 1rem;">Open a Support Case</h5>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label>Ticket Subject</label>
                <input type="text" [(ngModel)]="newTicketSubject" placeholder="E.g., Webhook signature validation error..." class="form-control" />
              </div>
              <div class="form-group" style="margin-bottom: 1.25rem;">
                <label>Severity Level</label>
                <select [(ngModel)]="newTicketPriority" class="form-control">
                  <option value="Low">Low - Normal Request</option>
                  <option value="Medium">Medium - Workflow Glitch</option>
                  <option value="High">High - Pipeline Down</option>
                </select>
              </div>
              <button (click)="addTicket()" class="btn btn-primary btn-block">Submit Ticket</button>
            </div>
            <!-- Quick Chatbot launcher -->
            <div class="card" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1.25rem;">
              <div>
                <h5 style="color:var(--accent); font-size: 0.88rem; text-transform: uppercase; font-family:var(--font-mono); margin-bottom: 0.5rem;">Live AI Assistant</h5>
                <p style="font-size: 0.82rem; color:var(--text-secondary); line-height: 1.4;">Need immediate automated help? Chat with Mia, our official support assistant, to check common issues, review make.com integrations, or diagnose errors.</p>
              </div>
              <button (click)="scrollToSection('ob-fab')" class="btn btn-secondary" style="width: 100%;">
                <i class="bi bi-chat-dots-fill"></i> Launch Chatbot
              </button>
            </div>
          </div>
          <!-- Tickets table -->
          <div style="margin-top: 2rem;">
            <h4 style="font-size: 0.95rem; color: #fff; margin-bottom: 1rem;"><i class="bi bi-ticket-detailed-fill"></i> Active Support Tickets</h4>
            <div class="table-container">
              <table class="portal-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Subject</th>
                    <th>Priority</th>
                    <th>Date Opened</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let tkt of ticketsList()">
                    <td><code>{{ tkt.id }}</code></td>
                    <td><strong>{{ tkt.subject }}</strong></td>
                    <td>
                      <span class="status-badge" [ngClass]="tkt.priority === 'High' ? 'declined' : (tkt.priority === 'Medium' ? 'awaiting-payment' : 'awaiting-assignment')">
                        {{ tkt.priority }}
                      </span>
                    </td>
                    <td>{{ tkt.date }}</td>
                    <td><span class="status-badge" [ngClass]="tkt.status === 'Open' ? 'in-progress' : 'completed'">{{ tkt.status }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <!-- CLIENT TAB: SETTINGS -->
        <div *ngIf="clientActiveTab() === 'settings'" class="team-section card">
          <div class="section-title">
            <h3>Account & Team Settings</h3>
            <p>Update profiles, toggle notification configurations, and manage user invites.</p>
          </div>
          <div class="grid grid-cols-2" style="margin-top: 1.5rem; gap: 2rem;">
            <!-- Profile settings -->
            <div class="card" style="padding: 1.5rem;">
              <h5 style="color:var(--accent); font-size: 0.88rem; text-transform: uppercase; font-family:var(--font-mono); margin-bottom: 1rem;">Profile Settings</h5>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label>Company Display Name</label>
                <input type="text" [value]="user.company" class="form-control" readonly />
              </div>
              <div class="form-group" style="margin-bottom: 1.25rem;">
                <label>Primary Admin Email</label>
                <input type="text" [value]="user.email" class="form-control" readonly />
              </div>
              <h5 style="color:var(--accent); font-size: 0.88rem; text-transform: uppercase; font-family:var(--font-mono); margin-top: 1.5rem; margin-bottom: 1rem;">Alert Configs</h5>
              <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.82rem; color: var(--text-secondary);">
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input type="checkbox" checked /> Send Email on Webhook quarantine errors
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                  <input type="checkbox" checked /> Request costing counters digest weekly
                </label>
              </div>
            </div>
            <!-- Team members invites -->
            <div class="card" style="padding: 1.5rem;">
              <h5 style="color:var(--accent); font-size: 0.88rem; text-transform: uppercase; font-family:var(--font-mono); margin-bottom: 1rem;">Invite Team Staff (Sub-Users)</h5>
              <div class="members-box" style="margin-bottom: 1.5rem;">
                <div *ngFor="let member of teamMembers()" class="member-card" style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.04);">
                  <div style="font-size: 0.82rem;">
                    <strong>{{ member.name }}</strong>
                    <div style="color:var(--text-muted); font-size: 0.72rem;">{{ member.email }}</div>
                  </div>
                  <span class="badge-role">{{ member.role }}</span>
                </div>
                <div *ngIf="teamMembers().length === 0" style="font-size:0.82rem; color:var(--text-muted);">No staff members invited yet.</div>
              </div>
              <div *ngIf="teamMembers().length < 5" style="display: flex; flex-direction: column; gap: 0.75rem;">
                <div class="form-group">
                  <label>Full Name</label>
                  <input type="text" [(ngModel)]="newMemberName" placeholder="E.g., John Doe" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Email Address</label>
                  <input type="email" [(ngModel)]="newMemberEmail" placeholder="E.g., staff@enterprise.com" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Password</label>
                  <input type="password" [(ngModel)]="newMemberPassword" placeholder="••••••••" class="form-control" />
                </div>
                <button (click)="onAddTeamMember()" class="btn btn-secondary btn-block" [disabled]="submittingTeam()">
                  Invite Sub-User Account
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- My Automations Logs Modal -->
        <div *ngIf="activeLogsOrder() as o" class="modal-overlay">
          <div class="modal-card" style="max-width: 580px;">
            <div class="modal-header">
              <h4><i class="bi bi-terminal"></i> Integration Logs: {{ o.workflowType }}</h4>
              <button class="close-btn" (click)="closeAutomationLogs()">&times;</button>
            </div>
            <div class="modal-body" style="background: #020510; color: #10b981; font-family: var(--font-mono); font-size: 0.75rem; padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border); max-height: 300px; overflow-y: auto;">
              <div *ngFor="let log of automationLogs()" style="margin-bottom: 0.5rem; line-height: 1.4;">{{ log }}</div>
            </div>
            <div style="padding: 1.25rem; display: flex; justify-content: flex-end;">
              <button (click)="closeAutomationLogs()" class="btn btn-secondary btn-sm">Close</button>
            </div>
          </div>
        </div>
      </ng-container>
      <!-- ============================================================
           2. SYSTEM ADMIN DASHBOARD VIEW
           ============================================================ -->
      <ng-container *ngIf="user.role === 'Admin'">
        <div class="welcome-banner">
          <div>
            <h2>Operations Control Portal</h2>
            <p>Review feasibility requests, approve costing, and monitor platform health. (Admin console)</p>
          </div>
        </div>
        <!-- Portal Sub-Navigation Tabs for Admin -->
        <div class="portal-sub-nav" style="display: flex; gap: 0.5rem; margin-top: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
          <button (click)="adminActiveTab.set('dashboard')" class="btn" [ngClass]="adminActiveTab() === 'dashboard' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-speedometer2"></i> Dashboard &amp; Review
          </button>
          <button (click)="adminActiveTab.set('users')" class="btn" [ngClass]="adminActiveTab() === 'users' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-people-fill"></i> User Management
          </button>
          <button (click)="adminActiveTab.set('workload')" class="btn" [ngClass]="adminActiveTab() === 'workload' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-person-workspace"></i> Workload Matrix
          </button>
          <button (click)="adminActiveTab.set('system')" class="btn" [ngClass]="adminActiveTab() === 'system' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-heart-pulse-fill"></i> System Health
          </button>
          <button (click)="adminActiveTab.set('billing')" class="btn" [ngClass]="adminActiveTab() === 'billing' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-credit-card"></i> Billing Admin
          </button>
          <button (click)="adminActiveTab.set('content')" class="btn" [ngClass]="adminActiveTab() === 'content' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-journal-text"></i> FAQ Editor
          </button>
          <button (click)="adminActiveTab.set('settings')" class="btn" [ngClass]="adminActiveTab() === 'settings' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-sliders"></i> Global Settings
          </button>
        </div>
        <!-- ADMIN TAB: DASHBOARD -->
                <div *ngIf="adminActiveTab() === 'dashboard'" style="display: flex; flex-direction: column; gap: 2rem;">
          <!-- KPIs Row -->
          <div class="kpi-row">
            <div class="kpi-card">
              <span class="kpi-label">Active Pipelines</span>
              <span class="kpi-value">{{ getAdminActivePipelinesCount() }}</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Pending Reviews</span>
              <span class="kpi-value" style="color: #fbbf24;">{{ pendingOrders().length }}</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Total Revenue</span>
              <span class="kpi-value">{{ getAdminTotalVolume() }}</span>
            </div>
            <div class="kpi-card">
              <span class="kpi-label">Success Rate</span>
              <span class="kpi-value" style="color: #34d399;">{{ getPipelineSuccessRate() }}%</span>
            </div>
          </div>
          <!-- Donut and Top Clients -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 0;">
            <!-- Donut Chart -->
            <div class="integrations-section card" style="padding: 1.75rem !important;">
              <div class="section-title" style="margin-bottom: 1.25rem;">
                <h3><i class="bi bi-pie-chart-fill" style="margin-right:0.5rem; color:#a78bfa;"></i>Pipeline Distribution</h3>
              </div>
              <div class="donut-section">
                <div class="donut-chart-wrap">
                  <svg viewBox="0 0 36 36" width="140" height="140">
                    <circle cx="18" cy="18" r="15.91" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="3"/>
                    <circle *ngFor="let seg of getDonutSegments()" cx="18" cy="18" r="15.91" fill="none"
                      [attr.stroke]="seg.color" stroke-width="3"
                      [attr.stroke-dasharray]="seg.dash" [attr.stroke-dashoffset]="seg.offset"
                      stroke-linecap="round" style="transition: stroke-dasharray 0.8s ease;"/>
                  </svg>
                  <div class="donut-center">
                    <span class="donut-center-val">{{ allOrders().length }}</span>
                    <span class="donut-center-lbl">Total</span>
                  </div>
                </div>
                <div class="donut-legend">
                  <div *ngFor="let seg of getDonutSegments()" class="donut-legend-item">
                    <span class="donut-legend-dot" [style.background]="seg.color"></span>
                    <span>{{ seg.label }}</span>
                    <span class="donut-legend-count">{{ seg.count }}</span>
                  </div>
                </div>
              </div>
            </div>
            <!-- Top Clients -->
            <div class="integrations-section card" style="padding: 1.75rem !important;">
              <div class="section-title" style="margin-bottom: 1.25rem;">
                <h3><i class="bi bi-trophy-fill" style="margin-right:0.5rem; color:#fbbf24;"></i>Top Clients by Value</h3>
              </div>
              <table class="top-clients-table" *ngIf="getTopClients().length > 0">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Client</th>
                    <th>Orders</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let c of getTopClients(); let i = index">
                    <td class="tc-rank">{{ i + 1 }}</td>
                    <td><strong>{{ c.name }}</strong><br><span style="font-size:0.7rem; color:var(--text-muted);">{{ c.company }}</span></td>
                    <td>{{ c.orderCount }}</td>
                    <td style="font-family: var(--font-mono); font-weight: 700;">\${{ c.totalValue.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
              <div *ngIf="getTopClients().length === 0" class="empty-state" style="padding:1.5rem;">
                <p style="margin:0; font-size:0.82rem;">No client data available yet.</p>
              </div>
            </div>
          </div>
          <!-- Pending Costing Reviews Table -->
          <div id="admin-pending" class="integrations-section card">
            <div class="section-title">
              <h3>Awaiting Admin Review &amp; Costing</h3>
              <p>Inspect connection credentials, evaluate complexity, and set target pricing for clients.</p>
            </div>
            <div class="table-container" *ngIf="pendingOrders().length > 0; else emptyAdminState">
              <table class="portal-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>ID</th>
                    <th>Client Detail</th>
                    <th>Scenario</th>
                    <th>Handshake Route</th>
                    <th>Client Bid</th>
                    <th>Architect Assigned</th>
                    <th>Cost & Time Est.</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  <ng-container *ngFor="let order of pendingOrders()">
                    <tr (click)="toggleExpandOrder(order.id, $event)" class="expandable-row" style="cursor: pointer;">
                      <td class="chevron-cell">
                        <button class="chevron-btn" type="button">
                          <i class="bi" [ngClass]="expandedOrderId() === order.id ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
                        </button>
                      </td>
                      <td class="order-id"><code>{{ order.id }}</code></td>
                      <td>
                        <div><strong>{{ order.clientName || 'N/A' }}</strong></div>
                        <div style="font-size: 0.72rem; color: var(--text-secondary);">{{ order.clientCompany || 'N/A' }}</div>
                      </td>
                      <td><strong>{{ order.workflowType }}</strong></td>
                      <td>
                        <div class="pipe-cell">
                          <span class="sys-badge">{{ order.sourceSystem }}</span>
                          <i class="bi bi-arrow-right-short"></i>
                          <span class="sys-badge">{{ order.destinationSystem }}</span>
                        </div>
                      </td>
                      <td>
                        <div *ngIf="order.price > 0" style="color: #fbbf24; font-weight: bold; font-family: var(--font-mono);">
                          \${{ order.price }}
                        </div>
                        <div *ngIf="!order.price || order.price <= 0" style="color: var(--text-muted); font-style: italic; font-size: 0.8rem;">
                          No Bid
                        </div>
                      </td>
                      <td><code>{{ order.engineerName || 'Unassigned' }}</code></td>
                      <td>
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;" (click)="$event.stopPropagation();">
                          <div class="admin-cost-input-wrap">
                            <span class="currency-tag">$</span>
                            <input 
                              type="number" 
                              [(ngModel)]="costApprovals[order.id]" 
                              placeholder="799"
                              class="form-control admin-cost-input"
                              style="width: 80px;"
                            />
                          </div>
                          <input 
                            type="text" 
                            [(ngModel)]="timeApprovals[order.id]" 
                            placeholder="3 days"
                            class="form-control"
                            style="padding: 0.35rem 0.5rem; font-size: 0.78rem; background: rgba(2, 8, 5, 0.5); border-color: rgba(16, 185, 129, 0.15); border-radius: 6px; width: 100px; color: white;"
                          />
                        </div>
                      </td>
                      <td>
                        <button 
                          (click)="onApproveCosting(order.id); $event.stopPropagation();" 
                          class="btn btn-primary btn-sm" 
                          [disabled]="!costApprovals[order.id] || costApprovals[order.id] <= 0 || !timeApprovals[order.id]"
                        >
                          Approve costing
                        </button>
                      </td>
                    </tr>
                    <tr *ngIf="expandedOrderId() === order.id">
                      <td colspan="9" class="expanded-row-td">
                        <div class="expanded-detail-card">
                          <div class="detail-grid">
                            <div class="detail-section">
                              <h4 class="detail-sec-title"><i class="bi bi-person-badge"></i> Client Contact Information</h4>
                              <div class="detail-item"><strong>Client Name:</strong> {{ order.clientName || 'N/A' }}</div>
                              <div class="detail-item"><strong>Company:</strong> {{ order.clientCompany || 'N/A' }}</div>
                              <div class="detail-item"><strong>Email Address:</strong> {{ order.clientEmail || 'N/A' }}</div>
                              <div class="detail-item"><strong>Submitted At:</strong> {{ order.createdAt | date:'medium' }}</div>
                            </div>
                            <div class="detail-section">
                              <h4 class="detail-sec-title"><i class="bi bi-bezier2"></i> Workflow Specifications</h4>
                              <div class="detail-item"><strong>Scenario:</strong> {{ order.workflowType }}</div>
                              <div class="detail-item"><strong>Source System:</strong> {{ order.sourceSystem }}</div>
                              <div class="detail-item"><strong>Destination System:</strong> {{ order.destinationSystem }}</div>
                              <div class="detail-item"><strong>Special Instructions:</strong> {{ order.instructions || 'None provided.' }}</div>
                            </div>
                          </div>
                          <div class="detail-credentials-grid">
                            <div class="cred-box">
                              <h5 class="cred-title"><i class="bi bi-key-fill"></i> Source Credentials ({{ order.sourceSystem }})</h5>
                              <div class="cred-table" *ngIf="getCredentialsList(order.sourceCredentials).length > 0; else noSrcCreds">
                                <div class="cred-row" *ngFor="let cred of getCredentialsList(order.sourceCredentials)">
                                  <span class="cred-label">{{ cred.key }}</span>
                                  <div class="cred-value-wrap">
                                    <span class="cred-value" *ngIf="!isCredentialMasked(order.id, 'source', cred.key)">{{ cred.value }}</span>
                                    <span class="cred-value masked" *ngIf="isCredentialMasked(order.id, 'source', cred.key)">••••••••••••</span>
                                    <div class="cred-actions">
                                      <button class="btn-cred-action" type="button" (click)="$event.stopPropagation(); toggleCredentialMask(order.id, 'source', cred.key)" [title]="isCredentialMasked(order.id, 'source', cred.key) ? 'Show credential' : 'Hide credential'">
                                        <i class="bi" [ngClass]="isCredentialMasked(order.id, 'source', cred.key) ? 'bi-eye' : 'bi-eye-slash'"></i>
                                      </button>
                                      <button class="btn-cred-action" type="button" (click)="$event.stopPropagation(); copyToClipboard(cred.value)" title="Copy to clipboard">
                                        <i class="bi bi-clipboard"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <ng-template #noSrcCreds>
                                <p class="no-creds-text">No source credentials supplied.</p>
                              </ng-template>
                            </div>
                            <div class="cred-box">
                              <h5 class="cred-title"><i class="bi bi-key-fill"></i> Destination Credentials ({{ order.destinationSystem }})</h5>
                              <div class="cred-table" *ngIf="getCredentialsList(order.destinationCredentials).length > 0; else noDestCreds">
                                <div class="cred-row" *ngFor="let cred of getCredentialsList(order.destinationCredentials)">
                                  <span class="cred-label">{{ cred.key }}</span>
                                  <div class="cred-value-wrap">
                                    <span class="cred-value" *ngIf="!isCredentialMasked(order.id, 'destination', cred.key)">{{ cred.value }}</span>
                                    <span class="cred-value masked" *ngIf="isCredentialMasked(order.id, 'destination', cred.key)">••••••••••••</span>
                                    <div class="cred-actions">
                                      <button class="btn-cred-action" type="button" (click)="$event.stopPropagation(); toggleCredentialMask(order.id, 'destination', cred.key)" [title]="isCredentialMasked(order.id, 'destination', cred.key) ? 'Show credential' : 'Hide credential'">
                                        <i class="bi" [ngClass]="isCredentialMasked(order.id, 'destination', cred.key) ? 'bi-eye' : 'bi-eye-slash'"></i>
                                      </button>
                                      <button class="btn-cred-action" type="button" (click)="$event.stopPropagation(); copyToClipboard(cred.value)" title="Copy to clipboard">
                                        <i class="bi bi-clipboard"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <ng-template #noDestCreds>
                                <p class="no-creds-text">No destination credentials supplied.</p>
                              </ng-template>
                            </div>
                          </div>
                          <!-- Handover History Timeline -->
                          <div class="handover-history-box" *ngIf="order.handoverHistory && order.handoverHistory.length > 0" style="background: rgba(255, 255, 255, 0.01); border: 1px solid rgba(139, 92, 246, 0.15); border-radius: 8px; padding: 1.25rem; margin-top: 1.75rem;">
                            <h5 style="margin: 0 0 1rem 0; color: #a78bfa; font-size: 0.88rem; display: flex; align-items: center; gap: 0.35rem;"><i class="bi bi-clock-history"></i> Architect Handover & Progress History</h5>
                            <div class="handover-timeline" style="display: flex; flex-direction: column; gap: 1rem;">
                              <div class="handover-event" *ngFor="let entry of order.handoverHistory" style="border-left: 2px solid rgba(139, 92, 246, 0.3); padding-left: 1rem; position: relative;">
                                <span class="timeline-dot" style="position: absolute; left: -5px; top: 3px; width: 8px; height: 8px; border-radius: 50%; background: #8b5cf6;"></span>
                                <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); margin-bottom: 0.2rem;">
                                  <span>Reassigned to: <strong>{{ entry.newEngineer }}</strong></span>
                                  <span>{{ entry.handoverDate | date:'medium' }}</span>
                                </div>
                                <p style="margin: 0; font-size: 0.82rem; color: var(--text-secondary); line-height: 1.4;">{{ entry.progressSummary || 'No progress summary logged.' }}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </ng-container>
                </tbody>
              </table>
            </div>
            <ng-template #emptyAdminState>
              <div class="empty-state" style="padding: 4rem;">
                <i class="bi bi-clipboard-check" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                <p>No connections require review or costing approval at the moment.</p>
              </div>
            </ng-template>
          </div>
          <!-- Reassignment progress modal overlay -->
          <div *ngIf="activeHandoverPrompt() as promptData" class="modal-overlay">
            <div class="modal-card" style="max-width: 500px;">
              <div class="modal-header">
                <h4><i class="bi bi-arrow-left-right"></i> Architect Handover Log</h4>
                <button class="close-btn" (click)="closeHandoverPrompt()">&times;</button>
              </div>
              <div class="modal-body">
                <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
                  You are reassigning this pipeline from <strong>{{ promptData.oldEng }}</strong> to <strong>{{ promptData.newEng }}</strong>. Please summarize the progress completed by {{ promptData.oldEng }} before handover.
                </p>
                <div class="form-group">
                  <label>Progress Summary / Notes</label>
                  <textarea 
                    [(ngModel)]="handoverProgressSummary"
                    rows="4"
                    placeholder="E.g., Successfully established connection and mapped core attributes. Sync testing remains pending."
                    class="form-control"
                  ></textarea>
                </div>
                <button (click)="submitHandoverReassignment()" class="btn btn-primary btn-block" style="margin-top: 1.25rem;" [disabled]="!handoverProgressSummary.trim()">
                  Confirm Reassignment & Log Progress
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ADMIN TAB: USER MANAGEMENT -->
        <div *ngIf="adminActiveTab() === 'users'" class="integrations-section card">
          <div class="section-title" style="margin-bottom: 1.5rem;">
            <h3>User &amp; Role Administration</h3>
            <p>Modify roles, search registered emails, and suspend/reactivate accounts.</p>
          </div>
          <div class="form-group" style="margin-bottom: 1.5rem; max-width: 400px;">
            <label>Search Users</label>
            <input type="text" [value]="userSearchQuery()" (input)="userSearchQuery.set($any($event.target).value)" placeholder="Search by name, email or role..." class="form-control" />
          </div>
          <div class="table-container">
            <table class="portal-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Assign Role</th>
                  <th>Status</th>
                  <th>Toggles</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let userItem of getFilteredUsers()">
                  <td><strong>{{ userItem.name }}</strong></td>
                  <td><code>{{ userItem.email }}</code></td>
                  <td>
                    <select class="form-control" [value]="userItem.role" (change)="onUpdateUserRole(userItem.id, $any($event.target).value)" style="font-size:0.75rem; padding:0.2rem 0.4rem; background: var(--bg-secondary); border-color: rgba(255,255,255,0.1); color: var(--text-primary); border-radius:6px; max-width: 120px;">
                      <option value="Client">Client</option>
                      <option value="Engineer">Engineer</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span class="status-badge" [ngClass]="userItem.isDisabled ? 'declined' : 'completed'">
                      {{ userItem.isDisabled ? 'Disabled' : 'Active' }}
                    </span>
                  </td>
                  <td>
                    <button (click)="toggleUserDisable(userItem)" class="btn btn-xs" [ngClass]="userItem.isDisabled ? 'btn-primary' : 'btn-secondary'" style="padding: 0.25rem 0.65rem;">
                      {{ userItem.isDisabled ? 'Enable' : 'Disable' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ADMIN TAB: ENGINEER WORKLOAD -->
        <div *ngIf="adminActiveTab() === 'workload'" class="integrations-section card">
          <div class="section-title" style="margin-bottom: 1.5rem;">
            <h3>Architect Assignment &amp; Workload Matrix</h3>
            <p>Drag active pipelines onto engineer nodes below to dynamically reassign them.</p>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem; align-items: start;">
            <div class="card" style="padding: 1.5rem; background: rgba(255,255,255,0.01);">
              <h4 style="color:#fff; margin-top:0; margin-bottom:1.25rem;"><i class="bi bi-card-list" style="color:var(--accent); margin-right:0.5rem;"></i>Active Pipelines</h4>
              <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 500px; overflow-y: auto; padding-right:0.25rem;">
                <div *ngFor="let o of allOrders()" 
                     [draggable]="o.status !== 'Completed' && o.status !== 'Declined'" 
                     (dragstart)="draggedOrderId = o.id" 
                     class="kanban-card" 
                     style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.75rem; cursor: grab;"
                     [style.opacity]="o.status === 'Completed' || o.status === 'Declined' ? '0.5' : '1'">
                  <div style="font-weight: 600; color: #fff; font-size: 0.82rem; margin-bottom: 0.25rem; display:flex; justify-content:space-between; align-items:center;">
                    <span>{{ o.workflowType }}</span>
                    <span class="status-badge" [ngClass]="o.status.toLowerCase().replace(' ','-')" style="font-size:0.6rem; padding:0.1rem 0.35rem;">{{ o.status }}</span>
                  </div>
                  <div style="font-size: 0.72rem; color: var(--text-secondary);">Route: {{ o.sourceSystem }} &rarr; {{ o.destinationSystem }}</div>
                  <div style="font-size:0.65rem; color:var(--text-muted); margin-top:0.4rem; display:flex; justify-content:space-between;">
                    <span>Architect: {{ o.engineerName || 'Unassigned' }}</span>
                    <span style="color:var(--accent); font-family:var(--font-mono);">\${{ o.price }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
              <h4 style="color:#fff; margin:0;"><i class="bi bi-shield-fill-gear" style="color:var(--accent); margin-right:0.5rem;"></i>Architect Availability &amp; Assignment</h4>
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                <div *ngFor="let wl of getEngineerWorkload()" 
                     (dragover)="$event.preventDefault()" 
                     (drop)="onTaskDrop(wl.name)" 
                     class="engineer-workload-target"
                     style="background: rgba(255,255,255,0.015); border: 1.5px dashed rgba(16, 185, 129, 0.15); padding: 1.25rem; border-radius: 12px; display: flex; flex-direction: column; gap: 0.75rem; transition: border-color 0.3s;"
                     [style.border-color]="draggedOrderId ? 'var(--primary)' : 'rgba(16, 185, 129, 0.15)'">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong style="color: #fff; font-size: 0.95rem;">{{ wl.name }}</strong>
                      <span class="status-dot" [style.background]="wl.online ? '#34d399' : '#f87171'" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-left: 0.5rem;"></span>
                      <span style="font-size: 0.72rem; color: var(--text-secondary); margin-left: 0.3rem;">{{ wl.online ? 'Online' : 'Offline' }}</span>
                    </div>
                    <span style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--text-secondary);">{{ wl.active }} / 8 Active Tasks</span>
                  </div>
                  <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.04); border-radius: 3px; overflow: hidden;">
                    <div [style.width]="wl.loadPct + '%'" style="height: 100%; background: var(--accent); transition: width 0.4s ease;"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ADMIN TAB: SYSTEM HEALTH -->
        <div *ngIf="adminActiveTab() === 'system'" class="integrations-section card" style="display: flex; flex-direction: column; gap: 2rem;">
          <div class="section-title">
            <h3>API &amp; Webhook Operations Health</h3>
            <p>Monitor active endpoint listeners, track response latency, and inspect system log streams.</p>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div class="card" style="padding: 1.5rem; background: rgba(255,255,255,0.01);">
              <h4 style="color:#fff; margin-top:0; margin-bottom:1.25rem;"><i class="bi bi-broadcast" style="color:var(--accent); margin-right:0.5rem;"></i>Active Webhook Endpoints</h4>
              <div class="table-container">
                <table class="portal-table" style="font-size: 0.8rem;">
                  <thead>
                    <tr>
                      <th>URL</th>
                      <th>Latency</th>
                      <th>Calls (Month)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let wh of webhooksList()">
                      <td><code style="font-size: 0.72rem;">{{ wh.url }}</code></td>
                      <td>{{ wh.latency }}</td>
                      <td>{{ wh.callsThisMonth }}</td>
                      <td><span class="status-badge completed">Active</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="card" style="padding: 1.5rem; background: rgba(255,255,255,0.01);">
              <h4 style="color:#fff; margin-top:0; margin-bottom:1.25rem;"><i class="bi bi-exclamation-triangle" style="color:var(--accent); margin-right:0.5rem;"></i>Platform Log &amp; Error Stream</h4>
              <div style="display:flex; flex-direction:column; gap:0.75rem; max-height: 250px; overflow-y: auto; padding-right: 0.25rem;">
                <div *ngFor="let err of errorLogsList()" style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 8px; padding: 0.75rem;">
                  <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:var(--text-muted); margin-bottom: 0.25rem;">
                    <span>System: <strong>{{ err.system }}</strong></span>
                    <span>{{ err.ts | date:'medium' }}</span>
                  </div>
                  <p style="margin:0; font-size:0.78rem; color:#f87171;">{{ err.message }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ADMIN TAB: BILLING ADMIN -->
        <div *ngIf="adminActiveTab() === 'billing'" class="integrations-section card" style="display: flex; flex-direction: column; gap: 2rem;">
          <div class="section-title">
            <h3>Billing, Subscriptions &amp; Invoices</h3>
            <p>Generate manual pricing statements and review current active enterprise subscriptions.</p>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <div class="card" style="padding: 1.5rem; background: rgba(255,255,255,0.01);">
              <h4 style="color:#fff; margin-top:0; margin-bottom:1.25rem;"><i class="bi bi-plus-circle" style="color:var(--accent); margin-right:0.5rem;"></i>Generate Client Invoice</h4>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label>Client Name / Company</label>
                <input type="text" [(ngModel)]="newInvoiceClient" placeholder="E.g., Acme Corp" class="form-control" />
              </div>
              <div class="form-group" style="margin-bottom: 1.25rem;">
                <label>Invoice Amount (USD)</label>
                <input type="number" [(ngModel)]="newInvoiceAmount" class="form-control" />
              </div>
              <button (click)="adminGenerateInvoice()" class="btn btn-primary btn-block" [disabled]="!newInvoiceClient.trim() || newInvoiceAmount <= 0">Generate Invoice Statement</button>
            </div>
            <div class="card" style="padding: 1.5rem; background: rgba(255,255,255,0.01);">
              <h4 style="color:#fff; margin-top:0; margin-bottom:1.25rem;"><i class="bi bi-wallet2" style="color:var(--accent); margin-right:0.5rem;"></i>Client Subscriptions</h4>
              <div class="table-container">
                <table class="portal-table" style="font-size:0.8rem;">
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Plan</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let sub of allSubscriptions()">
                      <td><strong>{{ sub.client }}</strong><br><span style="font-size:0.7rem; color:var(--text-muted);">{{ sub.email }}</span></td>
                      <td>{{ sub.plan }}</td>
                      <td style="font-family: var(--font-mono); font-weight:700;">\${{ sub.price }}/mo</td>
                      <td><span class="status-badge completed">Active</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div>
            <h4 style="color:#fff; margin-bottom:1rem;"><i class="bi bi-receipt-cutoff" style="color:var(--accent); margin-right:0.5rem;"></i>Invoice Receipt Database</h4>
            <div class="table-container">
              <table class="portal-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Client</th>
                    <th>Generated Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let inv of generatedInvoices()">
                    <td><code>{{ inv.id }}</code></td>
                    <td><strong>{{ inv.client }}</strong></td>
                    <td>{{ inv.date }}</td>
                    <td style="font-family: var(--font-mono); font-weight:700;">\${{ inv.amount }}</td>
                    <td><span class="status-badge" [ngClass]="inv.status === 'Paid' ? 'completed' : 'awaiting-payment'">{{ inv.status }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ADMIN TAB: FAQ EDITOR -->
        <div *ngIf="adminActiveTab() === 'content'" class="integrations-section card" style="display: flex; flex-direction: column; gap: 2rem;">
          <div class="section-title">
            <h3>Knowledge Base &amp; FAQ Management</h3>
            <p>Edit help articles that feed the AI chatbot fallback database dynamically.</p>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem; align-items: start;">
            <div class="card" style="padding: 1.5rem; background: rgba(255,255,255,0.01);">
              <h4 style="color:#fff; margin-top:0; margin-bottom:1.25rem;"><i class="bi bi-plus-circle" style="color:var(--accent); margin-right:0.5rem;"></i>Create FAQ Item</h4>
              <div class="form-group" style="margin-bottom: 1rem;">
                <label>Question</label>
                <input type="text" [(ngModel)]="newFaqQuestion" placeholder="E.g., How do I reset my credentials?" class="form-control" />
              </div>
              <div class="form-group" style="margin-bottom: 1.25rem;">
                <label>Answer Text</label>
                <textarea [(ngModel)]="newFaqAnswer" placeholder="Type the answer fallback details here..." rows="4" class="form-control"></textarea>
              </div>
              <button (click)="addFaq()" class="btn btn-primary btn-block" [disabled]="!newFaqQuestion.trim() || !newFaqAnswer.trim()">Add FAQ Item</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:1rem; max-height: 500px; overflow-y: auto; padding-right: 0.25rem;">
              <div *ngFor="let faq of faqArticles()" class="card" style="padding: 1.25rem; background: rgba(255,255,255,0.015); border: 1px solid var(--border);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.5rem; gap: 1rem;">
                  <strong style="color: #fff; font-size: 0.88rem;">Q: {{ faq.question }}</strong>
                  <button (click)="deleteFaq(faq)" class="btn btn-secondary btn-xs" style="color:#f87171; border-color: rgba(239,68,68,0.2);"><i class="bi bi-trash"></i></button>
                </div>
                <p style="margin:0; font-size:0.82rem; color:var(--text-secondary); line-height: 1.45;">A: {{ faq.answer }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ADMIN TAB: GLOBAL SETTINGS -->
        <div *ngIf="adminActiveTab() === 'settings'" class="integrations-section card">
          <div class="section-title" style="margin-bottom: 1.5rem;">
            <h3>Global System Configurations</h3>
            <p>Configure mail transfer, dashboard maintenance mode, and credentials branding.</p>
          </div>
          <div class="add-member-form" style="max-width: 600px; display:flex; flex-direction:column; gap:1.25rem;">
            <div class="form-group">
              <label>Console Branding Header</label>
              <input type="text" value="OrbitOps Core Console v2.0" class="form-control" readonly />
            </div>
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap:1rem;">
              <div class="form-group">
                <label>SMTP Transfer Host</label>
                <input type="text" [(ngModel)]="smtpHost" class="form-control" />
              </div>
              <div class="form-group">
                <label>SMTP Port</label>
                <input type="number" [(ngModel)]="smtpPort" class="form-control" />
              </div>
            </div>
            <div class="form-group">
              <label>Maintenance Mode Override</label>
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem;">
                <label class="switch" style="position: relative; display: inline-block; width: 44px; height: 22px;">
                  <input type="checkbox" [(ngModel)]="maintenanceMode" style="opacity: 0; width: 0; height: 0;" />
                  <span class="slider round" [style.background-color]="maintenanceMode ? '#ef4444' : '#10b981'" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; transition: .4s; border-radius: 34px;"></span>
                </label>
                <span style="font-size:0.85rem; color:var(--text-secondary);">
                  {{ maintenanceMode ? 'MAINTENANCE ACTIVE (Access restricted)' : 'OPERATIONAL (Standard operations)' }}
                </span>
              </div>
            </div>
            <button (click)="saveGlobalSettings()" class="btn btn-primary btn-block" style="margin-top: 0.5rem;">Save Global System Configurations</button>
          </div>
        </div>
      </ng-container>
      <!-- ============================================================
           3. ENGINEER PORTAL DASHBOARD VIEW
           ============================================================ -->
      <ng-container *ngIf="user.role === 'Engineer'">
        <div class="welcome-banner">
          <div>
            <h2>Architect Workspace: {{ user.name }}</h2>
            <p>Manage your queue, view assigned connection variables, and toggle availability.</p>
          </div>
          <!-- Availability Toggle -->
          <div class="availability-toggle-box">
            <span class="status-indicator-badge" [class.online]="engAvailable()" [class.busy]="!engAvailable()">
              {{ engAvailable() ? 'ONLINE: AVAILABLE' : 'OFFLINE: BUSY' }}
            </span>
            <!-- Custom Dropdown Button -->
            <div style="position: relative; display: inline-block; margin-left: 1rem;">
              <button (click)="toggleDropdown()" class="btn btn-secondary btn-sm" style="display: flex; align-items: center; gap: 0.5rem;">
                <span>Status: {{ engAvailable() ? 'Online' : 'Offline' }}</span>
                <i class="bi bi-chevron-down" style="font-size: 0.75rem;"></i>
              </button>
              <div *ngIf="statusDropdownOpen" class="status-dropdown-menu" style="position: absolute; right: 0; top: 110%; background: var(--bg-secondary); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); z-index: 100; min-width: 120px; padding: 0.25rem 0;">
                <button (click)="selectEngineerAvailability(true); statusDropdownOpen = false;" class="dropdown-item" style="width: 100%; text-align: left; padding: 0.5rem 1rem; background: none; border: none; color: var(--text-primary); font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: #34d399; display: inline-block;"></span>
                  Online
                </button>
                <button (click)="selectEngineerAvailability(false); statusDropdownOpen = false;" class="dropdown-item" style="width: 100%; text-align: left; padding: 0.5rem 1rem; background: none; border: none; color: var(--text-primary); font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: #f87171; display: inline-block;"></span>
                  Offline
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- Portal Sub-Navigation Tabs for Engineer -->
        <div class="portal-sub-nav" style="display: flex; gap: 0.5rem; margin-top: 1.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
          <button (click)="engineerActiveTab.set('board')" class="btn" [ngClass]="engineerActiveTab() === 'board' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-kanban"></i> Task Board
          </button>
          <button (click)="engineerActiveTab.set('queue')" class="btn" [ngClass]="engineerActiveTab() === 'queue' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-list-task"></i> My Queue
          </button>
          <button (click)="engineerActiveTab.set('workspace')" class="btn" [ngClass]="engineerActiveTab() === 'workspace' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-laptop"></i> Project Workspace
          </button>
          <button (click)="engineerActiveTab.set('chat')" class="btn" [ngClass]="engineerActiveTab() === 'chat' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-chat-dots"></i> Client Communication
          </button>
          <button (click)="engineerActiveTab.set('kb')" class="btn" [ngClass]="engineerActiveTab() === 'kb' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-book"></i> Knowledge Base
          </button>
          <button (click)="engineerActiveTab.set('timelog')" class="btn" [ngClass]="engineerActiveTab() === 'timelog' ? 'btn-primary' : 'btn-secondary'" style="padding: 0.5rem 1rem; font-size: 0.82rem; border-radius: 8px;">
            <i class="bi bi-clock-history"></i> Time Logging
          </button>
        </div>
        <!-- ENGINEER TAB: TASK BOARD -->
        <div *ngIf="engineerActiveTab() === 'board'" style="display: flex; flex-direction: column; gap: 2rem;">
          <!-- Engineer Workload Summary -->
          <div class="metrics-grid">
            <div class="metric-card card">
              <div class="metric-icon primary-glow"><i class="bi bi-folder2-open"></i></div>
              <div class="metric-info">
                <span class="m-val">{{ orders().length }}</span>
                <span class="m-lbl">Assigned Projects</span>
              </div>
            </div>
            <div class="metric-card card">
              <div class="metric-icon accent-glow"><i class="bi bi-check2-all"></i></div>
              <div class="metric-info">
                <span class="m-val">{{ getEngCompletedCount() }}</span>
                <span class="m-lbl">Completed</span>
              </div>
            </div>
            <div class="metric-card card">
              <div class="metric-icon violet-glow"><i class="bi bi-arrow-repeat"></i></div>
              <div class="metric-info">
                <span class="m-val">{{ getEngActiveCount() }}</span>
                <span class="m-lbl">In Progress</span>
              </div>
            </div>
            <div class="metric-card card" style="background: rgba(16,185,129,0.04) !important; border-color: rgba(16,185,129,0.12) !important;">
              <div class="metric-icon accent-glow"><i class="bi bi-clock-fill"></i></div>
              <div class="metric-info">
                <span class="session-timer" style="font-size:1.3rem;">{{ sessionTimerDisplay() }}</span>
                <span class="m-lbl">Time {{ engAvailable() ? 'Online' : 'Offline' }}</span>
              </div>
            </div>
          </div>
          <!-- Today's Focus -->
          <div *ngIf="getTodaysFocus() as focus" class="focus-card">
            <div class="focus-icon"><i class="bi bi-bullseye"></i></div>
            <div class="focus-info">
              <div class="focus-label">Today's Priority</div>
              <div class="focus-title">{{ focus.workflowType }}</div>
              <div class="focus-sub">{{ focus.sourceSystem }} &rarr; {{ focus.destinationSystem }} &bull; {{ focus.status }}</div>
            </div>
            <span class="status-badge" [ngClass]="focus.status.toLowerCase().replace(' ','-')" style="flex-shrink:0;">{{ focus.status }}</span>
          </div>
          <!-- Performance Summary -->
          <div class="integrations-section card" style="padding:1.75rem !important;">
            <div class="section-title" style="margin-bottom:1.25rem;">
              <h3><i class="bi bi-speedometer" style="margin-right:0.5rem; color:var(--accent);"></i>Performance Summary</h3>
              <p>Your pipeline completion metrics and productivity stats.</p>
            </div>
            <div class="perf-row">
              <div class="perf-card">
                <div class="perf-val">{{ getEngCompletionRate() }}%</div>
                <div class="perf-lbl">Completion Rate</div>
              </div>
              <div class="perf-card">
                <div class="perf-val">{{ getEngAvgHandlingDays() }}d</div>
                <div class="perf-lbl">Avg Handling Time</div>
              </div>
              <div class="perf-card">
                <div class="perf-val">{{ getEngActiveStreak() }}</div>
                <div class="perf-lbl">Active Streak</div>
              </div>
            </div>
          </div>
          <!-- Kanban Board -->
          <div *ngIf="orders().length > 0; else emptyEngState" class="integrations-section card" style="padding:1.75rem !important;">
            <div class="section-title" style="margin-bottom:1.25rem;">
              <h3><i class="bi bi-kanban-fill" style="margin-right:0.5rem; color:#a78bfa;"></i>Pipeline Kanban Board</h3>
              <p>Visual overview of your projects organized by stage.</p>
            </div>
            <div class="kanban-board">
              <div class="kanban-cols-container" style="display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem;">
                <div *ngFor="let col of getKanbanColumns()" class="kanban-col" style="flex: 1; min-width: 200px; background: rgba(255,255,255,0.015); border: 1px solid var(--border); border-radius: 10px; padding: 1rem;">
                  <div class="kanban-col-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
                    <strong style="color: #fff; font-size: 0.85rem;">{{ col.title }}</strong>
                    <span class="kanban-count" style="font-family: var(--font-mono); font-size: 0.75rem; background: rgba(255,255,255,0.05); padding: 0.1rem 0.4rem; border-radius: 4px;">{{ col.orders.length }}</span>
                  </div>
                  <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div *ngFor="let o of col.orders" class="kanban-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 0.75rem;">
                      <div class="kc-title" style="font-weight: 600; color: #fff; font-size: 0.82rem; margin-bottom: 0.25rem;">{{ o.workflowType }}</div>
                      <div class="kc-meta" style="font-size: 0.72rem; color: var(--text-secondary);">{{ o.sourceSystem }} &rarr; {{ o.destinationSystem }}</div>
                      <div style="font-size:0.65rem; color:var(--text-muted); margin-top:0.4rem; display:flex; justify-content:space-between;">
                        <span>Client: {{ o.clientCompany }}</span>
                        <span style="color:var(--accent);">{{ o.price > 0 ? '$' + o.price : '' }}</span>
                      </div>
                    </div>
                  </div>
                  <div *ngIf="col.orders.length === 0" style="font-size:0.7rem; color:var(--text-muted); text-align:center; padding:1.5rem 0;">
                    No projects
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- ENGINEER TAB: MY QUEUE -->
        <div *ngIf="engineerActiveTab() === 'queue'" style="display: flex; flex-direction: column; gap: 2rem;">
          <!-- Active assigned projects table -->
          <div class="integrations-section card">
            <div class="section-title">
              <h3>Your Assigned Queue &amp; Actions</h3>
              <p>List of your pipelines. Update status, review keys, and jump to workspace.</p>
            </div>
            <div class="table-container" *ngIf="orders().length > 0; else emptyEngState">
              <table class="portal-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>ID</th>
                    <th>Client Detail</th>
                    <th>Scenario</th>
                    <th>Route</th>
                    <th>Keys Count</th>
                    <th>Pipeline Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <ng-container *ngFor="let order of orders()">
                    <tr (click)="toggleExpandOrder(order.id, $event)" class="expandable-row" style="cursor: pointer;">
                      <td class="chevron-cell">
                        <button class="chevron-btn" type="button">
                          <i class="bi" [ngClass]="expandedOrderId() === order.id ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
                        </button>
                      </td>
                      <td class="order-id"><code>{{ order.id }}</code></td>
                      <td>
                        <div><strong>{{ order.clientName || 'N/A' }}</strong></div>
                        <div style="font-size: 0.72rem; color: var(--text-secondary);">{{ order.clientCompany || 'N/A' }}</div>
                      </td>
                      <td><strong>{{ order.workflowType }}</strong></td>
                      <td>
                        <div class="pipe-cell">
                          <span class="sys-badge">{{ order.sourceSystem }}</span>
                          <i class="bi bi-arrow-right-short"></i>
                          <span class="sys-badge">{{ order.destinationSystem }}</span>
                        </div>
                      </td>
                      <td>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">
                          Src: {{ getKeysCount(order.sourceCredentials) }} | 
                          Dest: {{ getKeysCount(order.destinationCredentials) }}
                        </div>
                      </td>
                      <td>
                        <select class="form-control" [value]="order.status" (change)="onUpdateStatus(order.id, $event); $event.stopPropagation();" style="max-width: 160px; font-size:0.75rem; padding:0.25rem 0.5rem; background: var(--bg-secondary); border-color: rgba(255,255,255,0.1); color: var(--text-primary); border-radius:6px;">
                          <option value="Awaiting Assignment">Awaiting Assignment</option>
                          <option value="Connection Setup">1. Connection Setup</option>
                          <option value="Mapping Schema">2. Mapping Schema</option>
                          <option value="Testing Sync">3. Testing Sync</option>
                          <option value="In Progress">4. In Progress</option>
                          <option value="Completed">5. Completed</option>
                          <option value="On Hold">On Hold</option>
                        </select>
                      </td>
                      <td>
                        <div style="display:flex; gap:0.35rem;" (click)="$event.stopPropagation();">
                          <button (click)="selectedEngProjectId.set(order.id); engineerActiveTab.set('workspace');" class="btn btn-secondary btn-xs">Workspace</button>
                          <button (click)="selectedCommProjectId.set(order.id); engineerActiveTab.set('chat');" class="btn btn-secondary btn-xs"><i class="bi bi-chat-fill"></i></button>
                        </div>
                      </td>
                    </tr>
                    <tr *ngIf="expandedOrderId() === order.id">
                      <td colspan="8" class="expanded-row-td">
                        <div class="expanded-detail-card">
                          <div class="detail-grid">
                            <div class="detail-section">
                              <h4 class="detail-sec-title"><i class="bi bi-person-badge"></i> Client Details</h4>
                              <div class="detail-item"><strong>Client Name:</strong> {{ order.clientName || 'N/A' }}</div>
                              <div class="detail-item"><strong>Company:</strong> {{ order.clientCompany || 'N/A' }}</div>
                              <div class="detail-item"><strong>Email Address:</strong> {{ order.clientEmail || 'N/A' }}</div>
                            </div>
                            <div class="detail-section">
                              <h4 class="detail-sec-title"><i class="bi bi-bezier2"></i> Specifications</h4>
                              <div class="detail-item"><strong>Instructions:</strong> {{ order.instructions || 'None provided.' }}</div>
                            </div>
                          </div>
                          <div class="detail-credentials-grid">
                            <div class="cred-box">
                              <h5 class="cred-title"><i class="bi bi-key-fill"></i> Source Credentials ({{ order.sourceSystem }})</h5>
                              <div class="cred-table" *ngIf="getCredentialsList(order.sourceCredentials).length > 0; else noSrcCreds">
                                <div class="cred-row" *ngFor="let cred of getCredentialsList(order.sourceCredentials)">
                                  <span class="cred-label">{{ cred.key }}</span>
                                  <div class="cred-value-wrap">
                                    <span class="cred-value" *ngIf="!isCredentialMasked(order.id, 'source', cred.key)">{{ cred.value }}</span>
                                    <span class="cred-value masked" *ngIf="isCredentialMasked(order.id, 'source', cred.key)">••••••••••••</span>
                                    <div class="cred-actions">
                                      <button class="btn-cred-action" type="button" (click)="$event.stopPropagation(); toggleCredentialMask(order.id, 'source', cred.key)">
                                        <i class="bi" [ngClass]="isCredentialMasked(order.id, 'source', cred.key) ? 'bi-eye' : 'bi-eye-slash'"></i>
                                      </button>
                                      <button class="btn-cred-action" type="button" (click)="$event.stopPropagation(); copyToClipboard(cred.value)">
                                        <i class="bi bi-clipboard"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <ng-template #noSrcCreds><p class="no-creds-text">No credentials supplied.</p></ng-template>
                            </div>
                            <div class="cred-box">
                              <h5 class="cred-title"><i class="bi bi-key-fill"></i> Destination Credentials ({{ order.destinationSystem }})</h5>
                              <div class="cred-table" *ngIf="getCredentialsList(order.destinationCredentials).length > 0; else noDestCreds">
                                <div class="cred-row" *ngFor="let cred of getCredentialsList(order.destinationCredentials)">
                                  <span class="cred-label">{{ cred.key }}</span>
                                  <div class="cred-value-wrap">
                                    <span class="cred-value" *ngIf="!isCredentialMasked(order.id, 'destination', cred.key)">{{ cred.value }}</span>
                                    <span class="cred-value masked" *ngIf="isCredentialMasked(order.id, 'destination', cred.key)">••••••••••••</span>
                                    <div class="cred-actions">
                                      <button class="btn-cred-action" type="button" (click)="$event.stopPropagation(); toggleCredentialMask(order.id, 'destination', cred.key)">
                                        <i class="bi" [ngClass]="isCredentialMasked(order.id, 'destination', cred.key) ? 'bi-eye' : 'bi-eye-slash'"></i>
                                      </button>
                                      <button class="btn-cred-action" type="button" (click)="$event.stopPropagation(); copyToClipboard(cred.value)">
                                        <i class="bi bi-clipboard"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <ng-template #noDestCreds><p class="no-creds-text">No credentials supplied.</p></ng-template>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </ng-container>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <!-- ENGINEER TAB: PROJECT WORKSPACE -->
        <div *ngIf="engineerActiveTab() === 'workspace'" style="display: flex; flex-direction: column; gap: 2rem;">
          <div class="integrations-section card">
            <div class="section-title">
              <h3>Project Workspace &amp; Scenario Mappings</h3>
              <p>Configure mapping notes, access direct scenario editing tools, and analyze execution run logs.</p>
            </div>
            <!-- Project selector -->
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label>Select Automation Pipeline</label>
              <select class="form-control" [value]="selectedEngProjectId()" (change)="selectedEngProjectId.set($any($event.target).value)">
                <option value="">-- Choose Assigned Project --</option>
                <option *ngFor="let o of orders()" [value]="o.id">{{ o.workflowType }} ({{ o.clientCompany }})</option>
              </select>
            </div>
            <!-- Workspace Details if selected -->
            <div *ngIf="getSelectedEngProject() as p; else noWorkspaceProject" style="display: flex; flex-direction: column; gap: 1.5rem; margin-top: 1.5rem;">
              <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border); padding: 1.5rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                <div>
                  <h4 style="color:#fff; margin-bottom: 0.25rem;">{{ p.workflowType }}</h4>
                  <span style="font-size:0.8rem; color:var(--text-secondary);">Client: <strong>{{ p.clientName }}</strong> of {{ p.clientCompany }} &bull; Price Bid: \${{ p.price }}</span>
                </div>
                <div style="display:flex; gap:0.5rem;">
                  <a href="https://make.com" target="_blank" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 0.35rem;">
                    <i class="bi bi-link-45deg"></i> Make.com Scenario
                  </a>
                  <a href="https://n8n.io" target="_blank" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 0.35rem;">
                    <i class="bi bi-diagram-3-fill"></i> n8n Workflow
                  </a>
                </div>
              </div>
              <!-- Notes field -->
              <div class="form-group">
                <label>Developer/Architect Internal Notes</label>
                <textarea class="form-control" rows="5" [(ngModel)]="engineerNotes[p.id]" placeholder="Add custom notes, keys, configuration links, or troubleshooting insights for this integration scenario..."></textarea>
                <button class="btn btn-primary btn-sm" style="margin-top:0.75rem;" (click)="saveNotes(p.id)">
                  <i class="bi bi-floppy"></i> Save Workspace Notes
                </button>
              </div>
              <!-- Test logs simulator -->
              <div style="margin-top: 1rem;">
                <h5 style="font-size:0.85rem; text-transform:uppercase; color:var(--accent); font-family:var(--font-mono); margin-bottom: 0.75rem;">Simulated Test Run Output</h5>
                <div style="background: #020510; color: #10b981; font-family: var(--font-mono); font-size: 0.78rem; padding: 1.25rem; border-radius: 8px; border: 1px solid var(--border); max-height: 200px; overflow-y: auto;">
                  <div>[2026-06-12 07:28:44] Initiating connector runtime instance...</div>
                  <div>[2026-06-12 07:28:45] Fetching schema validation challenge from {{ p.sourceSystem }}...</div>
                  <div>[2026-06-12 07:28:46] Source payload mapped successfully.</div>
                  <div>[2026-06-12 07:28:47] Sync testing complete: successfully connected to {{ p.destinationSystem }}.</div>
                </div>
              </div>
              <!-- Deployment status percent slider -->
              <div style="margin-top: 1rem;">
                <h5 style="margin-bottom:0.5rem;">Pipeline Mapping Progress</h5>
                <div style="display: flex; align-items: center; gap: 1rem;">
                  <span class="status-badge" [ngClass]="p.status.toLowerCase().replace(' ','-')">{{ p.status }}</span>
                  <div class="progress-bar-track" style="flex: 1; height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden;">
                    <div class="progress-bar-fill" [style.width]="getProjectProgressPercent(p.status) + '%'" style="height: 100%; background: var(--accent); transition: width 0.4s ease;"></div>
                  </div>
                  <span style="font-size:0.85rem; font-family:var(--font-mono);">{{ getProjectProgressPercent(p.status) }}%</span>
                </div>
              </div>
            </div>
            <ng-template #noWorkspaceProject>
              <div class="empty-state" style="padding: 3rem;">
                <i class="bi bi-laptop" style="font-size:2.5rem; color:var(--text-muted);"></i>
                <p style="margin-top: 1rem; color:var(--text-secondary);">Select an active assigned project from the dropdown to launch the developer workspace.</p>
              </div>
            </ng-template>
          </div>
        </div>
        <!-- ENGINEER TAB: CLIENT COMMUNICATION -->
        <div *ngIf="engineerActiveTab() === 'chat'" style="display: flex; flex-direction: column; gap: 2rem;">
          <div class="integrations-section card">
            <div class="section-title">
              <h3>Client Communication Comment Hub</h3>
              <p>Communicate with your clients directly about their integration specs and sandbox credentials.</p>
            </div>
            <!-- Project Selector -->
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label>Select Client Conversation Thread</label>
              <select class="form-control" [value]="selectedCommProjectId()" (change)="selectedCommProjectId.set($any($event.target).value)">
                <option value="">-- Choose Assigned Project --</option>
                <option *ngFor="let o of orders()" [value]="o.id">{{ o.workflowType }} &bull; client: {{ o.clientName }} ({{ o.clientCompany }})</option>
              </select>
            </div>
            <!-- Comments thread -->
            <div *ngIf="selectedCommProjectId() as orderId; else noCommProject">
              <div style="background: rgba(0,0,0,0.2); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; max-height: 400px; overflow-y: auto; margin-bottom: 1.5rem;">
                <div *ngFor="let msg of getCommentsForOrder(orderId)" style="display:flex; flex-direction:column; gap:0.25rem; max-width: 80%;" [style.align-self]="msg.sender === 'Engineer' ? 'flex-end' : 'flex-start'">
                  <div style="font-size:0.7rem; color:var(--text-muted); display:flex; gap:0.5rem;" [style.justify-content]="msg.sender === 'Engineer' ? 'flex-end' : 'flex-start'">
                    <strong>{{ msg.sender === 'Engineer' ? 'You' : 'Client (' + msg.sender + ')' }}</strong>
                    <span>&bull;</span>
                    <span>{{ msg.time }}</span>
                  </div>
                  <div style="padding: 0.75rem 1rem; border-radius: 12px; font-size: 0.85rem; line-height: 1.45;" [style.background]="msg.sender === 'Engineer' ? 'var(--primary)' : 'rgba(255,255,255,0.04)'" [style.color]="msg.sender === 'Engineer' ? 'white' : 'var(--text-primary)'" [style.border]="msg.sender === 'Engineer' ? 'none' : '1px solid var(--border)'">
                    {{ msg.text }}
                  </div>
                </div>
                <div *ngIf="getCommentsForOrder(orderId).length === 0" style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding: 2rem 0;">No comments logged yet. Send a greeting to initiate the handshake conversation thread!</div>
              </div>
              <!-- Comment form -->
              <div style="display:flex; gap:0.75rem;">
                <input type="text" [(ngModel)]="newCommentText[orderId]" placeholder="Type your comment to the client..." class="form-control" style="flex:1;" (keyup.enter)="addComment(orderId)" />
                <button (click)="addComment(orderId)" class="btn btn-primary" [disabled]="!(newCommentText[orderId] || '').trim()">Send</button>
              </div>
            </div>
            <ng-template #noCommProject>
              <div class="empty-state" style="padding: 3rem;">
                <i class="bi bi-chat-left-text" style="font-size:2.5rem; color:var(--text-muted);"></i>
                <p style="margin-top: 1rem; color:var(--text-secondary);">Select an active integration project to load comment threads.</p>
              </div>
            </ng-template>
          </div>
        </div>
        <!-- ENGINEER TAB: KNOWLEDGE BASE -->
        <div *ngIf="engineerActiveTab() === 'kb'" style="display: flex; flex-direction: column; gap: 2rem;">
          <div class="integrations-section card">
            <div class="section-title">
              <h3>Internal Knowledge Base &amp; Snippets</h3>
              <p>Search pre-written blueprints, OAuth workflows, rate-limiting solutions, and validation routines.</p>
            </div>
            <!-- Search box -->
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label>Search Internal Articles</label>
              <input type="text" [value]="kbSearch()" (input)="kbSearch.set($any($event.target).value)" placeholder="Search OAuth configuration, webhooks handshakes, NetSuite codes..." class="form-control" />
            </div>
            <!-- KB Articles list -->
            <div style="display:flex; flex-direction:column; gap:1.5rem;">
              <div *ngFor="let art of getKbArticlesFiltered()" class="card" style="padding:1.5rem; border: 1px solid var(--border);">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.5rem;">
                  <h4 style="color:#fff; font-size:1.05rem; margin:0;">{{ art.title }}</h4>
                  <span class="status-badge" style="background:rgba(59,130,246,0.1); color:#60a5fa; border: 1px solid rgba(59,130,246,0.2); font-size:0.65rem; padding:0.15rem 0.4rem;">{{ art.category }}</span>
                </div>
                <p style="font-size:0.82rem; color:var(--text-secondary); line-height:1.45; margin-bottom: 1rem;">{{ art.excerpt }}</p>
                <div style="position:relative; background:#020510; border:1px solid rgba(255,255,255,0.04); border-radius:8px; padding:1rem;">
                  <pre style="margin:0; font-family:var(--font-mono); font-size:0.75rem; color:#10b981; overflow-x:auto;">{{ art.code }}</pre>
                  <button (click)="copyToClipboard(art.code)" class="btn btn-secondary btn-xs" style="position:absolute; right:0.5rem; top:0.5rem; padding:0.2rem 0.5rem; font-size:0.65rem;"><i class="bi bi-clipboard"></i> Copy</button>
                </div>
              </div>
              <div *ngIf="getKbArticlesFiltered().length === 0" style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding: 2rem 0;">No articles match your search parameters. Try searching "OAuth" or "ADP".</div>
            </div>
          </div>
        </div>
        <!-- ENGINEER TAB: TIME LOGGING -->
        <div *ngIf="engineerActiveTab() === 'timelog'" style="display: flex; flex-direction: column; gap: 2rem;">
          <div class="integrations-section card">
            <div class="section-title">
              <h3>Work Hour Tracking &amp; Time Logs</h3>
              <p>Log work hours spent building, testing, or mapping customer data integrations.</p>
            </div>
            <!-- Project Selector -->
            <div class="form-group" style="margin-bottom: 1.5rem;">
              <label>Select Integration Pipeline</label>
              <select class="form-control" [value]="selectedTimeProjectId()" (change)="selectedTimeProjectId.set($any($event.target).value)">
                <option value="">-- Choose Assigned Project --</option>
                <option *ngFor="let o of orders()" [value]="o.id">{{ o.workflowType }} ({{ o.clientCompany }})</option>
              </select>
            </div>
            <div *ngIf="selectedTimeProjectId() as orderId; else noTimeProject" class="grid grid-cols-2" style="gap:2rem;">
              <!-- Time logger form -->
              <div class="card" style="padding: 1.5rem; border:1px solid var(--border);">
                <h5 style="color:var(--accent); font-size: 0.88rem; text-transform: uppercase; font-family:var(--font-mono); margin-bottom: 1.25rem;">Log Work Hours</h5>
                <div class="form-group" style="margin-bottom: 1rem;">
                  <label>Hours Spent</label>
                  <input type="number" [(ngModel)]="logHours" class="form-control" style="max-width: 120px;" />
                </div>
                <div class="form-group" style="margin-bottom: 1.25rem;">
                  <label>Activity Description</label>
                  <textarea [(ngModel)]="logDesc" placeholder="Describe mapping operations, sandbox authentication configurations..." class="form-control" rows="4"></textarea>
                </div>
                <button (click)="logTime(orderId)" class="btn btn-primary" [disabled]="logHours <= 0 || !logDesc.trim()">Submit Time Logs</button>
              </div>
              <!-- Time log summary list -->
              <div class="card" style="padding: 1.5rem; border:1px solid var(--border);">
                <h5 style="color:var(--accent); font-size: 0.88rem; text-transform: uppercase; font-family:var(--font-mono); margin-bottom: 1.25rem;">Logged Hours History</h5>
                <div style="max-height: 250px; overflow-y: auto;">
                  <div *ngFor="let log of getTimeLogsForOrder(orderId)" style="border-bottom: 1px solid rgba(255,255,255,0.04); padding: 0.5rem 0;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-size:0.85rem; color:#fff; font-weight:700;">{{ log.hours }} Hours</span>
                      <span style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono);">{{ log.date }}</span>
                    </div>
                    <p style="font-size:0.8rem; color:var(--text-secondary); margin: 0.25rem 0 0 0; line-height: 1.4;">{{ log.description }}</p>
                  </div>
                  <div *ngIf="getTimeLogsForOrder(orderId).length === 0" style="text-align:center; color:var(--text-muted); font-size:0.82rem; padding: 2rem 0;">No hours logged on this pipeline yet.</div>
                </div>
              </div>
            </div>
            <ng-template #noTimeProject>
              <div class="empty-state" style="padding: 3rem;">
                <i class="bi bi-clock-history" style="font-size:2.5rem; color:var(--text-muted);"></i>
                <p style="margin-top: 1rem; color:var(--text-secondary);">Select an active integration project to track and log work hours.</p>
              </div>
            </ng-template>
          </div>
        </div>
        <ng-template #emptyEngState>
          <div class="empty-state" style="padding: 3rem;">
            <i class="bi bi-journal-x" style="font-size:2.5rem;"></i>
            <h4>No Active Pipelines Assigned</h4>
            <p>Once clients accept estimating cost quotes, projects will populate here.</p>
          </div>
        </ng-template>
      </ng-container>
      <!-- ============================================================
           4. E-COMMERCE QR CHECKOUT PROMPT MODAL (Client Pay Flow)
           ============================================================ -->
      <div *ngIf="activeCheckoutOrder() as order" class="modal-overlay">
        <div class="modal-card checkout-modal-card">
          <div class="modal-header">
            <h4><i class="bi bi-lock-fill"></i> Secure Payment Prompt</h4>
            <button class="close-btn" (click)="closeCheckout()">&times;</button>
          </div>
          <div class="modal-body checkout-modal-body">
            <div class="ecommerce-prompt-header">
              <span>Costing approved by OrbitOps Admin</span>
              <h2>\${{ order.price }} USD</h2>
              <p class="sc-desc">Workflow: <strong>{{ order.workflowType }}</strong> ({{ order.sourceSystem }} &rarr; {{ order.destinationSystem }})</p>
              <p style="font-size: 0.78rem; color: var(--accent); margin-top: 0.25rem;"><i class="bi bi-clock-history"></i> Estimated Delivery: <strong>{{ order.estimatedCompletionTime || '3 days' }}</strong></p>
            </div>
            <!-- Amazon-style Instant Payment QR Section -->
            <div class="qr-payment-section">
              <div class="qr-container">
                <!-- Inline SVG QR Code Mock -->
                <svg width="128" height="128" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- QR Background -->
                  <rect width="100" height="100" rx="4" fill="#ffffff" />
                  <!-- QR Corners (Alignments) -->
                  <rect x="5" y="5" width="25" height="25" fill="#020805" stroke="#10b981" stroke-width="2"/>
                  <rect x="10" y="10" width="15" height="15" fill="#ffffff"/>
                  <rect x="13" y="13" width="9" height="9" fill="#020805"/>
                  <rect x="70" y="5" width="25" height="25" fill="#020805" stroke="#10b981" stroke-width="2"/>
                  <rect x="75" y="10" width="15" height="15" fill="#ffffff"/>
                  <rect x="78" y="78" width="9" height="9" fill="#020805" rx="1"/>
                  <rect x="5" y="70" width="25" height="25" fill="#020805" stroke="#10b981" stroke-width="2"/>
                  <rect x="10" y="75" width="15" height="15" fill="#ffffff"/>
                  <rect x="13" y="13" width="9" height="9" fill="#020805"/>
                  <!-- Random QR Matrix Blocks -->
                  <rect x="35" y="5" width="8" height="8" fill="#020805" />
                  <rect x="45" y="15" width="12" height="6" fill="#020805" />
                  <rect x="35" y="25" width="20" height="8" fill="#10b981" />
                  <rect x="5" y="35" width="8" height="16" fill="#020805" />
                  <rect x="18" y="45" width="12" height="8" fill="#020805" />
                  <rect x="35" y="40" width="16" height="16" fill="#020805" />
                  <rect x="55" y="35" width="12" height="12" fill="#020805" />
                  <rect x="70" y="35" width="25" height="8" fill="#10b981" />
                  <rect x="75" y="48" width="12" height="8" fill="#020805" />
                  <rect x="55" y="55" width="16" height="8" fill="#020805" />
                  <rect x="35" y="60" width="8" height="12" fill="#020805" />
                  <rect x="48" y="70" width="12" height="25" fill="#020805" />
                  <rect x="65" y="70" width="8" height="20" fill="#10b981" />
                  <rect x="80" y="80" width="15" height="15" fill="#020805" />
                </svg>
              </div>
              <div class="qr-info">
                <strong>Instant Scan & Pay</strong>
                <p>Scan using your mobile device or banking app to authorize this costing directly.</p>
              </div>
            </div>
            <hr class="summary-sep" />
            <!-- Alternative Credit Card Checkout Form -->
            <div class="modal-card-form">
              <h5>Or Pay via Credit Card</h5>
              <div *ngIf="checkoutError()" class="error-alert"><p>{{ checkoutError() }}</p></div>
              <div class="form-group">
                <label>Card Number</label>
                <input type="text" placeholder="4242 4242 4242 4242" class="form-control" />
              </div>
              <div class="grid grid-cols-2" style="margin-top: 0.75rem;">
                <div class="form-group">
                  <label>Expiry</label>
                  <input type="text" placeholder="12/26" class="form-control" />
                </div>
                <div class="form-group">
                  <label>CVC</label>
                  <input type="text" placeholder="123" class="form-control" />
                </div>
              </div>
              <button (click)="onProcessCheckout()" class="btn btn-primary btn-block" style="margin-top: 1.5rem;" [disabled]="submittingPay()">
                <span *ngIf="!submittingPay()"><i class="bi bi-shield-lock-fill"></i> Complete Payment \${{ order.price }}</span>
                <span *ngIf="submittingPay()" class="spinner-text"><span class="spinner"></span> Validating Transaction...</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <!-- 5. HANDOVER PROGRESS PROMPT MODAL -->
      <div *ngIf="activeHandoverPrompt() as promptData" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-header">
            <h4><i class="bi bi-arrow-left-right"></i> Architect Handover Log</h4>
            <button class="close-btn" (click)="closeHandoverPrompt()">&times;</button>
          </div>
          <div class="modal-body">
            <p style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
              You are reassigning this pipeline from <strong>{{ promptData.oldEng }}</strong> to <strong>{{ promptData.newEng }}</strong>. Please summarize the progress completed by {{ promptData.oldEng }} before handover.
            </p>
            <div class="form-group">
              <label>Progress Summary / Notes</label>
              <textarea 
                [(ngModel)]="handoverProgressSummary"
                rows="4"
                placeholder="E.g., Successfully established connection and mapped core attributes. Sync testing remains pending."
                class="form-control"
              ></textarea>
            </div>
            <button (click)="submitHandoverReassignment()" class="btn btn-primary btn-block" style="margin-top: 1.25rem;" [disabled]="!handoverProgressSummary.trim()">
              Confirm Reassignment & Log Progress
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .portal-home {
      display: flex;
      flex-direction: column;
      gap: 2.5rem;
    }
    .welcome-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.02) 100%);
      border: 1px solid rgba(16, 185, 129, 0.15);
      padding: 2rem;
      border-radius: 16px;
    }
    .welcome-banner h2 {
      font-size: 1.85rem;
      margin-bottom: 0.35rem;
      background: linear-gradient(135deg, #ffffff, var(--text-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .welcome-banner p {
      color: var(--text-secondary);
      font-size: 0.95rem;
      margin: 0;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: 1.25rem;
    }
    @media (min-width: 576px) { .metrics-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 992px) { .metrics-grid { grid-template-columns: repeat(4, 1fr); } }
    .metric-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.5rem !important;
      border-color: rgba(255, 255, 255, 0.05) !important;
    }
    .metric-icon {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    .primary-glow { background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.18); color: #60a5fa; }
    .accent-glow { background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.18); color: #34d399; }
    .violet-glow { background: rgba(139, 92, 246, 0.08); border: 1px solid rgba(139, 92, 246, 0.18); color: #a78bfa; }
    .gold-glow { background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.18); color: #fbbf24; }
    .metric-info {
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }
    .m-val {
      font-family: var(--font-display);
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-primary);
    }
    .m-lbl {
      font-size: 0.75rem;
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .payment-alert-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      background: rgba(245, 158, 11, 0.08) !important;
      border: 1px solid rgba(245, 158, 11, 0.2) !important;
      padding: 1.5rem 2rem !important;
      flex-wrap: wrap;
    }
    .alert-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .alert-icon {
      font-size: 2rem;
      color: var(--accent);
    }
    .payment-alert-banner h4 {
      margin: 0;
      font-size: 1.05rem;
      color: #ffffff;
    }
    .payment-alert-banner p {
      margin: 0.15rem 0 0 0;
      font-size: 0.85rem;
      color: var(--text-secondary);
    }
    .integrations-section {
      padding: 2.25rem !important;
    }
    .section-title {
      margin-bottom: 2rem;
    }
    .section-title h3 {
      font-size: 1.35rem;
      margin-bottom: 0.25rem;
      color: var(--text-primary);
    }
    .section-title p {
      font-size: 0.85rem;
      color: var(--text-secondary);
      margin: 0;
    }
    .table-container {
      overflow-x: auto;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }
    .portal-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }
    .portal-table th, .portal-table td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }
    .portal-table th {
      background: rgba(255, 255, 255, 0.01);
      font-family: var(--font-mono);
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      border-bottom: 2px solid rgba(255, 255, 255, 0.06);
    }
    .portal-table tr:hover td {
      background: rgba(255, 255, 255, 0.015);
    }
    .order-id code {
      font-family: var(--font-mono);
      color: var(--accent);
      font-weight: 700;
    }
    .pipe-cell {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .sys-badge {
      font-size: 0.75rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.07);
      padding: 0.2rem 0.5rem;
      border-radius: 6px;
      color: var(--text-secondary);
    }
    .cost-cell {
      font-family: var(--font-mono);
      font-weight: 700;
      color: #ffffff;
    }
    .engineer-cell {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.82rem;
    }
    .status-badge {
      display: inline-flex;
      font-family: var(--font-mono);
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .status-badge.completed { background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); color: #34d399; }
    .status-badge.in-progress { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.25); color: #60a5fa; }
    .status-badge.awaiting-admin-review { background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.25); color: #a78bfa; }
    .status-badge.awaiting-payment { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); color: #fbbf24; }
    .status-badge.awaiting-assignment { background: rgba(20, 184, 166, 0.1); border: 1px solid rgba(20, 184, 166, 0.25); color: #2dd4bf; }
    .status-badge.cost-proposed-by-admin { background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); color: #fbbf24; }
    .status-badge.declined { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); color: #f87171; }
    .btn-xs {
      padding: 0.25rem 0.5rem;
      font-size: 0.72rem;
      border-radius: 4px;
    }
    .btn-success {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }
    .btn-success:hover {
      background: rgba(16, 185, 129, 0.3);
      color: #fff;
    }
    .btn-danger {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.3);
      color: #fff;
    }
    .dropdown-item:hover {
      background: rgba(255,255,255,0.05) !important;
    }
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .empty-state i {
      font-size: 3rem;
      color: var(--text-muted);
      margin-bottom: 0.5rem;
    }
    .empty-state h4 {
      font-size: 1.15rem;
      color: var(--text-primary);
    }
    .empty-state p {
      font-size: 0.88rem;
      color: var(--text-secondary);
      max-width: 380px;
      line-height: 1.6;
      margin-bottom: 0.5rem;
    }
    /* Team settings layout */
    .team-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    @media(min-width:768px) {
      .team-grid { grid-template-columns: 1.25fr 1fr; }
    }
    .members-box {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: 380px;
      overflow-y: auto;
    }
    .member-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: rgba(255,255,255,0.015);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 10px;
    }
    .member-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(16,185,129,0.1);
      border: 1px solid rgba(16,185,129,0.2);
      color: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }
    .member-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      line-height: 1.3;
    }
    .member-info strong {
      font-size: 0.88rem;
      color: var(--text-primary);
    }
    .member-info span {
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .badge-role {
      font-size: 0.65rem;
      font-family: var(--font-mono);
      padding: 0.2rem 0.5rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 20px;
      color: var(--text-muted);
    }
    .no-members {
      padding: 2rem;
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .add-member-form {
      background: rgba(255,255,255,0.01);
      border: 1px solid rgba(255,255,255,0.04);
      padding: 1.5rem;
      border-radius: 12px;
    }
    .add-member-form h5 {
      font-size: 0.95rem;
      margin-bottom: 1.25rem;
      color: var(--text-primary);
    }
    .form-group {
      margin-bottom: 1rem;
      display: flex;
      flex-direction: column;
    }
    .form-group label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.4rem;
      color: var(--text-muted);
    }
    .form-control {
      background: rgba(2, 8, 5, 0.5);
      border: 1px solid rgba(16, 185, 129, 0.15);
      border-radius: 8px;
      padding: 0.75rem 0.85rem;
      color: #ffffff;
      font-size: 0.88rem;
    }
    .form-control:focus {
      border-color: var(--primary);
      outline: none;
    }
    .error-alert {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 0.75rem;
      border-radius: 8px;
      color: #f87171;
      font-size: 0.82rem;
      margin-bottom: 1rem;
    }
    .error-alert p { margin: 0; }
    /* Admin costing controls */
    .admin-cost-input-wrap {
      display: flex;
      align-items: center;
      background: rgba(2, 8, 5, 0.5);
      border: 1px solid rgba(16, 185, 129, 0.15);
      border-radius: 6px;
      padding: 0 0.5rem;
      width: 100px;
    }
    .currency-tag {
      color: var(--accent);
      font-weight: 700;
      font-size: 0.85rem;
    }
    .admin-cost-input {
      border: none !important;
      background: transparent !important;
      color: #ffffff !important;
      padding: 0.4rem 0.25rem !important;
      width: 100%;
      font-family: var(--font-mono);
      font-size: 0.88rem;
    }
    /* Engineer dashboard status classes */
    .availability-toggle-box {
      display: flex;
      align-items: center;
    }
    .status-indicator-badge {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      letter-spacing: 0.05em;
    }
    .status-indicator-badge.online {
      background: rgba(16, 185, 129, 0.12);
      border: 1.5px solid rgba(16, 185, 129, 0.3);
      color: #34d399;
    }
    .status-indicator-badge.busy {
      background: rgba(239, 68, 68, 0.12);
      border: 1.5px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
    }
    /* Modal / QR checkout elements */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-card {
      width: 100%;
      max-width: 440px;
      background: #04120a;
      border: 1px solid rgba(16, 185, 129, 0.25);
      border-radius: 12px;
      box-shadow: var(--shadow-lg), var(--shadow-glow-blue);
      overflow: hidden;
    }
    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid rgba(16, 185, 129, 0.15);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .modal-header h4 {
      margin: 0;
      font-size: 1.05rem;
      color: var(--text-primary);
    }
    .close-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.5rem;
      cursor: pointer;
    }
    .modal-body {
      padding: 1.5rem;
    }
    .ecommerce-prompt-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .ecommerce-prompt-header span {
      font-size: 0.75rem;
      font-family: var(--font-mono);
      text-transform: uppercase;
      color: var(--accent);
      background: rgba(16,185,129,0.1);
      padding: 0.25rem 0.65rem;
      border-radius: 20px;
      border: 1px solid rgba(16,185,129,0.2);
    }
    .ecommerce-prompt-header h2 {
      font-size: 2.25rem;
      color: #ffffff;
      margin: 0.75rem 0 0.25rem 0;
      font-family: var(--font-mono);
    }
    .sc-desc {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin: 0;
    }
    .qr-payment-section {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      background: rgba(255,255,255,0.015);
      border: 1px solid rgba(255,255,255,0.04);
      padding: 1rem;
      border-radius: 10px;
      margin-bottom: 1.5rem;
    }
    .qr-container {
      background: #ffffff;
      padding: 0.5rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .qr-info strong {
      font-size: 0.85rem;
      color: #ffffff;
      display: block;
      margin-bottom: 0.15rem;
    }
    .qr-info p {
      font-size: 0.75rem;
      color: var(--text-muted);
      margin: 0;
      line-height: 1.4;
    }
    .summary-sep {
      border: none;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      margin: 1.5rem 0;
    }
    .modal-card-form h5 {
      font-size: 0.88rem;
      color: #ffffff;
      margin-bottom: 1rem;
    }
    .spinner-text {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2.5px solid rgba(255, 255, 255, 0.2);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    /* Expandable details styling */
    .expanded-row-td {
      padding: 0 !important;
      background: rgba(255, 255, 255, 0.01) !important;
    }
    .expanded-detail-card {
      background: linear-gradient(135deg, rgba(8, 14, 26, 0.95) 0%, rgba(3, 7, 18, 0.98) 100%);
      border: 1px solid rgba(100, 160, 255, 0.12);
      border-top: none;
      border-radius: 0 0 12px 12px;
      padding: 1.75rem;
      margin-bottom: 1rem;
      box-shadow: inset 0 4px 24px rgba(0, 0, 0, 0.6), 0 8px 32px rgba(0, 0, 0, 0.3);
      animation: slideDown 0.25s var(--ease-spring);
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      margin-bottom: 1.75rem;
    }
    @media (min-width: 768px) {
      .detail-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    .detail-section {
      background: rgba(255, 255, 255, 0.015);
      border: 1px solid rgba(255, 255, 255, 0.04);
      padding: 1.25rem;
      border-radius: 10px;
    }
    .detail-sec-title {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #fff;
      margin-top: 0;
      margin-bottom: 1rem;
      font-family: var(--font-display);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding-bottom: 0.5rem;
    }
    .detail-item {
      font-size: 0.82rem;
      color: var(--text-secondary);
      margin-bottom: 0.6rem;
      line-height: 1.4;
    }
    .detail-item strong {
      color: #fff;
      display: inline-block;
      min-width: 130px;
    }
    .detail-credentials-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
    @media (min-width: 768px) {
      .detail-credentials-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    .cred-box {
      background: rgba(255, 255, 255, 0.015);
      border: 1px solid rgba(255, 255, 255, 0.04);
      padding: 1.25rem;
      border-radius: 10px;
    }
    .cred-title {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--accent);
      margin-top: 0;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      padding-bottom: 0.5rem;
    }
    .cred-table {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .cred-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.5rem 0.75rem;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255, 255, 255, 0.03);
      border-radius: 6px;
    }
    .cred-label {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-secondary);
      font-weight: bold;
    }
    .cred-value-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .cred-value {
      font-family: var(--font-mono);
      font-size: 0.78rem;
      color: #fff;
    }
    .cred-value.masked {
      color: var(--text-muted);
      letter-spacing: 0.1em;
    }
    .cred-actions {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .btn-cred-action {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 0.85rem;
      padding: 0.25rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    }
    .btn-cred-action:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.08);
    }
    .no-creds-text {
      font-size: 0.8rem;
      color: var(--text-muted);
      font-style: italic;
      margin: 0;
    }
    .chevron-cell {
      width: 40px;
      text-align: center;
    }
    .chevron-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
    }
    tr.expandable-row:hover .chevron-btn {
      color: #fff;
    }
    /* ΓöÇΓöÇ Light Theme Overrides ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
    :host-context([data-theme="light"]) .welcome-banner {
      background: linear-gradient(135deg, rgba(0,113,227,0.06) 0%, rgba(0,180,216,0.03) 100%);
      border-color: rgba(0,113,227,0.12);
    }
    :host-context([data-theme="light"]) .welcome-banner h2 {
      background: linear-gradient(135deg, #1D1D1F, #515154);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    :host-context([data-theme="light"]) .form-control {
      background: #ffffff;
      border-color: rgba(0,0,0,0.12);
      color: #1D1D1F;
    }
    :host-context([data-theme="light"]) .form-control:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(0,113,227,0.1);
    }
    :host-context([data-theme="light"]) .modal-card {
      background: #ffffff;
      border-color: rgba(0,0,0,0.12);
    }
    :host-context([data-theme="light"]) .modal-header {
      border-bottom-color: rgba(0,0,0,0.08);
    }
    :host-context([data-theme="light"]) .ecommerce-prompt-header h2 {
      color: #1D1D1F;
    }
    :host-context([data-theme="light"]) .expanded-detail-card {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-color: rgba(0,0,0,0.08);
      box-shadow: inset 0 1px 4px rgba(0,0,0,0.04);
    }
    :host-context([data-theme="light"]) .detail-sec-title {
      color: #1D1D1F;
      border-bottom-color: rgba(0,0,0,0.08);
    }
    :host-context([data-theme="light"]) .detail-item strong {
      color: #1D1D1F;
    }
    :host-context([data-theme="light"]) .cred-row {
      background: rgba(0,0,0,0.02);
      border-color: rgba(0,0,0,0.06);
    }
    :host-context([data-theme="light"]) .cred-value { color: #1D1D1F; }
    :host-context([data-theme="light"]) .portal-table th {
      background: rgba(0,0,0,0.02);
      border-bottom-color: rgba(0,0,0,0.08);
    }
    :host-context([data-theme="light"]) .portal-table td {
      border-bottom-color: rgba(0,0,0,0.06);
    }
    :host-context([data-theme="light"]) .portal-table tr:hover td {
      background: rgba(0,0,0,0.02);
    }
    :host-context([data-theme="light"]) .cost-cell {
      color: #1D1D1F;
    }
    :host-context([data-theme="light"]) .table-container {
      border-color: rgba(0,0,0,0.08);
    }
    :host-context([data-theme="light"]) .admin-cost-input-wrap {
      background: #ffffff;
      border-color: rgba(0,0,0,0.12);
    }
    :host-context([data-theme="light"]) .admin-cost-input {
      color: #1D1D1F !important;
    }
    :host-context([data-theme="light"]) .payment-alert-banner {
      background: rgba(217,119,6,0.06) !important;
      border-color: rgba(217,119,6,0.15) !important;
    }
    :host-context([data-theme="light"]) .payment-alert-banner h4 {
      color: #1D1D1F;
    }
    :host-context([data-theme="light"]) .qr-payment-section {
      background: rgba(0,0,0,0.02);
      border-color: rgba(0,0,0,0.06);
    }
    :host-context([data-theme="light"]) .qr-info strong { color: #1D1D1F; }
    :host-context([data-theme="light"]) .member-card {
      background: rgba(0,0,0,0.02);
      border-color: rgba(0,0,0,0.06);
    }
    :host-context([data-theme="light"]) .add-member-form {
      background: rgba(0,0,0,0.015);
      border-color: rgba(0,0,0,0.06);
    }
    :host-context([data-theme="light"]) .notif-panel {
      border-color: rgba(0,0,0,0.08);
    }
    :host-context([data-theme="light"]) tr.expandable-row:hover .chevron-btn {
      color: #1D1D1F;
    }
    /* ΓöÇΓöÇ Pipeline Progress Bar ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
    .pipeline-progress-section { margin-top: 0; }
    .pipeline-progress-card {
      display: flex; flex-direction: column; gap: 0.4rem;
      padding: 1rem 1.25rem;
      background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.05);
      border-radius: 10px;
    }
    :host-context([data-theme="light"]) .pipeline-progress-card {
      background: rgba(0,0,0,0.015); border-color: rgba(0,0,0,0.06);
    }
    .pp-header { display: flex; justify-content: space-between; align-items: center; }
    .pp-name { font-size: 0.84rem; font-weight: 600; color: var(--text-primary); }
    .pp-pct { font-size: 0.72rem; font-family: var(--font-mono); color: var(--accent); font-weight: 700; }
    .pp-bar-track {
      width: 100%; height: 6px; background: rgba(255,255,255,0.06); border-radius: 999px; overflow: hidden;
    }
    :host-context([data-theme="light"]) .pp-bar-track { background: rgba(0,0,0,0.06); }
    .pp-bar-fill {
      height: 100%; border-radius: 999px; transition: width 0.8s var(--ease-spring);
      background: linear-gradient(90deg, var(--primary), var(--accent));
    }
    .pp-stages { display: flex; justify-content: space-between; margin-top: 0.15rem; }
    .pp-stage {
      font-size: 0.58rem; font-family: var(--font-mono); text-transform: uppercase;
      letter-spacing: 0.04em; color: var(--text-muted);
    }
    .pp-stage.active { color: var(--accent); font-weight: 700; }
    .pp-stage.done { color: var(--text-secondary); }
    /* ΓöÇΓöÇ Service Health Cards ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
    .health-cards-row {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;
    }
    @media (max-width: 767px) { .health-cards-row { grid-template-columns: 1fr; } }
    .health-mini-card {
      display: flex; align-items: center; gap: 0.85rem;
      padding: 1rem 1.25rem; border-radius: 12px;
      background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.05);
    }
    :host-context([data-theme="light"]) .health-mini-card {
      background: #ffffff; border-color: rgba(0,0,0,0.06);
    }
    .hmc-icon {
      width: 38px; height: 38px; border-radius: 10px; display: flex;
      align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;
    }
    .hmc-info { display: flex; flex-direction: column; line-height: 1.3; }
    .hmc-val { font-size: 1.1rem; font-weight: 800; color: var(--text-primary); }
    .hmc-lbl { font-size: 0.68rem; font-family: var(--font-mono); text-transform: uppercase;
      letter-spacing: 0.04em; color: var(--text-muted); }
    /* ΓöÇΓöÇ Donut Chart ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
    .donut-section { display: flex; align-items: center; gap: 2rem; flex-wrap: wrap; }
    .donut-chart-wrap { position: relative; width: 140px; height: 140px; flex-shrink: 0; }
    .donut-center {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      text-align: center;
    }
    .donut-center-val { font-size: 1.6rem; font-weight: 800; color: var(--text-primary); display: block; }
    .donut-center-lbl { font-size: 0.62rem; font-family: var(--font-mono); text-transform: uppercase;
      color: var(--text-muted); letter-spacing: 0.05em; }
    .donut-legend { display: flex; flex-direction: column; gap: 0.5rem; }
    .donut-legend-item { display: flex; align-items: center; gap: 0.6rem; font-size: 0.8rem; color: var(--text-secondary); }
    .donut-legend-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
    .donut-legend-count { font-family: var(--font-mono); font-weight: 700; color: var(--text-primary); margin-left: auto; }
    /* ΓöÇΓöÇ Top Clients Table ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
    .top-clients-table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    .top-clients-table th, .top-clients-table td { padding: 0.65rem 1rem; text-align: left; }
    .top-clients-table th {
      font-size: 0.68rem; font-family: var(--font-mono); text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--text-muted); border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    :host-context([data-theme="light"]) .top-clients-table th { border-bottom-color: rgba(0,0,0,0.08); }
    .top-clients-table td { border-bottom: 1px solid rgba(255,255,255,0.03); }
    :host-context([data-theme="light"]) .top-clients-table td { border-bottom-color: rgba(0,0,0,0.04); }
    .tc-rank { font-family: var(--font-mono); font-weight: 700; color: var(--accent); }
    /* ΓöÇΓöÇ Engineer Workload Matrix ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
    .workload-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
    .workload-card {
      padding: 1rem; border-radius: 10px;
      background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.05);
      display: flex; flex-direction: column; gap: 0.6rem;
    }
    :host-context([data-theme="light"]) .workload-card {
      background: #ffffff; border-color: rgba(0,0,0,0.06);
    }
    .wl-name { font-size: 0.88rem; font-weight: 700; color: var(--text-primary); }
    .wl-stats { display: flex; gap: 1rem; font-size: 0.72rem; font-family: var(--font-mono); color: var(--text-muted); }
    .wl-bar-track { width: 100%; height: 4px; background: rgba(255,255,255,0.06); border-radius: 999px; }
    :host-context([data-theme="light"]) .wl-bar-track { background: rgba(0,0,0,0.06); }
    .wl-bar-fill { height: 100%; border-radius: 999px; transition: width 0.6s ease; }
    /* ΓöÇΓöÇ KPI Card ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
    .kpi-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; }
    .kpi-card {
      padding: 1.25rem; border-radius: 12px;
      background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.05);
      display: flex; flex-direction: column; gap: 0.3rem;
    }
    :host-context([data-theme="light"]) .kpi-card { background: #ffffff; border-color: rgba(0,0,0,0.06); }
    .kpi-label { font-size: 0.68rem; font-family: var(--font-mono); text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--text-muted); }
    .kpi-value { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }
    .kpi-delta { font-size: 0.72rem; font-family: var(--font-mono); }
    .kpi-delta.positive { color: #34d399; }
    .kpi-delta.negative { color: #f87171; }
    .kpi-delta.neutral { color: var(--text-muted); }
    /* ΓöÇΓöÇ Alert Panel ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
    .smart-alert {
      display: flex; align-items: flex-start; gap: 0.75rem;
      padding: 0.85rem 1rem; border-radius: 8px; font-size: 0.82rem;
      margin-bottom: 0.5rem;
    }
    .smart-alert.warning { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15); color: #fbbf24; }
    .smart-alert.info { background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.15); color: #60a5fa; }
    .smart-alert.danger { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.15); color: #f87171; }
    .smart-alert i { font-size: 1rem; flex-shrink: 0; margin-top: 0.1rem; }
    /* ΓöÇΓöÇ Kanban Board ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
    .kanban-board {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem;
      overflow-x: auto;
    }
    @media (max-width: 1023px) { .kanban-board { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 639px) { .kanban-board { grid-template-columns: 1fr; } }
    .kanban-col {
      background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.04);
      border-radius: 10px; padding: 0.75rem; min-height: 120px;
    }
    :host-context([data-theme="light"]) .kanban-col {
      background: rgba(0,0,0,0.015); border-color: rgba(0,0,0,0.06);
    }
    .kanban-col-header {
      font-size: 0.68rem; font-family: var(--font-mono); text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.65rem;
      display: flex; justify-content: space-between; align-items: center;
    }
    .kanban-count {
      background: rgba(255,255,255,0.06); padding: 0.1rem 0.4rem; border-radius: 999px;
      font-size: 0.6rem; font-weight: 700; color: var(--text-secondary);
    }
    :host-context([data-theme="light"]) .kanban-count { background: rgba(0,0,0,0.06); }
    .kanban-card {
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
      border-radius: 8px; padding: 0.65rem; margin-bottom: 0.5rem;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .kanban-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    :host-context([data-theme="light"]) .kanban-card {
      background: #ffffff; border-color: rgba(0,0,0,0.06);
    }
    :host-context([data-theme="light"]) .kanban-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .kc-title { font-size: 0.78rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem; }
    .kc-meta { font-size: 0.65rem; font-family: var(--font-mono); color: var(--text-muted); }
    /* ΓöÇΓöÇ Focus Card ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
    .focus-card {
      padding: 1.5rem; border-radius: 14px;
      background: linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(139,92,246,0.04) 100%);
      border: 1px solid rgba(59,130,246,0.15);
      display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap;
    }
    :host-context([data-theme="light"]) .focus-card {
      background: linear-gradient(135deg, rgba(0,113,227,0.04) 0%, rgba(124,58,237,0.03) 100%);
      border-color: rgba(0,113,227,0.12);
    }
    .focus-icon {
      width: 48px; height: 48px; border-radius: 12px;
      background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.3rem; color: #60a5fa; flex-shrink: 0;
    }
    .focus-info { flex: 1; min-width: 180px; }
    .focus-label { font-size: 0.68rem; font-family: var(--font-mono); text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.15rem; }
    .focus-title { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.1rem; }
    .focus-sub { font-size: 0.78rem; color: var(--text-secondary); }
    /* ΓöÇΓöÇ Performance Summary ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
    .perf-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    @media (max-width: 639px) { .perf-row { grid-template-columns: 1fr; } }
    .perf-card {
      text-align: center; padding: 1.25rem; border-radius: 12px;
      background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.05);
    }
    :host-context([data-theme="light"]) .perf-card { background: #ffffff; border-color: rgba(0,0,0,0.06); }
    .perf-val { font-size: 1.8rem; font-weight: 800; color: var(--text-primary); }
    .perf-lbl { font-size: 0.68rem; font-family: var(--font-mono); text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--text-muted); margin-top: 0.2rem; }
    /* ΓöÇΓöÇ Health Stat (admin) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
    .health-stat {
      display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.35rem;
      padding: 1rem; border-radius: 10px;
      background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.04);
    }
    :host-context([data-theme="light"]) .health-stat { background: #ffffff; border-color: rgba(0,0,0,0.06); }
    .hs-icon { font-size: 1.3rem; }
    .hs-val { font-size: 1.6rem; font-weight: 800; color: var(--text-primary); }
    .hs-lbl { font-size: 0.62rem; font-family: var(--font-mono); text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--text-muted); }
    /* ΓöÇΓöÇ Activity Feed Item ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
    .activity-feed-item {
      display: flex; align-items: center; gap: 1rem;
      padding: 0.85rem 0; border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    :host-context([data-theme="light"]) .activity-feed-item { border-bottom-color: rgba(0,0,0,0.04); }
    .act-icon {
      width: 34px; height: 34px; border-radius: 10px; display: flex;
      align-items: center; justify-content: center; font-size: 0.9rem; flex-shrink: 0;
    }
    .act-body { flex: 1; min-width: 0; }
    .act-title { font-size: 0.84rem; font-weight: 600; color: var(--text-primary); }
    .act-meta { font-size: 0.72rem; color: var(--text-muted); margin-top: 0.1rem; }
    /* ΓöÇΓöÇ Revenue Bar ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
    .rev-bar {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.25rem;
    }
    .rev-bar-val { font-size: 0.6rem; font-family: var(--font-mono); color: var(--text-muted); font-weight: 700; }
    .rev-bar-inner { width: 100%; border-radius: 3px 3px 0 0; transition: height 0.8s var(--ease-spring); }
    .rev-bar-lbl { font-size: 0.6rem; font-family: var(--font-mono); color: var(--text-muted); }
    /* ΓöÇΓöÇ Quick Action Buttons ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
    .quick-action-btn {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.5rem 1rem; border-radius: 10px; font-size: 0.82rem; font-weight: 600;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
      color: var(--text-primary); cursor: pointer; transition: all 0.2s;
    }
    .quick-action-btn:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); }
    :host-context([data-theme="light"]) .quick-action-btn {
      background: rgba(0,0,0,0.02); border-color: rgba(0,0,0,0.08);
    }
    :host-context([data-theme="light"]) .quick-action-btn:hover {
      background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.14);
    }
    .qa-icon { display: flex; align-items: center; }
    /* ΓöÇΓöÇ Notif Panel ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */
    .notif-item {
      display: flex; align-items: center; gap: 0.65rem;
      padding: 0.65rem 0.85rem; border-radius: 8px;
      background: rgba(255,255,255,0.015); border: 1px solid rgba(255,255,255,0.03);
    }
    :host-context([data-theme="light"]) .notif-item {
      background: rgba(0,0,0,0.015); border-color: rgba(0,0,0,0.04);
    }
    .notif-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .notif-text { flex: 1; font-size: 0.82rem; color: var(--text-primary); }
    .notif-time { font-size: 0.68rem; font-family: var(--font-mono); color: var(--text-muted); flex-shrink: 0; }
    @keyframes badge-pulse {
      0%,100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `]
})
export class PortalHomeComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private orderService = inject(OrderService);
  // Session timer
  private sessionStartTime = Date.now();
  sessionTimerDisplay = signal('00:00:00');
  private timerInterval: any;
  // UI state
  notifPanelOpen = true;
  clientActiveTab = signal<string>('dashboard');
  engineerActiveTab = signal<string>('board');
  adminActiveTab = signal<string>('dashboard');
  // Client Catalog
  catalogItems = [
    { type: 'HR Employee Onboarding Sync', description: 'Synchronize payroll and directory credentials automatically when a team member joins HiBob, Workday, or BambooHR.', price: 299, source: 'BambooHR', dest: 'HiBob', icon: 'bi-people-fill' },
    { type: 'Stripe Ledger Reconciler', description: 'Automatically load Stripe payments into NetSuite or QuickBooks journal entries with transaction isolation.', price: 799, source: 'Stripe', dest: 'NetSuite', icon: 'bi-wallet2' },
    { type: 'CRM Lead to Slack Router', description: 'Instantly alert sales representatives of closed-won Salesforce opportunities or fresh HubSpot leads.', price: 349, source: 'Salesforce', dest: 'Slack', icon: 'bi-chat-dots-fill' },
    { type: 'Custom Legacy Database Pipeline', description: 'Transform mainframes or local SQL tables into observable pipelines securely.', price: 2499, source: 'SQL Database', dest: 'Custom API', icon: 'bi-database-fill-gear' }
  ];
  // Client Request Form inputs
  reqName = '';
  reqSource = '';
  reqDest = '';
  reqInstructions = '';
  reqBidPrice = 0;
  reqSuccessMsg = '';
  // Client Billing
  invoices = [
    { id: 'INV-2026-004', date: '2026-06-01', amount: 499, status: 'Paid' },
    { id: 'INV-2026-003', date: '2026-05-01', amount: 499, status: 'Paid' },
    { id: 'INV-2026-002', date: '2026-04-01', amount: 499, status: 'Paid' }
  ];
  // Client Support
  ticketsList = signal([
    { id: 'TKT-104', subject: 'BambooHR webhook latency is elevated', status: 'Open', priority: 'High', date: '2026-06-11' },
    { id: 'TKT-098', subject: 'Billing address update request', status: 'Resolved', priority: 'Low', date: '2026-06-05' }
  ]);
  newTicketSubject = '';
  newTicketPriority = 'Low';
  // Engineer state
  engineerNotes: { [orderId: string]: string } = {};
  newCommentText: { [orderId: string]: string } = {};
  communicationLogs: { [orderId: string]: { sender: string, text: string, time: string }[] } = {};
  timeLogs: { [orderId: string]: { hours: number, description: string, date: string }[] } = {};
  logHours = 1;
  logDesc = '';
  // Engineer KB Articles
  kbArticles = [
    { title: 'OAuth Authenticator Setup for Workday', category: 'Auth', excerpt: 'Configuring API Client Credentials and Scope Delegations in Workday Console.', code: '// Set Authorization headers\r\nheaders.set("Authorization", "Bearer " + token);' },
    { title: 'ADP Webhook Validation Handshake', category: 'Webhooks', excerpt: 'Solving the signature verification signature challenge for ADP sync requests.', code: '// Calculate HMAC-SHA256 signature\r\nconst crypto = require("crypto");\r\nconst hash = crypto.createHmac("sha256", secret).update(body).digest("hex");' },
    { title: 'Solving NetSuite Rate-Limiting Errors', category: 'Performance', excerpt: 'Implementing request buffering queues with exponential backoff on NetSuite integrations.', code: 'if (statusCode === 429) {\r\n  await sleep(Math.pow(2, retryCount) * 1000);\r\n}' }
  ];
  kbSearch = signal('');
  // Admin FAQ Content Management
  faqArticles = signal([
    { question: 'How do I submit a new request?', answer: 'Go to the client dashboard, click on the "Request Form" tab, enter details, specify credentials and click Submit.' },
    { question: 'Is my credential data secure?', answer: 'Yes, all credentials are encrypted via AES-256 and stored inside restricted system key vaults.' },
    { question: 'What systems are natively supported?', answer: 'We natively support BambooHR, HiBob, Personio, Workday, Salesforce, HubSpot, NetSuite, ADP, Slack and custom databases.' }
  ]);
  newFaqQuestion = '';
  newFaqAnswer = '';
  // Client My Automations logs & toggles
  activeLogsOrder = signal<Order | null>(null);
  automationLogs = signal<string[]>([]);
  pausedAutomations = signal<Record<string, boolean>>({});
  // Engineer Portal sub-selectors
  selectedEngProjectId = signal<string>('');
  selectedCommProjectId = signal<string>('');
  selectedTimeProjectId = signal<string>('');
  // Admin Portal System Health
  webhooksList = signal([
    { id: 'WH-803', url: 'https://api.orbitops.ai/webhooks/bamboohr', status: 'Active', latency: '42ms', callsThisMonth: 1250 },
    { id: 'WH-512', url: 'https://api.orbitops.ai/webhooks/stripe', status: 'Active', latency: '18ms', callsThisMonth: 8430 },
    { id: 'WH-201', url: 'https://api.orbitops.ai/webhooks/salesforce', status: 'Active', latency: '65ms', callsThisMonth: 412 }
  ]);
  errorLogsList = signal([
    { ts: new Date().toISOString(), system: 'Stripe Ledger Reconciler', message: 'Rate limit hit (429) on NetSuite endpoint. Retrying in 4s.', level: 'Warning' },
    { ts: new Date(Date.now() - 3600000).toISOString(), system: 'BambooHR Onboarding Sync', message: 'Webhook signature validation failure from IP 184.22.9.112.', level: 'Error' }
  ]);
  // Admin Portal Billing Admin
  allSubscriptions = signal([
    { client: 'Acme Corp', email: 'billing@acme.com', plan: 'Enterprise Automation Plan', price: 499, status: 'Active', renewalDate: '2026-07-01' },
    { client: 'Starlight Retailers', email: 'operations@starlight.io', plan: 'Starter Automation Plan', price: 149, status: 'Active', renewalDate: '2026-06-28' }
  ]);
  generatedInvoices = signal([
    { id: 'INV-2026-004', client: 'Acme Corp', date: '2026-06-01', amount: 499, status: 'Paid' },
    { id: 'INV-2026-003', client: 'Acme Corp', date: '2026-05-01', amount: 499, status: 'Paid' },
    { id: 'INV-2026-002', client: 'Acme Corp', date: '2026-04-01', amount: 499, status: 'Paid' }
  ]);
  newInvoiceClient = '';
  newInvoiceAmount = 299;
  newInvoicePlanName = 'Professional Automation Plan';
  // Admin Portal User Management
  userSearchQuery = signal('');
  // Admin Global Settings
  smtpHost = 'smtp.sendgrid.net';
  smtpPort = 587;
  maintenanceMode = false;
  orders = signal<Order[]>([]);
  pendingOrders = signal<Order[]>([]);
  teamMembers = signal<any[]>([]);
  allOrders = signal<Order[]>([]);
  allUsers = signal<any[]>([]);
  allEngineersList = signal<any[]>([]);
  adminSelectedEngineers: { [orderId: string]: string } = {};
  adminSelectedStatuses: { [orderId: string]: string } = {};
  activeHandoverPrompt = signal<{ order: Order, oldEng: string, newEng: string, newStatus: string } | null>(null);
  handoverProgressSummary = '';
  draggedOrderId: string = '';
  expandedOrderId = signal<string | null>(null);
  maskedStates = signal<Record<string, boolean>>({});
  toggleExpandOrder(orderId: string, event?: Event) {
    if (event) {
      const target = event.target as HTMLElement;
      if (target.closest('.btn') || target.closest('input') || target.closest('select') || target.closest('.negotiation-controls') || target.closest('.counter-input-box')) {
        return;
      }
    }
    if (this.expandedOrderId() === orderId) {
      this.expandedOrderId.set(null);
    } else {
      this.expandedOrderId.set(orderId);
    }
  }
  getCredentialsList(credentials: any): { key: string, value: string }[] {
    if (!credentials) return [];
    return Object.entries(credentials).map(([key, value]) => ({ key, value: String(value) }));
  }
  isCredentialMasked(orderId: string, type: 'source' | 'destination', key: string): boolean {
    const stateKey = `${orderId}_${type}_${key}`;
    const states = this.maskedStates();
    return states[stateKey] !== false; // Default to true (masked)
  }
  toggleCredentialMask(orderId: string, type: 'source' | 'destination', key: string) {
    const stateKey = `${orderId}_${type}_${key}`;
    this.maskedStates.update(s => ({
      ...s,
      [stateKey]: !this.isCredentialMasked(orderId, type, key)
    }));
  }
  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
  }
  getRequestedScenariosCount(): number {
    return this.orders().length;
  }
  getActiveDeploymentsCount(): number {
    const activeStatuses = ['Connection Setup', 'Mapping Schema', 'Testing Sync', 'In Progress'];
    return this.orders().filter(o => activeStatuses.includes(o.status)).length;
  }
  getCompletedMappingsCount(): number {
    return this.orders().filter(o => o.status === 'Completed').length;
  }
  getTotalInvestmentValue(): string {
    return this.getTotalInvestment();
  }
  getAdminClientsCount(): number {
    return this.allUsers().filter(u => u.role === 'Client' || u.role === 'SubClient').length;
  }
  getAdminEngineersCount(): number {
    return this.allUsers().filter(u => u.role === 'Engineer').length;
  }
  getAdminActivePipelinesCount(): number {
    const activeStatuses = ['Connection Setup', 'Mapping Schema', 'Testing Sync', 'In Progress'];
    return this.allOrders().filter(o => activeStatuses.includes(o.status)).length;
  }
  getAdminTotalVolume(): string {
    const sum = this.allOrders()
      .filter(o => o.status !== 'Awaiting Admin Review' && o.status !== 'Cost Proposed by Admin' && o.status !== 'Declined')
      .reduce((total, order) => total + order.price, 0);
    return `$${sum.toLocaleString()}`;
  }
  loadAllOrdersForAdmin() {
    this.orderService.getAllOrdersForAdmin().subscribe({
      next: (data) => {
        this.allOrders.set(data);
        data.forEach(order => {
          if (this.adminSelectedEngineers[order.id] === undefined) {
            this.adminSelectedEngineers[order.id] = order.engineerName || '';
          }
          if (this.adminSelectedStatuses[order.id] === undefined) {
            this.adminSelectedStatuses[order.id] = order.status;
          }
          const storedNotes = localStorage.getItem(`eng_notes_${order.id}`);
          if (storedNotes) {
            this.engineerNotes[order.id] = storedNotes;
          }
        });
      }
    });
  }
  loadAllUsers() {
    this.authService.getAllUsers().subscribe({
      next: (data) => this.allUsers.set(data)
    });
  }
  loadEngineersForAssign() {
    this.authService.getEngineers().subscribe({
      next: (data) => this.allEngineersList.set(data)
    });
  }
  onAssignEngineer(orderId: string, event: Event) {
    const select = event.target as HTMLSelectElement;
    const engineerName = select.value;
    this.orderService.assignEngineer(orderId, engineerName).subscribe({
      next: () => {
        this.loadAllOrdersForAdmin();
        this.loadPendingWorkflows();
      }
    });
  }
  onUpdateStatus(orderId: string, event: Event | string) {
    const status = typeof event === 'string' ? event : (event.target as HTMLSelectElement).value;
    this.orderService.updateOrderStatus(orderId, status).subscribe({
      next: () => {
        const role = this.authService.currentUser()?.role;
        if (role === 'Admin') {
          this.loadAllOrdersForAdmin();
          this.loadPendingWorkflows();
        } else {
          this.loadOrders();
        }
      }
    });
  }
  submitAdminOverride(order: Order, event: Event) {
    event.stopPropagation();
    const oldEng = order.engineerName || '';
    const newEng = this.adminSelectedEngineers[order.id] || '';
    const newStatus = this.adminSelectedStatuses[order.id] || '';
    // Check if engineer is changed on an ongoing project
    if (oldEng && newEng && oldEng !== newEng) {
      this.handoverProgressSummary = '';
      this.activeHandoverPrompt.set({ order, oldEng, newEng, newStatus });
    } else {
      this.executeAdminUpdates(order.id, newEng, newStatus);
    }
  }
  closeHandoverPrompt() {
    this.activeHandoverPrompt.set(null);
    this.handoverProgressSummary = '';
  }
  submitHandoverReassignment() {
    const promptData = this.activeHandoverPrompt();
    if (!promptData) return;
    this.executeAdminUpdates(
      promptData.order.id,
      promptData.newEng,
      promptData.newStatus,
      this.handoverProgressSummary
    );
    this.closeHandoverPrompt();
  }
  executeAdminUpdates(orderId: string, newEng: string, newStatus: string, progressSummary?: string) {
    this.orderService.assignEngineer(orderId, newEng, progressSummary).subscribe({
      next: () => {
        this.orderService.updateOrderStatus(orderId, newStatus).subscribe({
          next: () => {
            this.loadAllOrdersForAdmin();
            this.loadPendingWorkflows();
          }
        });
      }
    });
  }
  downloadPurchaseSlip(order: Order) {
    const slipText = `==================================================
              ORBITOPS PURCHASE SLIP
==================================================
Order ID:         ${order.id}
Date Paid:        ${new Date(order.createdAt).toLocaleString()}
Client Name:      ${order.clientName || 'N/A'}
Client Company:   ${order.clientCompany || 'N/A'}
Client Email:     ${order.clientEmail || 'N/A'}
Integration Details:
--------------------------------------------------
Workflow Scenario: ${order.workflowType}
Source System:     ${order.sourceSystem}
Dest. System:      ${order.destinationSystem}
Assigned Architect:${order.engineerName || 'Unassigned'}
Est. Delivery:    ${order.estimatedCompletionTime || '3 days'}
--------------------------------------------------
Amount Paid:      $${order.price} USD
Payment Status:   PAID / SECURED
==================================================
Thank you for choosing OrbitOps Automation!
`;
    const blob = new Blob([slipText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `receipt_${order.id}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  // Cost approvals inputs mapping (orderId -> price)
  costApprovals: { [key: string]: number } = {};
  timeApprovals: { [key: string]: string } = {};
  // Active checkout overlays
  activeCheckoutOrder = signal<Order | null>(null);
  submittingPay = signal(false);
  checkoutError = signal('');
  // Team settings inputs
  newMemberName = '';
  newMemberEmail = '';
  newMemberPassword = '';
  submittingTeam = signal(false);
  teamError = signal('');
  teamSuccess = signal(false);
  // Admin Engineer registration inputs
  newEngineerName = '';
  newEngineerEmail = '';
  newEngineerPassword = '';
  submittingEngineer = signal(false);
  engineerError = signal('');
  engineerSuccess = signal(false);
  // Engineer state
  engAvailable = signal(true);
  ngOnInit() {
    const role = this.authService.currentUser()?.role;
    if (role === 'Admin') {
      this.loadPendingWorkflows();
      this.loadAllOrdersForAdmin();
      this.loadAllUsers();
      this.loadEngineersForAssign();
    } else {
      this.loadOrders();
      if (role === 'Client') {
        this.loadTeamMembers();
      }
      if (role === 'Engineer') {
        // Sync engineer availability status from currentUser
        const cur = this.authService.currentUser();
        if (cur) {
          this.engAvailable.set(cur.isAvailable ?? true);
        }
      }
    }
    // Start session timer
    this.sessionStartTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
      const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
      const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
      const s = (elapsed % 60).toString().padStart(2, '0');
      this.sessionTimerDisplay.set(`${h}:${m}:${s}`);
    }, 1000);
  }
  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
  loadOrders() {
    this.orderService.getOrders().subscribe({
      next: (data) => {
        this.orders.set(data);
        data.forEach(o => {
          const storedNotes = localStorage.getItem(`eng_notes_${o.id}`);
          if (storedNotes) {
            this.engineerNotes[o.id] = storedNotes;
          }
        });
      }
    });
  }
  loadPendingWorkflows() {
    this.orderService.getPendingWorkflows().subscribe({
      next: (data) => {
        this.pendingOrders.set(data);
        // Pre-populate admin input fields with client bids
        data.forEach(order => {
          if (order.price > 0 && !this.costApprovals[order.id]) {
            this.costApprovals[order.id] = order.price;
          }
        });
      }
    });
  }
  loadTeamMembers() {
    this.authService.getTeamMembers().subscribe({
      next: (data) => this.teamMembers.set(data)
    });
  }
  getTotalInvestment(): string {
    const sum = this.orders()
      .filter(o => o.status !== 'Awaiting Admin Review')
      .reduce((total, order) => total + order.price, 0);
    return `\$${sum.toLocaleString()}`;
  }
  getPaymentRequiredOrders(): Order[] {
    return this.orders().filter(o => o.status === 'Awaiting Payment');
  }
  getKeysCount(dict: any): number {
    return dict ? Object.keys(dict).length : 0;
  }
  // ── Client helpers ─────────────────────────────────────────────
  getNotifications(): any[] {
    const notifs: any[] = [];
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric' });
    this.orders().forEach(o => {
      if (o.status === 'Awaiting Payment') {
        notifs.push({ text: `Payment required for "${o.workflowType}"`, color: '#fbbf24', time: fmt(o.createdAt), label: 'Pay Now', action: () => this.openCheckout(o) });
      }
      if (o.status === 'Cost Proposed by Admin') {
        notifs.push({ text: `Admin proposed $${o.price} for "${o.workflowType}" — review needed`, color: '#a78bfa', time: fmt(o.createdAt), label: null, action: null });
      }
    });
    return notifs;
  }
  getActivityTimeline(): any[] {
    const statusMeta: Record<string, { icon: string, color: string, bg: string, label: string }> = {
      'Awaiting Admin Review': { icon: 'bi-hourglass',         color: '#a78bfa', bg: 'rgba(139,92,246,0.1)',  label: 'Awaiting Review' },
      'Cost Proposed by Admin':{ icon: 'bi-cash-coin',        color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  label: 'Cost Proposed' },
      'Awaiting Payment':      { icon: 'bi-credit-card',      color: '#fbbf24', bg: 'rgba(245,158,11,0.1)',  label: 'Awaiting Payment' },
      'Awaiting Assignment':   { icon: 'bi-person-plus',      color: '#2dd4bf', bg: 'rgba(20,184,166,0.1)',  label: 'Awaiting Assignment' },
      'Connection Setup':      { icon: 'bi-plug-fill',        color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',  label: 'Connection Setup' },
      'Mapping Schema':        { icon: 'bi-map-fill',         color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',  label: 'Mapping Schema' },
      'Testing Sync':          { icon: 'bi-bug-fill',         color: '#f9a8d4', bg: 'rgba(236,72,153,0.1)', label: 'Testing Sync' },
      'In Progress':           { icon: 'bi-arrow-repeat',     color: '#60a5fa', bg: 'rgba(59,130,246,0.1)',  label: 'In Progress' },
      'Completed':             { icon: 'bi-check-circle-fill',color: '#34d399', bg: 'rgba(16,185,129,0.1)', label: 'Completed' },
      'Declined':              { icon: 'bi-x-circle-fill',    color: '#f87171', bg: 'rgba(239,68,68,0.1)',  label: 'Declined' },
      'On Hold':               { icon: 'bi-pause-circle-fill',color: '#94a3b8', bg: 'rgba(148,163,184,0.1)',label: 'On Hold' },
    };
    return this.orders().map(o => {
      const meta = statusMeta[o.status] || { icon: 'bi-circle', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', label: o.status };
      return {
        title: `${o.workflowType}: ${o.sourceSystem} → ${o.destinationSystem}`,
        workflow: meta.label,
        time: new Date(o.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }),
        icon: meta.icon,
        color: meta.color,
        bg: meta.bg,
        status: o.status,
      };
    });
  }
  // ── Admin helpers ───────────────────────────────────────────────
  getEngineersOnlineCount(): number {
    return this.allUsers().filter(u => u.role === 'Engineer' && u.isAvailable).length;
  }
  getPipelineSuccessRate(): number {
    const total = this.allOrders().length;
    if (!total) return 0;
    const completed = this.allOrders().filter(o => o.status === 'Completed').length;
    return Math.round((completed / total) * 100);
  }
  getRevenueChartData(): any[] {
    const now = new Date();
    const months: { label: string, val: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: d.toLocaleString('default', { month: 'short' }), val: 0 });
    }
    this.allOrders().forEach(o => {
      if (!o.price || o.status === 'Awaiting Admin Review' || o.status === 'Declined') return;
      const d = new Date(o.createdAt);
      const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      if (diffMonths >= 0 && diffMonths < 6) {
        months[5 - diffMonths].val += o.price;
      }
    });
    const maxVal = Math.max(...months.map(m => m.val), 1);
    const colors = [
      { c: 'rgba(59,130,246,0.6)',  l: 'rgba(96,165,250,0.9)' },
      { c: 'rgba(139,92,246,0.6)', l: 'rgba(167,139,250,0.9)' },
      { c: 'rgba(16,185,129,0.6)', l: 'rgba(52,211,153,0.9)'  },
      { c: 'rgba(245,158,11,0.6)', l: 'rgba(251,191,36,0.9)'  },
      { c: 'rgba(59,130,246,0.6)',  l: 'rgba(96,165,250,0.9)' },
      { c: 'rgba(139,92,246,0.6)', l: 'rgba(167,139,250,0.9)' },
    ];
    return months.map((m, i) => ({
      label: m.label,
      val: m.val > 0 ? `${(m.val / 1000).toFixed(1)}k` : '',
      pct: Math.round((m.val / maxVal) * 85),
      color: colors[i].c,
      colorLight: colors[i].l,
    }));
  }
  getAdminActivityFeed(): any[] {
    const feed: any[] = [];
    const ordersToProcess = [...this.allOrders()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    ordersToProcess.forEach(o => {
      let icon = 'bi-circle', color = '#94a3b8', bg = 'rgba(148,163,184,0.1)', title = '', meta = '';
      if (o.status === 'Completed') {
        icon = 'bi-check-circle-fill'; color = '#34d399'; bg = 'rgba(16,185,129,0.1)';
        title = `Pipeline completed: ${o.workflowType}`;
      } else if (o.status === 'Awaiting Payment') {
        icon = 'bi-credit-card-fill'; color = '#fbbf24'; bg = 'rgba(245,158,11,0.1)';
        title = `Payment awaiting: ${o.clientName || 'Client'} — $${o.price}`;
      } else if (o.status === 'Cost Proposed by Admin') {
        icon = 'bi-cash-coin'; color = '#a78bfa'; bg = 'rgba(139,92,246,0.1)';
        title = `Cost proposal sent to ${o.clientName || 'Client'}: $${o.price}`;
      } else if (o.status === 'In Progress') {
        icon = 'bi-arrow-repeat'; color = '#60a5fa'; bg = 'rgba(59,130,246,0.1)';
        title = `Pipeline active: ${o.workflowType}`;
      } else if (o.status === 'Awaiting Admin Review') {
        icon = 'bi-hourglass'; color = '#a78bfa'; bg = 'rgba(139,92,246,0.1)';
        title = `New request from ${o.clientName || 'Client'}: ${o.workflowType}`;
      } else {
        title = `${o.workflowType}: ${o.status}`;
      }
      meta = `${o.sourceSystem} → ${o.destinationSystem} · ${new Date(o.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric' })}`;
      feed.push({ icon, color, bg, title, meta });
    });
    return feed;
  }
  scrollToSection(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  // ── Engineer helpers ─────────────────────────────────────────────
  getEngCompletedCount(): number {
    return this.orders().filter(o => o.status === 'Completed').length;
  }
  getEngActiveCount(): number {
    return this.orders().filter(o => ['Connection Setup','Mapping Schema','Testing Sync','In Progress'].includes(o.status)).length;
  }
  // Returns 'done', 'active', or '' for step progress tracker
  getStepClass(currentStatus: string, stepName: string): string {
    const steps = ['Connection Setup', 'Mapping Schema', 'Testing Sync', 'In Progress', 'Completed'];
    const currentIdx = steps.indexOf(currentStatus);
    const stepIdx = steps.indexOf(stepName);
    if (currentIdx === -1 || stepIdx === -1) return '';
    if (stepIdx < currentIdx) return 'done';
    if (stepIdx === currentIdx) return 'active';
    return '';
  }
  getPipelinePercent(status: string): number {
    const map: Record<string, number> = {
      'Awaiting Admin Review': 0, 'Cost Proposed by Admin': 0,
      'Awaiting Payment': 0, 'Awaiting Assignment': 5,
      'Connection Setup': 20, 'Mapping Schema': 45,
      'Testing Sync': 65, 'In Progress': 80, 'Completed': 100,
      'On Hold': 35, 'Declined': 0,
    };
    return map[status] ?? 0;
  }
  // Admin Costing approval
  onApproveCosting(orderId: string) {
    const price = this.costApprovals[orderId];
    const estTime = this.timeApprovals[orderId] || '3 days';
    if (!price || price <= 0 || !estTime) return;
    this.orderService.approveCosting(orderId, price, estTime).subscribe({
      next: () => {
        this.costApprovals[orderId] = 0;
        delete this.timeApprovals[orderId];
        this.loadPendingWorkflows();
      }
    });
  }
  // Client QR Checkout processes
  openCheckout(order: Order) {
    this.activeCheckoutOrder.set(order);
    this.checkoutError.set('');
    this.submittingPay.set(false);
  }
  closeCheckout() {
    this.activeCheckoutOrder.set(null);
  }
  onProcessCheckout() {
    const order = this.activeCheckoutOrder();
    if (!order) return;
    this.submittingPay.set(true);
    this.checkoutError.set('');
    // Simulate elements payment gateway check delay
    setTimeout(() => {
      this.orderService.confirmPayment(order.id).subscribe({
        next: () => {
          this.submittingPay.set(false);
          this.closeCheckout();
          this.loadOrders();
        },
        error: (err) => {
          this.submittingPay.set(false);
          this.checkoutError.set(err.error?.message || 'Payment gateway returned processing error.');
        }
      });
    }, 2000);
  }
  // Client team additions
  onAddTeamMember() {
    const name = this.newMemberName.trim();
    const email = this.newMemberEmail.trim();
    const password = this.newMemberPassword.trim();
    if (!name || !email || !password) {
      this.teamError.set('All fields are required.');
      return;
    }
    this.submittingTeam.set(true);
    this.teamError.set('');
    this.teamSuccess.set(false);
    this.authService.addSubPerson(name, email, password).subscribe({
      next: () => {
        this.submittingTeam.set(false);
        this.newMemberName = '';
        this.newMemberEmail = '';
        this.newMemberPassword = '';
        this.teamSuccess.set(true);
        this.loadTeamMembers();
      },
      error: (err) => {
        this.submittingTeam.set(false);
        this.teamError.set(err.error?.message || 'Failed to add team member.');
      }
    });
  }
  // Engineer toggles status via dropdown
  statusDropdownOpen = false;
  activeCounterOrderId = '';
  counterBidPrice = 0;
  toggleDropdown() {
    this.statusDropdownOpen = !this.statusDropdownOpen;
  }
  selectEngineerAvailability(isAvailable: boolean) {
    this.statusDropdownOpen = false;
    const status = isAvailable ? 'Available' : 'Busy';
    this.authService.updateEngineerStatus(status, isAvailable).subscribe({
      next: () => {
        this.engAvailable.set(isAvailable);
        const cur = this.authService.currentUser();
        if (cur) {
          cur.isAvailable = isAvailable;
          cur.currentStatus = status;
          localStorage.setItem('orbitops_auth_user', JSON.stringify(cur));
          this.authService.currentUser.set({ ...cur });
        }
      }
    });
  }
  onClientApprove(orderId: string) {
    this.orderService.clientApproveCosting(orderId).subscribe({
      next: () => {
        this.loadOrders();
      }
    });
  }
  onClientDecline(orderId: string) {
    this.orderService.clientDeclineCosting(orderId).subscribe({
      next: () => {
        this.loadOrders();
      }
    });
  }
  toggleCounterInput(orderId: string) {
    if (this.activeCounterOrderId === orderId) {
      this.activeCounterOrderId = '';
    } else {
      this.activeCounterOrderId = orderId;
      const order = this.orders().find(o => o.id === orderId);
      this.counterBidPrice = order ? order.price : 0;
    }
  }
  onClientSubmitCounter(orderId: string) {
    if (this.counterBidPrice <= 0) return;
    this.orderService.clientCounterCosting(orderId, this.counterBidPrice).subscribe({
      next: () => {
        this.activeCounterOrderId = '';
        this.counterBidPrice = 0;
        this.loadOrders();
      }
    });
  }
  onRegisterEngineer() {
    const name = this.newEngineerName.trim();
    const email = this.newEngineerEmail.trim();
    const password = this.newEngineerPassword.trim();
    if (!name || !email || !password) {
      this.engineerError.set('All fields are required.');
      return;
    }
    this.submittingEngineer.set(true);
    this.engineerError.set('');
    this.engineerSuccess.set(false);
    this.authService.addEngineer(name, email, password).subscribe({
      next: () => {
        this.submittingEngineer.set(false);
        this.newEngineerName = '';
        this.newEngineerEmail = '';
        this.newEngineerPassword = '';
        this.engineerSuccess.set(true);
      },
      error: (err) => {
        this.submittingEngineer.set(false);
        this.engineerError.set(err.error?.message || 'Failed to register engineer.');
      }
    });
  }
  // ΓöÇΓöÇ CLIENT: Pipeline progress bars ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  getActivePipelines(): { name: string, pct: number, stage: string, stageIdx: number }[] {
    const stageMap: Record<string, { stage: string, idx: number, pct: number }> = {
      'Connection Setup': { stage: 'Setup', idx: 0, pct: 20 },
      'Mapping Schema':   { stage: 'Mapping', idx: 1, pct: 45 },
      'Testing Sync':     { stage: 'Testing', idx: 2, pct: 65 },
      'In Progress':      { stage: 'Active', idx: 3, pct: 80 },
      'Completed':        { stage: 'Done', idx: 4, pct: 100 },
    };
    return this.orders()
      .filter(o => stageMap[o.status])
      .map(o => {
        const s = stageMap[o.status];
        return { name: o.workflowType, pct: s.pct, stage: s.stage, stageIdx: s.idx };
      });
  }
  // ΓöÇΓöÇ ENGINEER: Today's focus ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  getTodaysFocus(): Order | null {
    const activeStatuses = ['Connection Setup', 'Mapping Schema', 'Testing Sync', 'In Progress', 'Awaiting Assignment'];
    const active = this.orders().filter(o => activeStatuses.includes(o.status));
    if (active.length === 0) return null;
    // Prioritize oldest active project
    return active.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
  }
  // ΓöÇΓöÇ ENGINEER: Kanban columns ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  getKanbanColumns(): { title: string, orders: Order[] }[] {
    const cols = [
      { title: 'Setup', statuses: ['Connection Setup', 'Awaiting Assignment'] },
      { title: 'Mapping', statuses: ['Mapping Schema'] },
      { title: 'Testing', statuses: ['Testing Sync'] },
      { title: 'Active', statuses: ['In Progress'] },
      { title: 'Done', statuses: ['Completed'] },
    ];
    return cols.map(c => ({
      title: c.title,
      orders: this.orders().filter(o => c.statuses.includes(o.status))
    }));
  }
  // ΓöÇΓöÇ ENGINEER: Performance metrics ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  getEngCompletionRate(): number {
    const total = this.orders().length;
    if (!total) return 0;
    const done = this.orders().filter(o => o.status === 'Completed').length;
    return Math.round((done / total) * 100);
  }
  getEngAvgHandlingDays(): number {
    const completed = this.orders().filter(o => o.status === 'Completed');
    if (completed.length === 0) return 0;
    // Estimate: based on created date vs now (simplified)
    const totalDays = completed.reduce((sum, o) => {
      const created = new Date(o.createdAt).getTime();
      const diffDays = Math.max(1, Math.round((Date.now() - created) / (1000 * 60 * 60 * 24)));
      return sum + diffDays;
    }, 0);
    return Math.round(totalDays / completed.length);
  }
  getEngActiveStreak(): string {
    const activeCount = this.orders().filter(o =>
      ['Connection Setup', 'Mapping Schema', 'Testing Sync', 'In Progress'].includes(o.status)
    ).length;
    if (activeCount === 0) return 'ΓÇö';
    return `${activeCount} active`;
  }
  // ΓöÇΓöÇ ADMIN: Donut chart segments ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  getDonutSegments(): { label: string, count: number, color: string, dash: string, offset: string }[] {
    const total = this.allOrders().length;
    if (!total) return [];
    const groups: { label: string, statuses: string[], color: string }[] = [
      { label: 'Completed', statuses: ['Completed'], color: '#34d399' },
      { label: 'In Progress', statuses: ['Connection Setup','Mapping Schema','Testing Sync','In Progress'], color: '#60a5fa' },
      { label: 'Awaiting Review', statuses: ['Awaiting Admin Review','Cost Proposed by Admin'], color: '#a78bfa' },
      { label: 'Awaiting Payment', statuses: ['Awaiting Payment','Awaiting Assignment'], color: '#fbbf24' },
      { label: 'Declined / Hold', statuses: ['Declined','On Hold'], color: '#f87171' },
    ];
    const circumference = 2 * Math.PI * 15.91; // ~100
    let offset = 25; // Start at 12 o'clock position
    return groups.map(g => {
      const count = this.allOrders().filter(o => g.statuses.includes(o.status)).length;
      const pct = count / total;
      const dashLen = pct * circumference;
      const seg = {
        label: g.label, count, color: g.color,
        dash: `${dashLen} ${circumference - dashLen}`,
        offset: `${offset}`
      };
      offset -= dashLen; // SVG stroke-dashoffset decreases clockwise
      return seg;
    }).filter(s => s.count > 0);
  }
  // ΓöÇΓöÇ ADMIN: Top clients ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  getTopClients(): { name: string, company: string, orderCount: number, totalValue: number }[] {
    const clientMap: Record<string, { name: string, company: string, orderCount: number, totalValue: number }> = {};
    this.allOrders().forEach(o => {
      const key = o.clientName || o.clientEmail || 'Unknown';
      if (!clientMap[key]) {
        clientMap[key] = { name: o.clientName || 'Unknown', company: o.clientCompany || '', orderCount: 0, totalValue: 0 };
      }
      clientMap[key].orderCount++;
      if (o.status !== 'Declined') clientMap[key].totalValue += o.price;
    });
    return Object.values(clientMap)
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
  }
  // ΓöÇΓöÇ ADMIN: Smart alerts ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  getSmartAlerts(): { type: string, icon: string, message: string }[] {
    const alerts: { type: string, icon: string, message: string }[] = [];
    // Check for overdue reviews (> 48h)
    const overdueReviews = this.pendingOrders().filter(o => {
      const hours = (Date.now() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60);
      return hours > 48;
    });
    if (overdueReviews.length > 0) {
      alerts.push({ type: 'warning', icon: 'bi-clock-history', message: `${overdueReviews.length} order(s) have been awaiting review for over 48 hours.` });
    }
    // Check for overloaded engineers
    const engineers = this.allEngineersList();
    engineers.forEach(eng => {
      const assignedCount = this.allOrders().filter(o =>
        o.engineerName === eng.name && !['Completed','Declined'].includes(o.status)
      ).length;
      if (assignedCount >= 5) {
        alerts.push({ type: 'danger', icon: 'bi-person-exclamation', message: `${eng.name} has ${assignedCount} active projects ΓÇö consider redistributing.` });
      }
    });
    // Payment pending
    const paymentPending = this.allOrders().filter(o => o.status === 'Awaiting Payment').length;
    if (paymentPending > 0) {
      alerts.push({ type: 'info', icon: 'bi-credit-card', message: `${paymentPending} pipeline(s) awaiting client payment confirmation.` });
    }
    return alerts;
  }
  // ΓöÇΓöÇ ADMIN: Engineer workload matrix ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  getEngineerWorkload(): { name: string, online: boolean, active: number, completed: number, loadPct: number }[] {
    const engineers = this.allEngineersList();
    return engineers.map(eng => {
      const engOrders = this.allOrders().filter(o => o.engineerName === eng.name);
      const active = engOrders.filter(o => !['Completed','Declined','On Hold'].includes(o.status)).length;
      const completed = engOrders.filter(o => o.status === 'Completed').length;
      const maxCapacity = 8;
      return {
        name: eng.name,
        online: eng.isAvailable ?? false,
        active,
        completed,
        loadPct: Math.min(100, Math.round((active / maxCapacity) * 100))
      };
    });
  }
  // ΓöÇΓöÇ ADMIN: Monthly KPIs ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
  getNewOrdersThisMonth(): number {
    const now = new Date();
    return this.allOrders().filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }
  getNewOrdersDelta(): number {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthCount = this.allOrders().filter(o => {
      const d = new Date(o.createdAt);
      return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear();
    }).length;
    return this.getNewOrdersThisMonth() - lastMonthCount;
  }
  getRevenueThisMonth(): string {
    const now = new Date();
    const sum = this.allOrders()
      .filter(o => {
        const d = new Date(o.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          && !['Awaiting Admin Review','Declined'].includes(o.status);
      })
      .reduce((total, o) => total + o.price, 0);
    return `$${sum.toLocaleString()}`;
  }
  getRevenueDelta(): number {
    const now = new Date();
    const thisMonthRev = this.allOrders()
      .filter(o => {
        const d = new Date(o.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          && !['Awaiting Admin Review','Declined'].includes(o.status);
      })
      .reduce((t, o) => t + o.price, 0);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthRev = this.allOrders()
      .filter(o => {
        const d = new Date(o.createdAt);
        return d.getMonth() === lastMonth.getMonth() && d.getFullYear() === lastMonth.getFullYear()
          && !['Awaiting Admin Review','Declined'].includes(o.status);
      })
      .reduce((t, o) => t + o.price, 0);
    if (lastMonthRev === 0) return thisMonthRev > 0 ? 100 : 0;
    return Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100);
  }
  getAvgResolutionDays(): number {
    const completed = this.allOrders().filter(o => o.status === 'Completed');
    if (completed.length === 0) return 0;
    const totalDays = completed.reduce((sum, o) => {
      const diffDays = Math.max(1, Math.round((Date.now() - new Date(o.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
      return sum + diffDays;
    }, 0);
    return Math.round(totalDays / completed.length);
  }
  // ΓöÇΓöÇ CLIENT TAB: Request Form submit
  submitClientRequest() {
    if (!this.reqSource || !this.reqDest) return;
    const orderData: Partial<Order> = {
      workflowType: this.reqName || 'Custom Data Integration',
      sourceSystem: this.reqSource,
      destinationSystem: this.reqDest,
      instructions: this.reqInstructions,
      price: this.reqBidPrice || 0,
      sourceCredentials: {},
      destinationCredentials: {}
    };
    this.orderService.createOrder(orderData).subscribe({
      next: (newOrder) => {
        this.reqSuccessMsg = 'Your automation request has been submitted and is awaiting review.';
        this.loadOrders();
        // Reset form
        this.reqName = '';
        this.reqSource = '';
        this.reqDest = '';
        this.reqInstructions = '';
        this.reqBidPrice = 0;
        setTimeout(() => {
          this.reqSuccessMsg = '';
          this.clientActiveTab.set('automations');
        }, 2000);
      }
    });
  }
  // ΓöÇΓöÇ CLIENT TAB: My Automations pause/resume toggle
  toggleAutomation(order: Order) {
    const isPaused = this.pausedAutomations()[order.id];
    const newStatus = isPaused ? 'In Progress' : 'On Hold';
    this.pausedAutomations.update(p => ({ ...p, [order.id]: !isPaused }));
    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: () => {
        this.loadOrders();
      }
    });
  }
  // ΓöÇΓöÇ CLIENT TAB: My Automations logs viewer
  showAutomationLogs(order: Order) {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const mockLogs = [
      `[${timestamp}] Bootstrapping connector engine for ${order.workflowType}...`,
      `[${timestamp}] Attempting connection check to ${order.sourceSystem}...`,
      `[${timestamp}] Connection established successfully. Fetching schema definitions.`,
      `[${timestamp}] Transform step: mapped payload fields to ${order.destinationSystem} formatting.`,
      `[${timestamp}] Sync operation completed: processed 28 records. Zero errors.`
    ];
    this.automationLogs.set(mockLogs);
    this.activeLogsOrder.set(order);
  }
  closeAutomationLogs() {
    this.activeLogsOrder.set(null);
    this.automationLogs.set([]);
  }
  // ΓöÇΓöÇ CLIENT TAB: Support tickets
  addTicket() {
    if (!this.newTicketSubject.trim()) return;
    const current = this.ticketsList();
    const nextId = `TKT-${Math.floor(100 + Math.random() * 900)}`;
    this.ticketsList.set([
      { id: nextId, subject: this.newTicketSubject, status: 'Open', priority: this.newTicketPriority, date: new Date().toISOString().split('T')[0] },
      ...current
    ]);
    this.newTicketSubject = '';
    this.newTicketPriority = 'Low';
  }
  // ΓöÇΓöÇ ENGINEER TAB: KB search filter
  getKbArticlesFiltered() {
    const q = this.kbSearch().trim().toLowerCase();
    if (!q) return this.kbArticles;
    return this.kbArticles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q)
    );
  }
  // ΓöÇΓöÇ ENGINEER TAB: Client Communication comments
  getCommentsForOrder(orderId: string): { sender: string, text: string, time: string }[] {
    if (!this.communicationLogs[orderId]) {
      this.communicationLogs[orderId] = [
        { sender: 'Client', text: 'Hi team, let me know if you need additional sandbox credentials for testing.', time: '2026-06-11 14:20' },
        { sender: 'Engineer', text: 'Thanks! We are currently mapping the main ledger schemas and will reach out if needed.', time: '2026-06-11 16:45' }
      ];
    }
    return this.communicationLogs[orderId];
  }
  addComment(orderId: string) {
    const text = (this.newCommentText[orderId] || '').trim();
    if (!text) return;
    const userRole = this.authService.currentUser()?.role || 'User';
    const sender = userRole === 'Engineer' ? 'Engineer' : 'Client';
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const currentLogs = this.getCommentsForOrder(orderId);
    currentLogs.push({ sender, text, time: timestamp });
    this.communicationLogs[orderId] = currentLogs;
    this.newCommentText[orderId] = '';
  }
  // ΓöÇΓöÇ ENGINEER TAB: Time Logging
  getTimeLogsForOrder(orderId: string): { hours: number, description: string, date: string }[] {
    if (!this.timeLogs[orderId]) {
      this.timeLogs[orderId] = [
        { hours: 2, description: 'Initial OAuth connection configuration', date: '2026-06-10' },
        { hours: 3, description: 'Field schema mapping and validation testing', date: '2026-06-11' }
      ];
    }
    return this.timeLogs[orderId];
  }
  logTime(orderId: string) {
    if (!orderId || this.logHours <= 0 || !this.logDesc.trim()) return;
    const currentLogs = this.getTimeLogsForOrder(orderId);
    currentLogs.unshift({
      hours: this.logHours,
      description: this.logDesc.trim(),
      date: new Date().toISOString().split('T')[0]
    });
    this.timeLogs[orderId] = currentLogs;
    this.logDesc = '';
    this.logHours = 1;
  }
  // ΓöÇΓöÇ ADMIN TAB: User management toggles
  getFilteredUsers() {
    const q = this.userSearchQuery().trim().toLowerCase();
    if (!q) return this.allUsers();
    return this.allUsers().filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  }
  toggleUserDisable(user: any) {
    user.isDisabled = !user.isDisabled;
    this.authService.updateUserStatus(user.id, !user.isDisabled).subscribe();
  }
  // ΓöÇΓöÇ ADMIN TAB: Content Management FAQs
  addFaq() {
    if (!this.newFaqQuestion.trim() || !this.newFaqAnswer.trim()) return;
    const current = this.faqArticles();
    this.faqArticles.set([
      ...current,
      { question: this.newFaqQuestion.trim(), answer: this.newFaqAnswer.trim() }
    ]);
    this.newFaqQuestion = '';
    this.newFaqAnswer = '';
  }
  deleteFaq(faq: any) {
    this.faqArticles.set(this.faqArticles().filter(f => f !== faq));
  }
  // ΓöÇΓöÇ ADMIN TAB: Billing generation
  adminGenerateInvoice() {
    if (!this.newInvoiceClient.trim() || this.newInvoiceAmount <= 0) return;
    const newInv = {
      id: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      client: this.newInvoiceClient.trim(),
      date: new Date().toISOString().split('T')[0],
      amount: this.newInvoiceAmount,
      status: 'Unpaid'
    };
    this.generatedInvoices.set([newInv, ...this.generatedInvoices()]);
    this.newInvoiceClient = '';
    this.newInvoiceAmount = 299;
  }
  onTaskDrop(engName: string) {
    if (!this.draggedOrderId) return;
    const order = this.allOrders().find(o => o.id === this.draggedOrderId);
    if (!order) return;
    const oldEng = order.engineerName || '';
    if (oldEng && oldEng !== engName) {
      this.handoverProgressSummary = '';
      this.activeHandoverPrompt.set({ order, oldEng, newEng: engName, newStatus: order.status });
    } else {
      this.executeAdminUpdates(order.id, engName, order.status);
    }
    this.draggedOrderId = '';
  }
  getSelectedEngProject(): Order | undefined {
    return this.orders().find(o => o.id === this.selectedEngProjectId());
  }
  getProjectProgressPercent(status: string): number {
    return this.getPipelinePercent(status);
  }
  saveNotes(orderId: string) {
    const notes = this.engineerNotes[orderId] || '';
    localStorage.setItem(`eng_notes_${orderId}`, notes);
    alert('Workspace notes saved successfully.');
  }
  onUpdateUserRole(userId: string, role: string) {
    this.authService.updateUserRole(userId, role).subscribe({
      next: () => this.loadAllUsers()
    });
  }
  saveGlobalSettings() {
    alert('Global settings saved successfully.');
  }
}