import { TileCore } from "./tile";
import { UnitCore } from "./unit";
import { attack } from "./combat";
import { collector } from "./collector";

export enum MoveResult {
  none,
  move,
  embark,
  disembark,
  attack,
}

export function getMoveResult(
  unit: UnitCore,
  from: TileCore,
  to: TileCore,
): MoveResult {
  if (!unit.player.exploredTiles.has(to)) {
    return MoveResult.move;
  }

  if (unit.definition.type === "naval") {
    if (from.passableArea !== to.passableArea) {
      if (
        to.isLand &&
        to.city?.isCoastline &&
        to.city?.player === unit.player
      ) {
        return MoveResult.move;
      }
      if (to.isWater && from.city) {
        return MoveResult.move;
      }
      return MoveResult.none;
    }
    if (to.isLand) {
      return MoveResult.none;
    }
  } else if (unit.definition.type === "land") {
    if (to.isWater && to.getEmbarkmentTarget(unit)) {
      return MoveResult.embark;
    }
    if (unit.parent && from.isWater && to.isLand) {
      return MoveResult.disembark;
    }
    if (from.passableArea !== to.passableArea || to.isWater) {
      return MoveResult.none;
    }
  }

  if (unit.player.visibleTiles.has(to)) {
    const enemyUnit = to.getFirstEnemyUnit(unit);
    const enemyCity = to.city && to.city.player !== unit.player;
    if (enemyUnit || enemyCity) {
      if (unit.definition.strength) {
        return MoveResult.attack;
      } else {
        return MoveResult.none;
      }
    }
  }

  return MoveResult.move;
}

export function getMoveCost(
  unit: UnitCore,
  moveResult: MoveResult,
  from: TileCore,
  to: TileCore,
): number {
  const cost = from.neighboursCosts.get(to) || Infinity;

  if (moveResult === MoveResult.move) {
    return cost;
  }

  if (moveResult === MoveResult.attack) {
    return cost * 3;
  }

  if (moveResult === MoveResult.embark || moveResult === MoveResult.disembark) {
    return Math.max(1, unit.actionPointsLeft);
  }

  return Infinity;
}

export function move(unit: UnitCore, tile: TileCore) {
  if (!unit.actionPointsLeft) {
    return;
  }

  const moveResult = getMoveResult(unit, unit.tile, tile);
  const cost = getMoveCost(unit, moveResult, unit.tile, tile);

  if (moveResult === MoveResult.none) {
    return;
  }

  if (moveResult === MoveResult.embark) {
    // TODO implement embarkment
    const embarkmentTarget = tile.getEmbarkmentTarget(unit);
    embarkmentTarget?.addChild(unit);
    _move(unit, tile, cost);
  } else if (moveResult === MoveResult.disembark) {
    unit.parent?.removeChild(unit);
    _move(unit, tile, cost);
  } else if (moveResult === MoveResult.attack) {
    if (attack(unit, tile)) {
      _move(unit, tile, cost);
    }
  } else if (moveResult === MoveResult.move) {
    _move(unit, tile, cost);
  }
}

function _move(unit: UnitCore, tile: TileCore, cost: number) {
  const index = unit.tile.units.indexOf(unit);
  if (index !== -1) {
    unit.tile.units.splice(index, 1);
  }
  tile.units.push(unit);
  unit.tile = tile;

  unit.actionPointsLeft = Math.max(unit.actionPointsLeft - cost, 0);

  const visibleTiles = unit.getVisibleTiles();
  unit.player.exploreTiles(visibleTiles);
  unit.player.showTiles(visibleTiles);
  for (const child of unit.children) {
    _move(child, tile, 0);
    collector.units.add(child);
  }
}

export function moveAlongPath(unit: UnitCore) {
  if (!unit.path) {
    unit.setOrder(null);
    return;
  }

  unit.setOrder(unit.path.length ? "go" : null);

  collector.units.add(unit);

  while (unit.actionPointsLeft && unit.path.length) {
    if (unit.path[0][0] !== unit.tile) {
      move(unit, unit.path[0][0]);
    }

    unit.path[0].shift();
    if (!unit.path[0].length) {
      unit.path.shift();
    }
    if (!unit.path.length) {
      unit.path = null;
      unit.setOrder(null);
      return;
    }
  }
}
