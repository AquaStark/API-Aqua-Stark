/**
 * @fileoverview Dojo Types - TypeScript types for Dojo contract interactions
 * 
 * These types define the structure for all on-chain contract interactions.
 * Currently used with stub implementations that will be replaced with real
 * Dojo contract calls.
 * 
 * This file re-exports all on-chain data types from models and provides
 * additional types specific to Dojo contract operations.
 */

// Re-export all on-chain model types
export type { PlayerOnChain } from '../../models/player.model';
export type { TankOnChain } from '../../models/tank.model';
export type { FishOnChain } from '../../models/fish.model';
export type { DecorationOnChain } from '../../models/decoration.model';

// Re-export DecorationKind enum
export { DecorationKind } from '../../models/decoration.model';

/**
 * Result of a Dojo transaction.
 * Contains the transaction hash and success status.
 */
export interface DojoTransactionResult {
  tx_hash: string;
  success: boolean;
}

/**
 * Represents a fish in the family tree with parent references.
 */
export interface FishFamilyMember {
  id: number;
  parent1_id: number | null;
  parent2_id: number | null;
  generation: number;
}

/**
 * Complete family tree structure for a fish.
 * Includes the fish itself, all ancestors, and all descendants.
 */
export interface FishFamilyTree {
  fish_id: number;
  ancestors: FishFamilyMember[];
  descendants: FishFamilyMember[];
  generation_count: number;
  descendant_generation_count: number;
}

/**
 * Result of minting a tank on-chain.
 * Contains the transaction hash and the generated tank ID.
 */
export interface MintTankResult {
  tx_hash: string;
  tank_id: number;
}

/**
 * Result of minting a fish on-chain.
 * Contains the transaction hash and the generated fish ID.
 */
export interface MintFishResult {
  tx_hash: string;
  fish_id: number;
}
