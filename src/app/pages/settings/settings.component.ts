import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="space-y-6 max-w-3xl">
        <h2 class="text-2xl font-bold text-slate-800">Configuración</h2>
      
      <div class="bg-white p-8 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-slate-100/50 space-y-10">
        
        <!-- Backup -->
        <div>
          <h3 class="text-xl font-bold text-slate-800 mb-2">Copias de Seguridad</h3>
          <p class="text-sm text-slate-500 mb-6">Exporta todos tus datos (pares, transacciones, remesas) a un archivo, o restaura una copia anterior.</p>
          
          <div class="flex flex-wrap gap-4">
            <button (click)="exportData()" class="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-medium hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center gap-2">
              <mat-icon class="text-sm">download</mat-icon>
              Exportar Datos
            </button>
            
            <label class="px-6 py-3 bg-slate-50 border border-slate-200/60 text-slate-700 rounded-2xl font-medium hover:bg-slate-100 hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer" [class.opacity-50]="isSaving" [class.pointer-events-none]="isSaving">
              <mat-icon class="text-sm">@if (isSaving) { autorenew } @else { upload }</mat-icon>
              {{ isSaving ? 'Importando...' : 'Importar Datos' }}
              <input type="file" accept=".json" class="hidden" (change)="importData($event)" [disabled]="isSaving">
            </label>
          </div>
        </div>

        <hr class="border-slate-100/80">

        <!-- Reset -->
        <div>
          <h3 class="text-xl font-bold text-rose-600 mb-2">Zona de Peligro</h3>
          <p class="text-sm text-slate-500 mb-6">Restablece la aplicación a su estado inicial. Todos los datos actuales se perderán permanentemente.</p>
          
          <button (click)="showResetConfirm = true" class="px-6 py-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl font-medium hover:bg-rose-100 hover:text-rose-700 transition-all flex items-center gap-2" [disabled]="isSaving">
            <mat-icon class="text-sm">delete_forever</mat-icon>
            Restablecer Datos de Cero
          </button>
        </div>

      </div>

      <!-- Confirm Modal -->
      @if (showResetConfirm) {
        <div class="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
          <div class="bg-white rounded-[2rem] p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto border border-white/20">
            <div class="flex items-center gap-4 mb-6 text-rose-600">
              <div class="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <mat-icon class="text-3xl">warning</mat-icon>
              </div>
              <h3 class="text-xl font-bold text-slate-800">¿Estás seguro?</h3>
            </div>
            <p class="text-slate-600 mb-8 leading-relaxed">Esta acción eliminará todos los pares de divisas, transacciones y remesas. No se puede deshacer a menos que tengas una copia de seguridad.</p>
            <div class="flex justify-end gap-3">
              <button (click)="showResetConfirm = false" class="px-6 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-2xl transition-colors" [disabled]="isSaving">
                Cancelar
              </button>
              <button (click)="resetData()" class="px-6 py-3 bg-rose-600 text-white font-medium rounded-2xl hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-500/20 transition-all flex items-center gap-2" [disabled]="isSaving">
                @if (isSaving) {
                  <mat-icon class="animate-spin text-sm">autorenew</mat-icon>
                  Borrando...
                } @else {
                  Sí, eliminar todo
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class SettingsComponent {
  dataService = inject(DataService);
  showResetConfirm = false;
  isSaving = false;

  exportData() {
    this.dataService.exportData();
  }

  importData(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.isSaving = true;
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        if (content) {
          const success = await this.dataService.importData(content);
          this.isSaving = false;
          if (success) {
            alert('Datos importados correctamente.');
          } else {
            alert('Error al importar los datos. El archivo podría estar corrupto.');
          }
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    input.value = '';
  }

  async resetData() {
    this.isSaving = true;
    await this.dataService.resetData();
    this.isSaving = false;
    this.showResetConfirm = false;
  }
}
