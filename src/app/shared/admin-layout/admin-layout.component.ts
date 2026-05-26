import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AdminSidebarComponent],
  template: `
    <div class="admin-layout">
      <app-admin-sidebar></app-admin-sidebar>
      <div class="admin-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      height: calc(100vh - 56px);

      @media (max-width: 640px) {
        flex-direction: column;
      }
    }

    .admin-content {
      flex: 1;
      overflow-y: auto;
      background: #f3f4f6;
      padding-top: 50px;

      @media (min-width: 641px) {
        padding-top: 0;
      }
    }
  `]
})
export class AdminLayoutComponent {}
