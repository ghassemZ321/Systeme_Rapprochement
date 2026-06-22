import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ReconciliationSummary } from '../../models/models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  jobs: ReconciliationSummary[] = [];
  jobsFiltres: ReconciliationSummary[] = [];
  loading = true;
  generating: number | null = null;
  error = '';
  success = '';

  // Pagination
  currentPage = 0;
  pageSize = 5;
  totalPages = 0;
  jobsPage: ReconciliationSummary[] = [];

  // Filtres date
  dateDebut = '';
  dateFin = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.loading = true;
    this.api.getJobs().subscribe({
      next: (j) => {
        this.jobs = j;
        this.appliquerFiltres();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  appliquerFiltres(): void {
    this.currentPage = 0;
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
    this.totalPages = Math.ceil(this.jobsFiltres.length / this.pageSize);
    this.mettreAJourPage();
  }

  reinitialiserFiltres(): void {
    this.dateDebut = '';
    this.dateFin = '';
    this.appliquerFiltres();
  }

  mettreAJourPage(): void {
    const debut = this.currentPage * this.pageSize;
    const fin = debut + this.pageSize;
    this.jobsPage = this.jobsFiltres.slice(debut, fin);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.mettreAJourPage();
    }
  }

  getPages(): number[] {
    const pages: number[] = [];
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
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
        this.success = `Rapport ${cutOffId} telecharge avec succes.`;
        this.generating = null;
      },
      error: () => {
        this.error = 'Erreur lors de la generation du rapport.';
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