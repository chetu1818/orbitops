import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { LeadService } from '../../services/lead.service';
import { LeadSubmission } from '../../models/lead.model';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ScrollAnimateDirective],
  template: `
    <section class="section contact-section">
      <div class="glow-orb glow-primary" style="top: -20%; right: 10%;"></div>
      
      <div class="container contact-container">
        <div class="contact-info" appScrollAnimate>
          <span class="badge">Connection Port</span>
          <h2>Establish Secure Integration Channel</h2>
          <p class="contact-desc">
            Provide specs about the manual operational loops you intend to automate. 
            We will design a detailed workflow schema map to initiate database syncs.
          </p>
          
          <div class="feature-bullets">
            <div class="bullet-item">
              <span class="bullet-icon"><i class="bi bi-lightning-charge-fill"></i></span>
              <div>
                <h4>Initial Architecture Sync within 48 Hours</h4>
                <p>We analyze the database hooks or CSV files causing friction.</p>
              </div>
            </div>
            <div class="bullet-item">
              <span class="bullet-icon"><i class="bi bi-shield-fill-check"></i></span>
              <div>
                <h4>Secure Hand-off Procedures</h4>
                <p>We follow strict secrets policies and coordinate VPN tunnels.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="contact-card card" appScrollAnimate class="delay-200">
          <!-- Success State -->
          <div *ngIf="submitted" class="success-state">
            <div class="success-icon-wrapper">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3>TRANSMISSION_COMPLETE</h3>
            <p>{{ successMessage }}</p>
            <button (click)="resetForm()" class="btn btn-secondary btn-sm">Open New Channel</button>
          </div>

          <!-- Form State -->
          <form *ngIf="!submitted" [formGroup]="leadForm" (ngSubmit)="onSubmit()" novalidate>
            <!-- Error Alert -->
            <div *ngIf="errorMessage" class="error-alert">
              <span class="error-alert-icon"><i class="bi bi-exclamation-triangle-fill"></i></span>
              <p>{{ errorMessage }}</p>
            </div>

            <div class="form-group">
              <label for="name">Client Name</label>
              <input 
                type="text" 
                id="name" 
                formControlName="name" 
                placeholder="Jane Doe"
                [ngClass]="{'is-invalid': isFieldInvalid('name')}"
              />
              <div *ngIf="isFieldInvalid('name')" class="validation-message">
                Name is required (max 100 characters).
              </div>
            </div>

            <div class="form-group">
              <label for="company">Company ID</label>
              <input 
                type="text" 
                id="company" 
                formControlName="company" 
                placeholder="Enterprise Inc."
                [ngClass]="{'is-invalid': isFieldInvalid('company')}"
              />
              <div *ngIf="isFieldInvalid('company')" class="validation-message">
                Company name is required.
              </div>
            </div>

            <div class="form-group">
              <label for="email">Network Email</label>
              <input 
                type="email" 
                id="email" 
                formControlName="email" 
                placeholder="jane@company.com"
                [ngClass]="{'is-invalid': isFieldInvalid('email')}"
              />
              <div *ngIf="isFieldInvalid('email')" class="validation-message">
                Please enter a valid work email address.
              </div>
            </div>

            <div class="form-group">
              <label for="message">Describe the manual process you want to automate</label>
              <textarea 
                id="message" 
                formControlName="message" 
                rows="4" 
                placeholder="Explain the systems involved (e.g. syncing records between CSVs and payroll databases every Monday)..."
                [ngClass]="{'is-invalid': isFieldInvalid('message')}"
              ></textarea>
              <div *ngIf="isFieldInvalid('message')" class="validation-message">
                Please describe the process (minimum 20 characters, current: {{ getMessageLength() }}).
              </div>
            </div>

            <button 
              type="submit" 
              class="btn btn-primary btn-block" 
              [disabled]="leadForm.invalid || loading"
            >
              <span *ngIf="!loading">Execute Transmission</span>
              <span *ngIf="loading" class="spinner-text">
                <span class="spinner"></span> Syncing Node...
              </span>
            </button>
          </form>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .contact-section {
      background: radial-gradient(circle at 90% 80%, rgba(37, 99, 235, 0.02) 0%, transparent 60%);
    }
    .contact-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 4rem;
      align-items: center;
    }
    @media (min-width: 992px) {
      .contact-container {
        grid-template-columns: 1fr 1fr;
      }
    }
    .contact-info h2 {
      font-size: 2.5rem;
      margin-bottom: 1.5rem;
      color: var(--text-primary);
    }
    .contact-desc {
      color: var(--text-secondary);
      font-size: 1.1rem;
      margin-bottom: 3rem;
      line-height: 1.6;
    }
    .feature-bullets {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .bullet-item {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }
    .bullet-icon {
      font-size: 1.5rem;
      background: rgba(37, 99, 235, 0.1);
      padding: 0.5rem;
      border-radius: 8px;
      line-height: 1;
      color: var(--primary);
      border: 1px solid rgba(37, 99, 235, 0.2);
    }
    .bullet-item h4 {
      font-size: 1.1rem;
      margin-bottom: 0.25rem;
      color: var(--text-primary);
    }
    .bullet-item p {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    /* Light Theme Form Card */
    .contact-card {
      background: rgba(15, 23, 42, 0.6) !important;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      padding: 2.5rem !important;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4) !important;
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .form-group {
      margin-bottom: 1.5rem;
      display: flex;
      flex-direction: column;
    }
    .form-group label {
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .form-group input, .form-group textarea {
      background: rgba(3, 7, 18, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 0.85rem 1rem;
      color: #ffffff;
      font-family: var(--font-sans);
      font-size: 0.95rem;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      outline: none;
    }
    .form-group input:focus, .form-group textarea:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.25);
      background: rgba(3, 7, 18, 0.6);
    }
    .form-group input.is-invalid, .form-group textarea.is-invalid {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }
    .form-group input.is-invalid:focus, .form-group textarea.is-invalid:focus {
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
    }
    .validation-message {
      color: #ef4444;
      font-size: 0.8rem;
      margin-top: 0.35rem;
      font-weight: 500;
    }
    .btn-block {
      width: 100%;
      margin-top: 1rem;
    }

    /* Error Alert banner */
    .error-alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      color: #b91c1c;
      font-size: 0.85rem;
      font-weight: 500;
    }
    .error-alert-icon {
      font-size: 1.2rem;
      font-weight: 700;
    }

    /* Success State */
    .success-state {
      text-align: center;
      padding: 3rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }
    .success-icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #ecfdf5;
      border: 2px solid #a7f3d0;
      color: #059669;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: float 4s ease-in-out infinite;
    }
    .success-state h3 {
      font-size: 1.5rem;
      color: var(--text-primary);
    }
    .success-state p {
      color: var(--text-secondary);
      max-width: 320px;
      line-height: 1.5;
    }
    .btn-sm {
      padding: 0.6rem 1.25rem;
      font-size: 0.85rem;
    }

    /* Inline Loading Spinner */
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
  `]
})
export class ContactComponent {
  private fb = inject(FormBuilder);
  private leadService = inject(LeadService);
  private loadingService = inject(LoadingService);

  leadForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    company: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    message: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]]
  });

  loading = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';

  isFieldInvalid(fieldName: string): boolean {
    const field = this.leadForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getMessageLength(): number {
    return this.leadForm.get('message')?.value?.length || 0;
  }

  onSubmit() {
    if (this.leadForm.invalid) {
      this.leadForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.loadingService.show();
    this.errorMessage = '';
    const payload: LeadSubmission = this.leadForm.value;

    this.leadService.submitLead(payload).subscribe({
      next: (response) => {
        this.loading = false;
        this.loadingService.hide();
        this.submitted = true;
        this.successMessage = response.message || 'Thank you for reaching out. We will connect with you shortly!';
        this.leadForm.reset();
      },
      error: (err) => {
        this.loading = false;
        this.loadingService.hide();
        if (err.status === 400 && err.error) {
          if (typeof err.error === 'object') {
            const keys = Object.keys(err.error);
            const messages = keys.map(k => {
              const val = err.error[k];
              return Array.isArray(val) ? val.join(' ') : JSON.stringify(val);
            });
            this.errorMessage = `Validation error: ${messages.join(' ')}`;
          } else {
            this.errorMessage = err.error;
          }
        } else {
          this.errorMessage = 'Unable to connect to OrbitOps servers. Please verify your connection or try again later.';
        }
      }
    });
  }

  resetForm() {
    this.submitted = false;
    this.successMessage = '';
    this.errorMessage = '';
    this.leadForm.reset();
  }
}
