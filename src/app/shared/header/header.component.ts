import { Component, type OnInit, HostListener } from "@angular/core"
import { Router, RouterModule } from "@angular/router"
import { AuthService } from "../../services/auth.service"
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchBarComponent } from '../search-bar/search-bar.component';

@Component({
  selector: "app-header",
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.css"],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SearchBarComponent],
})
export class HeaderComponent implements OnInit {
  searchQuery = ""
  showNotifications = false
  showUserMenu = false
  usuario: any = null

  constructor(
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario()

    const temaGuardado = localStorage.getItem("tema_actual") || "default"
    this.cambiarTema(temaGuardado)
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement
    if (!target.closest(".notification-dropdown") && this.showNotifications) {
      this.showNotifications = false
    }
    if (!target.closest(".user-dropdown") && this.showUserMenu) {
      this.showUserMenu = false
    }
  }

  toggleSidebar(): void {
    document.body.classList.toggle("sidebar-collapsed")
  }

  onSearch(): void {
    console.log("Buscando:", this.searchQuery)
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation()
    this.showUserMenu = !this.showUserMenu
    this.showNotifications = false
  }

  getUserAvatar(): string {
    if (!this.usuario) return "assets/images/default.png"
    switch (this.usuario.rol) {
      case "Administrador": return "assets/images/admin.png"
      case "Supervisor": return "assets/images/supervisor.png"
      case "Operador": return "assets/images/operador.png"
      default: return "assets/images/default.png"
    }
  }

  getRoleName(rol: string | undefined): string {
    if (!rol) {
      return "Usuario";
    }
    switch (rol) {
      case "Administrador":
        return "Administrador";
      case "Supervisor":
        return "Supervisor";
      case "Operador":
        return "Operador";
      default:
        return "Usuario";
    }
  }

  tienePermiso(modulo: string): boolean {
    // Ajusta al nombre real de tu método en AuthService
    return this.authService.hasPermission(modulo);
  }

  cerrarSesion(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(["/login"])
    })
  }

  cambiarTema(tema: string): void {
    document.body.classList.remove("default-theme", "dark-theme", "light-theme", "colorful-theme")
    document.body.classList.add(`${tema}-theme`)
    localStorage.setItem("tema_actual", tema)
    console.log(`Tema cambiado a: ${tema}`)
  }
}
