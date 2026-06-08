import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ImportResponse, ReconciliationResponse, ResultDetail } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private baseUrl = 'http://localhost:8090/api';

  constructor(private http: HttpClient) {}

  importExcel(file: File): Observable<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResponse>(`${this.baseUrl}/import`, formData);
  }

  reconcile(importFileId: number): Observable<ReconciliationResponse> {
    return this.http.post<ReconciliationResponse>(
      `${this.baseUrl}/reconciliation/${importFileId}`, {});
  }

  getResults(jobId: number): Observable<ResultDetail[]> {
    return this.http.get<ResultDetail[]>(
      `${this.baseUrl}/reconciliation/${jobId}/results`);
  }

  downloadReport(jobId: number): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/reconciliation/${jobId}/report`,
      { responseType: 'blob' });
  }
}
