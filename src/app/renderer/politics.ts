import { GameState } from "../api/state";
import { GameRenderer } from "./renderer";
import { Area } from "./area";

export class PoliticsDrawer {
  areas: Area[] = [];

  constructor(private state: GameState, private renderer: GameRenderer) {
    this.makeAreas();
  }

  async makeAreas() {
    for (const player of this.state.players) {
      const tiles = await this.state.getAreaTiles(player.areaId);
      const area = new Area(this.state, {
        color: player.color,
        container: this.renderer.overlays.tilesContainer,
        backgroundOpacity: 0.5,
        borderShadow: 0.7,
        borderSize: 0.08,
        borderShadowStrength: 1,
        visibleOnWater: false,
      });

      this.areas.push(area);
      area.setTiles(tiles);
      this.state.areasMap.set(player.areaId, area);
    }
  }

  clear() {
    for (const area of this.areas) {
      area.clear();
    }
    this.areas = [];
  }
}
