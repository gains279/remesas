import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="space-y-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 class="text-2xl font-display font-bold text-slate-800">Wallet</h2>
        <div class="flex flex-wrap gap-3">
          <button (click)="openTransactionModal('DEPOSIT')" class="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors flex items-center gap-2 border border-emerald-200/50">
            <mat-icon class="text-sm">arrow_downward</mat-icon>
            Depositar
          </button>
          <button (click)="openTransactionModal('WITHDRAWAL')" class="px-5 py-2.5 bg-rose-50 text-rose-700 rounded-xl font-medium hover:bg-rose-100 transition-colors flex items-center gap-2 border border-rose-200/50">
            <mat-icon class="text-sm">arrow_upward</mat-icon>
            Retirar
          </button>
          <button (click)="openExchangeModal()" class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
            <mat-icon class="text-sm">swap_horiz</mat-icon>
            Intercambiar
          </button>
        </div>
      </div>

      <!-- Balances -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (bal of getBalancesArray(); track bal.currency) {
          <div class="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-100/80 transition-all hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
            <div class="flex items-center gap-4 mb-5">
              <div class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center font-display font-bold text-slate-600 border border-slate-100">
                {{ bal.currency }}
              </div>
              <h3 class="text-lg font-medium text-slate-600">Balance {{ bal.currency }}</h3>
            </div>
            <p class="text-4xl font-display font-bold text-slate-800">{{ bal.amount | number:'1.2-2' }}</p>
          </div>
        }
      </div>

      <!-- History -->
      <div class="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-100/80 overflow-hidden">
        <div class="px-8 py-6 border-b border-slate-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <h3 class="text-xl font-display font-bold text-slate-800">Historial de Transacciones</h3>
          <div class="flex bg-slate-50 p-1.5 rounded-xl border border-slate-100/80 w-full sm:w-auto">
            <button (click)="currentFilter.set('all')" 
                    [class.bg-white]="currentFilter() === 'all'" 
                    [class.shadow-sm]="currentFilter() === 'all'" 
                    [class.text-slate-800]="currentFilter() === 'all'"
                    class="flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 transition-all">
              Todas
            </button>
            <button (click)="currentFilter.set('in')" 
                    [class.bg-white]="currentFilter() === 'in'" 
                    [class.shadow-sm]="currentFilter() === 'in'" 
                    [class.text-emerald-600]="currentFilter() === 'in'"
                    class="flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 transition-all">
              Entradas
            </button>
            <button (click)="currentFilter.set('out')" 
                    [class.bg-white]="currentFilter() === 'out'" 
                    [class.shadow-sm]="currentFilter() === 'out'" 
                    [class.text-rose-600]="currentFilter() === 'out'"
                    class="flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 transition-all">
              Salidas
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-100/80">
              <tr>
                <th class="px-8 py-4">Fecha</th>
                <th class="px-8 py-4">Tipo</th>
                <th class="px-8 py-4">Descripción</th>
                <th class="px-8 py-4 text-right">Monto</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100/80">
              @for (tx of filteredTransactions(); track tx.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-8 py-5 text-slate-500">{{ tx.date | date:'short' }}</td>
                  <td class="px-8 py-5">
                    <span class="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium border"
                          [ngClass]="{
                            'bg-emerald-50 text-emerald-700 border-emerald-200/50': tx.type === 'DEPOSIT' || tx.type === 'REMITTANCE_IN',
                            'bg-rose-50 text-rose-700 border-rose-200/50': tx.type === 'WITHDRAWAL' || tx.type === 'REMITTANCE_OUT'
                          }">
                      {{ tx.type }}
                    </span>
                  </td>
                  <td class="px-8 py-5 text-slate-700 font-medium">{{ tx.description }}</td>
                  <td class="px-8 py-5 text-right font-medium"
                      [ngClass]="tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'">
                    {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount | number:'1.2-2' }} {{ tx.currency }}
                  </td>
                </tr>
              }
              @if (filteredTransactions().length === 0) {
                <tr>
                  <td colspan="4" class="px-8 py-12 text-center text-slate-500">No hay transacciones para mostrar.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Transaction Modal -->
      @if (showModal) {
        <div class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div class="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-2xl font-display font-bold text-slate-800">
                {{ txType === 'DEPOSIT' ? 'Depositar Fondos' : (txType === 'WITHDRAWAL' ? 'Retirar Fondos' : 'Intercambiar Divisas') }}
              </h3>
              <button (click)="showModal = false" class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            
            @if (txType === 'DEPOSIT' || txType === 'WITHDRAWAL') {
              <div class="space-y-5">
                <div>
                  <label for="txCurrency" class="block text-sm font-medium text-slate-600 mb-1.5">Moneda</label>
                  <select id="txCurrency" [(ngModel)]="txCurrency" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow">
                    <option value="">Seleccione una moneda</option>
                    @for (bal of getBalancesArray(); track bal.currency) {
                      <option [value]="bal.currency">{{ bal.currency }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label for="txAmount" class="block text-sm font-medium text-slate-600 mb-1.5">Monto</label>
                  <input id="txAmount" type="number" step="0.01" [(ngModel)]="txAmount" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow">
                </div>
                <div>
                  <label for="txDescription" class="block text-sm font-medium text-slate-600 mb-1.5">Descripción</label>
                  <input id="txDescription" type="text" [(ngModel)]="txDescription" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow">
                </div>
              </div>
            } @else {
              <div class="space-y-5">
                <div>
                  <label for="exFrom" class="block text-sm font-medium text-slate-600 mb-1.5">Moneda a Vender (Origen)</label>
                  <select id="exFrom" [(ngModel)]="exFrom" (change)="onExchangeCurrencyChange()" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow">
                    <option value="">Seleccione moneda origen</option>
                    @for (bal of getBalancesArray(); track bal.currency) {
                      @if (bal.amount > 0) {
                        <option [value]="bal.currency">{{ bal.currency }} (Disp: {{ bal.amount | number:'1.2-2' }})</option>
                      }
                    }
                  </select>
                </div>
                <div>
                  <label for="exAmount" class="block text-sm font-medium text-slate-600 mb-1.5">Monto a Vender</label>
                  <input id="exAmount" type="number" step="0.01" [(ngModel)]="exAmount" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow">
                </div>
                <div>
                  <label for="exTo" class="block text-sm font-medium text-slate-600 mb-1.5">Moneda a Recibir (Destino)</label>
                  <select id="exTo" [(ngModel)]="exTo" (change)="onExchangeCurrencyChange()" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow">
                    <option value="">Seleccione moneda destino</option>
                    @for (currency of dataService.currencies(); track currency) {
                      <option [value]="currency">{{ currency }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label for="exCostRate" class="block text-sm font-medium text-slate-600 mb-1.5">Tasa de Costo / Mercado</label>
                  <input id="exCostRate" type="number" step="0.0001" [(ngModel)]="exCostRate" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow">
                  <p class="text-xs text-slate-500 mt-1.5">1 {{ exFrom || 'Origen' }} = {{ exCostRate || 0 }} {{ exTo || 'Destino' }}</p>
                </div>
                <div>
                  <label for="exRate" class="block text-sm font-medium text-slate-600 mb-1.5">Tasa de Venta</label>
                  <input id="exRate" type="number" step="0.0001" [(ngModel)]="exRate" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow">
                  <p class="text-xs text-slate-500 mt-1.5">1 {{ exFrom || 'Origen' }} = {{ exRate || 0 }} {{ exTo || 'Destino' }}</p>
                </div>
                <div class="bg-indigo-50/80 p-5 rounded-2xl border border-indigo-100/50">
                  <p class="text-sm text-indigo-800/80 font-medium mb-1">Recibirás aproximadamente:</p>
                  <p class="text-3xl font-display font-bold text-indigo-900">{{ (exAmount * exRate) | number:'1.2-2' }} {{ exTo }}</p>
                </div>
              </div>
            }
            
            <div class="mt-10 flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button (click)="showModal = false" class="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">
                Cancelar
              </button>
              <button (click)="submitTransaction()" [disabled]="isSaving" class="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
                @if (isSaving) {
                  <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Procesando...
                } @else {
                  Confirmar
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class WalletComponent {
  dataService = inject(DataService);
  
  showModal = false;
  txType: 'DEPOSIT' | 'WITHDRAWAL' | 'EXCHANGE' = 'DEPOSIT';
  txCurrency = '';
  txAmount = 0;
  txDescription = '';

  exFrom = '';
  exTo = '';
  exAmount = 0;
  exRate = 0;
  exCostRate = 0;

  currentFilter = signal<'all' | 'in' | 'out'>('all');

  filteredTransactions = computed(() => {
    const txs = this.dataService.transactions();
    const filter = this.currentFilter();
    
    if (filter === 'in') {
      return txs.filter(t => t.amount > 0);
    } else if (filter === 'out') {
      return txs.filter(t => t.amount < 0);
    }
    
    return txs;
  });

  getBalancesArray() {
    const bals = this.dataService.balances();
    return Object.keys(bals).map(currency => ({ currency, amount: bals[currency] }));
  }

  openTransactionModal(type: 'DEPOSIT' | 'WITHDRAWAL') {
    this.txType = type;
    this.txCurrency = '';
    this.txAmount = 0;
    this.txDescription = type === 'DEPOSIT' ? 'Depósito manual' : 'Retiro manual';
    this.showModal = true;
  }

  openExchangeModal() {
    this.txType = 'EXCHANGE';
    this.exFrom = '';
    this.exTo = '';
    this.exAmount = 0;
    this.exRate = 0;
    this.exCostRate = 0;
    this.showModal = true;
  }

  onExchangeCurrencyChange() {
    if (this.exFrom && this.exTo) {
      const rate = this.dataService.getRate(this.exFrom, this.exTo);
      if (rate !== null) {
        this.exCostRate = rate;
        if (!this.exRate) this.exRate = rate;
      }
    }
  }

  isSaving = false;

  async submitTransaction() {
    this.isSaving = true;
    try {
      if (this.txType === 'EXCHANGE') {
        if (this.exFrom && this.exTo && this.exAmount > 0 && this.exRate > 0 && this.exCostRate > 0) {
          await this.dataService.addExchange(this.exFrom, this.exTo, this.exAmount, this.exRate, this.exCostRate);
          this.showModal = false;
        }
      } else {
        if (this.txCurrency && this.txAmount > 0) {
          const amount = this.txType === 'DEPOSIT' ? this.txAmount : -this.txAmount;
          await this.dataService.addTransaction(this.txType, this.txCurrency.toUpperCase(), amount, this.txDescription);
          this.showModal = false;
        }
      }
    } finally {
      this.isSaving = false;
    }
  }
}
