import {Component, OnInit} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { HeaderComponent } from './shared/header/header.component';
import { SidebarComponent } from './shared/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent]
})
export class AppComponent implements OnInit {
  title(title: any) {
      throw new Error('Method not implemented.');
  }
  isSidebarCollapsed: boolean = false;

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    // Cargar tema guardado
    const temaGuardado = localStorage.getItem("tema_actual") || "default";
    document.body.classList.add(`${temaGuardado}-theme`);

    // Cargar estado del sidebar
    this.isSidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
  }

  onSidebarStateChanged(isCollapsed: boolean): void {
    this.isSidebarCollapsed = isCollapsed;
  }
}
