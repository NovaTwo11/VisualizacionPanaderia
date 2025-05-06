import { Component, EventEmitter, type OnInit, Output, HostListener } from "@angular/core"
import { AuthService } from "../../services/auth.service"
import { CommonModule } from "@angular/common"
import { RouterModule } from "@angular/router"
import { FormsModule } from "@angular/forms"
import { Router, NavigationEnd } from "@angular/router"
import { filter } from "rxjs/operators"

@Component({
  selector: "app-sidebar",
  templateUrl: "./sidebar.component.html",
  styleUrls: ["./sidebar.component.css"],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class SidebarComponent implements OnInit {
  @Output() sidebarStateChanged = new EventEmitter<boolean>()
  isSidebarCollapsed = false
  isMobileOpen = false
  usuario: any = null
  openDropdowns: { [key: string]: boolean } = {
    entidades: false,
    transacciones: false,
    reportes: false,
  }

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.usuario = this.authService.getUsuario()

    // Verificar si hay una preferencia guardada para el estado del sidebar
    const sidebarState = localStorage.getItem("sidebar_collapsed")
    if (sidebarState) {
      this.isSidebarCollapsed = sidebarState === "true"
      this.updateBodyClass()
    }

    // Cerrar los dropdowns cuando cambia la ruta
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      // Actualizamos el estado activo y abrimos el dropdown correspondiente
      this.setInitialDropdownState()

      // Cerrar sidebar en móvil cuando se navega
      this.isMobileOpen = false
    })

    // Abrir el dropdown correspondiente según la ruta actual
    this.setInitialDropdownState()

    // Detectar si es móvil
    this.checkIfMobile()
  }

  @HostListener("window:resize", ["$event"])
  onResize() {
    this.checkIfMobile()
  }

  private checkIfMobile(): void {
    if (window.innerWidth <= 768) {
      this.isSidebarCollapsed = true
    }
  }

  setInitialDropdownState(): void {
    const currentUrl = this.router.url

    // Resetear todos los dropdowns
    Object.keys(this.openDropdowns).forEach((key) => {
      this.openDropdowns[key] = false
    })

    // Abrir el dropdown correspondiente
    if (currentUrl.includes("/entidades")) {
      this.openDropdowns["entidades"] = true
    } else if (currentUrl.includes("/transacciones")) {
      this.openDropdowns["transacciones"] = true
    } else if (currentUrl.includes("/reportes-consultas")) {
      this.openDropdowns["reportes"] = true
    }
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed
    localStorage.setItem("sidebar_collapsed", this.isSidebarCollapsed.toString())
    this.updateBodyClass()

    // Emitir evento para que el componente principal pueda ajustar el layout
    this.sidebarStateChanged.emit(this.isSidebarCollapsed)
  }

  toggleMobileSidebar(): void {
    this.isMobileOpen = !this.isMobileOpen

    // Prevenir scroll en el body cuando el sidebar está abierto
    if (this.isMobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
  }

  closeMobileSidebar(): void {
    this.isMobileOpen = false
    document.body.style.overflow = ""
  }

  toggleDropdown(dropdown: string): void {
    this.openDropdowns[dropdown] = !this.openDropdowns[dropdown]
  }

  isDropdownOpen(dropdown: string): boolean {
    return this.openDropdowns[dropdown]
  }

  isDropdownActive(dropdown: string): boolean {
    const currentUrl = this.router.url

    switch (dropdown) {
      case "entidades":
        return currentUrl.includes("/entidades")
      case "transacciones":
        return currentUrl.includes("/transacciones")
      case "reportes":
        return currentUrl.includes("/reportes-consultas")
      default:
        return false
    }
  }

  updateBodyClass(): void {
    if (this.isSidebarCollapsed) {
      document.body.classList.add("sidebar-collapsed")
    } else {
      document.body.classList.remove("sidebar-collapsed")
    }
  }

  getUserAvatar(): string {
    if (!this.usuario) return "assets/images/default.png"

    switch (this.usuario.rol) {
      case "Administrador":
        return "assets/images/admin.png"
      case "Supervisor":
        return "assets/images/supervisor.png"
      case "Operador":
        return "assets/images/operador.png"
      default:
        return "assets/images/default.png"
    }
  }

  getRoleName(rol: string | undefined): string {
    if (!rol) return "Usuario"

    switch (rol) {
      case "Administrador":
        return "Administrador"
      case "Supervisor":
        return "Supervisor"
      case "Operador":
        return "Operador"
      default:
        return "Usuario"
    }
  }

  tienePermiso(modulo: string): boolean {
    return this.authService.hasPermission(modulo)
  }
}
