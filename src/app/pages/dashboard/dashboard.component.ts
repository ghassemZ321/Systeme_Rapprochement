import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { BatchSummary, ReconciliationSummary } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  batches: BatchSummary[] = [];
  jobs: ReconciliationSummary[] = [];
  loading = true;
  error = '';

  totalBatches = 0;
  totalImported = 0;
  totalReconciled = 0;
  conformeRate = 0;
  lastJob: ReconciliationSummary | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    this.api.getBatches().subscribe({
      next: (batches) => {
        this.batches = batches;
        this.totalBatches = batches.length;
        this.totalImported = batches.filter(b => b.status === 'IMPORTED' || b.status === 'RECONCILED').length;
        this.totalReconciled = batches.filter(b => b.status === 'RECONCILED').length;

        this.api.getJobs().subscribe({
          next: (jobs) => {
            this.jobs = jobs;
            this.lastJob = jobs.length > 0 ? jobs[0] : null;
            if (this.lastJob) {
              const total = (this.lastJob.totalConforme || 0) + (this.lastJob.totalNonConforme || 0);
              this.conformeRate = total > 0 ? Math.round(((this.lastJob.totalConforme || 0) / total) * 100) : 0;
            }
            this.loading = false;
          },
          error: () => { this.loading = false; }
        });
      },
      error: () => {
        this.error = 'Erreur lors du chargement des données.';
        this.loading = false;
      }
    });
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'IMPORTED': return 'badge badge-imported';
      case 'RECONCILED': return 'badge badge-reconciled';
      case 'IMPORTING': return 'badge badge-importing';
      case 'ERROR': return 'badge badge-error';
      default: return 'badge';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'IMPORTED': return 'Importé';
      case 'RECONCILED': return 'Rapproché';
      case 'IMPORTING': return 'En cours';
      case 'ERROR': return 'Erreur';
      case 'COMPLETED': return 'Terminé';
      default: return status;
    }
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR');
  }
}
