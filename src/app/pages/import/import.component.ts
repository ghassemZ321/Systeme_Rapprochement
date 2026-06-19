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
  batches: BatchSummary[] = [];
  loadingBatches = true;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    this.api.getBatches().subscribe({
      next: (b) => { this.batches = b; this.loadingBatches = false; },
      error: () => { this.loadingBatches = false; }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const name = file.name.toLowerCase();
      if (!name.endsWith('.xlsx') && !name.endsWith('.csv')) {
        this.error = 'Format non supporté. Utilisez .xlsx ou .csv';
        return;
      }
      this.selectedFile = file;
      this.error = '';
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) {
      const name = file.name.toLowerCase();
      if (!name.endsWith('.xlsx') && !name.endsWith('.csv')) {
        this.error = 'Format non supporté. Utilisez .xlsx ou .csv';
        return;
      }
      this.selectedFile = file;
      this.error = '';
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onImport(): void {
    if (!this.selectedFile) {
      this.error = 'Veuillez sélectionner un fichier';
      return;
    }
    if (!this.cutOffId.trim()) {
      this.error = 'Le CUT_OFF_ID est obligatoire';
      return;
    }

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
        this.error = err.error?.message || 'Erreur lors de l\'import';
      }
    });
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'IMPORTED': return 'badge-info';
      case 'RECONCILED': return 'badge-success';
      case 'ERROR': return 'badge-danger';
      default: return 'badge-gray';
    }
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
}
