import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/auth/login.component';
import { RegisterComponent } from './components/auth/register.component';
import { EngineerLoginComponent } from './components/auth/engineer-login.component';
import { PortalLayoutComponent } from './components/portal/portal-layout.component';
import { PortalHomeComponent } from './components/portal/portal-home.component';
import { WizardComponent } from './components/portal/wizard.component';
import { ChatComponent } from './components/portal/chat.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth/login', component: LoginComponent },
  { path: 'auth/register', component: RegisterComponent },
  { path: 'auth/engineer-login', component: EngineerLoginComponent },
  {
    path: 'portal',
    component: PortalLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: PortalHomeComponent },
      { path: 'new-order', component: WizardComponent },
      { path: 'chat', component: ChatComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
