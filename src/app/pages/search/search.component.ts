import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { BatchSummary } from '../../models/models';

interface SearchResult {
  switchRef: string;
  montantExcel: number;
  montantCore: number;
  trxStatus: string;
  presence: string;
  conformite: string;
  anomalyCode: string;
  anomalySeverity: string;
  details: string;
}

interface SearchResponse {
  content: SearchResult[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  batches: BatchSummary[] = [];
  results: SearchResult[] = [];

  selectedBatchId: number | null = null;
  switchRef = '';
  conformite = '';
  anomalyCode = '';
  montantMin: number | null = null;
  montantMax: number | null = null;

  loading = false;
  error = '';
  searched = false;

  currentPage = 0;
  pageSize = 50;
  totalElements = 0;
  totalPages = 0;

  anomalyCodes = [
    'MISSING_CORE', 'MISSING_EXCEL', 'AMOUNT_MISMATCH',
    'PHONE_MISMATCH', 'TYPE_MISMATCH', 'DATE_MISMATCH',
    'INST_MISMATCH', 'REJECTED', 'FAILED', 'INSTANCE',
    'NOT_SETTLED', 'PENDING', 'PROCESSING', 'CANCELLED', 'REVERSED'
  ];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getBatches().subscribe({
      next: (b) => { this.batches = b; },
      error: () => {}
    });
  }

  search(page: number): void {
    if (!this.selectedBatchId) return;
    this.loading = true;
    this.error = '';
    this.currentPage = page;

    const token = localStorage.getItem('token');
    let url = `http://localhost:8090/api/search/transactions?batchId=${this.selectedBatchId}&page=${page}&size=${this.pageSize}`;
    if (this.switchRef)   url += `&switchRef=${encodeURIComponent(this.switchRef)}`;
    if (this.conformite)  url += `&conformite=${this.conformite}`;
    if (this.anomalyCode) url += `&anomalyCode=${this.anomalyCode}`;
    if (this.montantMin != null) url += `&montantMin=${this.montantMin}`;
    if (this.montantMax != null) url += `&montantMax=${this.montantMax}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: SearchResponse) => {
        this.results = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.searched = true;
        this.loading = false;
      })
      .catch(() => {
        this.error = 'Erreur lors de la recherche.';
        this.loading = false;
      });
  }

  reset(): void {
    this.selectedBatchId = null;
    this.switchRef = '';
    this.conformite = '';
    this.anomalyCode = '';
    this.montantMin = null;
    this.montantMax = null;
    this.results = [];
    this.searched = false;
    this.error = '';
    this.currentPage = 0;
    this.totalElements = 0;
    this.totalPages = 0;
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.search(page);
    }
  }

  getPages(): number[] {
    const pages: number[] = [];
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages - 1, this.currentPage + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  exportCsv(): void {
    let url = `http://localhost:8090/api/search/transactions/export-csv?batchId=${this.selectedBatchId}`;
    if (this.switchRef)   url += `&switchRef=${encodeURIComponent(this.switchRef)}`;
    if (this.conformite)  url += `&conformite=${this.conformite}`;
    if (this.anomalyCode) url += `&anomalyCode=${this.anomalyCode}`;
    if (this.montantMin != null) url += `&montantMin=${this.montantMin}`;
    if (this.montantMax != null) url += `&montantMax=${this.montantMax}`;
    this.downloadFile(url, `export_batch_${this.selectedBatchId}.csv`);
  }

  exportXlsx(): void {
    let url = `http://localhost:8090/api/search/transactions/export-xlsx?batchId=${this.selectedBatchId}`;
    if (this.switchRef)   url += `&switchRef=${encodeURIComponent(this.switchRef)}`;
    if (this.conformite)  url += `&conformite=${this.conformite}`;
    if (this.anomalyCode) url += `&anomalyCode=${this.anomalyCode}`;
    if (this.montantMin != null) url += `&montantMin=${this.montantMin}`;
    if (this.montantMax != null) url += `&montantMax=${this.montantMax}`;
    this.downloadFile(url, `export_batch_${this.selectedBatchId}.xlsx`);
  }

  downloadFile(url: string, filename: string): void {
    const token = localStorage.getItem('token');
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.blob())
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => { this.error = 'Erreur lors du téléchargement.'; });
  }

  getConformiteBadge(val: string): string {
    return val === 'CONFORME' ? 'badge badge-conforme' : 'badge badge-non-conforme';
  }

  getSeverityBadge(val: string): string {
    switch (val) {
      case 'CRITIQUE': return 'badge badge-critique';
      case 'MAJEURE':  return 'badge badge-majeure';
      case 'MOYENNE':  return 'badge badge-moyenne';
      case 'MINEURE':  return 'badge badge-mineure';
      default:         return 'badge';
    }
  }

  formatMontant(val: number): string {
    if (val == null) return '—';
    return val.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' MRU';
  }
}