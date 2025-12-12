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

// On-chain fields (from Dojo/Starknet)
export interface DecorationOnChain {
  id: number;
  owner: string;
  kind: DecorationKind;
  xp_multiplier: number;
}

// Off-chain fields (from Supabase)
export interface DecorationOffChain {
  id: number;
  owner: string;
  kind: DecorationKind;
  is_active: boolean;
  imageUrl?: string;
  createdAt: Date;
}

// Combined decoration interface
export interface Decoration extends DecorationOnChain, Omit<DecorationOffChain, 'id' | 'owner' | 'kind'> {
  id: number;
}

export interface CreateDecorationDto {
  id: number;
  owner: string;
  kind: DecorationKind;
  imageUrl?: string;
}

export interface UpdateDecorationDto {
  is_active?: boolean;
  imageUrl?: string;
}

export interface ToggleDecorationDto {
  decoration_id: number;
  is_active: boolean;
}
