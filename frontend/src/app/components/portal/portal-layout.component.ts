import { Component, inject, signal } from '@angular/core';
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
        <div class="portal-header-inner">

          <!-- Logo -->
          <a routerLink="/portal" class="portal-logo">
            <span class="logo-icon"><i class="bi bi-grid-3x3-gap-fill"></i></span>
            <span class="logo-text">OrbitOps<span class="logo-dot">.portal</span></span>
          </a>

          <!-- Desktop Nav -->
          <nav class="portal-nav" [class.mobile-open]="mobileNavOpen()">
            <a routerLink="/portal" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMobileNav()">
              <i class="bi bi-speedometer2"></i> <span>Dashboard</span>
            </a>
            <a *ngIf="authService.currentUser()?.role === 'Client' || authService.currentUser()?.role === 'SubClient'"
               routerLink="/portal/new-order" routerLinkActive="active" (click)="closeMobileNav()">
              <i class="bi bi-plus-circle-fill"></i> <span>New Integration</span>
            </a>
            <a routerLink="/portal/chat" routerLinkActive="active" (click)="closeMobileNav()">
              <i class="bi bi-chat-text-fill"></i> <span>Chat Console</span>
            </a>
          </nav>

          <!-- Right: user badge + logout + hamburger -->
          <div class="portal-right">
            
            <!-- Theme Selector -->
            <div class="theme-selector" role="group" aria-label="Select theme" style="margin-right: 0.5rem;">
              <span class="theme-label">Theme</span>
              <button
                *ngFor="let t of themes"
                class="theme-pill"
                [class.active]="currentTheme() === t.id"
                [attr.title]="t.label"
                [style.--theme-accent]="t.color"
                [style.background-color]="t.color"
                (click)="setTheme(t.id)"
                [attr.aria-label]="'Switch to ' + t.label + ' theme'"
              ></button>
            </div>

            <div class="portal-user" *ngIf="authService.currentUser() as user">
              <div class="user-badge">
                <i class="bi bi-person-workspace"></i>
                <div class="user-info">
                  <span class="user-name">{{ user.name }}</span>
                  <span class="user-company">
                    <span class="role-dot" [style.background]="getRoleColor(user.role)"></span>
                    {{ user.role }}
                  </span>
                </div>
              </div>
              <button (click)="onLogout()" class="btn-logout" title="Logout Session">
                <i class="bi bi-box-arrow-right"></i>
              </button>
            </div>

            <!-- Mobile hamburger -->
            <button class="portal-hamburger" (click)="toggleMobileNav()" aria-label="Toggle portal menu">
              <span [class]="mobileNavOpen() ? 'bi bi-x-lg' : 'bi bi-list'"></span>
            </button>
          </div>

        </div>
      </header>

      <!-- Mobile Slide-down Nav -->
      <div class="portal-mobile-nav" [class.open]="mobileNavOpen()">
        <nav class="portal-mobile-links">
          <a routerLink="/portal" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="closeMobileNav()">
            <i class="bi bi-speedometer2"></i> Dashboard
          </a>
          <a *ngIf="authService.currentUser()?.role === 'Client' || authService.currentUser()?.role === 'SubClient'"
             routerLink="/portal/new-order" routerLinkActive="active" (click)="closeMobileNav()">
            <i class="bi bi-plus-circle-fill"></i> New Integration
          </a>
          <a routerLink="/portal/chat" routerLinkActive="active" (click)="closeMobileNav()">
            <i class="bi bi-chat-text-fill"></i> Chat Console
          </a>
          <button (click)="onLogout()" class="mobile-logout-btn">
            <i class="bi bi-box-arrow-right"></i> Logout
          </button>
        </nav>
      </div>

      <!-- Main Portal Content -->
      <main class="portal-main" [class.chat-main]="isChatPage()">
        <div class="portal-container" [class.chat-container]="isChatPage()">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Portal Footer -->
      <footer class="portal-footer" *ngIf="!isChatPage()">
        <div class="portal-footer-inner">
          <p>© 2026 <strong>OrbitOps.ai</strong> · Secure Enterprise Integration Console · SOC2 Compliant</p>
          <span class="footer-live-badge"><span class="live-dot"></span>Systems Operational</span>
        </div>
      </footer>

    </div>
  `,
  styles: [`
    /* ── Wrapper ────────────────────────────────────────────────── */
    .portal-wrapper {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--bg-void);
      color: var(--text-primary);
      position: relative;
    }

    /* ── Header ─────────────────────────────────────────────────── */
    .portal-header {
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border);
      backdrop-filter: blur(18px) saturate(160%);
      -webkit-backdrop-filter: blur(18px) saturate(160%);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 16px rgba(0,0,0,0.3);
    }

    /* Light theme header */
    :host-context([data-theme="light"]) .portal-header {
      background: rgba(243,246,248,0.95);
      border-bottom-color: rgba(0,113,227,0.14);
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }

    .portal-header-inner {
      width: 100%;
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1.5rem;
      height: 68px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    /* ── Logo ───────────────────────────────────────────────────── */
    .portal-logo {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      text-decoration: none;
      flex-shrink: 0;
    }
    .portal-logo .logo-icon {
      color: var(--accent);
      font-size: 1.3rem;
      display: flex;
      align-items: center;
      filter: drop-shadow(0 0 8px rgba(20,184,166,0.4));
    }
    .portal-logo .logo-text {
      font-family: var(--font-display);
      font-size: 1.22rem;
      font-weight: 900;
      color: var(--text-primary);
      letter-spacing: -0.025em;
      white-space: nowrap;
    }
    .portal-logo .logo-dot {
      color: var(--accent);
      font-weight: 500;
    }

    /* ── Desktop Nav ────────────────────────────────────────────── */
    .portal-nav {
      display: none;
      align-items: center;
      gap: 0.25rem;
      flex: 1;
      justify-content: center;
    }
    @media (min-width: 768px) {
      .portal-nav { display: flex; }
    }
    .portal-nav a {
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.875rem;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.5rem 0.9rem;
      border-radius: 10px;
      transition: color 0.2s, background 0.2s;
      white-space: nowrap;
    }
    .portal-nav a:hover {
      color: var(--text-primary);
      background: rgba(255,255,255,0.04);
    }
    .portal-nav a.active {
      color: var(--accent);
      background: rgba(20,184,166,0.08);
      border: 1px solid rgba(20,184,166,0.18);
    }
    :host-context([data-theme="light"]) .portal-nav a:hover {
      background: rgba(0,0,0,0.04);
    }

    /* ── Right Section (user + hamburger) ───────────────────────── */
    .portal-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    /* ── User Badge ─────────────────────────────────────────────── */
    .portal-user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-badge {
      display: none;
      align-items: center;
      gap: 0.6rem;
      background: rgba(255,255,255,0.03);
      border: 1px solid var(--border);
      padding: 0.38rem 0.85rem;
      border-radius: 30px;
    }
    @media (min-width: 640px) {
      .user-badge { display: flex; }
    }
    .user-badge i {
      color: var(--accent);
      font-size: 1.05rem;
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
      white-space: nowrap;
    }
    .user-company {
      font-size: 0.65rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }
    .role-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .btn-logout {
      background: rgba(239,68,68,0.08);
      border: 1px solid rgba(239,68,68,0.18);
      color: #ef4444;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .btn-logout:hover {
      background: #ef4444;
      color: #fff;
      transform: scale(1.06);
    }

    /* ── Hamburger (mobile only) ────────────────────────────────── */
    .portal-hamburger {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 1.15rem;
      transition: all 0.2s;
    }
    .portal-hamburger:hover {
      background: rgba(255,255,255,0.08);
      color: var(--text-primary);
    }
    @media (min-width: 768px) {
      .portal-hamburger { display: none; }
    }

    /* ── Mobile Nav Dropdown ────────────────────────────────────── */
    .portal-mobile-nav {
      position: fixed;
      top: 68px;
      left: 0;
      width: 100%;
      height: 0;
      background: var(--bg-secondary);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid var(--border);
      z-index: 99;
      overflow: hidden;
      transition: height 0.32s cubic-bezier(0.16,1,0.3,1);
    }
    .portal-mobile-nav.open {
      height: auto;
      min-height: 220px;
    }
    .portal-mobile-links {
      display: flex;
      flex-direction: column;
      padding: 1.25rem 1.5rem;
      gap: 0.5rem;
    }
    .portal-mobile-links a {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border-radius: 10px;
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.95rem;
      text-decoration: none;
      transition: all 0.2s;
    }
    .portal-mobile-links a:hover,
    .portal-mobile-links a.active {
      color: var(--accent);
      background: rgba(20,184,166,0.08);
    }
    .mobile-logout-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      border-radius: 10px;
      color: #ef4444;
      font-weight: 600;
      font-size: 0.95rem;
      background: rgba(239,68,68,0.06);
      border: 1px solid rgba(239,68,68,0.15);
      cursor: pointer;
      transition: all 0.2s;
      margin-top: 0.5rem;
    }
    .mobile-logout-btn:hover {
      background: rgba(239,68,68,0.15);
    }

    /* ── Main Content ───────────────────────────────────────────── */
    .portal-main {
      flex: 1;
      padding: 2.5rem 0;
      position: relative;
    }
    .portal-container {
      width: 100%;
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1.25rem;
    }
    .portal-main.chat-main { padding: 0; flex: 1; display: flex; flex-direction: column; }
    .portal-container.chat-container {
      max-width: 100% !important;
      width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      display: flex !important;
      flex-direction: column !important;
      flex: 1 !important;
      align-items: stretch !important;
    }

    /* ── Footer ─────────────────────────────────────────────────── */
    .portal-footer {
      background: var(--bg-primary);
      border-top: 1px solid var(--border);
      padding: 1.2rem 0;
    }
    .portal-footer-inner {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.78rem;
      color: var(--text-muted);
    }
    .portal-footer-inner strong { color: var(--text-secondary); }
    .footer-live-badge {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-family: var(--font-mono);
      font-size: 0.68rem;
      letter-spacing: 0.05em;
      color: #10b981;
    }
    .live-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
      animation: liveDotPulse 1.8s ease-in-out infinite;
    }
    @keyframes liveDotPulse {
      0%,100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
  `]
})
export class PortalLayoutComponent {
  authService   = inject(AuthService);
  private router = inject(Router);
  mobileNavOpen = signal(false);

  currentTheme = signal<string>('dark');
  themes = [
    { id: 'light',  label: 'Light Mode',      color: '#F4F6F9', glow: 'rgba(244,246,249,0.6)' },
    { id: 'dark',   label: 'Dark Mode',       color: '#020510', glow: 'rgba(59,130,246,0.6)'  },
    { id: 'cyber',  label: 'Cyberpunk',        color: '#FF007F', glow: 'rgba(255,0,127,0.6)'   },
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('orbitops-theme') || 'dark';
      this.applyTheme(saved);
    }
  }

  setTheme(themeId: string) {
    this.applyTheme(themeId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('orbitops-theme', themeId);
    }
  }

  private applyTheme(themeId: string) {
    this.currentTheme.set(themeId);
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeId);
    }
  }

  onLogout() {
    this.authService.logout();
  }

  isChatPage(): boolean {
    return this.router.url.includes('/portal/chat');
  }

  toggleMobileNav() {
    this.mobileNavOpen.update(v => !v);
  }

  closeMobileNav() {
    this.mobileNavOpen.set(false);
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'Admin':     return '#f59e0b';
      case 'Engineer':  return '#3b82f6';
      case 'Client':    return '#10b981';
      case 'SubClient': return '#8b5cf6';
      default:          return '#6b7280';
    }
  }
}
