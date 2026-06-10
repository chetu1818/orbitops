import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="glow-orb glow-primary" style="top: 15%; left: 10%;"></div>
      <div class="glow-orb glow-accent" style="bottom: 15%; right: 10%;"></div>
      
      <div class="auth-card card">
        <div class="auth-header">
          <div class="logo-text">OrbitOps<span class="logo-dot">.ai</span></div>
          <h2>Sign Up</h2>
          <p>Create a new client account.</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" novalidate>
          <div *ngIf="errorMsg()" class="error-alert">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <p>{{ errorMsg() }}</p>
          </div>

          <div class="form-group">
            <label for="name">Full Name</label>
            <input 
              type="text" 
              id="name" 
              formControlName="name" 
              placeholder="Jane Doe"
              [class.is-invalid]="isFieldInvalid('name')"
            />
            <div *ngIf="isFieldInvalid('name')" class="validation-message">
              Name is required.
            </div>
          </div>

          <div class="form-group">
            <label for="company">Company Name</label>
            <input 
              type="text" 
              id="company" 
              formControlName="company" 
              placeholder="Enterprise Inc."
              [class.is-invalid]="isFieldInvalid('company')"
            />
            <div *ngIf="isFieldInvalid('company')" class="validation-message">
              Company is required.
            </div>
          </div>

          <div class="form-group">
            <label for="email">Network Email</label>
            <input 
              type="email" 
              id="email" 
              formControlName="email" 
              placeholder="jane@company.com"
              [class.is-invalid]="isFieldInvalid('email')"
            />
            <div *ngIf="isFieldInvalid('email')" class="validation-message">
              Please enter a valid work email.
            </div>
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              formControlName="password" 
              placeholder="••••••••"
              [class.is-invalid]="isFieldInvalid('password')"
            />
            <div *ngIf="isFieldInvalid('password')" class="validation-message">
              Password must be at least 6 characters.
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary btn-block" 
            [disabled]="registerForm.invalid || loading()"
          >
            <span *ngIf="!loading()">Sign Up</span>
            <span *ngIf="loading()" class="spinner-text">
              <span class="spinner"></span> Signing Up...
            </span>
          </button>
        </form>

        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/auth/login">Sign In</a></p>
          <p class="back-home"><a routerLink="/"><i class="bi bi-arrow-left"></i> Back to Home</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4rem 1.5rem;
      position: relative;
      overflow: hidden;
    }
    .auth-card {
      width: 100%;
      max-width: 460px;
      padding: 3rem !important;
      background: rgba(8, 20, 15, 0.75) !important;
      border: 1px solid rgba(16, 185, 129, 0.15) !important;
      box-shadow: var(--shadow-lg), var(--shadow-glow-blue) !important;
      z-index: 2;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .auth-header h2 {
      font-size: 1.75rem;
      margin: 0.75rem 0 0.5rem 0;
      color: var(--text-primary);
    }
    .auth-header p {
      font-size: 0.88rem;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .logo-text {
      font-family: var(--font-display);
      font-size: 1.6rem;
      font-weight: 900;
      color: var(--text-primary);
    }
    .logo-dot {
      color: var(--accent);
    }
    .form-group {
      margin-bottom: 1.5rem;
      display: flex;
      flex-direction: column;
    }
    .form-group label {
      font-size: 0.78rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .form-group input {
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
    .form-group input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
      background: rgba(2, 8, 5, 0.7);
    }
    .form-group input.is-invalid {
      border-color: #ef4444;
      background: rgba(239, 68, 68, 0.08);
    }
    .validation-message {
      color: #ef4444;
      font-size: 0.78rem;
      margin-top: 0.35rem;
    }
    .btn-block {
      width: 100%;
      margin-top: 1.5rem;
    }
    .auth-footer {
      text-align: center;
      margin-top: 2rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .auth-footer a {
      color: var(--accent);
      font-weight: 600;
      transition: color 0.2s;
    }
    .auth-footer a:hover {
      color: var(--text-primary);
    }
    .back-home {
      font-size: 0.8rem;
      margin-top: 0.5rem;
    }
    .back-home a {
      color: var(--text-muted);
      font-weight: 500;
    }
    .error-alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 0.85rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      color: #f87171;
      font-size: 0.82rem;
    }
    .error-alert p {
      margin: 0;
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
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    company: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  loading = signal(false);
  errorMsg = signal('');

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    const { name, email, company, password } = this.registerForm.value;
    this.authService.register(name, email, company, password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/portal']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Failed to register. Email may already be in use.');
      }
    });
  }
}
