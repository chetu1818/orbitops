import { Component, signal, inject, HostListener, PLATFORM_ID, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PopupComponent } from './components/popup/popup.component';
import { Logo3dComponent } from './components/logo-3d/logo-3d.component';
import { LoaderComponent } from './components/loader/loader.component';
import { ChatbotComponent } from './components/chatbot/chatbot.component';
import { LoadingService } from './services/loading.service';
import { AuthService } from './services/auth.service';

export interface Theme {
  id: string;
  label: string;
  color: string;
  glow: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    PopupComponent,
    Logo3dComponent,
    LoaderComponent,
    ChatbotComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('OrbitOps');
  protected readonly loadingService = inject(LoadingService);
  protected readonly authService = inject(AuthService);
  protected readonly activeSection = signal('hero');
  protected readonly mobileMenuOpen = signal(false);
  protected readonly currentTheme = signal<string>('aurora');
  protected readonly showLandingLayout = signal(true);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly themes: Theme[] = [
    { id: 'nova',   label: 'Nova Void',       color: '#3b82f6', glow: 'rgba(59,130,246,0.6)'  },
    { id: 'cyber',  label: 'Cyberpunk',        color: '#FF007F', glow: 'rgba(255,0,127,0.6)'   },
    { id: 'aurora', label: 'Nordic Aurora',    color: '#10B981', glow: 'rgba(16,185,129,0.6)'  },
    { id: 'sunset', label: 'Sunset Horizon',   color: '#F97316', glow: 'rgba(249,115,22,0.6)'  },
  ];

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        const currentPath = this.router.url.split('#')[0];
        const targetPath = event.url.split('#')[0];
        if (currentPath !== targetPath) {
          this.loadingService.show();
        }
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        setTimeout(() => {
          this.loadingService.hide();
          this.updateActiveSection();
        }, 800);

        if (event instanceof NavigationEnd) {
          this.checkRouteVisibility(event.urlAfterRedirects);
        }
      }
    });
  }

  private checkRouteVisibility(url: string) {
    const cleanUrl = url.split('#')[0].split('?')[0];
    const isAuthOrPortal = cleanUrl.startsWith('/auth') || cleanUrl.startsWith('/portal');
    this.showLandingLayout.set(!isAuthOrPortal);
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem('orbitops-theme') || 'aurora';
      this.applyTheme(saved);
    }
    this.checkRouteVisibility(this.router.url);
  }

  setTheme(themeId: string) {
    this.applyTheme(themeId);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('orbitops-theme', themeId);
    }
  }

  private applyTheme(themeId: string) {
    this.currentTheme.set(themeId);
    if (isPlatformBrowser(this.platformId)) {
      document.documentElement.setAttribute('data-theme', themeId);
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.updateActiveSection();
  }

  private updateActiveSection() {
    if (!isPlatformBrowser(this.platformId)) return;
    const sectionIds = ['hero', 'services', 'how-it-works', 'integrations', 'portfolio', 'security', 'about', 'contact'];
    
    const threshold = 150;
    if ((window.innerHeight + window.scrollY) >= (document.documentElement.scrollHeight - threshold)) {
      this.activeSection.set('contact');
      return;
    }

    const scrollPosition = window.scrollY + 220;
    
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) {
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollPosition >= top && scrollPosition < top + height) {
          this.activeSection.set(id);
          break;
        }
      }
    }
  }
}
