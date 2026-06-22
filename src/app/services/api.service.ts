import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ImportResponse, BatchSummary,
  ReconciliationSummary, ReconResult,
  UserResponse, CreateUserRequest,
  Config, UpdateConfigRequest,
  AuditLog, DashboardStats
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private base = 'http://localhost:8090/api';

  constructor(private http: HttpClient) {}

  // ── Import ──────────────────────────────────────────────
  uploadFile(file: File, cutOffId: string): Observable<ImportResponse> {
    const form = new FormData();
    form.append('file', file);
    form.append('cutOffId', cutOffId);
    return this.http.post<ImportResponse>(`${this.base}/import/upload`, form);
  }

  getBatches(): Observable<BatchSummary[]> {
    return this.http.get<BatchSummary[]>(`${this.base}/import/batches`);
  }

  getBatchById(id: number): Observable<BatchSummary> {
    return this.http.get<BatchSummary>(`${this.base}/import/batch/${id}`);
  }

  // ── Batch Admin ─────────────────────────────────────────
  annulerBatch(id: number): Observable<any> {
    return this.http.put(`${this.base}/admin/batch/${id}/annuler`, {});
  }

  supprimerBatch(id: number): Observable<any> {
    return this.http.delete(`${this.base}/admin/batch/${id}/supprimer`);
  }

  // ── Reconciliation ──────────────────────────────────────
  runReconciliation(batchId: number): Observable<ReconciliationSummary> {
    return this.http.post<ReconciliationSummary>(
      `${this.base}/reconciliation/run/${batchId}`, {});
  }

  getJobs(): Observable<ReconciliationSummary[]> {
    return this.http.get<ReconciliationSummary[]>(`${this.base}/reconciliation/jobs`);
  }

  getJobById(jobId: number): Observable<ReconciliationSummary> {
    return this.http.get<ReconciliationSummary>(
      `${this.base}/reconciliation/job/${jobId}`);
  }

  getResults(jobId: number): Observable<ReconResult[]> {
    return this.http.get<ReconResult[]>(
      `${this.base}/reconciliation/result/${jobId}`);
  }

  // ── Report ──────────────────────────────────────────────
  generateReport(jobId: number): Observable<Blob> {
    return this.http.get(`${this.base}/reports/generate/${jobId}`,
      { responseType: 'blob' });
  }

  // ── Users ───────────────────────────────────────────────
  getUsers(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.base}/admin/users`);
  }

  createUser(request: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.base}/admin/users`, request);
  }

  toggleUser(id: number): Observable<UserResponse> {
    return this.http.put<UserResponse>(
      `${this.base}/admin/users/${id}/toggle`, {});
  }

  resetPassword(id: number): Observable<string> {
    return this.http.put(`${this.base}/admin/users/${id}/reset-password`, {},
      { responseType: 'text' });
  }

  // ── Config ──────────────────────────────────────────────
  getConfigs(): Observable<Config[]> {
    return this.http.get<Config[]>(`${this.base}/admin/config`);
  }

  updateConfig(key: string, value: string): Observable<Config> {
    return this.http.put<Config>(`${this.base}/admin/config/${key}`, { configValue: value });
  }

  // ── Audit ───────────────────────────────────────────────
  getAuditLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.base}/admin/audit`);
  }

  // ── Dashboard ───────────────────────────────────────────
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/dashboard/stats`);
  }
}