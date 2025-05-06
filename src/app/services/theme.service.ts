import { Injectable, Renderer2, RendererFactory2 } from "@angular/core"
import { BehaviorSubject, Observable } from "rxjs"

export type Theme = "light-theme" | "dark-theme" | "colorful-theme" | "bakery-theme"

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private renderer: Renderer2
  private currentThemeSubject: BehaviorSubject<Theme>
  public currentTheme$: Observable<Theme>

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null)

    // Intentar obtener el tema guardado en localStorage
    const savedTheme = localStorage.getItem("theme") as Theme

    // Si no hay tema guardado, detectar preferencia del sistema
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    const defaultTheme = savedTheme || (prefersDark ? "dark-theme" : "light-theme")

    this.currentThemeSubject = new BehaviorSubject<Theme>(defaultTheme)
    this.currentTheme$ = this.currentThemeSubject.asObservable()

    // Aplicar el tema inicial
    this.setTheme(defaultTheme)

    // Escuchar cambios en la preferencia del sistema
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
      if (!localStorage.getItem("theme")) {
        const newTheme = e.matches ? "dark-theme" : "light-theme"
        this.setTheme(newTheme)
      }
    })
  }

  public setTheme(theme: Theme): void {
    this.currentThemeSubject.next(theme)
    localStorage.setItem("theme", theme)

    // Eliminar todas las clases de tema del body
    this.renderer.removeClass(document.body, "light-theme")
    this.renderer.removeClass(document.body, "dark-theme")
    this.renderer.removeClass(document.body, "colorful-theme")
    this.renderer.removeClass(document.body, "bakery-theme")

    // Añadir la clase del nuevo tema
    this.renderer.addClass(document.body, theme)
  }

  public getCurrentTheme(): Theme {
    return this.currentThemeSubject.value
  }

  public toggleDarkMode(): void {
    const currentTheme = this.getCurrentTheme()
    const newTheme = currentTheme === "dark-theme" ? "light-theme" : "dark-theme"
    this.setTheme(newTheme)
  }
}
