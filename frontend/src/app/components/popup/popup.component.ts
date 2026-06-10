import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="showPopup" class="modal-backdrop">
      <div class="modal-content card">
        <button (click)="closePopup()" class="close-btn" aria-label="Close modal">&times;</button>
        
        <div class="modal-body">
          <span class="badge">Inaugural Launch Offer</span>
          <h3>Your 1st Scenario is <span class="gradient-text">Free</span></h3>
          <p class="modal-description">
            To celebrate our startup launch, we are building one workflow automation scenario (Make.com or n8n) 
            completely free for our first 50 B2B clients. 
          </p>
          <div class="modal-actions">
            <button (click)="claimOffer()" class="btn btn-primary btn-block">Claim Free Scenario</button>
            <button (click)="closePopup()" class="btn btn-secondary btn-block">Maybe Later</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(3, 7, 18, 0.8);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: modalFadeIn 0.3s ease-out forwards;
    }
    .modal-content {
      width: 90%;
      max-width: 480px;
      padding: 3rem 2.5rem;
      border-color: rgba(16, 185, 129, 0.2);
      box-shadow: 0 30px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.1);
      position: relative;
      animation: modalScaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .close-btn {
      position: absolute;
      top: 1.5rem;
      right: 1.5rem;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      font-size: 1.75rem;
      cursor: pointer;
      line-height: 1;
      transition: color 0.2s ease;
    }
    .close-btn:hover {
      color: white;
    }
    .modal-body {
      text-align: center;
    }
    .modal-body h3 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    .modal-description {
      color: var(--text-secondary);
      font-size: 0.95rem;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    .modal-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    @keyframes modalFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes modalScaleUp {
      from { transform: scale(0.92); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class PopupComponent implements OnInit {
  private router = inject(Router);
  showPopup = false;

  ngOnInit() {
    // Check if modal was already dismissed this session to prevent spamming
    const dismissed = sessionStorage.getItem('orbitops_popup_dismissed');
    if (!dismissed) {
      setTimeout(() => {
        this.showPopup = true;
      }, 700);
    }
  }

  closePopup() {
    this.showPopup = false;
    sessionStorage.setItem('orbitops_popup_dismissed', 'true');
  }

  claimOffer() {
    this.closePopup();
    this.router.navigate(['/'], { fragment: 'contact' });
  }
}
