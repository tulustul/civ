import * as PIXI from "pixi.js";

import { BoundingBox } from "./camera";
import { TilesMap } from "../api/map";
import { Tile } from "../api/tile.interface";

export class TileWrapperContainer extends PIXI.Container {
  tilesMap = new Map<Tile, PIXI.DisplayObject[]>();

  bindToMap(map: TilesMap) {
    for (let x = 0; x < map.width; x++) {
      for (let y = 0; y < map.height; y++) {
        this.tilesMap.set(map.tiles[x][y], []);
      }
    }
  }
}

export class TileContainer extends PIXI.DisplayObject {
  parent: TileWrapperContainer;

  private map: TilesMap;

  private grid: PIXI.DisplayObject[][][] = [];
  childrenMap = new Map<PIXI.DisplayObject, Tile>();

  // TODO can it be rewritten with tile ids? Map<number, ...>
  private tilesMap = new Map<Tile, PIXI.DisplayObject[]>();

  // needed only for interactivity
  children: PIXI.DisplayObject[] = [];

  constructor(private bBox: BoundingBox) {
    super();
  }

  addChild<T extends PIXI.DisplayObject>(child: T, tile: Tile): void {
    if (child.parent) {
      child.parent.removeChild(child);
    }

    (child as any).parent = this;
    (child as any).transform._parentID = -1;

    this.grid[tile.x][tile.y].push(child);

    this.childrenMap.set(child, tile);
    this.tilesMap.get(tile)?.push(child);

    this.children.push(child);

    (this as any)._boundsID++;

    this.parent.tilesMap.get(tile)!.push(child);

    child.emit("added", this);
  }

  removeChild(child: PIXI.DisplayObject) {
    if (this.childrenMap.has(child)) {
      // remove from childrenMap
      const tile = this.childrenMap.get(child)!;
      this.childrenMap.delete(child);

      // remove from grid
      let children = this.grid[tile.x][tile.y];
      let index = children.indexOf(child);
      if (index !== -1) {
        children.splice(index, 1);
      }

      // remove from tilesMap
      children = this.tilesMap.get(tile)!;
      index = children.indexOf(child);
      if (index !== -1) {
        children.splice(index, 1);
      }

      // remove from parent
      children = this.parent.tilesMap.get(tile)!;
      index = children.indexOf(child);
      if (index !== -1) {
        children.splice(index, 1);
      }

      // remove from children
      index = this.children.indexOf(child);
      if (index !== -1) {
        children.splice(index, 1);
      }
    }
  }

  moveChild(child: PIXI.DisplayObject, tile: Tile) {
    this.removeChild(child);
    this.addChild(child, tile);
  }

  getChildsFor(tile: Tile) {
    return this.tilesMap.get(tile)!;
  }

  clearTile(tile: Tile) {
    for (const obj of this.getChildsFor(tile)) {
      obj.destroy();
    }
  }

  destroyAllChildren() {
    if (!this.map) {
      return;
    }

    for (let x = 0; x < this.map.width; x++) {
      for (let y = 0; y < this.map.height; y++) {
        for (const child of this.grid[x][y]) {
          child.destroy();
        }
      }
    }
  }

  bindToMap(map: TilesMap) {
    this.map = map;
    this.grid = new Array(map.width);
    this.tilesMap.clear();
    for (let x = 0; x < map.width; x++) {
      this.grid[x] = new Array(map.height);
      for (let y = 0; y < map.height; y++) {
        this.grid[x][y] = [];
        this.tilesMap.set(map.tiles[x][y], []);
      }
    }
  }

  render(renderer: PIXI.Renderer) {
    if (!this.visible || this.worldAlpha <= 0 || !this.renderable) {
      return;
    }

    for (let x = this.bBox.xStart; x < this.bBox.xEnd; x++) {
      for (let y = this.bBox.yStart; y < this.bBox.yEnd; y++) {
        for (const child of this.grid[x][y]) {
          (child as any).render(renderer);
        }
      }
    }
    renderer.batch.flush();
  }

  updateTransform() {
    if (!this.grid.length) {
      return;
    }

    (this as any)._boundsID++;

    this.transform.updateTransform(this.parent.transform);

    // TODO: check render flags, how to process stuff here
    (this as any).worldAlpha = this.alpha * this.parent.worldAlpha;

    for (let x = this.bBox.xStart; x < this.bBox.xEnd; x++) {
      for (let y = this.bBox.yStart; y < this.bBox.yEnd; y++) {
        for (const child of this.grid[x][y]) {
          if (child.visible) {
            child.updateTransform();
          }
        }
      }
    }
  }
}
