import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DashboardStats, BatchSummary, ReconciliationSummary } from '../../models/models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('donutChart') donutChartRef!: ElementRef;
  @ViewChild('barChart') barChartRef!: ElementRef;
  @ViewChild('lineChart') lineChartRef!: ElementRef;

  stats: DashboardStats | null = null;
  batches: BatchSummary[] = [];
  lastJob: ReconciliationSummary | null = null;
  loading = true;
  error = '';

  private donutChart: Chart | null = null;
  private barChart: Chart | null = null;
  private lineChart: Chart | null = null;
  private chartsReady = false;
  private dataReady = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    if (this.dataReady) {
      this.buildCharts();
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';
    this.dataReady = false;
    this.destroyCharts();

    this.api.getDashboardStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.tryBuildCharts();
      },
      error: () => {
        this.error = 'Erreur lors du chargement des statistiques.';
        this.loading = false;
      }
    });

    this.api.getBatches().subscribe({
      next: (batches) => {
        this.batches = batches.slice(0, 5);
        this.tryBuildCharts();
      },
      error: () => {}
    });

    this.api.getJobs().subscribe({
      next: (jobs) => {
        this.lastJob = jobs.length > 0 ? jobs[0] : null;
        this.loading = false;
        this.tryBuildCharts();
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  tryBuildCharts(): void {
    if (this.stats && this.batches.length >= 0 && !this.loading) {
      this.dataReady = true;
      if (this.chartsReady) {
        setTimeout(() => this.buildCharts(), 100);
      }
    }
  }

  buildCharts(): void {
    if (!this.stats) return;
    this.buildDonutChart();
    this.buildBarChart();
    this.buildLineChart();
  }

  buildDonutChart(): void {
    if (!this.donutChartRef) return;
    if (this.donutChart) this.donutChart.destroy();

    const ctx = this.donutChartRef.nativeElement.getContext('2d');
    this.donutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Conformes', 'Non conformes', 'Absentes Core', 'Absentes Excel'],
        datasets: [{
          data: [
            this.stats!.totalConformes,
            this.stats!.totalNonConformes - this.stats!.totalMissingCore - this.stats!.totalMissingExcel,
            this.stats!.totalMissingCore,
            this.stats!.totalMissingExcel
          ],
          backgroundColor: ['#22c55e', '#ef4444', '#f97316', '#3b82f6'],
          borderColor: ['#16a34a', '#dc2626', '#ea580c', '#2563eb'],
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 15, font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed as number;
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0';
                return ` ${ctx.label}: ${val.toLocaleString('fr-FR')} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  buildBarChart(): void {
    if (!this.barChartRef) return;
    if (this.barChart) this.barChart.destroy();

    const ctx = this.barChartRef.nativeElement.getContext('2d');
    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Critique', 'Majeure', 'Moyenne', 'Mineure'],
        datasets: [{
          label: 'Nombre d\'anomalies',
          data: [
            this.stats!.anomaliesCritiques,
            this.stats!.anomaliesMajeures,
            this.stats!.anomaliesMoyennes,
            this.stats!.anomaliesMineurs
          ],
          backgroundColor: [
            'rgba(239,68,68,0.8)',
            'rgba(249,115,22,0.8)',
            'rgba(234,179,8,0.8)',
            'rgba(59,130,246,0.8)'
          ],
          borderColor: ['#dc2626','#ea580c','#ca8a04','#2563eb'],
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${(ctx.parsed.y as number).toLocaleString('fr-FR')} anomalies`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              callback: (val) => Number(val).toLocaleString('fr-FR')
            }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  buildLineChart(): void {
    if (!this.lineChartRef) return;
    if (this.lineChart) this.lineChart.destroy();

    const ctx = this.lineChartRef.nativeElement.getContext('2d');
    const labels = this.batches.map(b => b.cutOffId);
    const data = this.batches.map(b => b.totalRows);

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Transactions importées',
          data,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#6366f1',
          pointRadius: 6,
          pointHoverRadius: 9,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${(ctx.parsed.y as number).toLocaleString('fr-FR')} transactions`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              callback: (val) => Number(val).toLocaleString('fr-FR')
            }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  destroyCharts(): void {
    if (this.donutChart) { this.donutChart.destroy(); this.donutChart = null; }
    if (this.barChart) { this.barChart.destroy(); this.barChart = null; }
    if (this.lineChart) { this.lineChart.destroy(); this.lineChart = null; }
  }

  getStatusBadge(status: string): string {
    switch (status) {
      case 'IMPORTED':   return 'badge badge-imported';
      case 'RECONCILED': return 'badge badge-reconciled';
      case 'IMPORTING':  return 'badge badge-importing';
      case 'ERROR':      return 'badge badge-error';
      default:           return 'badge';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'IMPORTED':   return 'Importé';
      case 'RECONCILED': return 'Rapproché';
      case 'IMPORTING':  return 'En cours';
      case 'ERROR':      return 'Erreur';
      case 'COMPLETED':  return 'Terminé';
      default:           return status;
    }
  }

  getSeverityClass(count: number, type: string): string {
    if (count === 0) return 'anomaly-zero';
    switch (type) {
      case 'critique': return 'anomaly-critique';
      case 'majeure':  return 'anomaly-majeure';
      case 'moyenne':  return 'anomaly-moyenne';
      case 'mineure':  return 'anomaly-mineure';
      default:         return '';
    }
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleString('fr-FR');
  }

  formatNumber(n: number): string {
    if (n === null || n === undefined) return '0';
    return n.toLocaleString('fr-FR');
  }
}