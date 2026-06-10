import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="portal-wrapper">
      <!-- Portal Header -->
      <header class="portal-header">
        <div class="portal-container">
          <a routerLink="/portal" class="portal-logo">
            <span class="logo-icon"><i class="bi bi-grid-3x3-gap-fill"></i></span>
            <span class="logo-text">OrbitOps<span class="logo-dot">.portal</span></span>
          </a>

          <nav class="portal-nav">
            <a routerLink="/portal" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
              <i class="bi bi-speedometer2"></i> Dashboard
            </a>
            <a *ngIf="authService.currentUser()?.role === 'Client' || authService.currentUser()?.role === 'SubClient'" routerLink="/portal/new-order" routerLinkActive="active">
              <i class="bi bi-plus-circle-fill"></i> New Integration
            </a>
            <a routerLink="/portal/chat" routerLinkActive="active">
              <i class="bi bi-chat-text-fill"></i> Chat Console
            </a>
          </nav>

          <div class="portal-user" *ngIf="authService.currentUser() as user">
            <div class="user-badge">
              <i class="bi bi-person-workspace"></i>
              <div class="user-info">
                <span class="user-name">{{ user.name }}</span>
                <span class="user-company">{{ user.company }}</span>
              </div>
            </div>
            <button (click)="onLogout()" class="btn-logout" title="Logout Session">
              <i class="bi bi-box-arrow-right"></i>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Portal Content -->
      <main class="portal-main" [class.chat-main]="isChatPage()">
        <div class="portal-container" [class.chat-container]="isChatPage()">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Portal Footer -->
      <footer class="portal-footer" *ngIf="!isChatPage()">
        <div class="portal-container">
          <p>© 2026 OrbitOps.ai. Secure Enterprise Integration Console. SOC2 Compliant.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .portal-wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg-void);
      color: var(--text-primary);
      position: relative;
    }
    .portal-header {
      background: rgba(4, 18, 10, 0.85);
      border-bottom: 1px solid rgba(16, 185, 129, 0.12);
      backdrop-filter: blur(16px);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .portal-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .portal-header .portal-container {
      height: 70px;
    }
    .portal-logo {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
    }
    .portal-logo .logo-icon {
      color: var(--primary);
      font-size: 1.35rem;
      display: flex;
      align-items: center;
    }
    .portal-logo .logo-text {
      font-family: var(--font-display);
      font-size: 1.3rem;
      font-weight: 900;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }
    .portal-logo .logo-dot {
      color: var(--accent);
      font-weight: 500;
    }
    .portal-nav {
      display: flex;
      gap: 1.5rem;
    }
    .portal-nav a {
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.9rem;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.5rem 0.85rem;
      border-radius: 8px;
      transition: all 0.2s;
    }
    .portal-nav a:hover {
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.03);
    }
    .portal-nav a.active {
      color: #ffffff;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.25);
    }
    .portal-user {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .user-badge {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      padding: 0.38rem 0.75rem;
      border-radius: 30px;
    }
    .user-badge i {
      color: var(--accent);
      font-size: 1.1rem;
    }
    .user-info {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .user-name {
      font-size: 0.82rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .user-company {
      font-size: 0.65rem;
      color: var(--text-muted);
    }
    .btn-logout {
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.18);
      color: #ef4444;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-logout:hover {
      background: #ef4444;
      color: #ffffff;
      transform: scale(1.05);
    }
    .portal-main {
      flex: 1;
      padding: 3rem 0;
      position: relative;
    }
    .portal-main.chat-main {
      padding: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .portal-container.chat-container {
      max-width: 100% !important;
      width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      flex: 1 !important;
      align-items: stretch !important;
      justify-content: stretch !important;
    }
    .portal-footer {
      background: rgba(2, 8, 5, 0.9);
      border-top: 1px solid rgba(255, 255, 255, 0.03);
      padding: 1.5rem 0;
      text-align: center;
      font-size: 0.78rem;
      color: var(--text-muted);
    }
  `]
})
export class PortalLayoutComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  onLogout() {
    this.authService.logout();
  }

  isChatPage(): boolean {
    return this.router.url.includes('/portal/chat');
  }
}
