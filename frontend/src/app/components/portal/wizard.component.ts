import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';

export interface Engineer {
  name: string;
  role: string;
  avatarClass: string;
  rating: number;
  projectsCount: number;
  skills: string[];
}

@Component({
  selector: 'app-order-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink],
  template: `
    <div class="wizard-page">
      <!-- Stepper Progress Bar -->
      <div class="stepper-progress card">
        <div class="step-nodes">
          <div class="step-node" [class.active]="currentStep() >= 1" [class.completed]="currentStep() > 1">
            <span class="node-num"><span *ngIf="currentStep() <= 1">1</span><i *ngIf="currentStep() > 1" class="bi bi-check"></i></span>
            <span class="node-lbl">Scenario Details</span>
          </div>
          <div class="step-line" [class.completed]="currentStep() > 1"></div>
          <div class="step-node" [class.active]="currentStep() >= 2" [class.completed]="currentStep() > 2">
            <span class="node-num"><span *ngIf="currentStep() <= 2">2</span><i *ngIf="currentStep() > 2" class="bi bi-check"></i></span>
            <span class="node-lbl">Connections</span>
          </div>
          <div class="step-line" [class.completed]="currentStep() > 2"></div>
          <div class="step-node" [class.active]="currentStep() >= 3" [class.completed]="currentStep() > 3">
            <span class="node-num"><span *ngIf="currentStep() <= 3">3</span><i *ngIf="currentStep() > 3" class="bi bi-check"></i></span>
            <span class="node-lbl">Architect Assign</span>
          </div>
          <div class="step-line" [class.completed]="currentStep() > 3"></div>
          <div class="step-node" [class.active]="currentStep() >= 4" [class.completed]="currentStep() > 4">
            <span class="node-num"><span *ngIf="currentStep() <= 4">4</span><i *ngIf="currentStep() > 4" class="bi bi-check"></i></span>
            <span class="node-lbl">Review Queue</span>
          </div>
        </div>
      </div>

      <!-- Main Step Container -->
      <div class="wizard-body card">
        
        <!-- STEP 1: Scenario Setup -->
        <div *ngIf="currentStep() === 1">
          <div class="step-header">
            <h3>Configure Scenario Path</h3>
            <p>Select the automation category and specify the source and destination node platforms.</p>
          </div>

          <form [formGroup]="step1Form" (ngSubmit)="nextStep1()">
            <div class="form-group">
              <label for="workflowType">Workflow Scenario Type</label>
              <select id="workflowType" formControlName="workflowType" class="form-select">
                <option value="">-- Choose Scenario Category --</option>
                <option *ngFor="let wf of workflowOptions" [value]="wf.type">
                  {{ wf.type }} - (Starts at \${{ wf.price }})
                </option>
              </select>
            </div>

            <div class="grid grid-cols-2" style="gap: 1.5rem;">
              <div class="form-group">
                <label for="sourceSystem">Source Node System</label>
                <input type="text" id="sourceSystem" formControlName="sourceSystem" class="form-control" placeholder="e.g. BambooHR, Stripe, Custom API" />
              </div>

              <div class="form-group">
                <label for="destinationSystem">Destination Node System</label>
                <input type="text" id="destinationSystem" formControlName="destinationSystem" class="form-control" placeholder="e.g. Workday, HubSpot, Database" />
              </div>
            </div>

            <div class="form-group" style="margin-top: 1rem;">
              <label for="customBid">Your Bid Price (USD)</label>
              <input type="number" id="customBid" formControlName="customBid" class="form-control" placeholder="Enter bid price or leave empty for base price" />
            </div>

            <div *ngIf="pricingDetected() > 0" class="pricing-banner">
              <div class="price-val">Estimated Base Price: <strong>\${{ pricingDetected() }} USD</strong></div>
              <div class="price-badge"><i class="bi bi-tag-fill"></i> Subject to Admin Review</div>
            </div>

            <div class="step-actions">
              <button type="button" routerLink="/portal" class="btn btn-secondary">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="step1Form.invalid">Configure Connections <i class="bi bi-arrow-right"></i></button>
            </div>
          </form>
        </div>

        <!-- STEP 2: Credentials Configuration -->
        <div *ngIf="currentStep() === 2">
          <div class="step-header">
            <h3>Establish Connection Parameters</h3>
            <p>List credentials and details separately. Add as many parameters as needed aligned as key-value rows.</p>
          </div>

          <div class="cred-grids">
            <!-- Source Credentials -->
            <div class="cred-column">
              <div class="cred-header-badge src">
                <i class="bi bi-box-arrow-in-right"></i> Source: {{ step1Form.value.sourceSystem }}
              </div>
              <div class="fields-box">
                <!-- Suggestion Pills -->
                <div class="suggestion-pills-container" style="margin-bottom: 1.25rem;">
                  <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.45rem; font-weight: 700; font-family: var(--font-mono);">POSSIBLE SOURCE REQUIREMENTS:</span>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                    <span 
                      *ngFor="let req of commonSourceRequirements" 
                      (click)="addSourceRow(req)"
                      class="badge-suggestion"
                    >
                      + {{ req }}
                    </span>
                  </div>
                </div>

                <div class="dynamic-rows-list">
                  <div *ngFor="let row of sourceCredRows; let idx = index" class="dynamic-row-item" style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem;">
                    <input type="text" [(ngModel)]="row.key" placeholder="Key (e.g. API Key)" class="form-control" style="flex: 1;" />
                    <input 
                      [type]="row.key.toLowerCase().includes('key') || row.key.toLowerCase().includes('secret') || row.key.toLowerCase().includes('password') || row.key.toLowerCase().includes('token') ? 'password' : 'text'" 
                      [(ngModel)]="row.value" 
                      placeholder="Value" 
                      class="form-control" 
                      style="flex: 1.2;" 
                    />
                    <button type="button" (click)="removeSourceRow(idx)" class="btn-trash-row" style="background: none; border: none; color: #f87171; font-size: 1.1rem; cursor: pointer; padding: 0.25rem; display: flex; align-items: center; justify-content: center;"><i class="bi bi-trash"></i></button>
                  </div>
                  <div *ngIf="sourceCredRows.length === 0" style="font-size: 0.82rem; color: var(--text-muted); text-align: center; padding: 1rem 0;">No fields added yet. Click requirements above or use the button below.</div>
                </div>

                <button type="button" (click)="addSourceRow()" class="btn btn-secondary btn-sm" style="margin-top: 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; padding: 0.4rem 0.85rem;">
                  <i class="bi bi-plus-circle"></i> Add Custom Parameter
                </button>
              </div>
            </div>

            <!-- Destination Credentials -->
            <div class="cred-column">
              <div class="cred-header-badge dest">
                <i class="bi bi-box-arrow-out-right"></i> Destination: {{ step1Form.value.destinationSystem }}
              </div>
              <div class="fields-box">
                <!-- Suggestion Pills -->
                <div class="suggestion-pills-container" style="margin-bottom: 1.25rem;">
                  <span style="font-size: 0.72rem; color: var(--text-muted); display: block; margin-bottom: 0.45rem; font-weight: 700; font-family: var(--font-mono);">POSSIBLE DESTINATION REQUIREMENTS:</span>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
                    <span 
                      *ngFor="let req of commonDestRequirements" 
                      (click)="addDestRow(req)"
                      class="badge-suggestion"
                    >
                      + {{ req }}
                    </span>
                  </div>
                </div>

                <div class="dynamic-rows-list">
                  <div *ngFor="let row of destCredRows; let idx = index" class="dynamic-row-item" style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.75rem;">
                    <input type="text" [(ngModel)]="row.key" placeholder="Key (e.g. API URL)" class="form-control" style="flex: 1;" />
                    <input 
                      [type]="row.key.toLowerCase().includes('key') || row.key.toLowerCase().includes('secret') || row.key.toLowerCase().includes('password') || row.key.toLowerCase().includes('token') ? 'password' : 'text'" 
                      [(ngModel)]="row.value" 
                      placeholder="Value" 
                      class="form-control" 
                      style="flex: 1.2;" 
                    />
                    <button type="button" (click)="removeDestRow(idx)" class="btn-trash-row" style="background: none; border: none; color: #f87171; font-size: 1.1rem; cursor: pointer; padding: 0.25rem; display: flex; align-items: center; justify-content: center;"><i class="bi bi-trash"></i></button>
                  </div>
                  <div *ngIf="destCredRows.length === 0" style="font-size: 0.82rem; color: var(--text-muted); text-align: center; padding: 1rem 0;">No fields added yet. Click requirements above or use the button below.</div>
                </div>

                <button type="button" (click)="addDestRow()" class="btn btn-secondary btn-sm" style="margin-top: 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; padding: 0.4rem 0.85rem;">
                  <i class="bi bi-plus-circle"></i> Add Custom Parameter
                </button>
              </div>
            </div>
          </div>

          <div class="step-actions">
            <button type="button" (click)="prevStep()" class="btn btn-secondary"><i class="bi bi-arrow-left"></i> Back</button>
            <button type="button" (click)="nextStep2()" class="btn btn-primary">Choose Architect <i class="bi bi-arrow-right"></i></button>
          </div>
        </div>

        <!-- STEP 3: Instructions & Engineer Selection -->
        <div *ngIf="currentStep() === 3">
          <div class="step-header">
            <h3>Assign Architect & Instructions</h3>
            <p>Provide specific design rules and choose an available architect to build the scenario.</p>
          </div>

          <div class="form-group">
            <label for="instructions">Instructions & Custom Rules for the Architect</label>
            <textarea 
              id="instructions" 
              [(ngModel)]="extraInstructions" 
              rows="3" 
              placeholder="E.g. Format the telephone number to E.164, handle duplicate records, send Slack warnings on failure..."
              class="form-control"
            ></textarea>
          </div>

          <div class="engineers-section">
            <label>Available Architects</label>
            <div class="engineer-cards">
              <div 
                *ngFor="let eng of engineers()" 
                class="eng-card" 
                [class.selected]="selectedEngineer()?.name === eng.name"
                (click)="selectEngineer(eng)"
              >
                <div class="eng-avatar-wrap">
                  <div class="avatar" [class]="eng.avatarClass"><i class="bi bi-person-fill-gear"></i></div>
                  <div class="badge-status">Online</div>
                </div>
                <div class="eng-details">
                  <h4>{{ eng.name }}</h4>
                  <span class="eng-role">{{ eng.role }}</span>
                  <div class="eng-stat">
                    <span class="rating"><i class="bi bi-star-fill"></i> {{ eng.rating.toFixed(1) }}</span>
                    <span class="sep">·</span>
                    <span class="projects">{{ eng.projectsCount }} automations</span>
                  </div>
                  <div class="eng-skills">
                    <span *ngFor="let s of eng.skills" class="s-tag">{{ s }}</span>
                  </div>
                </div>
                <div class="selection-indicator">
                  <i class="bi" [class.bi-circle]="selectedEngineer()?.name !== eng.name" [class.bi-check-circle-fill]="selectedEngineer()?.name === eng.name"></i>
                </div>
              </div>
              <div *ngIf="engineers().length === 0" class="no-engineers-alert">
                <i class="bi bi-exclamation-octagon"></i>
                <p>No architects are currently available to receive mappings. Please check back shortly.</p>
              </div>
            </div>
          </div>

          <div *ngIf="paymentError()" class="error-alert" style="margin-top: 1.5rem;"><p>{{ paymentError() }}</p></div>

          <div class="step-actions">
            <button type="button" (click)="prevStep()" class="btn btn-secondary" [disabled]="paying()"><i class="bi bi-arrow-left"></i> Back</button>
            <button type="button" (click)="submitForReview()" class="btn btn-primary" [disabled]="!selectedEngineer() || paying()">
              <span *ngIf="!paying()"><i class="bi bi-send-fill"></i> Submit for Costing Review</span>
              <span *ngIf="paying()" class="spinner-text"><span class="spinner"></span> Dispatching Setup...</span>
            </button>
          </div>
        </div>

        <!-- STEP 4: Costing Review Transition Queue -->
        <div *ngIf="currentStep() === 4 && completedOrder() as order">
          <div class="success-screen">
            <div class="success-ring" style="background: rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.3); color: #a78bfa; box-shadow: 0 0 24px rgba(139, 92, 246, 0.2);">
              <i class="bi bi-hourglass-split"></i>
            </div>
            
            <h2>WORKFLOW_SUBMITTED_FOR_REVIEW</h2>
            <p class="success-sub">Deployment configuration successfully queued for feasibility approval.</p>

            <div class="receipt-card">
              <div class="receipt-header">
                <h4>Queue Metadata</h4>
                <span class="receipt-id">TICKET: {{ order.id }}</span>
              </div>
              <hr class="receipt-sep" />
              <div class="receipt-row">
                <span>Client Owner</span>
                <strong>{{ authService.currentUser()?.name }}</strong>
              </div>
              <div class="receipt-row">
                <span>Scenario Category</span>
                <strong>{{ order.workflowType }}</strong>
              </div>
              <div class="receipt-row">
                <span>Connection Route</span>
                <strong>{{ order.sourceSystem }} &rarr; {{ order.destinationSystem }}</strong>
              </div>
              <div class="receipt-row">
                <span>Requested Architect</span>
                <strong>{{ order.engineerName }}</strong>
              </div>
              <div class="receipt-row">
                <span>Target Pricing</span>
                <strong style="color: var(--accent);">Pending Admin Valuation</strong>
              </div>
              <div class="receipt-row">
                <span>Est. Delivery</span>
                <strong style="color: var(--accent);">Pending Admin Valuation</strong>
              </div>
            </div>

            <div class="receipt-dispatched">
              <i class="bi bi-info-circle-fill" style="color: var(--accent);"></i>
              <span>You will receive a dashboard alert once the Operations Admin approves costing.</span>
            </div>

            <div class="success-actions">
              <button routerLink="/portal" class="btn btn-primary">Go to Dashboard</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .wizard-page {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      max-width: 960px;
      margin: 0 auto;
    }
    .stepper-progress {
      padding: 1.5rem 2rem !important;
      border-color: rgba(255, 255, 255, 0.05) !important;
    }
    .step-nodes {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .step-node {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      z-index: 2;
    }
    .node-num {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.03);
      border: 2px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--text-muted);
      transition: all 0.3s;
    }
    .step-node.active .node-num {
      border-color: var(--primary);
      background: rgba(16, 185, 129, 0.12);
      color: #ffffff;
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.2);
    }
    .step-node.completed .node-num {
      border-color: var(--accent);
      background: var(--accent);
      color: #000000;
    }
    .node-lbl {
      font-size: 0.72rem;
      font-family: var(--font-mono);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
    }
    .step-node.active .node-lbl { color: var(--text-primary); }
    .step-line {
      flex: 1;
      height: 2px;
      background: rgba(255, 255, 255, 0.05);
      margin: 0 1rem;
      margin-top: -18px;
      z-index: 1;
    }
    .step-line.completed {
      background: var(--accent);
    }
    .wizard-body {
      padding: 3rem !important;
      background: rgba(8, 20, 15, 0.75) !important;
      border: 1px solid rgba(16, 185, 129, 0.15) !important;
      min-height: 480px;
    }
    .step-header {
      margin-bottom: 2.25rem;
    }
    .step-header h3 {
      font-size: 1.5rem;
      margin-bottom: 0.35rem;
      color: var(--text-primary);
    }
    .step-header p {
      font-size: 0.88rem;
      color: var(--text-secondary);
    }
    .form-group {
      margin-bottom: 1.5rem;
      display: flex;
      flex-direction: column;
    }
    .form-group label {
      font-size: 0.8rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .form-select, .form-control {
      background: rgba(2, 8, 5, 0.5);
      border: 1px solid rgba(16, 185, 129, 0.15);
      border-radius: 8px;
      padding: 0.85rem 1rem;
      color: #ffffff;
      font-family: var(--font-sans);
      font-size: 0.95rem;
      transition: all 0.2s;
      outline: none;
    }
    .form-select:focus, .form-control:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
      background: rgba(2, 8, 5, 0.7);
    }
    .form-select option {
      background: #020805;
      color: #ffffff;
    }
    .pricing-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(16, 185, 129, 0.06);
      border: 1px solid rgba(16, 185, 129, 0.18);
      padding: 1.25rem 1.5rem;
      border-radius: 10px;
      margin: 1.5rem 0 2rem 0;
    }
    .price-val {
      font-size: 0.95rem;
      color: var(--text-secondary);
    }
    .price-val strong {
      color: #ffffff;
      font-size: 1.15rem;
    }
    .price-badge {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--accent);
      background: rgba(16, 185, 129, 0.12);
      padding: 0.25rem 0.65rem;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .step-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 2.5rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      padding-top: 2rem;
    }
    .cred-grids {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    @media (min-width: 768px) {
      .cred-grids { grid-template-columns: 1fr 1fr; }
    }
    .cred-header-badge {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      padding: 0.5rem 0.85rem;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 700;
      margin-bottom: 1.25rem;
    }
    .cred-header-badge.src { background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.18); color: #60a5fa; }
    .cred-header-badge.dest { background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.18); color: #34d399; }
    .fields-box {
      background: rgba(255, 255, 255, 0.015);
      border: 1px solid rgba(255, 255, 255, 0.04);
      padding: 1.5rem;
      border-radius: 12px;
      min-height: 200px;
    }
    .engineers-section {
      margin-top: 2rem;
    }
    .engineers-section label {
      font-size: 0.8rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
    }
    .engineer-cards {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .eng-card {
      display: flex;
      align-items: center;
      gap: 1.25rem;
      padding: 1.25rem;
      background: rgba(255, 255, 255, 0.015);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .eng-card:hover {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(16, 185, 129, 0.2);
    }
    .eng-card.selected {
      background: rgba(16, 185, 129, 0.06);
      border-color: var(--accent);
    }
    .eng-avatar-wrap {
      position: relative;
    }
    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .avatar.blue { background: rgba(59, 130, 246, 0.12); border: 1.5px solid rgba(59, 130, 246, 0.3); color: #60a5fa; }
    .avatar.teal { background: rgba(20, 184, 166, 0.12); border: 1.5px solid rgba(20, 184, 166, 0.3); color: #2dd4bf; }
    .avatar.pink { background: rgba(236, 72, 153, 0.12); border: 1.5px solid rgba(236, 72, 153, 0.3); color: #f472b6; }
    .avatar.orange { background: rgba(249, 115, 22, 0.12); border: 1.5px solid rgba(249, 115, 22, 0.3); color: #fb923c; }

    .badge-status {
      position: absolute;
      bottom: -2px;
      right: -2px;
      background: #10b981;
      border: 2px solid #020805;
      font-size: 0.5rem;
      padding: 0.1rem 0.35rem;
      border-radius: 10px;
      color: #ffffff;
      font-weight: 700;
    }
    .eng-details {
      flex: 1;
    }
    .eng-details h4 {
      font-size: 0.95rem;
      margin: 0;
      color: var(--text-primary);
    }
    .eng-role {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .eng-stat {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
      margin: 0.15rem 0 0.4rem 0;
    }
    .eng-stat .rating {
      color: #fbbf24;
    }
    .eng-skills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }
    .s-tag {
      font-family: var(--font-mono);
      font-size: 0.6rem;
      padding: 0.1rem 0.4rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 4px;
      color: var(--text-muted);
    }
    .selection-indicator {
      font-size: 1.25rem;
      color: var(--text-muted);
    }
    .selected .selection-indicator {
      color: var(--accent);
    }
    .no-engineers-alert {
      text-align: center;
      padding: 2rem;
      background: rgba(239, 68, 68, 0.06);
      border: 1px dashed rgba(239, 68, 68, 0.25);
      border-radius: 10px;
      color: #f87171;
    }
    .no-engineers-alert i {
      font-size: 2rem;
      margin-bottom: 0.5rem;
      display: block;
    }
    .no-engineers-alert p {
      margin: 0;
      font-size: 0.85rem;
    }
    .error-alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 0.85rem;
      border-radius: 8px;
      color: #f87171;
      font-size: 0.82rem;
    }
    .error-alert p {
      margin: 0;
    }
    .success-screen {
      text-align: center;
      padding: 3rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .success-ring {
      width: 74px;
      height: 74px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.75rem;
      margin-bottom: 1.5rem;
      animation: float 5s ease-in-out infinite;
    }
    .success-screen h2 {
      font-size: 1.6rem;
      letter-spacing: 0.05em;
      color: var(--text-primary);
    }
    .success-sub {
      color: var(--text-secondary);
      font-size: 0.9rem;
      margin: 0.25rem 0 2rem 0;
    }
    .receipt-card {
      width: 100%;
      max-width: 440px;
      background: rgba(255, 255, 255, 0.015);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 1.5rem;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      text-align: left;
      margin-bottom: 1.5rem;
    }
    .receipt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .receipt-header h4 {
      font-size: 0.95rem;
      color: var(--text-primary);
    }
    .receipt-id {
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--text-muted);
    }
    .receipt-sep {
      border: none;
      border-top: 1px dashed rgba(255, 255, 255, 0.08);
    }
    .receipt-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.82rem;
      color: var(--text-secondary);
    }
    .receipt-row strong {
      color: #ffffff;
    }
    .receipt-dispatched {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted);
      font-size: 0.82rem;
      margin-bottom: 2rem;
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
     .badge-suggestion {
       font-size: 0.72rem;
       background: rgba(255, 255, 255, 0.03);
       border: 1px solid rgba(255, 255, 255, 0.08);
       color: var(--text-secondary);
       padding: 0.25rem 0.55rem;
       border-radius: 6px;
       cursor: pointer;
       font-family: var(--font-mono);
       transition: all 0.25s;
       user-select: none;
     }
     .badge-suggestion:hover {
       background: rgba(16, 185, 129, 0.12);
       border-color: var(--accent);
       color: #ffffff;
       box-shadow: 0 0 8px rgba(16, 185, 129, 0.15);
     }
     .btn-trash-row:hover {
       color: #ef4444 !important;
       transform: scale(1.1);
     }
   `]
})
export class WizardComponent implements OnInit {
  private fb = inject(FormBuilder);
  authService = inject(AuthService);
  private orderService = inject(OrderService);
  private router = inject(Router);

