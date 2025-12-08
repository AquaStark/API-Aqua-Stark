/**
 * @fileoverview Player Model
 * 
 * Represents a player in the Aqua Stark game.
 * Each player is uniquely identified by their Starknet contract address.
 * Stores global stats like total experience, fish count, tournaments won, reputation, and breeding activity.
 */

export interface Player {
  address: string;
  total_xp: number;
  fish_count: number;
  tournaments_won: number;
  reputation: number;
  offspring_created: number;
}

export interface CreatePlayerDto {
  address: string;
}

export interface UpdatePlayerDto {
  total_xp?: number;
  fish_count?: number;
  tournaments_won?: number;
  reputation?: number;
  offspring_created?: number;
}
