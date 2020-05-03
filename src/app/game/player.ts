import { Tile } from "./tile";
import { Unit } from "./unit";
import { getTileIndex, getTileFromIndex } from "./serialization";
import { Game } from "./game";
import { City } from "./city";
import { Area } from "./area";

export enum PlayerType {
  human,
  ai,
}

export interface PlayerSerialized {
  type: PlayerType;
  exploredTiles: number[];
}

export class Player {
  id: number;

  exploredTiles = new Set<Tile>();

  visibleTiles = new Set<Tile>();

  units: Unit[] = [];

  cities: City[] = [];

  area = this.game.areasManager.make(0xff0000);

  constructor(public game: Game, public type: PlayerType) {}

  serialize(): PlayerSerialized {
    return {
      type: this.type,
      exploredTiles: Array.from(this.exploredTiles).map((tile) =>
        getTileIndex(this.game.map, tile),
      ),
    };
  }

  static deserialize(game: Game, data: PlayerSerialized) {
    const player = new Player(game, data.type);
    for (const tileIndex of data.exploredTiles) {
      player.exploredTiles.add(getTileFromIndex(game.map, tileIndex));
    }
    return player;
  }
}
