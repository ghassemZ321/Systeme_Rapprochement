import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class ReconciliationComponent implements OnInit, OnDestroy {
  batches: BatchSummary[] = [];
  jobs: ReconciliationSummary[] = [];
  results: ReconResult[] = [];

  selectedBatchId: number | null = null;
  selectedJobId: number | null = null;
  selectedJob: ReconciliationSummary | null = null;

  loadingBatches = true;
  loadingJobs = false;
  loadingResults = false;
  running = false;

  error = '';
  success = '';

  // -- Filtres date historique --
  dateDebut = '';
  dateFin = '';

  // -- Pagination historique --
  jobsFiltres: ReconciliationSummary[] = [];
  jobsPage: ReconciliationSummary[] = [];
  jobCurrentPage = 0;
  jobPageSize = 5;
  jobTotalPages = 0;

  // -- Pagination resultats --
  currentPage = 0;
  pageSize = 50;
  totalElements = 0;
  totalPages = 0;

  // -- Progression --
  progressDone = 0;
  progressTotal = 0;
  progressPct = 0;
  progressInterval: any = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadBatches();
    this.loadJobs();
  }

  ngOnDestroy(): void {
    this.stopProgress();
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
      next: (j) => {
        this.jobs = j;
        this.appliquerFiltres();
        this.loadingJobs = false;
      },
      error: () => { this.loadingJobs = false; }
    });
  }

  // -- Filtres + Pagination --
  appliquerFiltres(): void {
    this.jobCurrentPage = 0;
    let liste = [...this.jobs];

    if (this.dateDebut) {
      const debut = new Date(this.dateDebut);
      liste = liste.filter(j => new Date(j.launchedAt) >= debut);
    }

    if (this.dateFin) {
      const fin = new Date(this.dateFin);
      fin.setHours(23, 59, 59);
      liste = liste.filter(j => new Date(j.launchedAt) <= fin);
    }

    this.jobsFiltres = liste;
    this.jobTotalPages = Math.ceil(this.jobsFiltres.length / this.jobPageSize);
    this.mettreAJourPage();
  }

  reinitialiserFiltres(): void {
    this.dateDebut = '';
    this.dateFin = '';
    this.appliquerFiltres();
  }

  mettreAJourPage(): void {
    const debut = this.jobCurrentPage * this.jobPageSize;
    const fin = debut + this.jobPageSize;
    this.jobsPage = this.jobsFiltres.slice(debut, fin);
  }

  goToJobPage(page: number): void {
    if (page >= 0 && page < this.jobTotalPages) {
      this.jobCurrentPage = page;
      this.mettreAJourPage();
    }
  }

  getJobPages(): number[] {
    const pages: number[] = [];
    const start = Math.max(0, this.jobCurrentPage - 2);
    const end = Math.min(this.jobTotalPages - 1, this.jobCurrentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  // -- Rapprochement --
  runReconciliation(): void {
    if (!this.selectedBatchId) return;
    this.running = true;
    this.error = '';
    this.success = '';
    this.progressDone = 0;
    this.progressTotal = 0;
    this.progressPct = 0;

    const batch = this.batches.find(b => b.id === this.selectedBatchId);
    this.progressTotal = batch?.totalRows || 0;

    this.api.runReconciliation(this.selectedBatchId).subscribe({
      next: (summary) => {
        this.stopProgress();
        this.progressPct = 100;
        this.progressDone = this.progressTotal;
        this.success = `Rapprochement termine - Conformes: ${summary.totalConforme} | Non conformes: ${summary.totalNonConforme}`;
        this.running = false;
        this.selectedBatchId = null;
        this.loadBatches();
        this.loadJobs();
        setTimeout(() => {
          this.progressPct = 0;
          this.progressDone = 0;
          this.progressTotal = 0;
        }, 5000);
      },
      error: (err: any) => {
        this.stopProgress();
        this.error = err.error?.message || 'Erreur lors du rapprochement.';
        this.running = false;
        this.progressPct = 0;
      }
    });

    this.startProgressSimulation();
  }

  startProgressSimulation(): void {
    let simulated = 0;
    const total = this.progressTotal || 1000;
    this.progressInterval = setInterval(() => {
      if (!this.running) { this.stopProgress(); return; }
      const remaining = total - simulated;
      const increment = Math.max(1, Math.floor(remaining * 0.08));
      simulated = Math.min(simulated + increment, total - 1);
      this.progressDone = simulated;
      this.progressPct = Math.round((simulated / total) * 100);
    }, 800);
  }

  stopProgress(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  // -- Resultats pagines --
  loadResults(jobId: number): void {
    this.selectedJobId = jobId;
    this.selectedJob = this.jobs.find(j => j.jobId === jobId) || null;
    this.currentPage = 0;
    this.results = [];
    this.loadPage(0);
  }

  loadPage(page: number): void {
    if (!this.selectedJobId) return;
    this.loadingResults = true;
    this.currentPage = page;

    const token = localStorage.getItem('token');
    const url = `http://localhost:8090/api/reconciliation/result/${this.selectedJobId}/page?page=${page}&size=${this.pageSize}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: any) => {
        this.results = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.loadingResults = false;
        setTimeout(() => {
          document.querySelector('.results-wrapper')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      })
      .catch(() => { this.loadingResults = false; });
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.loadPage(page);
    }
  }

  getPages(): number[] {
    const pages: number[] = [];
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  get conformeCount(): number { return this.selectedJob?.totalConforme || 0; }
  get nonConformeCount(): number { return this.selectedJob?.totalNonConforme || 0; }

  getConformiteBadge(val: string): string {
    return val === 'CONFORME' ? 'badge badge-conforme' : 'badge badge-non-conforme';
  }

  getStatusLabel(val: string): string {
    switch (val) {
      case 'CONFORME':     return 'Conforme';
      case 'NON_CONFORME': return 'Non conforme';
      case 'COMPLETED':    return 'Termine';
      case 'ERROR':        return 'Erreur';
      default:             return val;
    }
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR');
  }

  formatNumber(n: number): string {
    return (n || 0).toLocaleString('fr-FR');
  }
}