import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScrollAnimateDirective } from '../../directives/scroll-animate.directive';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, ScrollAnimateDirective],
  template: `
    <section class="section security-page page-fade-in">
      <div class="container">
        <div class="section-header" appScrollAnimate>
          <span class="badge">Compliance Core</span>
          <h2>Security & Compliance</h2>
          <p>Enterprise data privacy is built into every low-code pipeline and custom proxy API we deploy.</p>
        </div>

        <div class="grid grid-cols-2">
          <div class="card security-card" appScrollAnimate class="delay-100">
            <h3>IPsec VPN Tunneling</h3>
            <p>
              We route all database synchronization queries through secure VPN tunnels, 
              preventing operational data from passing over public internet paths.
            </p>
          </div>

          <div class="card security-card" appScrollAnimate class="delay-200">
            <h3>AES-256 Secret Encryption</h3>
            <p>
              Workflow secrets, credentials, and access tokens are encrypted at rest 
              using AES-256 and rotated periodically following SOC2 alignment models.
            </p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .security-page {
      background: var(--bg-primary);
    }
    .security-card h3 {
      font-size: 1.4rem;
      margin-bottom: 0.75rem;
      color: var(--text-primary);
    }
    .security-card p {
      color: var(--text-secondary);
      font-size: 0.95rem;
    }
  `]
})
export class SecurityComponent {}
