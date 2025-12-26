/**
 * @fileoverview Player Model
 * 
 * Represents a player in the Aqua Stark game.
 * Each player is uniquely identified by their Starknet contract address.
 * Split into on-chain (Dojo/Starknet) and off-chain (Supabase) fields.
 */

import type { Tank } from './tank.model';
import type { Fish } from './fish.model';
import type { Decoration } from './decoration.model';

// On-chain fields (from Dojo/Starknet)
export interface PlayerOnChain {
  address: string;
  total_xp: number;
  fish_count: number;
  tournaments_won: number;
  reputation: number;
  offspring_created: number;
}

// Off-chain fields (from Supabase)
export interface PlayerOffChain {
  address: string;
  avatar_url?: string | null; // Always included in responses, null if not set
  created_at: Date;
  updated_at: Date;
}

export interface Player extends PlayerOnChain, Omit<PlayerOffChain, 'address'> {
  address: string;
}

export interface CreatePlayerDto {
  address: string;
  avatar_url?: string;
}

export interface UpdatePlayerDto {
  total_xp?: number;
  fish_count?: number;
  tournaments_won?: number;
  reputation?: number;
  offspring_created?: number;
  avatar_url?: string;
}

/**
 * Extended player profile that includes all related assets.
 * Used in GET /player/:address endpoint to return complete player data.
 */
export interface PlayerProfile extends Player {
  tanks: Tank[];
  fish: Fish[];
  decorations: Decoration[];
}
