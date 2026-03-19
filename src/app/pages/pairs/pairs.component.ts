import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-pairs',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 class="text-2xl font-bold text-slate-800">Pares y Tasas de Cambio</h2>
        <div class="flex flex-wrap gap-3">
          <button (click)="showCurrenciesModal = true" class="px-5 py-2.5 bg-white border border-slate-200/60 text-slate-700 rounded-2xl font-medium hover:bg-slate-50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all flex items-center gap-2">
            <mat-icon class="text-sm">payments</mat-icon>
            Monedas
          </button>
          <button (click)="showAddModal = true" class="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 hover:shadow-[0_4px_12px_rgba(79,70,229,0.2)] transition-all flex items-center gap-2">
            <mat-icon class="text-sm">add</mat-icon>
            Nuevo Par
          </button>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-100/50">
        <div class="relative w-full sm:w-96">
          <mat-icon class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</mat-icon>
          <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Buscar pares (ej. USD, EUR)..." class="w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm transition-all">
        </div>
        <div class="flex bg-slate-50/80 p-1.5 rounded-2xl w-full sm:w-auto border border-slate-100">
          <button (click)="showFavoritesOnly.set(false)" 
                  [class.bg-white]="!showFavoritesOnly()" 
                  [class.shadow-sm]="!showFavoritesOnly()" 
                  [class.text-slate-800]="!showFavoritesOnly()"
                  class="flex-1 sm:flex-none px-5 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 transition-all">
            Todos
          </button>
          <button (click)="showFavoritesOnly.set(true)" 
                  [class.bg-white]="showFavoritesOnly()" 
                  [class.shadow-sm]="showFavoritesOnly()" 
                  [class.text-amber-600]="showFavoritesOnly()"
                  class="flex-1 sm:flex-none px-5 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 transition-all flex items-center justify-center gap-1.5">
            <mat-icon class="text-sm">star</mat-icon> Favoritos
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        @for (pair of filteredPairs(); track pair.id) {
          <div class="bg-white p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-slate-100/50 flex flex-col relative group transition-all duration-300">
            <button (click)="toggleFavorite(pair.id)" [disabled]="isSaving" class="absolute top-5 right-14 text-slate-300 hover:text-amber-400 transition-colors focus:outline-none disabled:opacity-50" [class.text-amber-400]="pair.isFavorite">
              <mat-icon>{{ pair.isFavorite ? 'star' : 'star_border' }}</mat-icon>
            </button>
            <button (click)="deletePair(pair.id)" [disabled]="isSaving" class="absolute top-5 right-5 text-slate-300 hover:text-rose-500 transition-colors focus:outline-none sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-50">
              <mat-icon>delete</mat-icon>
            </button>
            
            <div class="flex items-center gap-3 mb-6 mt-2">
              <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm shadow-sm">
                {{ pair.base }}
              </div>
              <mat-icon class="text-slate-300">arrow_forward</mat-icon>
              <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm shadow-sm">
                {{ pair.quote }}
              </div>
            </div>
            
            <div class="flex-1">
              <p class="text-sm text-slate-500 mb-1 font-medium">Tasa Actual</p>
              <div class="flex items-end gap-2">
                <span class="text-4xl font-bold text-slate-800 tracking-tight">{{ pair.rate }}</span>
                <span class="text-sm font-medium text-slate-500 mb-1.5">{{ pair.quote }}</span>
              </div>
            </div>
            
            <div class="mt-6 pt-6 border-t border-slate-100/50">
              <label [for]="'rate-' + pair.id" class="block text-xs font-medium text-slate-500 mb-2">Ajustar Tasa</label>
              <div class="relative flex items-center">
                <input [id]="'rate-' + pair.id" type="number" step="0.01" [ngModel]="pair.rate" #rateInput class="w-full pl-4 pr-28 py-2.5 bg-slate-50/50 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                <button (click)="updateRate(pair.id, rateInput.value)" [disabled]="isSaving" class="absolute right-1.5 px-4 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 hover:shadow-md transition-all disabled:opacity-50">
                  {{ isSaving ? '...' : 'Actualizar' }}
                </button>
              </div>
            </div>
          </div>
        }
        @if (filteredPairs().length === 0) {
          <div class="col-span-full py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200/60 border-dashed">
            <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <mat-icon class="text-3xl text-slate-400">search_off</mat-icon>
            </div>
            <p class="font-medium text-slate-600">No se encontraron pares que coincidan con tu búsqueda.</p>
          </div>
        }
      </div>

      <!-- Add Modal -->
      @if (showAddModal) {
        <div class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div class="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-xl font-bold text-slate-800">Agregar Nuevo Par</h3>
              <button (click)="showAddModal = false" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
            
            <div class="space-y-5">
              <div>
                <label for="base" class="block text-sm font-medium text-slate-700 mb-1.5">Moneda Base</label>
                <select id="base" [(ngModel)]="newPair.base" class="w-full px-4 py-3 bg-slate-50/50 border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700">
                  <option value="">Seleccione moneda base</option>
                  @for (currency of dataService.currencies(); track currency) {
                    <option [value]="currency">{{ currency }}</option>
                  }
                </select>
              </div>
              <div>
                <label for="quote" class="block text-sm font-medium text-slate-700 mb-1.5">Moneda Destino</label>
                <select id="quote" [(ngModel)]="newPair.quote" class="w-full px-4 py-3 bg-slate-50/50 border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700">
                  <option value="">Seleccione moneda destino</option>
                  @for (currency of dataService.currencies(); track currency) {
                    <option [value]="currency">{{ currency }}</option>
                  }
                </select>
              </div>
              <div>
                <label for="rate" class="block text-sm font-medium text-slate-700 mb-1.5">Tasa Inicial</label>
                <input id="rate" type="number" step="0.01" [(ngModel)]="newPair.rate" class="w-full px-4 py-3 bg-slate-50/50 border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700">
              </div>
            </div>
            
            <div class="mt-10 flex justify-end gap-3">
              <button (click)="showAddModal = false" class="px-6 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-2xl transition-colors">
                Cancelar
              </button>
              <button (click)="addPair()" [disabled]="isSaving" class="px-6 py-3 bg-indigo-600 text-white font-medium rounded-2xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2">
                @if (isSaving) {
                  <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Guardando...
                } @else {
                  Guardar Par
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Currencies Modal -->
      @if (showCurrenciesModal) {
        <div class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div class="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col border border-white/20">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-xl font-bold text-slate-800">Gestionar Monedas</h3>
              <button (click)="showCurrenciesModal = false" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <mat-icon class="text-sm">close</mat-icon>
              </button>
            </div>
            
            <div class="flex gap-3 mb-6">
              <input type="text" [(ngModel)]="newCurrencyCode" placeholder="Ej. BRL" class="flex-1 px-4 py-3 bg-slate-50/50 border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase transition-all">
              <button (click)="addCurrency()" [disabled]="isSaving" class="px-6 py-3 bg-indigo-600 text-white font-medium rounded-2xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2">
                @if (isSaving) {
                  <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                } @else {
                  Agregar
                }
              </button>
            </div>
            
            <div class="flex-1 overflow-y-auto min-h-[200px] border border-slate-100/80 rounded-2xl p-3 bg-slate-50/30">
              <ul class="space-y-1">
                @for (currency of dataService.currencies(); track currency) {
                  <li class="flex items-center justify-between py-3 px-4 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-100">
                    <span class="font-medium text-slate-700">{{ currency }}</span>
                    <button (click)="removeCurrency(currency)" [disabled]="isSaving" class="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors disabled:opacity-50">
                      <mat-icon class="text-[18px]">delete</mat-icon>
                    </button>
                  </li>
                }
              </ul>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PairsComponent {
  dataService = inject(DataService);
  
  showAddModal = false;
  showCurrenciesModal = false;
  newPair = { base: '', quote: '', rate: 1 };
  newCurrencyCode = '';
  
  searchQuery = signal('');
  showFavoritesOnly = signal(false);

  filteredPairs = computed(() => {
    let pairs = this.dataService.pairs();
    const query = this.searchQuery().toLowerCase().trim();
    const favsOnly = this.showFavoritesOnly();

    if (favsOnly) {
      pairs = pairs.filter(p => p.isFavorite);
    }

    if (query) {
      pairs = pairs.filter(p => 
        p.base.toLowerCase().includes(query) || 
        p.quote.toLowerCase().includes(query)
      );
    }

    return pairs;
  });

  isSaving = false;

  async updateRate(id: string, value: string) {
    const rate = parseFloat(value);
    if (!isNaN(rate) && rate > 0) {
      this.isSaving = true;
      try {
        await this.dataService.updateRate(id, rate);
      } finally {
        this.isSaving = false;
      }
    }
  }

  async addPair() {
    if (this.newPair.base && this.newPair.quote && this.newPair.rate > 0) {
      this.isSaving = true;
      try {
        await this.dataService.addPair(this.newPair.base.toUpperCase(), this.newPair.quote.toUpperCase(), this.newPair.rate);
        this.showAddModal = false;
        this.newPair = { base: '', quote: '', rate: 1 };
      } finally {
        this.isSaving = false;
      }
    }
  }

  async addCurrency() {
    if (this.newCurrencyCode) {
      this.isSaving = true;
      try {
        await this.dataService.addCurrency(this.newCurrencyCode);
        this.newCurrencyCode = '';
      } finally {
        this.isSaving = false;
      }
    }
  }

  async removeCurrency(currency: string) {
    this.isSaving = true;
    try {
      await this.dataService.removeCurrency(currency);
    } finally {
      this.isSaving = false;
    }
  }

  async toggleFavorite(id: string) {
    this.isSaving = true;
    try {
      await this.dataService.toggleFavoritePair(id);
    } finally {
      this.isSaving = false;
    }
  }

  async deletePair(id: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este par?')) {
      this.isSaving = true;
      try {
        await this.dataService.deletePair(id);
      } finally {
        this.isSaving = false;
      }
    }
  }
}
