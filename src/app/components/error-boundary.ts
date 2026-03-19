import { Component, ErrorHandler, Injectable, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    @if (error()) {
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
        <div class="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 text-center animate-in fade-in zoom-in duration-300">
          <div class="w-20 h-20 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-600 mx-auto mb-8 border border-rose-100/50 shadow-sm">
            <mat-icon class="text-4xl w-9 h-9">error_outline</mat-icon>
          </div>
          <h3 class="text-2xl font-display font-bold text-slate-800 mb-3">Algo salió mal</h3>
          <p class="text-slate-500 mb-8 leading-relaxed">
            Ha ocurrido un error inesperado. Por favor, intenta recargar la página o contacta con soporte si el problema persiste.
          </p>
          
          <div class="bg-slate-50 rounded-2xl p-4 mb-8 text-left overflow-hidden">
            <p class="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold">Detalles del error</p>
            <p class="text-sm font-mono text-slate-600 break-words line-clamp-3">{{ errorMessage() }}</p>
          </div>

          <button (click)="clearError()" class="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
            Entendido
          </button>
        </div>
      </div>
    }
    <ng-content></ng-content>
  `
})
export class ErrorBoundaryComponent {
  error = signal(false);
  errorMessage = signal('');

  handleError(error: unknown) {
    this.error.set(true);
    if (error instanceof Error) {
      try {
        const parsed = JSON.parse(error.message);
        this.errorMessage.set(parsed.error || error.message);
      } catch {
        this.errorMessage.set(error.message);
      }
    } else {
      this.errorMessage.set(String(error));
    }
  }

  clearError() {
    this.error.set(false);
    this.errorMessage.set('');
  }
}

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private errorBoundary = inject(ErrorBoundaryComponent);

  handleError(error: unknown) {
    console.error('Global Error:', error);
    this.errorBoundary.handleError(error);
  }
}
