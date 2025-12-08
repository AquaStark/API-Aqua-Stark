/**
 * @fileoverview Decoration Model
 * 
 * Represents visual and functional objects that can be placed in a tank.
 * Each decoration is an NFT owned by a player and may provide gameplay
 * bonuses like XP multipliers.
 */

// Decoration types available in the game
export enum DecorationKind {
  Plant = 'Plant',
  Statue = 'Statue',
  Background = 'Background',
  Ornament = 'Ornament',
}

export interface Decoration {
  id: number;
  owner: string;
  kind: DecorationKind;
  // XP bonus percentage (e.g., 10 = +10%)
  xp_multiplier: number;
  is_active: boolean;
}

export interface CreateDecorationDto {
  owner: string;
  kind: DecorationKind;
  xp_multiplier: number;
}

export interface UpdateDecorationDto {
  is_active?: boolean;
}

export interface ToggleDecorationDto {
  decoration_id: number;
  is_active: boolean;
}
