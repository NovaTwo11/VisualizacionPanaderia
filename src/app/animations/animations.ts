import { trigger, transition, style, animate, query, stagger, keyframes } from "@angular/animations"

export const fadeAnimation = trigger("fadeAnimation", [
  transition(":enter", [style({ opacity: 0 }), animate("300ms ease-in", style({ opacity: 1 }))]),
  transition(":leave", [animate("300ms ease-out", style({ opacity: 0 }))]),
])

export const slideUpAnimation = trigger("slideUpAnimation", [
  transition(":enter", [
    style({ transform: "translateY(20px)", opacity: 0 }),
    animate("300ms ease-in", style({ transform: "translateY(0)", opacity: 1 })),
  ]),
  transition(":leave", [animate("300ms ease-out", style({ transform: "translateY(20px)", opacity: 0 }))]),
])

export const listAnimation = trigger("listAnimation", [
  transition("* => *", [
    query(
      ":enter",
      [
        style({ opacity: 0, transform: "translateY(20px)" }),
        stagger("50ms", [animate("300ms ease-in", style({ opacity: 1, transform: "translateY(0)" }))]),
      ],
      { optional: true },
    ),
    query(
      ":leave",
      [stagger("50ms", [animate("300ms ease-out", style({ opacity: 0, transform: "translateY(20px)" }))])],
      { optional: true },
    ),
  ]),
])

export const pulseAnimation = trigger("pulseAnimation", [
  transition(":enter", [
    animate(
      "1s ease-in-out",
      keyframes([
        style({ transform: "scale(1)", offset: 0 }),
        style({ transform: "scale(1.05)", offset: 0.5 }),
        style({ transform: "scale(1)", offset: 1 }),
      ]),
    ),
  ]),
])

export const formAnimation = trigger("formAnimation", [
  transition(":enter", [
    style({ transform: "translateY(-20px)", opacity: 0 }),
    animate("300ms ease-in", style({ transform: "translateY(0)", opacity: 1 })),
  ]),
  transition(":leave", [animate("300ms ease-out", style({ transform: "translateY(-20px)", opacity: 0 }))]),
])
