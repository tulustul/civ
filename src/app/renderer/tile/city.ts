import * as PIXIE from "pixi.js";

import { takeUntil } from "rxjs/operators";

import { getTileVariants, pickRandom, drawTileSprite } from "../utils";
import { TileContainer } from "../tile-container";
import { GameRenderer } from "../renderer";
import { GameApi } from "src/app/api";
import { City } from "src/app/api/city";

const SMALL_CITY_TEXTURES = getTileVariants("villageSmall", 4);
const BIG_CITY_TEXTURES = getTileVariants("village", 4);

export class CityDrawer {
  citiesGraphics = new Map<City, PIXIE.Sprite>();

  constructor(
    private game: GameApi,
    private renderer: GameRenderer,
    private container: TileContainer,
  ) {
    game.init$.subscribe((state) => {
      state.citySpawned$
        .pipe(takeUntil(game.stop$))
        .subscribe((city) => this.spawn(city));

      state.cityUpdated$
        .pipe(takeUntil(game.stop$))
        .subscribe((city) => this.update(city));

      state.cityDestroyed$
        .pipe(takeUntil(game.stop$))
        .subscribe((city) => this.destroy(city));
    });
  }

  build() {
    if (!this.game.state) {
      return;
    }

    for (const city of this.game.state.cities) {
      this.spawn(city);
    }
  }

  spawn(city: City) {
    const variants = city.size >= 10 ? BIG_CITY_TEXTURES : SMALL_CITY_TEXTURES;
    const textureName = pickRandom(variants);
    const g = drawTileSprite(city.tile, this.textures[textureName]);

    this.container.addChild(g, city.tile);
    this.citiesGraphics.set(city, g);

    if (!this.game.state!.trackedPlayer.exploredTiles.has(city.tile)) {
      g.visible = false;
    }
  }

  destroy(city: City) {
    const g = this.citiesGraphics.get(city)!;
    this.citiesGraphics.delete(city);
    g.destroy();
  }

  update(city: City) {
    this.destroy(city);
    this.spawn(city);
  }

  clear() {
    this.container.destroyAllChildren();
    this.citiesGraphics.clear();
  }

  private get textures() {
    return this.renderer.textures;
  }
}