  currentStep = signal(1);
  paying = signal(false);
  paymentError = signal('');
  completedOrder = signal<any | null>(null);

  workflowOptions = [
    { type: 'HR Employee Sync', price: 299 },
    { type: 'Payroll Automation', price: 799 },
    { type: 'CRM Lead Integration', price: 349 },
    { type: 'Finance Reconciliation', price: 899 },
    { type: 'Multi-System ERP Bridge', price: 1999 },
    { type: 'Custom Scenario', price: 2499 }
  ];

  systemOptions = [
    'BambooHR', 'HiBob', 'Personio', 'Workday', 'QuickBooks', 
    'ADP', 'Stripe', 'HubSpot', 'Salesforce', 'Slack', 'SendGrid', 'Other'
  ];

  engineers = signal<Engineer[]>([]);
  selectedEngineer = signal<Engineer | null>(null);
  extraInstructions = '';

  step1Form: FormGroup = this.fb.group({
    workflowType: ['', [Validators.required]],
    sourceSystem: ['', [Validators.required]],
    destinationSystem: ['', [Validators.required]],
    customBid: [null]
  });

  // Dynamic Credentials Store
  sourceCredentialsInput: Record<string, string> = {};
  destinationCredentialsInput: Record<string, string> = {};

  // Dynamic credentials rows
  sourceCredRows: { key: string; value: string }[] = [];
  destCredRows: { key: string; value: string }[] = [];

