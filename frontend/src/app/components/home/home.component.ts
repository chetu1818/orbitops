import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../hero/hero.component';
import { ServicesComponent } from '../services/services.component';
import { HowItWorksComponent } from '../how-it-works/how-it-works.component';
import { IntegrationsComponent } from '../integrations/integrations.component';
import { PortfolioComponent } from '../portfolio/portfolio.component';
import { SecurityComponent } from '../security/security.component';
import { AboutComponent } from '../about/about.component';
import { ContactComponent } from '../contact/contact.component';
import { DataTransformComponent } from '../data-transform/data-transform.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroComponent,
    ServicesComponent,
    DataTransformComponent,
    HowItWorksComponent,
    IntegrationsComponent,
    PortfolioComponent,
    SecurityComponent,
    AboutComponent,
    ContactComponent
  ],
  template: `
    <app-hero id="hero"></app-hero>
    <app-services id="services"></app-services>
    <app-data-transform id="data-transform"></app-data-transform>
    <app-how-it-works id="how-it-works"></app-how-it-works>
    <app-integrations id="integrations"></app-integrations>
    <app-portfolio id="portfolio"></app-portfolio>
    <app-security id="security"></app-security>
    <app-about id="about"></app-about>
    <app-contact id="contact"></app-contact>
  `
})
export class HomeComponent {}



