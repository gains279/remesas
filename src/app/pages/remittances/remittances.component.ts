import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService, Remittance } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-remittances',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  template: `
    <div class="space-y-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 class="text-2xl font-display font-bold text-slate-800">Remesas</h2>
        <div class="flex flex-wrap gap-3">
          <button (click)="exportToExcel()" class="px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition-colors flex items-center gap-2 border border-emerald-200/50">
            <mat-icon class="text-sm">download</mat-icon>
            Exportar a Excel
          </button>
          <button (click)="showAddModal = true" class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
            <mat-icon class="text-sm">add</mat-icon>
            Nueva Remesa
          </button>
        </div>
      </div>

      <!-- List -->
      <div class="bg-white rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-100/80 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-100/80">
              <tr>
                <th class="px-6 py-4">Fecha</th>
                <th class="px-6 py-4">Remitente</th>
                <th class="px-6 py-4">Agente</th>
                <th class="px-6 py-4">Par</th>
                <th class="px-6 py-4 text-right">Enviado</th>
                <th class="px-6 py-4 text-right">Recibido</th>
                <th class="px-6 py-4 text-right">Tasa</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100/80">
              @for (rem of dataService.remittances(); track rem.id) {
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="px-6 py-4.5 text-slate-500">{{ rem.date | date:'short' }}</td>
                  <td class="px-6 py-4.5 font-medium text-slate-800">{{ rem.senderFirstName }} {{ rem.senderLastName }}</td>
                  <td class="px-6 py-4.5 text-slate-600">{{ rem.agentName }}</td>
                  <td class="px-6 py-4.5">
                    <span class="inline-flex items-center px-3 py-1 rounded-lg bg-slate-100/80 text-slate-700 text-xs font-medium border border-slate-200/50">
                      {{ getPairCode(rem.pairId) }}
                    </span>
                  </td>
                  <td class="px-6 py-4.5 text-right font-medium text-emerald-600">{{ rem.amountSent | number:'1.2-2' }}</td>
                  <td class="px-6 py-4.5 text-right font-medium text-indigo-600">{{ rem.amountReceived | number:'1.2-2' }}</td>
                  <td class="px-6 py-4.5 text-right text-slate-500">{{ rem.rate }}</td>
                </tr>
              }
              @if (dataService.remittances().length === 0) {
                <tr>
                  <td colspan="7" class="px-6 py-12 text-center text-slate-500">No hay remesas registradas.</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add Modal -->
      @if (showAddModal) {
        <div class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div class="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-slate-100">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-2xl font-display font-bold text-slate-800">Registrar Nueva Remesa</h3>
              <button (click)="showAddModal = false" class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
              <!-- Sender Info -->
              <div class="space-y-5">
                <h4 class="font-medium text-slate-800 border-b border-slate-100 pb-3">Datos del Remitente</h4>
                <div>
                  <label for="senderFirstName" class="block text-sm font-medium text-slate-600 mb-1.5">Nombre</label>
                  <input id="senderFirstName" type="text" [(ngModel)]="newRem.senderFirstName" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow">
                </div>
                <div>
                  <label for="senderLastName" class="block text-sm font-medium text-slate-600 mb-1.5">Apellidos</label>
                  <input id="senderLastName" type="text" [(ngModel)]="newRem.senderLastName" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow">
                </div>
                <div>
                  <label for="agentName" class="block text-sm font-medium text-slate-600 mb-1.5">Agente / Usuario</label>
                  <input id="agentName" type="text" [(ngModel)]="newRem.agentName" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow">
                </div>
              </div>

              <!-- Transaction Info -->
              <div class="space-y-5">
                <h4 class="font-medium text-slate-800 border-b border-slate-100 pb-3">Detalles de la Operación</h4>
                <div>
                  <label for="pairId" class="block text-sm font-medium text-slate-600 mb-1.5">Par de Intercambio</label>
                  <select id="pairId" [(ngModel)]="newRem.pairId" (change)="onPairChange()" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow">
                    <option value="">Seleccione un par</option>
                    @for (pair of dataService.pairs(); track pair.id) {
                      <option [value]="pair.id">{{ pair.base }}/{{ pair.quote }} ({{ pair.rate }})</option>
                    }
                  </select>
                </div>
                <div>
                  <label for="amountSent" class="block text-sm font-medium text-slate-600 mb-1.5">Monto a Enviar ({{ getBaseCurrency() }})</label>
                  <input id="amountSent" type="number" step="0.01" [(ngModel)]="newRem.amountSent" (input)="calculateReceived()" class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow">
                </div>
                <div>
                  <label for="amountReceived" class="block text-sm font-medium text-slate-600 mb-1.5">Monto a Recibir ({{ getQuoteCurrency() }})</label>
                  <input id="amountReceived" type="number" step="0.01" [(ngModel)]="newRem.amountReceived" readonly class="w-full px-4 py-2.5 bg-slate-100/50 border border-slate-200/50 rounded-xl text-slate-500 cursor-not-allowed">
                </div>
              </div>
            </div>
            
            <div class="mt-10 flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button (click)="showAddModal = false" class="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors">
                Cancelar
              </button>
              <button (click)="addRemittance()" [disabled]="!isValid() || isSaving" class="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2">
                @if (isSaving) {
                  <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Procesando...
                } @else {
                  Registrar Remesa
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class RemittancesComponent {
  dataService = inject(DataService);
  
  showAddModal = false;
  newRem: Partial<Remittance> = {
    senderFirstName: '',
    senderLastName: '',
    agentName: '',
    pairId: '',
    amountSent: 0,
    amountReceived: 0,
    rate: 0
  };

  getPairCode(pairId: string) {
    const pair = this.dataService.pairs().find(p => p.id === pairId);
    return pair ? `${pair.base}/${pair.quote}` : pairId;
  }

  getBaseCurrency() {
    if (!this.newRem.pairId) return '';
    const pair = this.dataService.pairs().find(p => p.id === this.newRem.pairId);
    return pair?.base || '';
  }

  getQuoteCurrency() {
    if (!this.newRem.pairId) return '';
    const pair = this.dataService.pairs().find(p => p.id === this.newRem.pairId);
    return pair?.quote || '';
  }

  onPairChange() {
    const pair = this.dataService.pairs().find(p => p.id === this.newRem.pairId);
    if (pair) {
      this.newRem.rate = pair.rate;
      this.calculateReceived();
    }
  }

  calculateReceived() {
    if (this.newRem.amountSent && this.newRem.rate) {
      this.newRem.amountReceived = this.newRem.amountSent * this.newRem.rate;
    } else {
      this.newRem.amountReceived = 0;
    }
  }

  isValid() {
    return this.newRem.senderFirstName && 
           this.newRem.senderLastName && 
           this.newRem.agentName && 
           this.newRem.pairId && 
           this.newRem.amountSent && 
           this.newRem.amountSent > 0;
  }

  isSaving = false;

  async addRemittance() {
    if (this.isValid()) {
      this.isSaving = true;
      try {
        await this.dataService.addRemittance(this.newRem as Omit<Remittance, 'id' | 'date'>);
        this.showAddModal = false;
        this.newRem = {
          senderFirstName: '',
          senderLastName: '',
          agentName: '',
          pairId: '',
          amountSent: 0,
          amountReceived: 0,
          rate: 0
        };
      } finally {
        this.isSaving = false;
      }
    }
  }

  exportToExcel() {
    const data = this.dataService.remittances().map(r => ({
      Fecha: new Date(r.date).toLocaleString(),
      Remitente: `${r.senderFirstName} ${r.senderLastName}`,
      Agente: r.agentName,
      Par: this.getPairCode(r.pairId),
      Enviado: r.amountSent,
      Recibido: r.amountReceived,
      Tasa: r.rate
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Remesas");
    XLSX.writeFile(wb, "Remesas.xlsx");
  }
}