  // Suggestion lists
  commonSourceRequirements = [
    'API Key', 'API Base URL', 'Client ID', 'Client Secret', 'Username', 'Password', 'Access Token', 'Tenant ID', 'Webhook Secret'
  ];

  commonDestRequirements = [
    'API Key', 'API URL Endpoint', 'Client ID', 'Client Secret', 'Username', 'Password', 'Access Token', 'Database Conn String', 'Security Token'
  ];

  addSourceRow(key: string = '', value: string = '') {
    if (key && this.sourceCredRows.some(r => r.key.toLowerCase() === key.toLowerCase())) return;
    this.sourceCredRows.push({ key, value });
  }

  removeSourceRow(index: number) {
    this.sourceCredRows.splice(index, 1);
  }

  addDestRow(key: string = '', value: string = '') {
    if (key && this.destCredRows.some(r => r.key.toLowerCase() === key.toLowerCase())) return;
    this.destCredRows.push({ key, value });
  }

  removeDestRow(index: number) {
    this.destCredRows.splice(index, 1);
  }

  pricingDetected = computed(() => {
    const wfType = this.step1Form.get('workflowType')?.value;
    const match = this.workflowOptions.find(o => o.type === wfType);
    return match ? match.price : 0;
  });

  ngOnInit() {
    this.loadEngineers();
  }

