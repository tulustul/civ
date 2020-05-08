import { Component, OnInit, OnDestroy } from "@angular/core";

import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

import { Game } from "src/app/core/game";
import { Unit } from "src/app/core/unit";
import { UnitAction, ACTIONS } from "src/app/core/unit-actions";

@Component({
  selector: "app-unit-panel",
  templateUrl: "./unit-panel.component.html",
  styleUrls: ["./unit-panel.component.scss"],
})
export class UnitPanelComponent implements OnInit, OnDestroy {
  unit: Unit | null = null;

  private ngUnsubscribe = new Subject<void>();

  constructor(private game: Game) {}

  ngOnInit(): void {
    this.game.unitsManager.activeUnit$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((unit) => (this.unit = unit));
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
  }

  get unit$() {
    return this.game.unitsManager;
  }

  getActionName(action: UnitAction) {
    return ACTIONS[action].name;
  }

  destroy() {
    if (this.unit) {
      this.game.unitsManager.destroy(this.unit);
    }
  }
}
