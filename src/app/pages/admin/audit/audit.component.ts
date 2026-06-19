import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { AuditLog } from '../../../models/models';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.css']
})
export class AuditComponent implements OnInit {
  logs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  loading = true;
  error = '';
  searchTerm = '';
  selectedAction = '';

  actions: string[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    this.api.getAuditLogs().subscribe({
      next: (logs) => {
        this.logs = logs;
        this.filteredLogs = logs;
        this.actions = [...new Set(logs.map(l => l.action))];
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  filter(): void {
    this.filteredLogs = this.logs.filter(l => {
      const matchSearch = !this.searchTerm ||
        l.username.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        l.details?.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchAction = !this.selectedAction || l.action === this.selectedAction;
      return matchSearch && matchAction;
    });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedAction = '';
    this.filteredLogs = this.logs;
  }

  getActionBadge(action: string): string {
    if (action.includes('LOGIN')) return 'badge badge-login';
    if (action.includes('IMPORT')) return 'badge badge-import';
    if (action.includes('RECON')) return 'badge badge-recon';
    if (action.includes('USER')) return 'badge badge-user';
    if (action.includes('CONFIG')) return 'badge badge-config';
    return 'badge badge-default';
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR');
  }
}