  loadEngineers() {
    this.authService.getEngineers().subscribe({
      next: (data) => this.engineers.set(data)
    });
  }

  nextStep1() {
    if (this.step1Form.invalid) return;

    this.sourceCredRows = [];
    this.destCredRows = [];

    // Pre-populate defaults based on typed system name
    const srcSys = (this.step1Form.value.sourceSystem || '').toLowerCase();
    if (srcSys.includes('bamboo')) {
      this.addSourceRow('Subdomain');
      this.addSourceRow('API Key');
    } else if (srcSys.includes('bob')) {
      this.addSourceRow('API Token');
    } else if (srcSys.includes('workday')) {
      this.addSourceRow('API URL Endpoint');
      this.addSourceRow('Username');
      this.addSourceRow('Password');
      this.addSourceRow('Tenant ID');
    } else if (srcSys.includes('stripe')) {
      this.addSourceRow('Secret API Key');
    } else if (srcSys.includes('salesforce')) {
      this.addSourceRow('Client ID');
      this.addSourceRow('Client Secret');
      this.addSourceRow('Username');
      this.addSourceRow('Password');
      this.addSourceRow('Instance Login URL');
    } else {
      this.addSourceRow('API Base URL');
      this.addSourceRow('API Key');
    }

    const destSys = (this.step1Form.value.destinationSystem || '').toLowerCase();
    if (destSys.includes('bamboo')) {
      this.addDestRow('Subdomain');
      this.addDestRow('API Key');
    } else if (destSys.includes('bob')) {
      this.addDestRow('API Token');
    } else if (destSys.includes('workday')) {
      this.addDestRow('API URL Endpoint');
      this.addDestRow('Username');
      this.addDestRow('Password');
      this.addDestRow('Tenant ID');
    } else if (destSys.includes('stripe')) {
      this.addDestRow('Secret API Key');
    } else if (destSys.includes('salesforce')) {
      this.addDestRow('Client ID');
      this.addDestRow('Client Secret');
      this.addDestRow('Username');
      this.addDestRow('Password');
      this.addDestRow('Instance Login URL');
    } else {
      this.addDestRow('API URL Endpoint');
      this.addDestRow('API Key');
    }

    this.currentStep.set(2);
  }

