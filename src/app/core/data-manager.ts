import { BUILDINGS } from "../data/products/buildings";
import { IDLE_PRODUCTS } from "../data/products/idle-products";
import { UNITS_DEFINITIONS } from "../data/products/units";

import {
  UnitDefinition,
  Building,
  IdleProduct,
  GovernmentOption,
} from "./data.interface";
import { GOVERNMENT_OPTIONS } from "../data/internal-politics/government-options";
import { Entity, HaveRequirements } from "./data.interface";

const ENTITIES_MAP = new Map<string, Entity & HaveRequirements>();

const UNITS_MAP = new Map<string, UnitDefinition>();
for (const definition of UNITS_DEFINITIONS) {
  UNITS_MAP.set(definition.id, definition);
  ENTITIES_MAP.set(definition.id, definition);
}

const BUILDINGS_MAP = new Map<string, Building>();
for (const definition of BUILDINGS) {
  BUILDINGS_MAP.set(definition.id, definition);
  ENTITIES_MAP.set(definition.id, definition);
}

const IDLE_PRODUCTS_MAP = new Map<string, IdleProduct>();
for (const definition of IDLE_PRODUCTS) {
  IDLE_PRODUCTS_MAP.set(definition.id, definition);
  ENTITIES_MAP.set(definition.id, definition);
}

const GOVERNMENT_OPTIONS_MAP = new Map<string, GovernmentOption>();
for (const definition of GOVERNMENT_OPTIONS) {
  GOVERNMENT_OPTIONS_MAP.set(definition.id, definition);
  ENTITIES_MAP.set(definition.id, definition);
}

export function getEntityById(id: string): Entity & HaveRequirements {
  const entityDef = ENTITIES_MAP.get(id);
  if (!entityDef) {
    throw Error(`DataManager: No entity with id "${id}"`);
  }
  return entityDef;
}

export function getUnitById(id: string): UnitDefinition {
  const unitDef = UNITS_MAP.get(id);
  if (!unitDef) {
    throw Error(`DataManager: No unit with id "${id}"`);
  }
  return unitDef;
}

export function getBuildingById(id: string): Building {
  const buildingDef = BUILDINGS_MAP.get(id);
  if (!buildingDef) {
    throw Error(`DataManager: No building with id "${id}"`);
  }
  return buildingDef;
}

export function getIdleProductById(id: string): IdleProduct {
  const idleProductDef = IDLE_PRODUCTS_MAP.get(id);
  if (!idleProductDef) {
    throw Error(`DataManager: No idle product with id "${id}"`);
  }
  return idleProductDef;
}

export function getGovernmentOptionById(id: string): GovernmentOption {
  const governmentOption = GOVERNMENT_OPTIONS_MAP.get(id);
  if (!governmentOption) {
    throw Error(`DataManager: No government option with id "${id}"`);
  }
  return governmentOption;
}