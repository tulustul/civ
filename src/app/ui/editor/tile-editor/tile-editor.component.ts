import { Component, OnInit, OnDestroy } from '@angular/core';

import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { Game } from 'src/app/game/game';
import { Tile, TileDirection } from 'src/app/game/tile.interface';
import {
  CLIMATE_OPTIONS,
  FOREST_OPTIONS,
  LAND_FORM_OPTIONS,
  RIVER_OPTIONS,
  SEA_LEVEL_OPTIONS,
} from '../constants';
import { getTileDirection } from 'src/app/game/hex-math';
import { OPPOSITE_DIRECTIONS } from 'src/app/map-generators/utils';

@Component({
  selector: 'app-tile-editor',
  templateUrl: './tile-editor.component.html',
  styleUrls: ['./tile-editor.component.scss'],
})
export class TileEditorComponent implements OnInit, OnDestroy {
  tile: Tile | null = null;

  ngUnsubscribe = new Subject<void>();

  SEA_LEVEL_OPTIONS = SEA_LEVEL_OPTIONS;
  LAND_FORM_OPTIONS = LAND_FORM_OPTIONS;
  CLIMATE_OPTIONS = CLIMATE_OPTIONS;
  FOREST_OPTIONS = FOREST_OPTIONS;
  RIVER_OPTIONS = RIVER_OPTIONS;

  constructor(private game: Game) {}

  ngOnInit(): void {
    this.game.tilesManager.selectedTile$
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((tile) => (this.tile = tile));
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  update() {
    if (this.tile) {
      this.game.tilesManager.updatedTile$.next(this.tile);
    }
  }

  updateRiver(riverParts: TileDirection[]) {
    if (!this.tile) {
      return;
    }

    this.tile.riverParts = riverParts;
    for (const neighbour of this.tile.neighbours) {
      const dir = getTileDirection(this.tile, neighbour);
      const hasRiver = riverParts.includes(dir);
      const oppositeDir = OPPOSITE_DIRECTIONS[dir];
      const neighbourRiverParts = new Set(neighbour.riverParts);
      if (hasRiver) {
        neighbourRiverParts.add(oppositeDir);
      } else {
        neighbourRiverParts.delete(oppositeDir);
      }
      neighbour.riverParts = Array.from(neighbourRiverParts);
      this.game.tilesManager.updatedTile$.next(neighbour);
    }
    this.update();
  }
}