  nextStep2() {
    this.sourceCredentialsInput = {};
    this.sourceCredRows.forEach(r => {
      if (r.key.trim()) {
        this.sourceCredentialsInput[r.key.trim()] = r.value;
      }
    });

    this.destinationCredentialsInput = {};
    this.destCredRows.forEach(r => {
      if (r.key.trim()) {
        this.destinationCredentialsInput[r.key.trim()] = r.value;
      }
    });

    this.currentStep.set(3);
  }

  selectEngineer(eng: Engineer) {
    this.selectedEngineer.set(eng);
  }

  prevStep() {
    this.currentStep.update(s => s - 1);
  }

  submitForReview() {
    if (!this.selectedEngineer()) return;

    this.paying.set(true);
    this.paymentError.set('');

    const orderPayload = {
      workflowType: this.step1Form.value.workflowType,
      sourceSystem: this.step1Form.value.sourceSystem,
      destinationSystem: this.step1Form.value.destinationSystem,
      sourceCredentials: this.sourceCredentialsInput,
      destinationCredentials: this.destinationCredentialsInput,
      instructions: this.extraInstructions,
      engineerName: this.selectedEngineer()?.name || '',
      engineerRating: this.selectedEngineer()?.rating || 5.0,
      price: this.step1Form.value.customBid || this.pricingDetected(),
    };

    this.orderService.createOrder(orderPayload).subscribe({
      next: (orderRes) => {
        this.paying.set(false);
        this.completedOrder.set(orderRes);
        this.currentStep.set(4);
      },
      error: (err) => {
        this.paying.set(false);
        this.paymentError.set(err.error?.message || 'Failed to submit workflow to queue. Please try again.');
      }
    });
  }
}
