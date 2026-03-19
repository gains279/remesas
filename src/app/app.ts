import { ChangeDetectionStrategy, Component, signal, inject, ErrorHandler } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DataService } from './services/data.service';
import { CommonModule } from '@angular/common';
import { ErrorBoundaryComponent, GlobalErrorHandler } from './components/error-boundary';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule, CommonModule, ErrorBoundaryComponent],
  providers: [
    ErrorBoundaryComponent,
    { provide: ErrorHandler, useClass: GlobalErrorHandler }
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  dataService = inject(DataService);
  isSidebarOpen = signal(true);
}
