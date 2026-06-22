import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { BatchSummary } from '../../models/models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface PeriodeStats {
  batchId: number;
  totalTransactions: number;
  totalConformes: number;
  totalNonConformes: number;
  totalMissingCore: number;
  totalMissingExcel: number;
  tauxConformite: number;
  anomaliesCritiques: number;
  anomaliesMajeures: number;
  anomaliesMoyennes: number;
  anomaliesMineurs: number;
}

interface CompareResponse {
  periodeA: PeriodeStats;
  periodeB: PeriodeStats;
  differences: {
    deltaTotal: number;
    deltaConformes: number;
    deltaNonConformes: number;
    deltaTaux: number;
  };
}

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './compare.component.html',
  styleUrls: ['./compare.component.css']
})
export class CompareComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('compareChart') compareChartRef!: ElementRef;
  @ViewChild('trendChart') trendChartRef!: ElementRef;

  batches: BatchSummary[] = [];
  batchIdA: number | null = null;
  batchIdB: number | null = null;

  result: CompareResponse | null = null;
  loading = false;
  error = '';
  compared = false;

  private compareChart: Chart | null = null;
  private trendChart: Chart | null = null;
  private chartsReady = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getBatches().subscribe({
      next: (b) => { this.batches = b.filter(x => x.status === 'RECONCILED'); },
      error: () => {}
    });
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
  }

  ngOnDestroy(): void {
    if (this.compareChart) this.compareChart.destroy();
    if (this.trendChart)   this.trendChart.destroy();
  }

  compare(): void {
    if (!this.batchIdA || !this.batchIdB) return;
    if (this.batchIdA === this.batchIdB) {
      this.error = 'Veuillez sélectionner deux périodes différentes.';
      return;
    }
    this.loading = true;
    this.error = '';
    this.result = null;
    this.compared = false;

    const token = localStorage.getItem('token');
    const url = `http://localhost:8090/api/search/compare?batchIdA=${this.batchIdA}&batchIdB=${this.batchIdB}`;

    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then((data: CompareResponse) => {
        this.result = data;
        this.compared = true;
        this.loading = false;
        setTimeout(() => this.buildCharts(), 150);
      })
      .catch(() => {
        this.error = 'Erreur lors de la comparaison.';
        this.loading = false;
      });
  }

  reset(): void {
    this.batchIdA = null;
    this.batchIdB = null;
    this.result = null;
    this.compared = false;
    this.error = '';
    if (this.compareChart) { this.compareChart.destroy(); this.compareChart = null; }
    if (this.trendChart)   { this.trendChart.destroy();   this.trendChart = null; }
  }

  buildCharts(): void {
    if (!this.result) return;
    this.buildCompareChart();
    this.buildTrendChart();
  }

  buildCompareChart(): void {
    if (!this.compareChartRef) return;
    if (this.compareChart) this.compareChart.destroy();

    const labelA = this.getBatchLabel(this.batchIdA!);
    const labelB = this.getBatchLabel(this.batchIdB!);
    const ctx = this.compareChartRef.nativeElement.getContext('2d');

    this.compareChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Total', 'Conformes', 'Non conformes', 'Missing Core', 'Missing Excel'],
        datasets: [
          {
            label: labelA,
            data: [
              this.result!.periodeA.totalTransactions,
              this.result!.periodeA.totalConformes,
              this.result!.periodeA.totalNonConformes,
              this.result!.periodeA.totalMissingCore,
              this.result!.periodeA.totalMissingExcel
            ],
            backgroundColor: 'rgba(99,102,241,0.8)',
            borderColor: '#4f46e5',
            borderWidth: 2,
            borderRadius: 6
          },
          {
            label: labelB,
            data: [
              this.result!.periodeB.totalTransactions,
              this.result!.periodeB.totalConformes,
              this.result!.periodeB.totalNonConformes,
              this.result!.periodeB.totalMissingCore,
              this.result!.periodeB.totalMissingExcel
            ],
            backgroundColor: 'rgba(249,115,22,0.8)',
            borderColor: '#ea580c',
            borderWidth: 2,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${(ctx.parsed.y as number).toLocaleString('fr-FR')}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: { callback: (val) => Number(val).toLocaleString('fr-FR') }
          },
          x: { grid: { display: false } }
        }
      }
    });
  }

  buildTrendChart(): void {
    if (!this.trendChartRef) return;
    if (this.trendChart) this.trendChart.destroy();

    const labelA = this.getBatchLabel(this.batchIdA!);
    const labelB = this.getBatchLabel(this.batchIdB!);
    const ctx = this.trendChartRef.nativeElement.getContext('2d');

    this.trendChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Conformes', 'Non conformes', 'Missing Core', 'Missing Excel', 'Critiques', 'Majeures'],
        datasets: [
          {
            label: labelA,
            data: [
              this.result!.periodeA.totalConformes,
              this.result!.periodeA.totalNonConformes,
              this.result!.periodeA.totalMissingCore,
              this.result!.periodeA.totalMissingExcel,
              this.result!.periodeA.anomaliesCritiques,
              this.result!.periodeA.anomaliesMajeures
            ],
            backgroundColor: 'rgba(99,102,241,0.2)',
            borderColor: '#6366f1',
            borderWidth: 2,
            pointBackgroundColor: '#6366f1'
          },
          {
            label: labelB,
            data: [
              this.result!.periodeB.totalConformes,
              this.result!.periodeB.totalNonConformes,
              this.result!.periodeB.totalMissingCore,
              this.result!.periodeB.totalMissingExcel,
              this.result!.periodeB.anomaliesCritiques,
              this.result!.periodeB.anomaliesMajeures
            ],
            backgroundColor: 'rgba(249,115,22,0.2)',
            borderColor: '#f97316',
            borderWidth: 2,
            pointBackgroundColor: '#f97316'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } }
      }
    });
  }

  getBatchLabel(id: number): string {
    const b = this.batches.find(x => x.id === id);
    return b ? b.cutOffId : `Batch ${id}`;
  }

  getDeltaClass(val: number, inverse = false): string {
    if (val === 0) return 'delta-neutral';
    const positive = inverse ? val < 0 : val > 0;
    return positive ? 'delta-positive' : 'delta-negative';
  }

  getDeltaIcon(val: number, inverse = false): string {
    if (val === 0) return 'fa-minus';
    const positive = inverse ? val < 0 : val > 0;
    return positive ? 'fa-arrow-up' : 'fa-arrow-down';
  }

  formatNumber(n: number): string {
    if (n == null) return '0';
    return n.toLocaleString('fr-FR');
  }

  formatDelta(n: number): string {
    if (n == null) return '0';
    return (n > 0 ? '+' : '') + n.toLocaleString('fr-FR');
  }
}