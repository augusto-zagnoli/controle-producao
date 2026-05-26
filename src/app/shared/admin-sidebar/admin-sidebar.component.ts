import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

interface MenuItemGroup {
  icon: string;
  label: string;
  expanded?: boolean;
  items: MenuItem[];
}

interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss'
})
export class AdminSidebarComponent {
  private readonly auth = inject(AuthService);

  sidebarOpen = false;
  isSmallScreen = window.innerWidth <= 640;

  menuGroups: MenuItemGroup[] = [
    {
      icon: '📋',
      label: 'Ordens de Serviço',
      expanded: true,
      items: [
        { icon: '📝', label: 'Listar', route: '/admin' },
        { icon: '➕', label: 'Nova OS', route: '/admin/nova' }
      ]
    },
    {
      icon: '⚙️',
      label: 'Gestão',
      expanded: false,
      items: [
        { icon: '👷', label: 'Funcionários', route: '/admin/funcionarios' },
        { icon: '👤', label: 'Usuários', route: '/admin/usuarios' }
      ]
    },
    {
      icon: '🔧',
      label: 'Sistema',
      expanded: false,
      items: [
        { icon: '⚙️', label: 'Configurações', route: '/admin/configuracoes' },
        { icon: '🏷️', label: 'Funções', route: '/admin/funcoes' },
        { icon: '🏢', label: 'Setores', route: '/admin/setores' },
        { icon: '🔩', label: 'Equipamentos', route: '/admin/equipamentos' }
      ]
    }
  ];

  constructor() {
    window.addEventListener('resize', () => {
      this.isSmallScreen = window.innerWidth <= 640;
      if (!this.isSmallScreen) {
        this.sidebarOpen = false;
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  toggleGroup(group: MenuItemGroup): void {
    group.expanded = !group.expanded;
  }
}
