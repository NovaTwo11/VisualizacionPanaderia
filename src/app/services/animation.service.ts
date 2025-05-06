import { Injectable } from "@angular/core"
import { BehaviorSubject, type Observable } from "rxjs"

export type AnimationState = "enter" | "leave" | "none"

@Injectable({
  providedIn: "root",
})
export class AnimationService {
  private animationStateSubject: BehaviorSubject<AnimationState>
  public animationState$: Observable<AnimationState>

  constructor() {
    this.animationStateSubject = new BehaviorSubject<AnimationState>("none")
    this.animationState$ = this.animationStateSubject.asObservable()
  }

  public setAnimationState(state: AnimationState): void {
    this.animationStateSubject.next(state)
  }

  public getAnimationState(): AnimationState {
    return this.animationStateSubject.value
  }
}
