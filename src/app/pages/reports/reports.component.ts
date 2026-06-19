import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { ReconciliationSummary } from '../../models/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  jobs: ReconciliationSummary[] = [];
  loading = true;
  generating: number | null = null;
  error = '';
  success = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.loading = true;
    this.api.getJobs().subscribe({
      next: (j) => { this.jobs = j; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  generateReport(jobId: number, cutOffId: string): void {
    this.generating = jobId;
    this.error = '';
    this.success = '';

    this.api.generateReport(jobId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_${cutOffId}_${jobId}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
        this.success = `Rapport ${cutOffId} téléchargé avec succès.`;
        this.generating = null;
      },
      error: () => {
        this.error = 'Erreur lors de la génération du rapport.';
        this.generating = null;
      }
    });
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR');
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'badge badge-completed';
      case 'ERROR': return 'badge badge-error';
      default: return 'badge';
    }
  }
}
