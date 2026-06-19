import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, ChangePasswordRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = 'http://localhost:8090/api/auth';

  constructor(private http: HttpClient) {}

  login(request: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, request).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('username', response.username);
        localStorage.setItem('fullName', response.fullName);
        localStorage.setItem('role', response.role);
        localStorage.setItem('mustChangePwd', String(response.mustChangePwd));
      })
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<string> {
    return this.http.post(`${this.apiUrl}/change-password`, request,
      { responseType: 'text' });
  }

  logout(): void {
    localStorage.clear();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return this.getToken() !== null;
  }

  getUsername(): string {
    return localStorage.getItem('username') || '';
  }

  getFullName(): string {
    return localStorage.getItem('fullName') || '';
  }

  getRole(): string {
    return localStorage.getItem('role') || '';
  }

  mustChangePwd(): boolean {
    return localStorage.getItem('mustChangePwd') === 'true';
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  isSuperviseur(): boolean {
    return this.getRole() === 'SUPERVISEUR';
  }

  isAgent(): boolean {
    return this.getRole() === 'AGENT';
  }

  canReconcile(): boolean {
    return this.isAdmin() || this.isSuperviseur();
  }

  getInitials(): string {
    const name = this.getFullName();
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}
