import { Component, OnInit, inject, signal } from '@angular/core';
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
          <button *ngIf="user.role === 'Client'" routerLink="/portal/new-order" class="btn btn-primary">
            <i class="bi bi-plus-circle"></i> Create New Integration
          </button>
        </div>

        <!-- Metrics -->
        <div class="metrics-grid">
          <div class="metric-card card">
            <div class="metric-icon primary-glow"><i class="bi bi-diagram-3-fill"></i></div>
            <div class="metric-info">
              <span class="m-val">{{ orders().length }}</span>
              <span class="m-lbl">Active Integrations</span>
            </div>
          </div>
          <div class="metric-card card">
            <div class="metric-icon accent-glow"><i class="bi bi-activity"></i></div>
            <div class="metric-info">
              <span class="m-val">100%</span>
              <span class="m-lbl">Pipeline Health</span>
            </div>
          </div>
          <div class="metric-card card">
            <div class="metric-icon violet-glow"><i class="bi bi-shield-fill-check"></i></div>
            <div class="metric-info">
              <span class="m-val">SOC2</span>
              <span class="m-lbl">Audit Level</span>
            </div>
          </div>
          <div class="metric-card card">
            <div class="metric-icon gold-glow"><i class="bi bi-currency-dollar"></i></div>
            <div class="metric-info">
              <span class="m-val">{{ getTotalInvestment() }}</span>
              <span class="m-lbl">Total Investment</span>
            </div>
          </div>
        </div>

        <!-- Action Needed Alert (Awaiting Payments) -->
        <div *ngIf="getPaymentRequiredOrders().length > 0" class="payment-alert-banner card">
          <div class="alert-content">
            <i class="bi bi-credit-card-2-back-fill alert-icon"></i>
            <div>
              <h4>Payment Approvals Pending</h4>
              <p>The Admin has approved costing for {{ getPaymentRequiredOrders().length }} workflow request(s). Scan the QR code or use credit card to activate.</p>
            </div>
          </div>
          <div class="alert-actions">
            <button class="btn btn-primary btn-sm" (click)="openCheckout(getPaymentRequiredOrders()[0])">
              Pay Order Costing &rarr;
            </button>
          </div>
        </div>

        <!-- Pipelines List -->
        <div class="integrations-section card">
          <div class="section-title">
            <h3>Your Automation Pipelines</h3>
            <p>Real-time deployment and costing approvals of your custom scenarios.</p>
          </div>

          <div class="table-container" *ngIf="orders().length > 0; else emptyState">
            <table class="portal-table">
              <thead>
                <tr>
                  <th></th>
                  <th>ID</th>
                  <th>Scenario / Workflow</th>
                  <th>Data Pipeline</th>
                  <th>Cost (USD)</th>
                  <th>Est. Duration</th>
                  <th>Assigned Engineer</th>
                  <th>Status</th>
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
                    <td><strong>{{ order.workflowType }}</strong></td>
                    <td>
                      <div class="pipe-cell">
                        <span class="sys-badge">{{ order.sourceSystem }}</span>
                        <i class="bi bi-arrow-right-short"></i>
                        <span class="sys-badge">{{ order.destinationSystem }}</span>
                      </div>
                    </td>
                    <td class="cost-cell">
                      <span *ngIf="order.status === 'Awaiting Admin Review' && order.price === 0" style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">Pending Review</span>
                      <span *ngIf="order.status === 'Awaiting Admin Review' && order.price > 0" style="color: var(--accent); font-weight: bold;">\${{ order.price }} <span style="font-size:0.75rem; font-weight:normal; color:var(--text-muted); display:block;">(Your Bid)</span></span>
                      <span *ngIf="order.status !== 'Awaiting Admin Review'">\${{ order.price }}</span>
                    </td>
                    <td class="cost-cell" style="font-size: 0.82rem; color: var(--text-secondary);">
                      {{ order.estimatedCompletionTime || 'Pending' }}
                    </td>
                    <td>
                      <div class="engineer-cell">
                        <i class="bi bi-person-fill-gear"></i>
                        <span>{{ order.engineerName || 'Unassigned' }}</span>
                      </div>
                    </td>
                    <td>
                      <span class="status-badge" [ngClass]="order.status.toLowerCase().replace(' ', '-')">
                        {{ order.status }}
                      </span>
                    </td>
                    <td>
                      <button *ngIf="order.status === 'Awaiting Payment'" (click)="openCheckout(order); $event.stopPropagation();" class="btn btn-primary btn-sm">
                        Pay Costing
                      </button>

                      <div *ngIf="order.status === 'Cost Proposed by Admin'" class="negotiation-controls" style="display: flex; flex-direction: column; gap: 0.4rem;">
                        <div style="font-size: 0.72rem; color: #fbbf24; font-family: var(--font-mono); margin-bottom: 0.2rem;">
                          <i class="bi bi-info-circle"></i> Cost Proposed: <strong>\${{ order.price }}</strong>
                        </div>
                        <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
                          <button (click)="onClientApprove(order.id); $event.stopPropagation();" class="btn btn-success btn-xs">
                            Approve
                          </button>
                          <button (click)="onClientDecline(order.id); $event.stopPropagation();" class="btn btn-danger btn-xs">
                            Decline
                          </button>
                          <button (click)="toggleCounterInput(order.id); $event.stopPropagation();" class="btn btn-secondary btn-xs">
                            New Bid
                          </button>
                        </div>
                        <div *ngIf="activeCounterOrderId === order.id" class="counter-input-box" style="display: flex; align-items: center; gap: 0.25rem; margin-top: 0.25rem;" (click)="$event.stopPropagation();">
                          <span style="font-size: 0.8rem; color: var(--text-muted); font-family: var(--font-mono); font-weight: bold;">$</span>
                          <input type="number" [(ngModel)]="counterBidPrice" placeholder="Counter Price" class="form-control" style="width: 80px; padding: 0.25rem 0.5rem; font-size: 0.78rem; height: auto;" />
                          <button (click)="onClientSubmitCounter(order.id)" class="btn btn-primary btn-xs" style="padding: 0.25rem 0.5rem;" [disabled]="counterBidPrice <= 0">
                            Submit
                          </button>
                        </div>
                      </div>

                      <span *ngIf="order.status !== 'Awaiting Payment' && order.status !== 'Cost Proposed by Admin'" style="color: var(--text-muted); font-size: 0.8rem;">No Action</span>
                    </td>
                  </tr>
                  
                  <tr *ngIf="expandedOrderId() === order.id">
                    <td colspan="9" class="expanded-row-td">
                      <div class="expanded-detail-card">
                        <div class="detail-grid">
                          <div class="detail-section">
                            <h4 class="detail-sec-title"><i class="bi bi-person-badge"></i> Client Workspace Details</h4>
                            <div class="detail-item"><strong>Client Name:</strong> {{ order.clientName || user.name }}</div>
                            <div class="detail-item"><strong>Company:</strong> {{ order.clientCompany || user.company }}</div>
                            <div class="detail-item"><strong>Email Address:</strong> {{ order.clientEmail || user.email }}</div>
                            <div class="detail-item"><strong>Requested At:</strong> {{ order.createdAt | date:'medium' }}</div>
                          </div>
                          
                          <div class="detail-section">
                            <h4 class="detail-sec-title"><i class="bi bi-bezier2"></i> Integration Specification</h4>
                            <div class="detail-item"><strong>Scenario / Type:</strong> {{ order.workflowType }}</div>
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
                      </div>
                    </td>
                  </tr>
                </ng-container>
              </tbody>
            </table>
          </div>

          <ng-template #emptyState>
            <div class="empty-state">
              <i class="bi bi-bezier2"></i>
              <h4>No Integration Pipelines Detected</h4>
              <p>Start your first scenario by configuring systems and requesting an architect assignment.</p>
              <button routerLink="/portal/new-order" class="btn btn-secondary">Configure Pipeline</button>
            </div>
          </ng-template>
        </div>

        <!-- Client Sub-persons Team Settings Section -->
        <div *ngIf="user.role === 'Client'" class="team-section card" style="margin-top: 2.5rem;">
          <div class="section-title">
            <h3>Team Settings & Sub-Persons</h3>
            <p>Add up to 5 team members to access the secure portal and chat with architects under your account. ({{ teamMembers().length }}/5 added)</p>
          </div>

          <div class="team-grid">
            <!-- Team members list -->
            <div class="members-box">
              <div *ngFor="let member of teamMembers()" class="member-card">
                <div class="member-avatar"><i class="bi bi-person-workspace"></i></div>
                <div class="member-info">
                  <strong>{{ member.name }}</strong>
                  <span>{{ member.email }}</span>
                </div>
                <span class="badge-role">{{ member.role }}</span>
              </div>
              <div *ngIf="teamMembers().length === 0" class="no-members">No team members added. Complete the form to invite your staff.</div>
            </div>

            <!-- Add Team member form -->
            <div class="add-member-form" *ngIf="teamMembers().length < 5">
              <h5>Invite Team Member</h5>
              <div *ngIf="teamError()" class="error-alert"><p>{{ teamError() }}</p></div>
              <div *ngIf="teamSuccess()" class="success-alert" style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 0.75rem; border-radius: 8px; color: #34d399; margin-bottom: 1rem;"><p style="margin:0;">Team member added successfully.</p></div>

              <div class="form-group">
                <label>Full Name</label>
                <input type="text" [(ngModel)]="newMemberName" placeholder="John Doe" class="form-control" />
              </div>
              <div class="form-group">
                <label>Email Address</label>
                <input type="email" [(ngModel)]="newMemberEmail" placeholder="john@enterprise.com" class="form-control" />
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" [(ngModel)]="newMemberPassword" placeholder="••••••••" class="form-control" />
              </div>
              <button (click)="onAddTeamMember()" class="btn btn-secondary btn-block" [disabled]="submittingTeam()">
                Add Sub-User Account
              </button>
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

        <div class="integrations-section card">
          <div class="section-title">
            <h3>Awaiting Admin Review & Costing</h3>
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
                      </div>
                    </td>
                  </tr>
                </ng-container>
              </tbody>
            </table>
          </div>

          <ng-template #emptyAdminState>
            <div class="empty-state">
              <i class="bi bi-clipboard-check"></i>
              <h4>All Workflows Synchronized</h4>
              <p>No new integration scenarios require costing or feasibility reviews currently.</p>
            </div>
          </ng-template>
        </div>

        <!-- Admin Engineer Management Section -->
        <div class="team-section card" style="margin-top: 2.5rem; max-width: 600px; margin-left: auto; margin-right: auto;">
          <div class="section-title">
            <h3>Engineer Management</h3>
            <p>Create and register a secure portal account for a new OrbitOps Automation Architect / Engineer.</p>
          </div>

          <div class="add-member-form">
            <h5>Register New Engineer</h5>
            <div *ngIf="engineerError()" class="error-alert"><p>{{ engineerError() }}</p></div>
            <div *ngIf="engineerSuccess()" class="success-alert" style="background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 0.75rem; border-radius: 8px; color: #34d399; margin-bottom: 1rem;"><p style="margin:0;">Engineer registered successfully.</p></div>

            <div class="form-group">
              <label>Full Name</label>
              <input type="text" [(ngModel)]="newEngineerName" placeholder="Alex Chen" class="form-control" />
            </div>
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" [(ngModel)]="newEngineerEmail" placeholder="alex@orbitops.ai" class="form-control" />
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" [(ngModel)]="newEngineerPassword" placeholder="••••••••" class="form-control" />
            </div>
            <button (click)="onRegisterEngineer()" class="btn btn-secondary btn-block" [disabled]="submittingEngineer()">
              Register Engineer Account
            </button>
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
              <div *ngIf="statusDropdownOpen" class="status-dropdown-menu" style="position: absolute; right: 0; top: 110%; background: #080e1a; border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); z-index: 100; min-width: 120px; padding: 0.25rem 0;">
                <button (click)="selectEngineerAvailability(true)" class="dropdown-item" style="width: 100%; text-align: left; padding: 0.5rem 1rem; background: none; border: none; color: #ECFDF5; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: #34d399; display: inline-block;"></span>
                  Online
                </button>
                <button (click)="selectEngineerAvailability(false)" class="dropdown-item" style="width: 100%; text-align: left; padding: 0.5rem 1rem; background: none; border: none; color: #ECFDF5; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem;">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: #f87171; display: inline-block;"></span>
                  Offline
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="integrations-section card">
          <div class="section-title">
            <h3>Your Assigned Automation Projects</h3>
            <p>Active integration mappings, client instructions, and secure API credentials.</p>
          </div>

          <div class="table-container" *ngIf="orders().length > 0; else emptyEngState">
            <table class="portal-table">
              <thead>
                <tr>
                  <th></th>
                  <th>ID</th>
                  <th>Client Detail</th>
                  <th>Scenario</th>
                  <th>Handshake Route</th>
                  <th>Keys Count</th>
                  <th>Pipeline Status</th>
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
                      <span class="status-badge" [ngClass]="order.status.toLowerCase().replace(' ', '-')">
                        {{ order.status }}
                      </span>
                    </td>
                  </tr>
                  
                  <tr *ngIf="expandedOrderId() === order.id">
                    <td colspan="7" class="expanded-row-td">
                      <div class="expanded-detail-card">
                        <div class="detail-grid">
                          <div class="detail-section">
                            <h4 class="detail-sec-title"><i class="bi bi-person-badge"></i> Client Details</h4>
                            <div class="detail-item"><strong>Client Name:</strong> {{ order.clientName || 'N/A' }}</div>
                            <div class="detail-item"><strong>Company:</strong> {{ order.clientCompany || 'N/A' }}</div>
                            <div class="detail-item"><strong>Email Address:</strong> {{ order.clientEmail || 'N/A' }}</div>
                            <div class="detail-item"><strong>Assigned At:</strong> {{ order.createdAt | date:'medium' }}</div>
                          </div>
                          
                          <div class="detail-section">
                            <h4 class="detail-sec-title"><i class="bi bi-bezier2"></i> Workflow Specifications</h4>
                            <div class="detail-item"><strong>Scenario:</strong> {{ order.workflowType }}</div>
                            <div class="detail-item"><strong>Source System:</strong> {{ order.sourceSystem }}</div>
                            <div class="detail-item"><strong>Destination System:</strong> {{ order.destinationSystem }}</div>
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
                      </div>
                    </td>
                  </tr>
                </ng-container>
              </tbody>
            </table>
          </div>

          <ng-template #emptyEngState>
            <div class="empty-state">
              <i class="bi bi-journal-x"></i>
              <h4>No Active Projects Assigned</h4>
              <p>Ensure your status is set to ONLINE to receive client scenario connections.</p>
            </div>
          </ng-template>
        </div>
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
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }
    tr.expandable-row:hover .chevron-btn {
      color: #fff;
    }
  `]
})
export class PortalHomeComponent implements OnInit {
  authService = inject(AuthService);
  private orderService = inject(OrderService);

  orders = signal<Order[]>([]);
  pendingOrders = signal<Order[]>([]);
  teamMembers = signal<any[]>([]);

  expandedOrderId = signal<string | null>(null);
  maskedStates = signal<Record<string, boolean>>({});

  toggleExpandOrder(orderId: string, event?: Event) {
    if (event) {
      const target = event.target as HTMLElement;
      if (target.closest('.btn') || target.closest('input') || target.closest('.negotiation-controls') || target.closest('.counter-input-box')) {
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
  }

  loadOrders() {
    this.orderService.getOrders().subscribe({
      next: (data) => this.orders.set(data)
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
}
