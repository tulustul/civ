import { Injectable } from "@angular/core";

import { BehaviorSubject } from "rxjs";

import { NextTurnService } from "./ui/next-turn.service";
import { MapUi } from "./ui/map-ui";
import { UIState } from "./ui/ui-state";
import { Camera } from "./renderer/camera";
import { GameApi } from "./api/game";

@Injectable()
export class Controls {
  isMousePressed = false;

  private _mouseButton$ = new BehaviorSubject<number | null>(null);
  mouseButton$ = this._mouseButton$.asObservable();

  constructor(
    private game: GameApi,
    private camera: Camera,
    private nextTurnService: NextTurnService,
    private mapUi: MapUi,
    private uiState: UIState,
  ) {}

  onMouseDown(event: MouseEvent) {
    this.isMousePressed = true;
    this._mouseButton$.next(event.button);
    event.preventDefault();
    event.stopPropagation();

    if (this.mapUi.selectedUnit && this.mouseButton === 2) {
      const tile = this.getTileFromMouseEvent(event);
      if (tile) {
        this.mapUi.selectedUnit.findPath(tile).then(() => {
          if (this.mapUi.selectedUnit) {
            this.mapUi.setPath(this.mapUi.selectedUnit.path);
          }
        });
      }
    }

    return false;
  }

  onClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    const hoveredTile = this.mapUi.hoveredTile;
    if (hoveredTile) {
      this.mapUi.clickTile(hoveredTile);
    }

    return false;
  }

  onMouseUp(event: MouseEvent) {
    const [x, y] = this.camera.screenToGame(event.clientX, event.clientY);

    const selectedUnit = this.mapUi.selectedUnit;
    if (selectedUnit && this.mouseButton === 2) {
      const tile = this.game.state!.map.get(x, y);
      if (tile) {
        selectedUnit.moveAlongPath().then(async () => {
          this.mapUi.setPath(selectedUnit.path);
          // to refresh the ui
          this.mapUi["_selectedUnit$"].next(selectedUnit);
          this.mapUi.unitRangeArea.setTiles(await selectedUnit.getRange());
        });
      }
    }

    this.isMousePressed = false;
    this._mouseButton$.next(null);
  }

  onMouseMove(event: MouseEvent) {
    const tile = this.getTileFromMouseEvent(event);

    if (tile !== this.mapUi.hoveredTile) {
      this.mapUi.hoverTile(tile);

      if (tile && this.mapUi.selectedUnit && this.mouseButton === 2) {
        this.mapUi.selectedUnit.findPath(tile).then(() => {
          if (this.mapUi.selectedUnit) {
            this.mapUi.setPath(this.mapUi.selectedUnit.path);
          }
        });
      }
    }

    if (this.mapUi.allowMapPanning && this.isMousePressed) {
      if (this.mouseButton === 1) {
        this.camera.moveBy(event.movementX, event.movementY);
      }
    }
  }

  onWheel(event: WheelEvent) {
    this.camera.scaleByWithEasing(
      1 + (event.deltaY > 0 ? -0.3 : 0.3),
      event.clientX,
      event.clientY,
      300,
    );
  }

  onKeyDown(event: KeyboardEvent) {
    if (this.uiState.activeView) {
      if (event.key === "Escape") {
        this.uiState.activeView.quit();
      }
    } else if (this.uiState.menuVisible$.value) {
      if (event.key === "Escape" && this.game.state) {
        this.uiState.menuVisible$.next(false);
      }
    } else {
      if (event.key === "Enter") {
        this.nextTurnService.next();
      } else if (event.key === "Escape") {
        this.uiState.menuVisible$.next(true);
      } else if (this.mapUi.selectedUnit) {
        if (event.key === "s" || event.key === "f") {
          this.mapUi.selectedUnit
            .setOrder("sleep")
            .then(() =>
              this.mapUi["_selectedUnit$"].next(this.mapUi.selectedUnit),
            );
        } else if (event.key === " ") {
          this.mapUi.selectedUnit
            .setOrder("skip")
            .then(() =>
              this.mapUi["_selectedUnit$"].next(this.mapUi.selectedUnit),
            );
        } else if (event.key === "b") {
          this.mapUi.selectedUnit
            .doAction("foundCity")
            .then(() =>
              this.mapUi["_selectedUnit$"].next(this.mapUi.selectedUnit),
            );
        }
      }
    }
  }

  onKeyUp(event: KeyboardEvent) {}

  getTileFromMouseEvent(event: MouseEvent) {
    const [x, y] = this.camera.screenToGame(event.clientX, event.clientY);
    return this.game.state!.map.get(x, y);
  }

  nextTurn() {
    // this.mapUi.setPath(this.activeUnit?.path || null);
  }

  get mouseButton() {
    return this._mouseButton$.value;
  }
}
