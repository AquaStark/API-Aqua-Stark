/**
 * @fileoverview Tank Model
 * 
 * Represents the on-chain aquarium where a player's fish live.
 * Each tank is a unique NFT owned by a player, with a limited capacity
 * and potential for decoration or upgrades.
 */

// On-chain fields (from Dojo/Starknet)
export interface TankOnChain {
  id: number;
  owner: string;
  capacity: number;
}

export interface Tank {
  id: number;
  owner: string;
  capacity: number;
}

export interface CreateTankDto {
  owner: string;
  capacity?: number;
}

export interface UpdateTankDto {
  capacity?: number;
}
