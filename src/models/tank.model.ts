/**
 * @fileoverview Tank Model
 * 
 * Represents the on-chain aquarium where a player's fish live.
 * Split into on-chain (Dojo/Starknet) and off-chain (Supabase) fields.
 */

// On-chain fields (from Dojo/Starknet)
export interface TankOnChain {
  id: number;
  owner: string;
  capacity: number;
}

// Off-chain fields (from Supabase)
export interface TankOffChain {
  id: number;
  owner: string;
  createdAt: Date;
  name?: string;
  sprite_url?: string;
}

export interface Tank extends TankOnChain, Omit<TankOffChain, 'id' | 'owner'> {
  id: number;
}

export interface CreateTankDto {
  owner: string;
  capacity?: number;
  name?: string;
}

export interface UpdateTankDto {
  capacity?: number;
  name?: string;
}
