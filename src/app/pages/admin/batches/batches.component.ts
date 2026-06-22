import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { BatchSummary } from '../../../models/models';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-batches',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './batches.component.html',
  styleUrls: ['./batches.component.css']
})
export class BatchesComponent implements OnInit {
  batches: BatchSummary[] = [];
  loading = true;
  error = '';
  successMessage = '';
  actionLoading: number | null = null;

  // -- Filtres date --
  dateDebut = '';
  dateFin = '';

  // -- Pagination --
  batchesFiltres: BatchSummary[] = [];
  batchesPage: BatchSummary[] = [];
  currentPage = 0;
  pageSize = 8;
  totalPages = 0;

  // Modal confirmation
  showModal = false;
  modalAction: 'annuler' | 'supprimer' | null = null;
  selectedBatch: BatchSummary | null = null;

  isAdmin = false;

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit(): void {
    this.isAdmin = this.auth.getRole() === 'ADMIN';
    this.loadBatches();
  }

  loadBatches(): void {
    this.loading = true;
    this.api.getBatches().subscribe({
      next: (data) => {
        this.batches = data;
        this.appliquerFiltres();
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur lors du chargement des batches.';
        this.loading = false;
      }
    });
  }

  // -- Filtres + Pagination --
  appliquerFiltres(): void {
    this.currentPage = 0;
    let liste = [...this.batches];

    if (this.dateDebut) {
      const debut = new Date(this.dateDebut);
      liste = liste.filter(b => new Date(b.importedAt) >= debut);
    }

    if (this.dateFin) {
      const fin = new Date(this.dateFin);
      fin.setHours(23, 59, 59);
      liste = liste.filter(b => new Date(b.importedAt) <= fin);
    }

    this.batchesFiltres = liste;
    this.totalPages = Math.ceil(this.batchesFiltres.length / this.pageSize);
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
    this.batchesPage = this.batchesFiltres.slice(debut, fin);
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

  // -- Modal --
  openModal(action: 'annuler' | 'supprimer', batch: BatchSummary): void {
    this.modalAction = action;
    this.selectedBatch = batch;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedBatch = null;
    this.modalAction = null;
  }

  confirmerAction(): void {
    if (!this.selectedBatch || !this.modalAction) return;
    const id = this.selectedBatch.id;
    this.actionLoading = id;
    this.closeModal();

    if (this.modalAction === 'annuler') {
      this.api.annulerBatch(id).subscribe({
        next: (res) => {
          this.successMessage = res.message || 'Batch annule avec succes.';
          this.actionLoading = null;
          this.loadBatches();
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Erreur lors de l\'annulation.';
          this.actionLoading = null;
          setTimeout(() => this.error = '', 5000);
        }
      });
    } else {
      this.api.supprimerBatch(id).subscribe({
        next: (res) => {
          this.successMessage = res.message || 'Batch supprime definitivement.';
          this.actionLoading = null;
          this.loadBatches();
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Erreur lors de la suppression.';
          this.actionLoading = null;
          setTimeout(() => this.error = '', 5000);
        }
      });
    }
  }

  canAnnuler(batch: BatchSummary): boolean {
    return batch.status === 'IMPORTED' || batch.status === 'ERROR';
  }

  canSupprimer(batch: BatchSummary): boolean {
    return batch.status !== 'RECONCILED';
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'IMPORTED':   return 'badge badge-imported';
      case 'RECONCILED': return 'badge badge-reconciled';
      case 'ERROR':      return 'badge badge-error';
      default:           return 'badge';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'IMPORTED':   return 'Importe';
      case 'RECONCILED': return 'Rapproche';
      case 'ERROR':      return 'Erreur';
      default:           return status;
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