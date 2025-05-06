import { Component } from "@angular/core"
import { RouterOutlet } from "@angular/router"
import { trigger, transition, style, animate, query, group } from "@angular/animations"
import { CommonModule } from "@angular/common"

@Component({
  selector: "app-route-transition",
  templateUrl: "./route-transition.component.html",
  styleUrls: ["./route-transition.component.css"],
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  animations: [
    trigger("routeAnimations", [
      transition("* <=> *", [
        style({ position: "relative" }),
        query(
          ":enter, :leave",
          [
            style({
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }),
          ],
          { optional: true },
        ),
        query(":enter", [style({ opacity: 0 })], { optional: true }),
        query(":leave", [style({ opacity: 1 })], { optional: true }),
        group([
          query(":leave", [animate("300ms ease-out", style({ opacity: 0 }))], { optional: true }),
          query(":enter", [animate("300ms ease-in", style({ opacity: 1 }))], { optional: true }),
        ]),
      ]),
    ]),
  ],
})
export class RouteTransitionComponent {
  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData["animation"]
  }
}
