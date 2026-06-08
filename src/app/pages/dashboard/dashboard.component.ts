import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { ReconciliationResponse, ResultDetail } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {

  selectedFile: File | null = null;
  importFileId: number | null = null;
  jobId: number | null = null;
  summary: ReconciliationResponse | null = null;
  results: ResultDetail[] = [];
  message = '';
  loading = false;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  getFullName(): string {
    return this.authService.getFullName();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.message = `Fichier selectionne : ${this.selectedFile.name}`;
      this.cdr.detectChanges();
    }
  }

  onImport(): void {
    if (!this.selectedFile) {
      this.message = 'Veuillez selectionner un fichier';
      this.cdr.detectChanges();
      return;
    }
    this.loading = true;
    this.cdr.detectChanges();
    this.apiService.importExcel(this.selectedFile).subscribe({
      next: (res) => {
        this.importFileId = res.importFileId;
        this.message = `Import reussi : ${res.totalRows} lignes (fichier #${res.importFileId})`;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.message = 'Erreur lors de l\'import';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onReconcile(): void {
    if (this.importFileId === null) {
      this.message = 'Veuillez d\'abord importer un fichier';
      this.cdr.detectChanges();
      return;
    }
    this.loading = true;
    this.cdr.detectChanges();
    this.apiService.reconcile(this.importFileId).subscribe({
      next: (res) => {
        this.summary = res;
        this.jobId = res.jobId;
        this.message = 'Rapprochement termine';
        this.cdr.detectChanges();
        this.loadResults();
      },
      error: () => {
        this.message = 'Erreur lors du rapprochement';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadResults(): void {
    if (this.jobId === null) return;
    this.apiService.getResults(this.jobId).subscribe({
      next: (res) => {
        this.results = res;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.message = 'Erreur lors du chargement des resultats';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onDownloadReport(): void {
    if (this.jobId === null) return;
    this.apiService.downloadReport(this.jobId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_job_${this.jobId}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.message = 'Erreur lors du telechargement';
        this.cdr.detectChanges();
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'MATCHED': return 'status-matched';
      case 'AMOUNT_MISMATCH': return 'status-mismatch';
      case 'EXCEL_ONLY': return 'status-excel';
      case 'ORACLE_ONLY': return 'status-oracle';
      default: return '';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getInitials(): string {
    const name = this.authService.getFullName();
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'MATCHED': return 'Conforme';
      case 'AMOUNT_MISMATCH': return 'Écart montant';
      case 'EXCEL_ONLY': return 'Excel uniquement';
      case 'ORACLE_ONLY': return 'Oracle uniquement';
      default: return status;
    }
  }


}
