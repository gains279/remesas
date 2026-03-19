import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profits',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 class="text-2xl font-bold text-slate-800">Ganancias Estimadas</h2>
        <div class="flex flex-wrap items-center gap-3 bg-white px-5 py-2.5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-100/50">
          <label for="refCurrency" class="text-sm font-medium text-slate-500">Moneda de Referencia:</label>
          <select id="refCurrency" [(ngModel)]="referenceCurrency" class="bg-slate-50/50 border border-slate-200/60 rounded-xl px-4 py-1.5 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer">
            @for (currency of dataService.currencies(); track currency) {
              <option [value]="currency">{{ currency }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Total Profit Card -->
      <div class="bg-gradient-to-br from-indigo-500 to-violet-600 p-8 sm:p-10 rounded-[2rem] shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden">
        <div class="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div class="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        
        <div class="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <p class="text-indigo-100 font-medium mb-2 opacity-90">Ganancia Total Estimada</p>
            <div class="flex items-end gap-3">
              <h3 class="text-5xl sm:text-6xl font-bold tracking-tight">{{ totalProfit() | number:'1.2-2' }}</h3>
              <span class="text-2xl font-medium text-indigo-200 mb-1.5">{{ referenceCurrency() }}</span>
            </div>
            <p class="text-sm text-indigo-200 mt-5 flex items-center gap-1.5 opacity-80">
              <mat-icon class="text-[18px]">info</mat-icon>
              Basado en las tasas de mercado actuales.
            </p>
          </div>
          <div class="flex flex-col sm:flex-row gap-6 sm:gap-10 text-left sm:text-right bg-white/10 p-5 rounded-3xl backdrop-blur-sm border border-white/10">
            <div>
              <p class="text-indigo-200 text-sm mb-1.5 font-medium">Por Remesas</p>
              <p class="text-2xl sm:text-3xl font-bold tracking-tight">{{ totalRemittanceProfit() | number:'1.2-2' }}</p>
            </div>
            <div class="hidden sm:block w-px bg-white/20"></div>
            <div>
              <p class="text-indigo-200 text-sm mb-1.5 font-medium">Por Intercambios</p>
              <p class="text-2xl sm:text-3xl font-bold tracking-tight">{{ totalExchangeProfit() | number:'1.2-2' }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Profits by Pair -->
      <h3 class="text-xl font-bold text-slate-800 mt-10 mb-5">Ganancias por Remesas (Por Par)</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (stat of profitsByPair(); track stat.pairId) {
          <div class="bg-white p-6 sm:p-7 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100/50 flex flex-col transition-all duration-300">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-2">
                <div class="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shadow-sm">
                  {{ stat.base }}
                </div>
                <mat-icon class="text-slate-300 text-sm">arrow_forward</mat-icon>
                <div class="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shadow-sm">
                  {{ stat.quote }}
                </div>
              </div>
              <span class="text-xs font-medium px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl">
                {{ stat.count }} remesas
              </span>
            </div>
            
            <div class="flex-1">
              <p class="text-sm text-slate-500 mb-1.5 font-medium">Ganancia Estimada</p>
              <div class="flex items-end gap-2">
                <span class="text-3xl font-bold tracking-tight" [ngClass]="stat.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                  {{ stat.profit > 0 ? '+' : '' }}{{ stat.profit | number:'1.2-2' }}
                </span>
                <span class="text-sm font-medium text-slate-500 mb-1">{{ referenceCurrency() }}</span>
              </div>
            </div>
            
            <div class="mt-6 pt-5 border-t border-slate-100/50 text-sm text-slate-500 space-y-2.5">
              <div class="flex justify-between items-center">
                <span>Volumen Recibido:</span>
                <span class="font-semibold text-slate-700">{{ stat.totalSent | number:'1.2-2' }} {{ stat.base }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Volumen Pagado:</span>
                <span class="font-semibold text-slate-700">{{ stat.totalReceived | number:'1.2-2' }} {{ stat.quote }}</span>
              </div>
            </div>
          </div>
        }
        @if (profitsByPair().length === 0) {
          <div class="col-span-full py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200/60 border-dashed">
            <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <mat-icon class="text-3xl text-slate-400">analytics</mat-icon>
            </div>
            <p class="font-medium text-slate-600">No hay remesas registradas para calcular ganancias.</p>
          </div>
        }
      </div>

      <!-- Profits by Exchanges -->
      <h3 class="text-xl font-bold text-slate-800 mt-10 mb-5">Ganancias por Intercambios (Venta de Divisas)</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (stat of exchangeProfits(); track stat.id) {
          <div class="bg-white p-6 sm:p-7 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100/50 flex flex-col transition-all duration-300">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center gap-2">
                <div class="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shadow-sm">
                  {{ stat.fromCurrency }}
                </div>
                <mat-icon class="text-slate-300 text-sm">arrow_forward</mat-icon>
                <div class="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs shadow-sm">
                  {{ stat.toCurrency }}
                </div>
              </div>
              <span class="text-xs font-medium px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl">
                {{ stat.date | date:'shortDate' }}
              </span>
            </div>
            
            <div class="flex-1">
              <p class="text-sm text-slate-500 mb-1.5 font-medium">Ganancia Estimada</p>
              <div class="flex items-end gap-2">
                <span class="text-3xl font-bold tracking-tight" [ngClass]="stat.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'">
                  {{ stat.profit > 0 ? '+' : '' }}{{ stat.profit | number:'1.2-2' }}
                </span>
                <span class="text-sm font-medium text-slate-500 mb-1">{{ referenceCurrency() }}</span>
              </div>
            </div>
            
            <div class="mt-6 pt-5 border-t border-slate-100/50 text-sm text-slate-500 space-y-2.5">
              <div class="flex justify-between items-center">
                <span>Vendido:</span>
                <span class="font-semibold text-slate-700">{{ stat.amountSold | number:'1.2-2' }} {{ stat.fromCurrency }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Recibido:</span>
                <span class="font-semibold text-slate-700">{{ stat.amountReceived | number:'1.2-2' }} {{ stat.toCurrency }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Tasa de Costo:</span>
                <span class="font-semibold text-slate-700">{{ stat.costRate | number:'1.2-4' }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Tasa de Venta:</span>
                <span class="font-semibold text-slate-700">{{ stat.rate | number:'1.2-4' }}</span>
              </div>
            </div>
          </div>
        }
        @if (exchangeProfits().length === 0) {
          <div class="col-span-full py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200/60 border-dashed">
            <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <mat-icon class="text-3xl text-slate-400">swap_horiz</mat-icon>
            </div>
            <p class="font-medium text-slate-600">No hay intercambios registrados para calcular ganancias.</p>
          </div>
        }
      </div>
    </div>
  `
})
export class ProfitsComponent {
  dataService = inject(DataService);
  
  referenceCurrency = signal('USD');

  profitsByPair = computed(() => {
    const remittances = this.dataService.remittances();
    const ref = this.referenceCurrency();
    
    const statsMap = new Map<string, {
      pairId: string;
      base: string;
      quote: string;
      count: number;
      totalSent: number;
      totalReceived: number;
      profit: number;
    }>();

    for (const rem of remittances) {
      const [base, quote] = rem.pairId.split('-');
      if (!base || !quote) continue;

      if (!statsMap.has(rem.pairId)) {
        statsMap.set(rem.pairId, {
          pairId: rem.pairId,
          base,
          quote,
          count: 0,
          totalSent: 0,
          totalReceived: 0,
          profit: 0
        });
      }

      const stat = statsMap.get(rem.pairId)!;
      stat.count += 1;
      stat.totalSent += rem.amountSent;
      stat.totalReceived += rem.amountReceived;

      if (rem.profitInBase !== undefined) {
        const rateBaseToRef = this.dataService.getRate(base, ref);
        if (rateBaseToRef !== null) {
          stat.profit += rem.profitInBase * rateBaseToRef;
        }
      } else {
        const rateBase = this.dataService.getRate(base, ref);
        const rateQuote = this.dataService.getRate(quote, ref);

        if (rateBase !== null && rateQuote !== null) {
          const valueIn = rem.amountSent * rateBase;
          const valueOut = rem.amountReceived * rateQuote;
          stat.profit += (valueIn - valueOut);
        }
      }
    }

    return Array.from(statsMap.values()).sort((a, b) => b.profit - a.profit);
  });

  exchangeProfits = computed(() => {
    const exchanges = this.dataService.exchanges();
    const ref = this.referenceCurrency();

    return exchanges.map(ex => {
      let profitInRef = 0;
      const profitInToCurrency = ex.profit !== undefined ? ex.profit : 0;
      
      const rateToRef = this.dataService.getRate(ex.toCurrency, ref);
      if (rateToRef !== null) {
        profitInRef = profitInToCurrency * rateToRef;
      } else if (ex.profit === undefined) {
        // Fallback for old exchanges without profit stored
        const rateFrom = this.dataService.getRate(ex.fromCurrency, ref);
        const rateTo = this.dataService.getRate(ex.toCurrency, ref);
        if (rateFrom !== null && rateTo !== null) {
          const valueSold = ex.amountSold * rateFrom;
          const valueReceived = ex.amountReceived * rateTo;
          profitInRef = valueReceived - valueSold;
        }
      }

      return {
        ...ex,
        profit: profitInRef
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  totalRemittanceProfit = computed(() => {
    return this.profitsByPair().reduce((sum, stat) => sum + stat.profit, 0);
  });

  totalExchangeProfit = computed(() => {
    return this.exchangeProfits().reduce((sum, ex) => sum + ex.profit, 0);
  });

  totalProfit = computed(() => {
    return this.totalRemittanceProfit() + this.totalExchangeProfit();
  });
}
