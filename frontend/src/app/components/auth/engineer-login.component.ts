import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-engineer-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-wrapper">
      <div class="glow-orb glow-primary" style="top: 15%; left: 10%;"></div>
      <div class="glow-orb glow-accent" style="bottom: 15%; right: 10%;"></div>
      
      <div class="auth-card card">
        <!-- Engineer Login Panel -->
        <div *ngIf="!show2FA()">
          <div class="auth-header">
            <div class="logo-text">OrbitOps<span class="logo-dot">.architects</span></div>
            <h2>Architect Sign In</h2>
            <p>Access the secure engineer operations console.</p>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" novalidate>
            <div *ngIf="errorMsg()" class="error-alert">
              <i class="bi bi-exclamation-triangle-fill"></i>
              <p>{{ errorMsg() }}</p>
            </div>

            <div class="form-group">
              <label for="email">Architect Network Email</label>
              <input 
                type="text" 
                id="email" 
                formControlName="email" 
                placeholder="architect@orbitops.ai"
                [class.is-invalid]="isFieldInvalid('email')"
              />
              <div *ngIf="isFieldInvalid('email')" class="validation-message">
                Architect email is required.
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
                Password is required.
              </div>
            </div>

            <button 
              type="submit" 
              class="btn btn-primary btn-block" 
              [disabled]="loginForm.invalid || loading()"
            >
              <span *ngIf="!loading()">Secure Sign In</span>
              <span *ngIf="loading()" class="spinner-text">
                <span class="spinner"></span> Verifying...
              </span>
            </button>
          </form>

          <div class="auth-footer">
            <p class="back-home"><a routerLink="/"><i class="bi bi-arrow-left"></i> Back to Home</a></p>
          </div>
        </div>

        <!-- 2FA Code Verification Panel -->
        <div *ngIf="show2FA()">
          <div class="auth-header">
            <div class="logo-text">OrbitOps<span class="logo-dot">.security</span></div>
            <h2>Enter Security Code</h2>
            <p style="margin-top: 0.5rem;">We've sent a 6-digit verification code to <strong>{{ loginEmail() }}</strong> to authorize this session. (Local test files saved in <code>chat_data/emails</code>).</p>
          </div>

          <form [formGroup]="faForm" (ngSubmit)="onVerify2Fa()" novalidate>
            <div *ngIf="errorMsg()" class="error-alert">
              <i class="bi bi-exclamation-triangle-fill"></i>
              <p>{{ errorMsg() }}</p>
            </div>

            <div class="form-group">
              <label for="code">Verification Code</label>
              <input 
                type="text" 
                id="code" 
                formControlName="code" 
                placeholder="••••••"
                maxlength="6"
                style="text-align: center; font-size: 1.5rem; letter-spacing: 0.15em; font-family: var(--font-mono); font-weight: 700; color: var(--accent);"
                [class.is-invalid]="faForm.get('code')?.invalid && faForm.get('code')?.touched"
              />
              <div *ngIf="faForm.get('code')?.invalid && faForm.get('code')?.touched" class="validation-message">
                Enter the 6-digit numeric security code.
              </div>
            </div>

            <button 
              type="submit" 
              class="btn btn-primary btn-block" 
              [disabled]="faForm.invalid || loading()"
            >
              <span *ngIf="!loading()">Confirm Access</span>
              <span *ngIf="loading()" class="spinner-text">
                <span class="spinner"></span> Authenticating...
              </span>
            </button>

            <button 
              type="button" 
              class="btn btn-secondary btn-block" 
              style="margin-top: 0.75rem;"
              (click)="cancel2Fa()"
            >
              Cancel
            </button>
          </form>
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
export class EngineerLoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  faForm: FormGroup = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  show2FA = signal(false);
  loginEmail = signal('');
  loading = signal(false);
  errorMsg = signal('');

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    const { email, password } = this.loginForm.value;
    this.authService.engineerLogin(email, password).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.twoFactorRequired) {
          this.loginEmail.set(res.email);
          this.show2FA.set(true);
          this.faForm.reset();
        } else {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/portal';
          this.router.navigateByUrl(returnUrl);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Invalid credentials. Please try again.');
      }
    });
  }

  onVerify2Fa() {
    if (this.faForm.invalid) {
      this.faForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set('');

    const { code } = this.faForm.value;
    this.authService.verify2Fa(this.loginEmail(), code).subscribe({
      next: () => {
        this.loading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/portal';
        this.router.navigateByUrl(returnUrl);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Verification code invalid or expired.');
      }
    });
  }

  cancel2Fa() {
    this.show2FA.set(false);
    this.errorMsg.set('');
  }
}
