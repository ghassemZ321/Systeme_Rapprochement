import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { BatchSummary, ReconciliationSummary, ReconResult } from '../../models/models';

@Component({
  selector: 'app-reconciliation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reconciliation.component.html',
  styleUrls: ['./reconciliation.component.css']
})
export class ReconciliationComponent implements OnInit {
  batches: BatchSummary[] = [];
  jobs: ReconciliationSummary[] = [];
  results: ReconResult[] = [];

  selectedBatchId: number | null = null;
  selectedJobId: number | null = null;

  loadingBatches = true;
  loadingJobs = false;
  loadingResults = false;
  running = false;

  error = '';
  success = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadBatches();
    this.loadJobs();
  }

  loadBatches(): void {
    this.api.getBatches().subscribe({
      next: (b) => {
        this.batches = b.filter(batch => batch.status === 'IMPORTED');
        this.loadingBatches = false;
      },
      error: () => { this.loadingBatches = false; }
    });
  }

  loadJobs(): void {
    this.loadingJobs = true;
    this.api.getJobs().subscribe({
      next: (j) => { this.jobs = j; this.loadingJobs = false; },
      error: () => { this.loadingJobs = false; }
    });
  }

  runReconciliation(): void {
    if (!this.selectedBatchId) return;
    this.running = true;
    this.error = '';
    this.success = '';

    this.api.runReconciliation(this.selectedBatchId).subscribe({
      next: (summary) => {
        this.success = `Rapprochement terminé — Conformes: ${summary.totalConforme} | Non conformes: ${summary.totalNonConforme}`;
        this.running = false;
        this.selectedBatchId = null;
        this.loadBatches();
        this.loadJobs();
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Erreur lors du rapprochement.';
        this.running = false;
      }
    });
  }

  loadResults(jobId: number): void {
    this.selectedJobId = jobId;
    this.loadingResults = true;
    this.results = [];

    this.api.getResults(jobId).subscribe({
      next: (r) => { this.results = r; this.loadingResults = false; },
      error: () => { this.loadingResults = false; }
    });
  }

  get conformeCount(): number {
    return this.results.filter(r => r.conformite === 'CONFORME').length;
  }

  get nonConformeCount(): number {
    return this.results.filter(r => r.conformite === 'NON_CONFORME').length;
  }

  getStatusBadge(val: string): string {
    switch (val) {
      case 'CONFORME': return 'badge badge-conforme';
      case 'NON_CONFORME': return 'badge badge-non-conforme';
      case 'COMPLETED': return 'badge badge-reconciled';
      case 'ERROR': return 'badge badge-error';
      default: return 'badge';
    }
  }

  getStatusLabel(val: string): string {
    switch (val) {
      case 'CONFORME': return 'Conforme';
      case 'NON_CONFORME': return 'Non conforme';
      case 'COMPLETED': return 'Terminé';
      case 'ERROR': return 'Erreur';
      default: return val;
    }
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR');
  }
}
