import { UnitCore } from "./unit";
import { collector } from "./collector";
import { UnitsManager } from "./unit-manager";
import { LandForm } from "../shared";

export enum CombatModifierType {
  hills,
  forest,
  river,
  health,
  flanks,
}

export enum BattleResult {
  victory,
  undecided,
  defeat,
}

export interface CombatModifier {
  type: CombatModifierType;
  value: number;
}

export interface CombatSimulationSide {
  damage: number;
  strength: number;
  modifiers: CombatModifier[];
}

export interface CombatSimulation {
  attacker: CombatSimulationSide;
  defender: CombatSimulationSide;
}

export function doCombat(attacker: UnitCore, defender: UnitCore): BattleResult {
  const sim = simulateCombat(attacker, defender);

  // TODO add small random variations
  attacker.health -= sim.attacker.damage;
  defender.health -= sim.defender.damage;

  if (attacker.health > 0) {
    collector.units.add(attacker);
  }

  if (defender.health > 0) {
    collector.units.add(defender);
  }

  if (attacker.health <= 0) {
    attacker.destroy();
    return BattleResult.defeat;
  }

  if (defender.health <= 0) {
    defender.destroy();
    return BattleResult.victory;
  }

  return BattleResult.undecided;
}

export function simulateCombat(
  attacker: UnitCore,
  defender: UnitCore,
): CombatSimulation {
  const attackerModifiers = [
    ...getUnitModifiers(attacker),
    ...getAttackerModifiers(attacker, defender),
  ];
  const defenderModifiers = [
    ...getUnitModifiers(defender),
    ...getDefenderModifiers(attacker, defender),
  ];

  const attackerStrength =
    attacker.definition.strength *
    attackerModifiers.reduce((total, bonus) => total + bonus.value, 1);

  const defenderStrength =
    defender.definition.strength *
    defenderModifiers.reduce((total, bonus) => total + bonus.value, 1);

  return {
    attacker: {
      strength: attackerStrength,
      modifiers: attackerModifiers,
      damage: getDamage(defenderStrength / attackerStrength),
    },
    defender: {
      strength: defenderStrength,
      modifiers: defenderModifiers,
      damage: getDamage(attackerStrength / defenderStrength),
    },
  };
}

function getUnitModifiers(unit: UnitCore): CombatModifier[] {
  const modifiers: CombatModifier[] = [];
  if (unit.health < 100) {
    modifiers.push({
      type: CombatModifierType.health,
      value: (unit.health - 100) / 200,
    });
  }

  return modifiers;
}

function getAttackerModifiers(
  attacker: UnitCore,
  defender: UnitCore,
): CombatModifier[] {
  const modifiers: CombatModifier[] = [];

  const flanks = getFlanks(attacker, defender);
  if (flanks) {
    modifiers.push({
      type: CombatModifierType.flanks,
      value: flanks * 0.15,
    });
  }

  return modifiers;
}

function getDefenderModifiers(
  attacker: UnitCore,
  defender: UnitCore,
): CombatModifier[] {
  const modifiers: CombatModifier[] = [];

  if (defender.tile.landForm === LandForm.hills) {
    modifiers.push({ type: CombatModifierType.hills, value: 0.5 });
  }

  if (defender.tile.forest) {
    modifiers.push({ type: CombatModifierType.forest, value: 0.3 });
  }

  const direction = defender.tile.getDirectionTo(attacker.tile);
  if (defender.tile.riverParts.includes(direction)) {
    modifiers.push({ type: CombatModifierType.river, value: 0.5 });
  }

  const flanks = getFlanks(defender, attacker);
  if (flanks) {
    modifiers.push({
      type: CombatModifierType.flanks,
      value: flanks * 0.15,
    });
  }

  return modifiers;
}

function getDamage(ratio: number): number {
  // https://forums.civfanatics.com/threads/getting-the-combat-damage-math.646582/#post-15468029
  let modifier = (Math.pow((ratio + 3) / 4, 4) + 1) / 2;
  return Math.round(30 * modifier);
}

function getFlanks(unit: UnitCore, enemy: UnitCore) {
  return (
    enemy.tile.neighbours.filter(
      (tile) =>
        !!tile.units.find(
          (u) => u.player === unit.player && u.definition.strength,
        ),
    ).length - 1
  );
}