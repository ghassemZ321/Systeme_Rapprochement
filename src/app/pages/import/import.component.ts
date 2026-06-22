import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { BatchSummary, ImportResponse } from '../../models/models';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './import.component.html',
  styleUrl: './import.component.css'
})
export class ImportComponent implements OnInit {
  selectedFile: File | null = null;
  cutOffId = '';
  loading = false;
  result: ImportResponse | null = null;
  error = '';
  isDragging = false;

  // -- Toutes les donnees --
  batches: BatchSummary[] = [];
  loadingBatches = true;

  // -- Filtres date --
  dateDebut = '';
  dateFin = '';

  // -- Pagination --
  batchesFiltres: BatchSummary[] = [];
  batchesPage: BatchSummary[] = [];
  currentPage = 0;
  pageSize = 5;
  totalPages = 0;

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.loadBatches(); }

  loadBatches(): void {
    this.loadingBatches = true;
    this.api.getBatches().subscribe({
      next: (b) => {
        this.batches = b;
        this.appliquerFiltres();
        this.loadingBatches = false;
      },
      error: () => { this.loadingBatches = false; }
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

  // -- Upload --
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.setFile(input.files[0]);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.setFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  setFile(file: File): void {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.csv')) {
      this.error = 'Format non supporte. Utilisez .xlsx ou .csv';
      return;
    }
    this.selectedFile = file;
    this.error = '';
    this.result = null;
  }

  onImport(): void {
    if (!this.selectedFile) { this.error = 'Veuillez selectionner un fichier'; return; }
    if (!this.cutOffId.trim()) { this.error = 'Le CUT_OFF_ID est obligatoire'; return; }

    this.error = '';
    this.result = null;
    this.loading = true;

    this.api.uploadFile(this.selectedFile, this.cutOffId.trim()).subscribe({
      next: (res) => {
        this.loading = false;
        this.result = res;
        if (res.status === 'IMPORTED') {
          this.loadBatches();
          this.selectedFile = null;
          this.cutOffId = '';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || "Erreur lors de l'import";
      }
    });
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'IMPORTED':   return 'badge-info';
      case 'RECONCILED': return 'badge-success';
      case 'ERROR':      return 'badge-danger';
      case 'IMPORTING':  return 'badge-warning';
      default:           return 'badge-gray';
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}