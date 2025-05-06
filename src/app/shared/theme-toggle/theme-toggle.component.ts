import { Component, type OnInit, type OnDestroy } from "@angular/core"
import { ThemeService } from "../../services/theme.service"
import { Subscription } from "rxjs"
import { CommonModule } from "@angular/common"

@Component({
  selector: "app-theme-toggle",
  templateUrl: "./theme-toggle.component.html",
  styleUrls: ["./theme-toggle.component.css"],
  standalone: true,
  imports: [CommonModule],
})
export class ThemeToggleComponent implements OnInit, OnDestroy {
  isDarkMode = false
  private themeSubscription: Subscription | null = null

  constructor(private themeService: ThemeService) {}

  ngOnInit(): void {
    this.themeSubscription = this.themeService.currentTheme$.subscribe((theme) => {
      this.isDarkMode = theme === "dark-theme"
    })
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe()
    }
  }

  toggleTheme(): void {
    this.themeService.toggleDarkMode()
  }
}
