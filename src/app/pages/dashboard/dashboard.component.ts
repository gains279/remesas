import { Component, inject, computed, ViewChild, ElementRef, AfterViewInit, effect, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DataService } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { Chart, registerables } from 'chart.js';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-8">
      <h2 class="text-2xl font-display font-bold text-slate-800">Dashboard</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-100/80 transition-all hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div class="flex items-center gap-5">
            <div class="w-14 h-14 rounded-2xl bg-indigo-50/80 flex items-center justify-center text-indigo-600 border border-indigo-100/50">
              <mat-icon class="text-[28px] w-[28px] h-[28px]">send</mat-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500 mb-0.5">Total Remesas</p>
              <p class="text-3xl font-display font-bold text-slate-800">{{ totalRemittances() }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-100/80 transition-all hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div class="flex items-center gap-5">
            <div class="w-14 h-14 rounded-2xl bg-emerald-50/80 flex items-center justify-center text-emerald-600 border border-emerald-100/50">
              <mat-icon class="text-[28px] w-[28px] h-[28px]">account_balance_wallet</mat-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500 mb-0.5">Volumen Enviado (USD)</p>
              <p class="text-3xl font-display font-bold text-slate-800">{{ totalVolume() | currency:'USD' }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-100/80 transition-all hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          <div class="flex items-center gap-5">
            <div class="w-14 h-14 rounded-2xl bg-amber-50/80 flex items-center justify-center text-amber-600 border border-amber-100/50">
              <mat-icon class="text-[28px] w-[28px] h-[28px]">swap_horiz</mat-icon>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-500 mb-0.5">Pares Activos</p>
              <p class="text-3xl font-display font-bold text-slate-800">{{ activePairs() }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white p-8 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-100/80">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h3 class="text-xl font-display font-bold text-slate-800">Fluctuación de Tasas de Cambio</h3>
          <select #pairSelect (change)="selectedPairId = pairSelect.value; updateChart()" class="px-5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow cursor-pointer">
            @for (pair of dataService.pairs(); track pair.id) {
              <option [value]="pair.id">{{ pair.base }}/{{ pair.quote }}</option>
            }
          </select>
        </div>
        <div class="h-[350px] w-full">
          <canvas #chartCanvas></canvas>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements AfterViewInit {
  dataService = inject(DataService);
  platformId = inject(PLATFORM_ID);
  
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  chart: Chart | null = null;
  selectedPairId = this.dataService.pairs()[0]?.id;

  totalRemittances = computed(() => this.dataService.remittances().length);
  
  totalVolume = computed(() => {
    return this.dataService.remittances().reduce((sum, r) => {
      // Assuming all sent amounts are converted to USD for volume calculation if needed, 
      // but for simplicity we just sum if base is USD, else we might need conversion.
      // Let's just sum amountSent for now.
      return sum + r.amountSent;
    }, 0);
  });

  activePairs = computed(() => this.dataService.pairs().length);

  constructor() {
    effect(() => {
      // Re-render chart if pairs change
      this.dataService.pairs();
      if (this.chart && isPlatformBrowser(this.platformId)) {
        this.updateChart();
      }
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initChart();
    }
  }

  initChart() {
    Chart.register(...registerables);
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Tasa de Cambio',
          data: [],
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: false }
        }
      }
    });
    this.updateChart();
  }

  updateChart() {
    if (!this.chart || !this.selectedPairId) return;
    
    const pair = this.dataService.pairs().find(p => p.id === this.selectedPairId);
    if (pair) {
      this.chart.data.labels = pair.history.map(h => new Date(h.date).toLocaleDateString());
      this.chart.data.datasets[0].data = pair.history.map(h => h.rate);
      this.chart.update();
    }
  }
}
