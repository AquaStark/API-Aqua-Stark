/**
 * Utilities for XP calculation and fish evolution.
 *
 * Configurable XP thresholds per fish state:
 *
 * - Baby:       0 <= xp < 50
 * - Juvenile:   50 <= xp < 150
 * - YoungAdult: 150 <= xp < 350
 * - Adult:      xp >= 350
 *
 * These values are suggested defaults and can be adjusted
 * if the game design changes. Keeping them centralized here
 * avoids magic numbers scattered across the codebase.
 */

import { FishState } from '@/models/fish.model';
import { DecorationKind } from '@/models/decoration.model';
import { ValidationError, NotFoundError } from '@/core/errors';
import { getSupabaseClient } from '@/core/utils/supabase-client';
import { logError } from '@/core/utils/logger';

export const BABY_MAX_XP = 50;
export const JUVENILE_MAX_XP = 150;
export const YOUNG_ADULT_MAX_XP = 350;

/**
 * Types of food that can be given to fish.
 * This enum can be extended in the future to support different food types.
 */
export enum FoodType {
  Basic = 'Basic',
  // Future food types can be added here:
  // Premium = 'Premium',
  // Special = 'Special',
}

/**
 * Default XP base value when feeding a fish.
 * This is the base XP gained before applying decoration multipliers.
 */
export const DEFAULT_FEED_BASE_XP = 10;

/**
 * XP base values per food type.
 * 
 * This mapping allows different food types to grant different base XP amounts.
 * To add a new food type:
 * 1. Add it to the FoodType enum
 * 2. Add an entry here with the desired XP value
 * 
 * Values represent base XP before multipliers are applied.
 */
export const FOOD_TYPE_BASE_XP: Record<FoodType, number> = {
  [FoodType.Basic]: DEFAULT_FEED_BASE_XP,
  // Future food types:
  // [FoodType.Premium]: 20,
  // [FoodType.Special]: 30,
};

/**
 * Default XP percentage multipliers per decoration kind.
 *
 * Values are percentages, e.g. 10 means +10% XP.
 * These are gameplay tuning knobs and can be adjusted as needed.
 */
export const DECORATION_XP_MULTIPLIERS: Record<DecorationKind, number> = {
  [DecorationKind.Plant]: 5,
  [DecorationKind.Statue]: 10,
  [DecorationKind.Background]: 2,
  [DecorationKind.Ornament]: 3,
};

/**
 * Gets the base XP value for a given food type.
 * Returns the default base XP if food type is not provided or not found.
 *
 * @param foodType - Optional food type (defaults to FoodType.Basic)
 * @returns Base XP value for the food type
 */
export function getFeedBaseXp(foodType?: FoodType): number {
  if (!foodType) {
    return DEFAULT_FEED_BASE_XP;
  }
  
  return FOOD_TYPE_BASE_XP[foodType] ?? DEFAULT_FEED_BASE_XP;
}

/**
 * Calculates fish XP applying a percentage multiplier.
 *
 * @param baseXp Base XP (without multipliers)
 * @param multiplier Additional XP percentage (10 = +10%)
 */
export function calculateFishXp(baseXp: number, multiplier: number): number {
  const factor = 1 + multiplier / 100;

  return baseXp * factor;
}

/**
 * Sums total player XP from the XP of all their fish.
 */
export function calculatePlayerXp(fishXpArray: number[]): number {
  return fishXpArray.reduce((total, xp) => total + xp, 0);
}

/**
 * Determines fish state based on its current XP.
 * Uses the configurable thresholds defined in this module.
 */
export function determineFishState(xp: number): FishState {
  const safeXp = Math.max(0, xp);

  if (safeXp < BABY_MAX_XP) {
    return FishState.Baby;
  }

  if (safeXp < JUVENILE_MAX_XP) {
    return FishState.Juvenile;
  }

  if (safeXp < YOUNG_ADULT_MAX_XP) {
    return FishState.YoungAdult;
  }

  return FishState.Adult;
}

/**
 * Calculates the total XP multiplier from active decorations for a tank.
 *
 * Expected responsibilities:
 * - Read decorations associated to tankId.
 * - Filter only active decorations.
 * - Sum their percentages (10 + 5 = 15) and return 0.15.
 */
export async function getActiveDecorationsMultiplier(
  tankId: number,
): Promise<number> {
  // Basic validation for tankId
  if (!tankId || tankId <= 0 || !Number.isInteger(tankId)) {
    throw new ValidationError('Invalid tank ID');
  }

  try {
    const supabase = getSupabaseClient();

    // 1. Resolve tank owner from tank ID (off-chain)
    const { data: tankRow, error: tankError } = await supabase
      .from('tanks')
      .select('owner')
      .eq('id', tankId)
      .single();

    if (tankError) {
      if (tankError.code === 'PGRST116') {
        throw new NotFoundError(`Tank with ID ${tankId} not found`);
      }
      throw new Error(`Database error when reading tank: ${tankError.message}`);
    }

    if (!tankRow?.owner) {
      throw new NotFoundError(`Tank with ID ${tankId} not found`);
    }

    const owner: string = tankRow.owner;

    // 2. Get active decorations for this owner
    const { data: decorations, error: decorationsError } = await supabase
      .from('decorations')
      .select('kind, is_active, owner')
      .eq('owner', owner)
      .eq('is_active', true);

    if (decorationsError) {
      throw new Error(
        `Database error when reading decorations: ${decorationsError.message}`,
      );
    }

    if (!decorations || decorations.length === 0) {
      // No active decorations → no additional XP
      return 0;
    }

    type DecorationRow = {
      kind: string;
      is_active: boolean;
      owner: string;
    };

    const totalPercentage = (decorations as DecorationRow[]).reduce(
      (sum, row) => {
        if (!row.is_active) {
          return sum;
        }

        const kind = row.kind as DecorationKind;
        const value = DECORATION_XP_MULTIPLIERS[kind] ?? 0;

        return sum + value;
      },
      0,
    );

    // Convert percentage to multiplier factor: 10 + 5 -> 0.15
    return totalPercentage / 100;
  } catch (error) {
    logError(`Failed to calculate decoration XP multiplier for tank ${tankId}`, error);
    throw error;
  }
}

