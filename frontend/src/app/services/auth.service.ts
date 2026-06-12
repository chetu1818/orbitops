import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { resolveApiUrl } from '../utils/api';

export interface ClientUser {
  id: string;
  name: string;
  email: string;
  company: string;
  role: string; // 'Client' | 'SubClient' | 'Engineer' | 'Admin'
  isAvailable?: boolean;
  currentStatus?: string;
}

export interface AuthResponse {
  token: string;
  user: ClientUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = resolveApiUrl('/api/auth', 'http://localhost:5015/api/auth');

  currentUser = signal<ClientUser | null>(null);

  constructor() {
    this.loadSession();
  }

  private getHeaders() {
    const token = this.getToken();
    return new HttpHeaders().set('Authorization', token ? `Bearer ${token}` : '');
  }

  register(name: string, email: string, company: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, { name, email, company, password }).pipe(
      tap(res => this.setSession(res))
    );
  }

  login(email: string, password: string): Observable<any> {
    // Returns { twoFactorRequired: true, email: string } OR { twoFactorRequired: false, token: string, user: ClientUser }
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        if (res && res.twoFactorRequired === false) {
          this.setSession(res);
        }
      })
    );
  }

  engineerLogin(email: string, password: string): Observable<any> {
    // Returns { twoFactorRequired: true, email: string } OR { twoFactorRequired: false, token: string, user: ClientUser }
    return this.http.post<any>(`${this.apiUrl}/engineer-login`, { email, password }).pipe(
      tap(res => {
        if (res && res.twoFactorRequired === false) {
          this.setSession(res);
        }
      })
    );
  }

  verify2Fa(email: string, code: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify-2fa`, { email, code }).pipe(
      tap(res => this.setSession(res))
    );
  }

  logout() {
    localStorage.removeItem('orbitops_auth_token');
    localStorage.removeItem('orbitops_auth_user');
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('orbitops_auth_token');
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  addSubPerson(name: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add-sub-person`, { name, email, password }, { headers: this.getHeaders() });
  }

  addEngineer(name: string, email: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add-engineer`, { name, email, company: 'OrbitOps Architects', password }, { headers: this.getHeaders() });
  }

  getTeamMembers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/team`, { headers: this.getHeaders() });
  }

  getEngineers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/engineers`, { headers: this.getHeaders() });
  }

  updateEngineerStatus(status: string, isAvailable: boolean): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/engineer-status`, { status, isAvailable }, { headers: this.getHeaders() });
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/all-users`, { headers: this.getHeaders() });
  }

  updateUserStatus(userId: string, isEnabled: boolean): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/user-status`, { userId, isEnabled }, { headers: this.getHeaders() });
  }

  updateUserRole(userId: string, role: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/user-role`, { userId, role }, { headers: this.getHeaders() });
  }

  private setSession(auth: AuthResponse) {
    localStorage.setItem('orbitops_auth_token', auth.token);
    localStorage.setItem('orbitops_auth_user', JSON.stringify(auth.user));
    this.currentUser.set(auth.user);
  }

  private loadSession() {
    const userStr = localStorage.getItem('orbitops_auth_user');
    const token = localStorage.getItem('orbitops_auth_token');
    if (userStr && token) {
      try {
        this.currentUser.set(JSON.parse(userStr));
      } catch {
        this.logout();
      }
    }
  }
}
